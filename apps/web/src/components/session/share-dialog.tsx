"use client";

import { Check, Copy, Download, Share2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/lib/cn";
import {
  canShareFiles,
  canvasToPng,
  renderShareCard,
  shareMessage,
  type ShareCardData,
  type ShareMode,
} from "@/lib/share-card";

/**
 * "Soruyu paylaş" diyaloğu (Figma "Paylaş sayfası" 49:2356/49:2447; cevapsız 49:2538/49:2619).
 * Önizleme görsel değil, paylaşılacak tuvalin kendisidir (CSS ile küçültülür). Dosya
 * paylaşımı olan tarayıcılarda (mobil) "Paylaş…" görsel + metni sistem sayfasına verir;
 * masaüstünde "PNG indir" + "Bağlantıyı kopyala". Mod seçimi yalnız cevaplanmış soruda.
 */
export function ShareDialog({
  open,
  onClose,
  answered,
  build,
}: {
  open: boolean;
  onClose: () => void;
  answered: boolean;
  build: (mode: ShareMode) => ShareCardData;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<ShareMode>("question");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // Dosya paylaşımı desteği: sunucuda false, istemcide tarayıcıdan (hydration uyumlu).
  const nativeShare = useSyncExternalStore(
    () => () => {},
    canShareFiles,
    () => false,
  );
  const effective: ShareMode = answered ? mode : "question";
  const data = build(effective);
  const dataKey = JSON.stringify(data);

  // Açıkken ve veri değişince tuvali yeniden çiz.
  useEffect(() => {
    if (!open || !canvasRef.current) return;
    let alive = true;
    renderShareCard(canvasRef.current, JSON.parse(dataKey) as ShareCardData)
      .then(() => alive && setError(null))
      .catch(() => alive && setError("Kart çizilemedi. Tekrar dene."));
    return () => {
      alive = false;
    };
  }, [open, dataKey]);

  const close = useCallback(() => {
    onClose();
    setTimeout(() => {
      setMode("question");
      setError(null);
      setCopied(false);
    }, 300);
  }, [onClose]);

  const share = async () => {
    if (!canvasRef.current) return;
    setBusy(true);
    setError(null);
    try {
      const file = await canvasToPng(
        canvasRef.current,
        `paemisyon-soru-${data.questionId.slice(0, 8)}.png`,
      );
      if (nativeShare) {
        try {
          await navigator.share({
            files: [file],
            text: shareMessage(data.url),
          });
        } catch (e) {
          if ((e as { name?: string }).name !== "AbortError") throw e;
        }
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(file);
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
      }
    } catch {
      setError("Kart oluşturulamadı. Tekrar dene.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
    } catch {
      setError("Bağlantı kopyalanamadı.");
    }
  };

  const modes: { id: ShareMode; label: string; detail: string }[] = [
    {
      id: "question",
      label: "Soruyu paylaş",
      detail: "Şıklar var, cevap yok. Varsayılan.",
    },
    {
      id: "answer",
      label: "Cevap ve açıklamayla paylaş",
      detail: "Doğru şık işaretli, açıklamanın ilk cümlesi ve dayanak maddesi.",
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Soruyu paylaş"
      size="md"
      footer={
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => void share()}
            loading={busy}
            className="w-full"
          >
            {nativeShare ? (
              <>
                <Share2 size={16} aria-hidden /> Paylaş…
              </>
            ) : (
              <>
                <Download size={16} aria-hidden /> PNG indir
              </>
            )}
          </Button>
          <Button
            variant="secondary"
            onClick={() => void copy()}
            className="w-full"
          >
            {copied ? (
              <>
                <Check size={16} aria-hidden /> Bağlantı kopyalandı
              </>
            ) : (
              <>
                <Copy size={16} aria-hidden /> Bağlantıyı kopyala
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Dar ekranda alt alta (önizleme ortada), geniş ekranda yan yana. */}
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          {/* Önizleme = paylaşılan tuval; 1080×1350 → 200 px genişlik */}
          <canvas
            ref={canvasRef}
            aria-label="Paylaşım kartı önizlemesi"
            className="w-[200px] shrink-0 rounded-control"
            style={{ aspectRatio: "4 / 5" }}
          />
          <p className="type-body-sm text-ink-soft">
            Kart sorunun ilk hâliyle üretilir; işaretlediğin şık karta girmez.
            Görselin yanında soruya giden bağlantı da gider.
          </p>
        </div>

        {answered ? (
          <div
            className="flex flex-col gap-2"
            role="radiogroup"
            aria-label="Paylaşım modu"
          >
            {modes.map((m) => {
              const active = m.id === effective;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setMode(m.id)}
                  className={cn(
                    "tk-interactive flex items-center gap-3 rounded-card border p-4 text-left",
                    active
                      ? "border-accent bg-accent-soft ring-1 ring-accent"
                      : "border-line bg-surface hover:border-ink-soft",
                  )}
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="type-subhead text-ink">{m.label}</span>
                    <span className="type-body-sm text-ink-soft">
                      {m.detail}
                    </span>
                  </span>
                  {active ? (
                    <Check
                      size={22}
                      className="shrink-0 text-accent-ink"
                      aria-hidden
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}

        {error ? <Notice tone="error">{error}</Notice> : null}
      </div>
    </Dialog>
  );
}

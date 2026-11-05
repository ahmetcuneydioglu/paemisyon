"use client";

import { Check, Ellipsis } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type TransitionEvent } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import {
  FLASHCARD_MODE,
  kartDonusHref,
  kartKisayolu,
  kartlarHref,
  requeueAgain,
  sessionLine,
  tallyLine,
  type Flashcard,
  type FlashcardEventResult,
  type FlashcardMode,
  type FlashcardRating,
  type FlashcardScope,
  type FlashcardSession,
  type FlashcardSessionSummary,
  type FlashcardSource,
} from "@/lib/kartlar";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { KeyHint } from "@/components/ui/key-hint";
import { Notice } from "@/components/ui/notice";
import { Popover } from "@/components/ui/popover";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { FocusFrame } from "@/components/shell/focus-frame";
import { FlashCard, FlashcardResultPanel, KoseRozeti, RatingBar, UndoStrip } from "./flashcard-kit";

/** Saat erişimi render dışında (React Compiler kuralı); yalnız olay işleyicileri çağırır. */
const saat = { simdi: () => Date.now() };
/** Geri al şeridi süresi; sunucu penceresi daha uzun (10 dk), istemci 5 sn gösterir. */
const GERI_AL_MS = 5000;
/** Uçuş geçişi gelmezse (sekme arka planda vb.) puanı yine de yaz. */
const UCUS_GUVENLIK_MS = 450;

type Phase = "loading" | "error" | "playing" | "finishing" | "done";
interface SonOlay {
  clientEventId: string;
  rating: FlashcardRating;
  cardId: string;
  index: number;
  requeued: boolean;
}
interface OlayGovdesi {
  clientEventId: string;
  flashcardId: string;
  rating: FlashcardRating;
  timeSpentMs: number;
}
interface Hata {
  code: string;
  message: string;
}

function baslatmaHatasi(e: unknown): Hata {
  if (e instanceof ApiClientError) {
    switch (e.code) {
      case "PREMIUM_REQUIRED":
        return { code: e.code, message: "Bu kapsamın bilgi kartları Premium ile açılır." };
      case "NO_CARDS":
        return { code: e.code, message: "Bu modda çalışılacak kart yok." };
      case "FLASHCARDS_DISABLED":
        return { code: e.code, message: "Bilgi kartları henüz açık değil." };
      default:
        return { code: e.code, message: e.message };
    }
  }
  return { code: "NETWORK", message: "Bağlantı yok; kartlar açılamadı." };
}

/** Sunucu reddi (bitmiş oturum vb.) yeniden denenmez; ağ/5xx denenir (olay kimliği idempotent). */
const yenidenDenenir = (e: unknown) => !(e instanceof ApiClientError) || e.status >= 500;

/**
 * Bilgi kartı oynatıcısı (Doc 56 aşama 4; Figma 159:1166 / 161:952 / 161:1019) — L3 Odak
 * (`FocusFrame`). Kuyruk sunucudan tek seferde gelir; puanlar arka planda gider, gidemeyen
 * bitişte yeniden denenir. "Tekrar" denen kart turun sonuna döner (en çok 2 görünüm, sunucuyla
 * aynı). Geri al 5 sn. Klavye: ← Tekrar · → Biliyorum · Boşluk çevir · F favori · Z geri al ·
 * Esc çıkış. Bitişte oturum özeti aynı ekranda. Expo karşılığı `app/kartlar.tsx`.
 */
export function FlashcardPlayer({
  scope,
  mode,
  resume = false,
  source,
  label,
}: {
  scope: FlashcardScope;
  mode: FlashcardMode;
  /** Taze yarım oturumu kaldığı yerden açar (`GET sessions/resume`). */
  resume?: boolean;
  source?: FlashcardSource;
  /** Üst şerit etiketi; sunucu kapsam adı verirse o kazanır. */
  label?: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<Hata | null>(null);
  const [session, setSession] = useState<FlashcardSession | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [pending, setPending] = useState<FlashcardRating | null>(null);
  const [sonOlay, setSonOlay] = useState<SonOlay | null>(null);
  const [tally, setTally] = useState({ known: 0, again: 0, learned: 0 });
  const [note, setNote] = useState<{ tone: "info" | "warning"; text: string } | null>(null);
  const [exitAsk, setExitAsk] = useState(false);
  // Hata bildir (Doc 56 §3f): kart üstündeki bayrak → diyalog; neden + isteğe bağlı açıklama, tur yerinde kalır.
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string | null>(null);
  const [reportText, setReportText] = useState("");
  const [reportState, setReportState] = useState<"idle" | "busy" | "done" | "already" | "error">("idle");
  const REPORT_REASONS = [
    { code: "wrong_answer", label: "Cevap hatalı" },
    { code: "outdated_law", label: "Mevzuat güncel değil" },
    { code: "ambiguous", label: "Soru belirsiz / cevap tartışmalı" },
    { code: "typo", label: "Yazım hatası" },
  ] as const;
  function reportKapat() {
    setReportOpen(false);
    setReportReason(null);
    setReportText("");
    setReportState("idle");
  }
  async function reportGonder(flashcardId: string) {
    const r = REPORT_REASONS.find((x) => x.code === reportReason);
    if (!r) return;
    setReportState("busy");
    try {
      const mesaj = reportText.trim() ? `${r.label} — ${reportText.trim()}` : r.label;
      const res = await apiClient<{ alreadyReported: boolean }>(`/me/flashcards/${flashcardId}/report`, { method: "POST", body: { message: mesaj } });
      setReportState(res.alreadyReported ? "already" : "done");
    } catch {
      setReportState("error");
    }
  }
  const [result, setResult] = useState<FlashcardSessionSummary | null>(null);
  const shownAt = useRef(0);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ucusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Gönderilemeyen olaylar; bitişte sırayla yeniden denenir. */
  const bekleyen = useRef<OlayGovdesi[]>([]);
  /** Yoldaki olaylar: geri al, olayın sunucuya varmasını bekler (yarış yok). */
  const yolda = useRef(new Map<string, Promise<unknown>>());
  const kaydetRef = useRef<(r: FlashcardRating) => void>(() => {});

  const { courseId, topicId, unitSlug } = scope;
  const total = cards.length;
  const card = cards[index] ?? null;
  const etiket = session?.scope.label ?? label ?? "Bilgi kartları";
  const donus = kartDonusHref(scope, source);
  const modBasligi = FLASHCARD_MODE[session?.mode ?? mode].title;

  /* ---------------- Başlatma ---------------- */
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let s: FlashcardSession | null;
        if (resume) {
          s = await apiClient<FlashcardSession | null>("/me/flashcards/sessions/resume");
          if (!s) throw new ApiClientError(404, "NO_SESSION", "Sürdürülecek oturum yok.");
        } else {
          s = await apiClient<FlashcardSession>("/me/flashcards/sessions", {
            method: "POST",
            body: { scope: { courseId, topicId, unitSlug }, mode, ...(source ? { source } : {}) },
          });
        }
        if (!active) return;
        setSession(s);
        setCards(s.cards);
        setIndex(0);
        shownAt.current = saat.simdi();
        setPhase("playing");
      } catch (e) {
        if (!active) return;
        setError(baslatmaHatasi(e));
        setPhase("error");
      }
    })();
    return () => {
      active = false;
    };
  }, [courseId, topicId, unitSlug, mode, resume, source]);

  useEffect(
    () => () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
      if (ucusTimer.current) clearTimeout(ucusTimer.current);
    },
    [],
  );

  /* ---------------- Puanlama ---------------- */
  /** Düğme/klavye: kartı aynı yönde uçur; geçiş bitince `kaydet`. Reduce-motion'da hemen. */
  function puanla(rating: FlashcardRating) {
    if (!card || pending || phase !== "playing") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      kaydet(rating);
      return;
    }
    setPending(rating);
    ucusTimer.current = setTimeout(() => kaydetRef.current(rating), UCUS_GUVENLIK_MS);
  }

  function ucusBitti(e: TransitionEvent<HTMLDivElement>) {
    if (e.propertyName !== "transform" || !pending) return;
    if (ucusTimer.current) clearTimeout(ucusTimer.current);
    kaydet(pending);
  }

  /** Kart ekrandan çıktıktan sonra: olay yazılır, kuyruk ve sayaçlar güncellenir, sonraki karta geçilir. */
  function kaydet(rating: FlashcardRating) {
    if (!session || !card) return;
    ucusTimer.current = null;
    const clientEventId = crypto.randomUUID();
    const spent = Math.max(0, saat.simdi() - shownAt.current);
    const onceki = card.state.state;

    const yeniKartlar = rating === "again" ? requeueAgain(cards, card) : cards;
    const requeued = yeniKartlar.length > cards.length;
    setCards(yeniKartlar);
    setTally((t) => ({ ...t, known: t.known + (rating === "again" ? 0 : 1), again: t.again + (rating === "again" ? 1 : 0) }));
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setSonOlay({ clientEventId, rating, cardId: card.id, index, requeued });
    undoTimer.current = setTimeout(() => setSonOlay(null), GERI_AL_MS);

    setPending(null);
    setFlipped(false);
    shownAt.current = saat.simdi();
    if (index + 1 >= yeniKartlar.length) void bitir(session.sessionId);
    else setIndex(index + 1);

    const govde: OlayGovdesi = { clientEventId, flashcardId: card.id, rating, timeSpentMs: spent };
    const istek = apiClient<FlashcardEventResult>(`/me/flashcards/sessions/${session.sessionId}/events`, { method: "POST", body: govde })
      .then((r) => {
        setCards((cs) => cs.map((c) => (c.id === card.id ? { ...c, state: r.state } : c)));
        if (r.state.state === "learned" && onceki !== "learned") setTally((t) => ({ ...t, learned: t.learned + 1 }));
      })
      .catch((e: unknown) => {
        if (yenidenDenenir(e)) {
          bekleyen.current.push(govde);
          setNote({ tone: "info", text: "Bazı puanlar gönderilemedi; tur bitince yeniden denenir." });
        }
      })
      .finally(() => yolda.current.delete(clientEventId));
    yolda.current.set(clientEventId, istek);
  }
  useEffect(() => {
    kaydetRef.current = kaydet;
  });

  async function geriAl() {
    if (!session || !sonOlay || phase !== "playing") return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    const o = sonOlay;
    setSonOlay(null);
    const i = bekleyen.current.findIndex((b) => b.clientEventId === o.clientEventId);
    if (i >= 0) bekleyen.current.splice(i, 1);
    else {
      await yolda.current.get(o.clientEventId)?.catch(() => undefined);
      try {
        await apiClient(`/me/flashcards/sessions/${session.sessionId}/events/${o.clientEventId}/undo`, { method: "POST" });
      } catch (e) {
        setNote({
          tone: "warning",
          text: e instanceof ApiClientError && e.code === "UNDO_NOT_LATEST" ? "Geri alınamadı: bu kart için daha yeni bir puanın var." : "Geri alınamadı; yeniden dene.",
        });
        return;
      }
    }
    setCards((cs) => (o.requeued ? cs.slice(0, -1) : cs));
    setTally((t) => ({ ...t, known: t.known - (o.rating === "again" ? 0 : 1), again: t.again - (o.rating === "again" ? 1 : 0) }));
    setIndex(o.index);
    setFlipped(false);
    shownAt.current = saat.simdi();
  }

  /* ---------------- Bitiş ---------------- */
  async function bitir(sessionId: string) {
    setPhase("finishing");
    for (const b of bekleyen.current.splice(0)) {
      try {
        await apiClient(`/me/flashcards/sessions/${sessionId}/events`, { method: "POST", body: b });
      } catch (e) {
        if (yenidenDenenir(e)) bekleyen.current.push(b);
      }
    }
    try {
      const r = await apiClient<FlashcardSessionSummary>(`/me/flashcards/sessions/${sessionId}/complete`, { method: "POST" });
      setResult(r);
      setNote(bekleyen.current.length > 0 ? { tone: "info", text: "Bazı puanlar gönderilemedi; özet onlar olmadan hesaplandı." } : null);
      setPhase("done");
    } catch (e) {
      setError(e instanceof ApiClientError ? { code: e.code, message: e.message } : { code: "NETWORK", message: "Bağlantı yok; oturum bitirilemedi. Puanların sunucuda, kaldığın yerden dönebilirsin." });
      setPhase("error");
    }
  }

  /* ---------------- Araçlar ---------------- */
  function toggleBookmark() {
    if (!card) return;
    const on = !card.bookmarked;
    setCards((cs) => cs.map((c) => (c.id === card.id ? { ...c, bookmarked: on } : c)));
    apiClient(`/me/flashcards/bookmarks/${card.id}`, { method: on ? "POST" : "DELETE" }).catch(() =>
      setCards((cs) => cs.map((c) => (c.id === card.id ? { ...c, bookmarked: !on } : c))),
    );
  }

  /** "Bu konudan soru çöz": ünite kapsamında kartların maddeleri, aksi halde konu geneli. */
  function soruHref(c: Flashcard | null): string | undefined {
    const tid = topicId ?? c?.topic.id;
    if (!tid) return undefined;
    const q = new URLSearchParams({ topicId: tid, count: "10", source: "flashcards", scope: etiket });
    if (unitSlug) {
      const nos = [...new Set(cards.flatMap((k) => k.articles.map((a) => a.no)))];
      if (nos.length > 0) q.set("articleNos", nos.join(","));
    }
    return `/seans?${q.toString()}`;
  }

  /* ---------------- Klavye ---------------- */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return;
      const k = kartKisayolu(e.key);
      if (!k) return;
      if (k === "exit") {
        if (phase === "playing" && !exitAsk) setExitAsk(true);
        return;
      }
      if (phase !== "playing" || exitAsk) return;
      // Odaktaki düğme/bağlantı Boşluk ve Enter'ı kendisi işler; çift eylem olmasın.
      if (k === "flip" && (tag === "BUTTON" || tag === "A")) return;
      e.preventDefault();
      if (k === "flip") setFlipped((f) => !f);
      else if (k === "again") puanla("again");
      else if (k === "known") puanla("known");
      else if (k === "bookmark") toggleBookmark();
      else if (k === "undo") void geriAl();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* ---------------- Görünümler ---------------- */
  if (phase === "loading" || phase === "finishing") {
    return (
      <FocusFrame context={etiket} exitHref={donus}>
        <div className="flex flex-col gap-4 py-2" aria-busy>
          <Skeleton className="h-1 w-full" radius="pill" />
          <Skeleton className="h-[380px] w-full md:h-[420px]" radius="card" />
          <Skeleton className="h-14 w-full" radius="card" />
          <p className="type-body-sm text-ink-soft">{phase === "finishing" ? "Oturum bitiriliyor…" : "Kartlar geliyor…"}</p>
        </div>
      </FocusFrame>
    );
  }

  if (phase === "error" || !session) {
    const premium = error?.code === "PREMIUM_REQUIRED";
    return (
      <FocusFrame context={etiket} exitHref={donus}>
        <div className="flex flex-col gap-3 py-2">
          <Notice tone={premium ? "warning" : "error"} title={premium ? "Premium gerekiyor" : "Kartlar açılamadı"}>
            {error?.message}
          </Notice>
          <div className="flex flex-wrap gap-2">
            {premium ? <ButtonLink href="/premium">Premium&apos;u gör</ButtonLink> : null}
            <ButtonLink href={donus} variant="secondary">
              Geri dön
            </ButtonLink>
          </div>
        </div>
      </FocusFrame>
    );
  }

  if (phase === "done" && result) {
    return (
      <FocusFrame context="Kart özeti" exitHref={donus}>
        <div className="flex flex-col gap-5">
          {note ? <Notice tone={note.tone}>{note.text}</Notice> : null}
          <FlashcardResultPanel result={result} line={sessionLine(result)} learnedDelta={tally.learned} />
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={donus}>Geldiğin yere dön</ButtonLink>
            {result.due.count > 0 ? (
              <ButtonLink href={kartlarHref(scope, "due", source, etiket, { nonce: result.sessionId.slice(0, 8) })} variant="secondary">
                Tekrarı sür · {Math.min(20, result.due.count)} kart
              </ButtonLink>
            ) : null}
            {soruHref(cards[0] ?? null) ? (
              <ButtonLink href={soruHref(cards[0] ?? null)!} variant="ghost">
                Bu konudan 10 soru çöz
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </FocusFrame>
    );
  }

  if (!card) return null;
  const puanlandi = tally.known + tally.again;

  return (
    <FocusFrame
      context={`${etiket} · ${modBasligi}`}
      onExit={() => (puanlandi === 0 ? router.push(donus) : setExitAsk(true))}
      actions={
        <Popover
          align="end"
          trigger={({ toggle, id, open }) => (
            <button
              type="button"
              onClick={toggle}
              aria-label="Kart menüsü"
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls={id}
              className="tk-interactive flex size-11 items-center justify-center rounded-control text-ink-soft hover:bg-surface-alt hover:text-ink"
            >
              <Ellipsis size={22} strokeWidth={1.75} aria-hidden />
            </button>
          )}
        >
          {(close) => (
            <div className="flex w-64 flex-col py-1">
              <button
                type="button"
                onClick={() => {
                  close();
                  void bitir(session.sessionId);
                }}
                className="tk-interactive flex min-h-11 flex-col items-start justify-center rounded-control px-3 py-1.5 text-left hover:bg-surface-alt"
              >
                <span className="type-subhead text-ink">Şimdilik bitir</span>
                <span className="type-body-sm text-ink-subtle">Puanladıkların kaydedilir, özet gösterilir</span>
              </button>
              <Link
                href={donus}
                onClick={close}
                className="tk-interactive flex min-h-11 flex-col items-start justify-center rounded-control px-3 py-1.5 text-left hover:bg-surface-alt"
              >
                <span className="type-subhead text-ink">Turdan çık</span>
                <span className="type-body-sm text-ink-subtle">Kalan kartlara kaldığın yerden dönersin</span>
              </Link>
            </div>
          )}
        </Popover>
      }
      aside={
        <Card className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="type-label text-ink-subtle">Bu tur</span>
            <p className="type-body tabular text-ink">
              {tally.known} biliyorum · {tally.again} tekrar
            </p>
          </div>
          <dl className="flex flex-col gap-1.5">
            <span className="type-label text-ink-subtle">Kısayollar</span>
            {[
              ["←", "Tekrar"],
              ["→", "Biliyorum"],
              ["Boşluk", "Kartı çevir"],
              ["F", "Favori"],
              ["Z", "Geri al"],
              ["Esc", "Çıkış"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3">
                <dt className="type-body-sm text-ink-soft">{v}</dt>
                <dd>
                  <KeyHint keys={k} className="inline-block" />
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      }
      asideLabel="Tur bilgisi"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <ProgressBar value={total > 0 ? index / total : 0} height={4} label="Tur ilerlemesi" />
          <p className="type-body-sm tabular text-center text-ink-soft">
            {modBasligi} · {Math.min(index + 1, Math.max(total, 1))} / {total}
          </p>
        </div>
        {note ? <Notice tone={note.tone}>{note.text}</Notice> : null}
        <div
          key={`${card.id}-${index}`}
          className="kart-ucus kart-giris relative"
          data-ucus={pending ?? undefined}
          onTransitionEnd={ucusBitti}
        >
          <FlashCard card={card} flipped={flipped} onFlip={() => setFlipped((f) => !f)} onBookmark={toggleBookmark} onReport={() => setReportOpen(true)} solveHref={soruHref(card)} />
          {pending ? <KoseRozeti rating={pending} /> : null}
        </div>
        <RatingBar onAgain={() => puanla("again")} onKnown={() => puanla("known")} disabled={pending != null} />
        {sonOlay ? (
          <UndoStrip rating={sonOlay.rating} onUndo={() => void geriAl()} />
        ) : (
          <p className="type-body-sm text-center text-ink-subtle">{tallyLine(tally.known, tally.again)}</p>
        )}
      </div>

      <Dialog
        open={reportOpen}
        onClose={reportKapat}
        title={`Kartı bildir · ${card.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`}
        size="sm"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            {reportState === "done" || reportState === "already" ? (
              <Button variant="secondary" onClick={reportKapat}>
                Kapat
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={reportKapat}>
                  Vazgeç
                </Button>
                <Button variant="destructive" onClick={() => void reportGonder(card.id)} disabled={!reportReason || reportState === "busy"} loading={reportState === "busy"}>
                  Gönder
                </Button>
              </>
            )}
          </div>
        }
      >
        {reportState === "done" ? (
          <Notice tone="success" title="Bildirim alındı">
            Editör ekibi inceleyecek. Teşekkürler.
          </Notice>
        ) : reportState === "already" ? (
          <Notice tone="info" title="Zaten bildirilmiş">
            Bu kart için daha önce bildirim göndermişsin; editör sırada.
          </Notice>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="type-subhead text-ink">Sorun ne?</p>
            <div role="radiogroup" aria-label="Neden" className="divide-y divide-line rounded-card border border-line bg-surface">
              {REPORT_REASONS.map((r) => {
                const active = r.code === reportReason;
                return (
                  <button
                    key={r.code}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setReportReason(r.code)}
                    className={`tk-interactive flex min-h-11 w-full items-center justify-between px-4 py-2.5 text-left ${active ? "type-subhead text-accent-ink" : "type-body text-ink"}`}
                  >
                    <span>{r.label}</span>
                    {active ? <Check size={18} strokeWidth={2} aria-hidden /> : null}
                  </button>
                );
              })}
            </div>
            <label htmlFor="kart-bildirim" className="type-subhead text-ink">
              Açıklama (isteğe bağlı)
            </label>
            <textarea
              id="kart-bildirim"
              value={reportText}
              onChange={(e) => setReportText(e.target.value.slice(0, 480))}
              onKeyDown={(e) => e.stopPropagation()}
              rows={3}
              placeholder="Neyin yanlış olduğunu kısaca yaz."
              className="type-body-sm w-full rounded-control border border-line bg-surface px-2.5 py-2 text-ink outline-none placeholder:text-ink-subtle focus:border-ink-soft"
            />
            {reportState === "error" ? <Notice tone="error">Gönderilemedi; yeniden dene.</Notice> : null}
          </div>
        )}
      </Dialog>

      <Dialog
        open={exitAsk}
        onClose={() => setExitAsk(false)}
        title="Turdan çıkıyor musun?"
        size="sm"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setExitAsk(false)}>
              Devam et
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setExitAsk(false);
                void bitir(session.sessionId);
              }}
            >
              Bitir ve özeti gör
            </Button>
            <Button variant="destructive" onClick={() => router.push(donus)}>
              Çık
            </Button>
          </div>
        }
      >
        <p className="type-body text-ink-soft">Puanladığın kartlar kaydedildi; kalan kartlara kaldığın yerden dönebilirsin.</p>
      </Dialog>
    </FocusFrame>
  );
}

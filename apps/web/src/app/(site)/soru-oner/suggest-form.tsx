"use client";
import { useId, useMemo, useState } from "react";
import { CheckCircle2, Plus, X } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import type { PublicCatalogModule } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";

const LABELS = ["A", "B", "C", "D", "E"];

interface Opt {
  label: string;
  text: string;
  isCorrect: boolean;
}

/* Beş şık kuralı (8 Eyl 2026): yeni soru beş şıkla başlar. */
const BASLANGIC: Opt[] = LABELS.map((label, i) => ({
  label,
  text: "",
  isCorrect: i === 0,
}));

const fieldClass =
  "h-11 w-full rounded-control border border-line bg-surface px-3 type-body text-ink outline-none focus:border-ink-soft";
const areaClass =
  "w-full rounded-control border border-line bg-surface px-3 py-2.5 type-body text-ink outline-none focus:border-ink-soft";

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="type-label text-ink-soft">
      {children}
    </label>
  );
}

/** Soru öner formu. Öneri onay kuyruğuna düşer (yayına çıkmaz). */
export function SuggestForm({ catalog }: { catalog: PublicCatalogModule[] }) {
  const id = useId();
  const [topicId, setTopicId] = useState("");
  const [stem, setStem] = useState("");
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );
  const [options, setOptions] = useState<Opt[]>(BASLANGIC);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = useMemo(
    () =>
      !!topicId &&
      stem.trim().length >= 10 &&
      options.every((o) => o.text.trim().length > 0) &&
      options.filter((o) => o.isCorrect).length === 1,
    [topicId, stem, options],
  );

  function setOpt(i: number, patch: Partial<Opt>) {
    setOptions((p) => p.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  }
  function markCorrect(i: number) {
    setOptions((p) => p.map((o, j) => ({ ...o, isCorrect: j === i })));
  }
  function addOpt() {
    if (options.length >= 5) return;
    setOptions((p) => [
      ...p,
      { label: LABELS[p.length], text: "", isCorrect: false },
    ]);
  }
  function removeOpt(i: number) {
    if (options.length <= 2) return;
    setOptions((p) => {
      const next = p
        .filter((_, j) => j !== i)
        .map((o, j) => ({ ...o, label: LABELS[j] }));
      if (!next.some((o) => o.isCorrect))
        next[0] = { ...next[0], isCorrect: true };
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      await apiClient("/questions/suggest", {
        method: "POST",
        body: {
          topicId,
          stem,
          explanation: explanation || undefined,
          difficulty,
          options,
        },
      });
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Öneri gönderilemedi, tekrar dene.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Card>
        <EmptyState
          icon={CheckCircle2}
          title="Teşekkürler!"
          body="Önerin editör onayına gönderildi. Uygun bulunursa soru bankasına eklenecek."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setDone(false);
                setStem("");
                setExplanation("");
                setOptions(BASLANGIC);
              }}
            >
              Yeni soru öner
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <Card className="flex flex-col gap-5 p-5">
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor={`${id}-topic`}>Konu</FieldLabel>
          <select
            id={`${id}-topic`}
            required
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className={fieldClass}
          >
            <option value="">Konu seç…</option>
            {catalog.map((m) =>
              m.courses.map((c) =>
                c.topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {m.name} / {c.name} / {t.name}
                  </option>
                )),
              ),
            )}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor={`${id}-stem`}>Soru</FieldLabel>
          <textarea
            id={`${id}-stem`}
            required
            rows={3}
            value={stem}
            onChange={(e) => setStem(e.target.value)}
            placeholder="Soruyu buraya yaz (en az 10 karakter)…"
            className={areaClass}
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <legend className="type-label text-ink-soft">
              Şıklar (doğruyu işaretle)
            </legend>
            {options.length < 5 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addOpt}
                leadingIcon={<Plus size={16} aria-hidden />}
              >
                Şık ekle
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {options.map((o, i) => (
              <div key={o.label} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  className="size-4 shrink-0 accent-accent"
                  checked={o.isCorrect}
                  onChange={() => markCorrect(i)}
                  aria-label={`${o.label} şıkkı doğru`}
                />
                <span className="type-subhead w-5 shrink-0 text-ink-soft">
                  {o.label}
                </span>
                <input
                  required
                  value={o.text}
                  onChange={(e) => setOpt(i, { text: e.target.value })}
                  placeholder={`${o.label} şıkkı`}
                  aria-label={`${o.label} şıkkı metni`}
                  className={fieldClass}
                />
                {options.length > 2 && (
                  <IconButton
                    label="Şıkkı kaldır"
                    icon={X}
                    variant="ghost"
                    onClick={() => removeOpt(i)}
                  />
                )}
              </div>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor={`${id}-exp`}>
            Açıklama / çözüm (isteğe bağlı)
          </FieldLabel>
          <textarea
            id={`${id}-exp`}
            rows={2}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className={areaClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor={`${id}-diff`}>Zorluk</FieldLabel>
          <select
            id={`${id}-diff`}
            value={difficulty}
            onChange={(e) =>
              setDifficulty(e.target.value as "easy" | "medium" | "hard")
            }
            className={`${fieldClass} sm:w-48`}
          >
            <option value="easy">Kolay</option>
            <option value="medium">Orta</option>
            <option value="hard">Zor</option>
          </select>
        </div>
      </Card>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="flex flex-col gap-2">
        <Button
          type="submit"
          disabled={!valid}
          loading={busy}
          size="lg"
          className="self-start"
        >
          Öneriyi gönder
        </Button>
        <p className="type-body-sm text-ink-subtle">
          Önerin doğrudan yayınlanmaz; editör onayından geçtikten sonra soru
          bankasına eklenir.
        </p>
      </div>
    </form>
  );
}

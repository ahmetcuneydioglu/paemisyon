"use client";
import { useMemo, useState } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import type { PublicCatalogModule } from "@/lib/types";

const LABELS = ["A", "B", "C", "D", "E"];

interface Opt {
  label: string;
  text: string;
  isCorrect: boolean;
}

/** Soru öner formu — eski /soru-oner. Öneri onay kuyruğuna düşer (yayına çıkmaz). */
export function SuggestForm({ catalog }: { catalog: PublicCatalogModule[] }) {
  const [topicId, setTopicId] = useState("");
  const [stem, setStem] = useState("");
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [options, setOptions] = useState<Opt[]>([
    { label: "A", text: "", isCorrect: true },
    { label: "B", text: "", isCorrect: false },
    { label: "C", text: "", isCorrect: false },
    { label: "D", text: "", isCorrect: false },
  ]);
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
    setOptions((p) => [...p, { label: LABELS[p.length], text: "", isCorrect: false }]);
  }
  function removeOpt(i: number) {
    if (options.length <= 2) return;
    setOptions((p) => {
      const next = p.filter((_, j) => j !== i).map((o, j) => ({ ...o, label: LABELS[j] }));
      if (!next.some((o) => o.isCorrect)) next[0] = { ...next[0], isCorrect: true };
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
        body: { topicId, stem, explanation: explanation || undefined, difficulty, options },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Öneri gönderilemedi, tekrar dene.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="card-content text-center">
          <h2 className="head3 mb-3">
            <i className="icon-question" aria-hidden />
            Teşekkürler!
          </h2>
          <p className="text-sm">
            Önerin editör onayına gönderildi. Uygun bulunursa soru bankasına eklenecek.
          </p>
          <button
            onClick={() => {
              setDone(false);
              setStem("");
              setExplanation("");
              setOptions([
                { label: "A", text: "", isCorrect: true },
                { label: "B", text: "", isCorrect: false },
                { label: "C", text: "", isCorrect: false },
                { label: "D", text: "", isCorrect: false },
              ]);
            }}
            className="btn-old btn-old-navy mt-6"
          >
            Yeni Soru Öner
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5 px-4 py-8">
      <div>
        <label className="block text-sm font-medium">Konu</label>
        <select
          required
          value={topicId}
          onChange={(e) => setTopicId(e.target.value)}
          className="mt-1 w-full border border-(--color-border) bg-white px-3 py-2 text-sm"
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

      <div>
        <label className="block text-sm font-medium">Soru</label>
        <textarea
          required
          rows={3}
          value={stem}
          onChange={(e) => setStem(e.target.value)}
          placeholder="Soruyu buraya yaz (en az 10 karakter)…"
          className="mt-1 w-full border border-(--color-border) px-3 py-2 text-sm"
        />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium">Şıklar (doğruyu işaretle)</label>
          {options.length < 5 && (
            <button type="button" onClick={addOpt} className="text-sm font-medium text-(--color-navy) hover:underline">
              + Şık ekle
            </button>
          )}
        </div>
        <div className="space-y-2">
          {options.map((o, i) => (
            <div key={o.label} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                checked={o.isCorrect}
                onChange={() => markCorrect(i)}
                aria-label={`${o.label} şıkkı doğru`}
              />
              <span className="w-5 text-sm font-bold text-neutral-500">{o.label})</span>
              <input
                required
                value={o.text}
                onChange={(e) => setOpt(i, { text: e.target.value })}
                placeholder={`${o.label} şıkkı`}
                className="flex-1 border border-(--color-border) px-3 py-2 text-sm"
              />
              {options.length > 2 && (
                <button type="button" onClick={() => removeOpt(i)} className="px-1 text-neutral-400 hover:text-(--color-red)" aria-label="Şıkkı kaldır">
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Açıklama / Çözüm (opsiyonel)</label>
        <textarea
          rows={2}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          className="mt-1 w-full border border-(--color-border) px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Zorluk</label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
          className="mt-1 border border-(--color-border) bg-white px-3 py-2 text-sm"
        >
          <option value="easy">Kolay</option>
          <option value="medium">Orta</option>
          <option value="hard">Zor</option>
        </select>
      </div>

      {error && <p className="text-sm font-semibold text-(--color-red)">{error}</p>}

      <button type="submit" disabled={!valid || busy} className="btn-old btn-old-navy disabled:opacity-50">
        {busy ? "Gönderiliyor…" : "Öneriyi Gönder"}
      </button>
      <p className="text-[12px] text-neutral-500">
        Önerin doğrudan yayınlanmaz; editör onayından geçtikten sonra soru bankasına eklenir.
      </p>
    </form>
  );
}

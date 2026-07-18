"use client";

import Link from "next/link";
import { useState } from "react";
import { config } from "@/lib/config";
import type { QuestionOfDay } from "@/lib/public-api";

interface RevealResult {
  isCorrect: boolean;
  correctOptionId: string | null;
  explanation: string | null;
  source: string | null;
}

/**
 * Günün Sorusu (Doc 23) — girişsiz ana sayfanın kancası: soru SAYFADA
 * çözülür, cevap seçilince sunucudan açıklama gelir, ardından kayıt CTA'sı.
 */
export function QuestionOfDayCard({ question, loggedIn }: { question: QuestionOfDay; loggedIn: boolean }) {
  const [chosen, setChosen] = useState<string | null>(null);
  const [result, setResult] = useState<RevealResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function pick(optionId: string) {
    if (result || busy) return;
    setBusy(true);
    setChosen(optionId);
    try {
      const res = await fetch(`${config.apiBaseUrl}/public/question-of-day/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: question.versionId, optionId }),
      });
      const json = (await res.json()) as { data?: RevealResult };
      if (json.data) setResult(json.data);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-white/20 bg-white/10 p-6 text-left backdrop-blur">
      <div className="mb-3 flex items-center justify-between text-sm text-white/70">
        <span>🎯 Günün Sorusu</span>
        <span>
          {/* "Ders / Konu" aynıysa tek göster (tekrar önleme). */}
          {[...new Set(question.topic.split(" / "))].join(" / ")}
        </span>
      </div>
      <p className="mb-4 font-medium text-white">{question.stem}</p>
      <div className="space-y-2" role="radiogroup" aria-label="Günün sorusu şıkları">
        {question.options.map((o) => {
          let cls = "border-white/25 bg-white/5 hover:bg-white/15";
          if (result) {
            if (o.id === result.correctOptionId) cls = "border-emerald-400 bg-emerald-500/30";
            else if (o.id === chosen) cls = "border-red-400 bg-red-500/30";
            else cls = "border-white/15 bg-white/5 opacity-60";
          }
          return (
            <button
              key={o.id}
              onClick={() => pick(o.id)}
              disabled={!!result || busy}
              className={`block w-full rounded-lg border px-4 py-2.5 text-left text-sm text-white transition ${cls}`}
              role="radio"
              aria-checked={chosen === o.id}
            >
              <b>{o.label})</b> {o.text}
            </button>
          );
        })}
      </div>

      {result && (
        <div className="mt-4 rounded-lg bg-white/10 p-4 text-sm text-white">
          <p className="mb-1 font-bold">
            {result.isCorrect ? "🎉 Doğru! Harikasın." : "Yanlış — ama artık biliyorsun."}
          </p>
          {result.explanation && <p className="text-white/85">Açıklama: {result.explanation}</p>}
          {result.source && <p className="mt-1 text-xs text-white/60">Kaynak: {result.source}</p>}
          {!loggedIn && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Link
                href="/kayit"
                className="rounded-sm bg-white px-4 py-2 font-heading text-[13px] font-bold text-(--tk-brand)"
              >
                Ücretsiz kayıt ol, serini başlat
              </Link>
              <span className="text-xs text-white/60">Her gün 1 soru + günde 15 ücretsiz soru</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

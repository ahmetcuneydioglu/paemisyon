"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { config } from "@/lib/config";
import type { DailyQuiz } from "@/lib/public-api";

interface RevealResult {
  isCorrect: boolean;
  correctOptionId: string | null;
  explanation: string | null;
  source: string | null;
}

/**
 * Günün Quizi (Doc 23 funnel) — girişsiz ana sayfanın kancası: 10 kaynaklı çıkmış
 * soru SAYFADA tek tek çözülür (cevap seçilince sunucudan açıklama), sonunda
 * skor + kayıt/giriş duvarı. Girişli `daily` seansıyla AYNI 10 soru.
 */
export function DailyQuizCard({
  quiz,
  loggedIn,
  freeDailyLimit,
}: {
  quiz: DailyQuiz;
  /** Belirtilmezse (statik sayfa) giriş durumu istemcide çerezden sezilir. */
  loggedIn?: boolean;
  /** Ücretsiz günlük hak — sunucudan gelir, metne gömülmez. */
  freeDailyLimit: number;
}) {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [result, setResult] = useState<RevealResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState(0);

  const [detectedLogin, setDetectedLogin] = useState(false);
  useEffect(() => {
    if (loggedIn !== undefined) return;
    const id = setTimeout(
      () => setDetectedLogin(document.cookie.includes("-auth-token")),
      0,
    );
    return () => clearTimeout(id);
  }, [loggedIn]);
  const isLoggedIn = loggedIn ?? detectedLogin;

  const done = index >= quiz.count;
  const q = done ? null : quiz.questions[index];

  async function pick(optionId: string) {
    if (result || busy || !q) return;
    setBusy(true);
    setChosen(optionId);
    try {
      const res = await fetch(`${config.apiBaseUrl}/public/daily-quiz/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: q.versionId, optionId }),
      });
      const json = (await res.json()) as { data?: RevealResult };
      if (json.data) {
        setResult(json.data);
        if (json.data.isCorrect) setScore((s) => s + 1);
      }
    } finally {
      setBusy(false);
    }
  }

  function next() {
    setResult(null);
    setChosen(null);
    setIndex((i) => i + 1);
  }

  // ── Dönüşüm duvarı (10 soru bitince) ──
  if (done) {
    const pct = quiz.count > 0 ? Math.round((score / quiz.count) * 100) : 0;
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-white/20 bg-white/10 p-6 text-center backdrop-blur">
        <p className="text-sm text-white/70">Günün Quizini tamamladın 🎉</p>
        <p className="mt-2 font-heading text-4xl font-bold text-white">
          {score}
          <span className="text-2xl text-white/60">/{quiz.count}</span>
        </p>
        <p className="mt-1 text-sm text-white/70">doğruluk %{pct}</p>
        {isLoggedIn ? (
          <Link
            href="/bugun"
            className="mt-5 inline-block rounded-sm bg-white px-6 py-3 font-heading text-[15px] font-bold text-brand"
          >
            Bugün&apos;e devam et →
          </Link>
        ) : (
          <div className="mt-5 flex flex-col items-center gap-3">
            <Link
              href="/kayit"
              className="rounded-sm bg-white px-6 py-3 font-heading text-[15px] font-bold text-brand"
            >
              Ücretsiz kaydol — günde {freeDailyLimit} soru + koç + seri
            </Link>
            <span className="text-xs text-white/70">
              Zaten üye misin?{" "}
              <Link href="/giris" className="font-bold text-white underline">
                Giriş yap
              </Link>
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-white/20 bg-white/10 p-6 text-left backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-3 text-sm text-white/70">
        <span className="shrink-0">🎯 Günün Quizi</span>
        <span className="min-w-0 truncate text-right">
          {index + 1}/{quiz.count} · {[...new Set(q!.topic.split(" / "))].join(" / ")}
        </span>
      </div>
      {/* İlerleme çubuğu */}
      <div className="mb-4 h-1 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-white/70 transition-all"
          style={{ width: `${quiz.count > 0 ? (index / quiz.count) * 100 : 0}%` }}
        />
      </div>
      <p className="mb-4 font-medium text-white">{q!.stem}</p>
      <div className="space-y-2" role="radiogroup" aria-label="Günün quizi şıkları">
        {q!.options.map((o) => {
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
          {result.explanation && (
            <p className="text-white/85">Açıklama: {result.explanation}</p>
          )}
          {result.source && (
            <p className="mt-1 text-xs text-white/60">Kaynak: {result.source}</p>
          )}
          <button
            type="button"
            onClick={next}
            className="mt-3 rounded-sm bg-white px-4 py-2 font-heading text-[13px] font-bold text-brand"
          >
            {index + 1 < quiz.count ? "Sonraki soru →" : "Sonucu gör →"}
          </button>
        </div>
      )}
    </div>
  );
}

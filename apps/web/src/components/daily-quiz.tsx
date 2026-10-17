"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { config } from "@/lib/config";
import type { DailyQuiz } from "@/lib/public-api";
import { Card } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import { Notice } from "@/components/ui/notice";
import {
  QuestionOption,
  QuestionStem,
  type QuestionOptionState,
} from "@/components/ui/question";

interface RevealResult {
  isCorrect: boolean;
  correctOptionId: string | null;
  explanation: string | null;
  source: string | null;
}

/**
 * Günün Quizi (Doc 23 funnel) — girişsiz ana sayfanın kancası: 10 kaynaklı çıkmış
 * soru SAYFADA tek tek çözülür (cevap seçilince sunucudan açıklama), sonunda
 * skor + kayıt/giriş duvarı. Girişli `daily` turuyla AYNI 10 soru.
 *
 * Görünüm kit üstünde (W-F): seans oynatıcıyla aynı şık satırı ve kök; böylece
 * ziyaretçi kayıt olunca tanıdık bir ekranla karşılaşır.
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
      <Card className="mx-auto flex max-w-2xl flex-col items-center gap-3 p-6 text-center">
        <span className="type-label text-accent-ink">
          Günün Quizini tamamladın
        </span>
        <p className="type-stat text-[40px] leading-none text-ink">
          {score}
          <span className="text-ink-subtle">/{quiz.count}</span>
        </p>
        <p className="type-body-sm text-ink-soft">doğruluk %{pct}</p>
        {isLoggedIn ? (
          <ButtonLink href="/bugun" size="lg" className="mt-2">
            Bugün&apos;e devam et
          </ButtonLink>
        ) : (
          <div className="mt-2 flex flex-col items-center gap-3">
            <ButtonLink href="/kayit" size="lg">
              Ücretsiz kaydol — günde {freeDailyLimit} soru + koç + seri
            </ButtonLink>
            <span className="type-body-sm text-ink-soft">
              Zaten üye misin?{" "}
              <Link
                href="/giris"
                className="font-semibold text-accent-ink hover:underline"
              >
                Giriş yap
              </Link>
            </span>
          </div>
        )}
      </Card>
    );
  }

  const correctLabel =
    result?.correctOptionId && q
      ? q.options.find((o) => o.id === result.correctOptionId)?.label
      : undefined;

  const stateOf = (id: string): QuestionOptionState => {
    if (!result) return chosen === id ? "selected" : "default";
    if (id === result.correctOptionId)
      return id === chosen ? "correct" : "missed";
    if (id === chosen) return "incorrect";
    return "disabled";
  };

  return (
    <Card className="mx-auto flex max-w-2xl flex-col gap-4 p-5 text-left sm:p-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="type-label text-accent-ink">Günün Quizi</span>
          <span className="type-label tabular text-ink-subtle">
            {index + 1}/{quiz.count}
          </span>
        </div>
        <ProgressBar
          value={quiz.count > 0 ? index / quiz.count : 0}
          height={4}
          label="Quiz ilerlemesi"
        />
      </div>
      <QuestionStem
        index={index + 1}
        total={quiz.count}
        topic={[...new Set(q!.topic.split(" / "))].join(" / ")}
        stem={q!.stem}
      />
      <div
        className="flex flex-col gap-2"
        role="radiogroup"
        aria-label="Günün quizi şıkları"
      >
        {q!.options.map((o) => (
          <QuestionOption
            key={o.id}
            label={o.label}
            text={o.text}
            state={stateOf(o.id)}
            onSelect={!result && !busy ? () => pick(o.id) : undefined}
          />
        ))}
      </div>

      {result && (
        <Notice
          tone={result.isCorrect ? "success" : "error"}
          title={
            result.isCorrect
              ? "Doğru"
              : `Yanlış${correctLabel ? ` — doğru cevap ${correctLabel}` : ""}`
          }
          action={
            <Button onClick={next} size="md">
              {index + 1 < quiz.count ? "Sonraki soru" : "Sonucu gör"}
            </Button>
          }
        >
          {result.explanation ? (
            <p className="whitespace-pre-line">{result.explanation}</p>
          ) : null}
          {result.source ? (
            <p className="mt-1 text-ink-soft">Kaynak: {result.source}</p>
          ) : null}
        </Notice>
      )}
    </Card>
  );
}

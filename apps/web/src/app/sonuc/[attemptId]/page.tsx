import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { supabaseServer } from "@/lib/supabase/server";
import type { AttemptResult } from "@/lib/types";
import { ResultTiles } from "@/components/result-tiles";
import { ReviewList } from "@/components/review-list";

export const metadata: Metadata = { title: "Sınav Sonucu", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Sonuç + inceleme — eski sinav-sonuc.php (Doc 18 §2.4). Yalnız sahibi. */
export default async function SonucPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/giris");

  let result: AttemptResult;
  try {
    result = await api<AttemptResult>(`/exams/attempts/${attemptId}`);
  } catch (e) {
    if (e instanceof ApiError && e.code === "EXAM_IN_PROGRESS") {
      const examId = (e.details as { examId?: string } | undefined)?.examId;
      return (
        <div className="mx-auto max-w-2xl px-4 py-16">
          <div className="card-content text-center">
            <h1 className="head3 mb-3">
              <i className="icon-timer" aria-hidden />
              Sınav Devam Ediyor
            </h1>
            <p className="mb-6 text-sm">
              Bu sınavın süresi henüz dolmadı — sonucu, sınav bittikten sonra görebilirsin.
            </p>
            {examId && (
              <Link href={`/sinav/${examId}`} className="btn-old btn-old-green">
                Sınava Dön
              </Link>
            )}
          </div>
        </div>
      );
    }
    throw e;
  }

  const breakdown = result.topicBreakdown ?? [];
  const losers = breakdown.filter((t) => t.wrong + t.blank > 0).slice(0, 3);
  const lostTotal = breakdown.reduce((s, t) => s + t.wrong + t.blank, 0);
  const lostInTop3 = losers.reduce((s, t) => s + t.wrong + t.blank, 0);

  return (
    <div>
      <ResultTiles result={result} />

      {/* Derin analiz (wireframe 08): ilk kart KONTROL EDİLEBİLİRLİK verir —
          sıralama değil, "kaybın nereden ve kapatılabilir" bilgisi. */}
      {losers.length > 0 && (
        <div className="mx-auto max-w-3xl px-4 pt-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-1 text-sm font-bold text-(--color-navy)">Koç</p>
            <p className="mb-4 text-sm text-gray-600">
              {lostTotal > 0 && lostInTop3 / lostTotal >= 0.5
                ? `Kaybının %${Math.round((lostInTop3 / lostTotal) * 100)}'i ${losers.length} konudan — hepsi kapatılabilir:`
                : "Kaybın konulara dağılmış — en çok kaybettirenler:"}
            </p>
            <ul className="space-y-2">
              {losers.map((t) => (
                <li
                  key={t.topicId}
                  className="flex items-center justify-between gap-3 border-b border-dashed border-gray-200 pb-2 text-sm last:border-0 last:pb-0"
                >
                  <span className="min-w-0 flex-1 truncate">{t.topicName}</span>
                  <span className="shrink-0 text-gray-500">
                    {t.wrong > 0 && `${t.wrong} yanlış`}
                    {t.wrong > 0 && t.blank > 0 && " · "}
                    {t.blank > 0 && `${t.blank} boş`}
                    <span className="text-gray-400"> / {t.total}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-gray-400">
              Bu konuların kapatma seansları uygulamada seni bekliyor — yanlışların
              tekrar kuyruğuna eklendi.
            </p>
          </div>

          {/* Tam konu kırılımı */}
          {breakdown.length > losers.length && (
            <details className="mt-3 rounded-xl border border-gray-200 bg-white p-5 text-sm">
              <summary className="cursor-pointer font-bold text-(--color-navy)">
                Tüm konu kırılımı ({breakdown.length} konu)
              </summary>
              <ul className="mt-3 space-y-1.5">
                {breakdown.map((t) => (
                  <li key={t.topicId} className="flex items-center gap-3">
                    <span className="min-w-0 flex-1 truncate">{t.topicName}</span>
                    <span className="h-2 w-28 shrink-0 overflow-hidden rounded bg-gray-100">
                      <span
                        className="block h-full rounded bg-(--color-green)"
                        style={{ width: `${(t.correct / Math.max(1, t.total)) * 100}%` }}
                      />
                    </span>
                    <span className="w-12 shrink-0 text-right text-gray-500">
                      {t.correct}/{t.total}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 pt-6 text-center">
        <div className="flex flex-wrap justify-center gap-2">
          <Link href={`/siralama/${result.exam.id}`} className="btn-old btn-old-navy">
            Sıralamayı Gör
          </Link>
          <Link href="/denemeler" className="btn-old btn-old-green">
            Diğer Denemeler
          </Link>
        </div>
      </div>
      <h2 className="head2 mt-8">Cevap İncelemesi</h2>
      <ReviewList questions={result.review} showAnswers />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { AttemptResult } from "@/lib/types";
import { Card, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { ReviewList } from "@/components/review-list";

export const metadata: Metadata = { title: "Sınav Sonucu", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Deneme Sonucu + Derin Analiz (Doc 27 §3.8, wireframe 11). Şok değil yol
 * haritası: önce kendi kıyasın ve kapatılabilir kayıplar, sıralama sonra.
 * Her kayıp satırı eyleme bağlanır — tek tık kapatma seansı (/seans).
 */
export default async function SonucPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;

  let result: AttemptResult;
  try {
    result = await api<AttemptResult>(`/exams/attempts/${attemptId}`);
  } catch (e) {
    if (e instanceof ApiError && e.code === "EXAM_IN_PROGRESS") {
      const examId = (e.details as { examId?: string } | undefined)?.examId;
      return (
        <div className="grid min-h-[70vh] place-items-center px-4">
          <Card className="w-full max-w-md p-8 text-center">
            <p className="text-3xl" aria-hidden>⏱</p>
            <CardTitle className="mt-3 text-[17px]">Sınav devam ediyor</CardTitle>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
              Süre dolmadan sonuç açılmaz — herkese aynı anda, adil.
            </p>
            {examId && (
              <div className="mt-6">
                <ButtonLink href={`/sinav/${examId}`}>Sınava dön</ButtonLink>
              </div>
            )}
          </Card>
        </div>
      );
    }
    throw e;
  }

  const breakdown = result.topicBreakdown ?? [];
  const losers = breakdown.filter((t) => t.wrong + t.blank > 0).slice(0, 3);
  const lostTotal = breakdown.reduce((s, t) => s + t.wrong + t.blank, 0);
  const lostInTop3 = losers.reduce((s, t) => s + t.wrong + t.blank, 0);
  const minutes =
    result.durationSeconds != null ? Math.max(1, Math.round(result.durationSeconds / 60)) : null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <nav className="tk-caption mb-3" aria-label="breadcrumb">
        <Link href="/denemeler" className="hover:text-ink">Denemeler</Link> ›{" "}
        {result.exam.title} › Analiz
      </nav>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        {/* Sol: skor + koç + eylemler */}
        <div className="space-y-4">
          <Card className="p-6 text-center">
            <span className="tk-caption">
              {result.exam.title}
              {minutes && ` · ${minutes} dk`}
            </span>
            <p className="tabular mt-2 font-heading text-5xl font-bold text-ink">
              {result.score != null ? result.score.toFixed(2) : "—"}
            </p>
            <p className="tk-caption mt-1">NET (doğru − yanlış/4)</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-[13px]">
              <div className="rounded-sm bg-success/10 py-2">
                <p className="tabular font-bold text-success">{result.correctCount}</p>
                <p className="text-ink-soft">doğru</p>
              </div>
              <div className="rounded-sm bg-danger/10 py-2">
                <p className="tabular font-bold text-danger">{result.wrongCount}</p>
                <p className="text-ink-soft">yanlış</p>
              </div>
              <div className="rounded-sm bg-line/60 py-2">
                <p className="tabular font-bold text-ink">{result.blankCount}</p>
                <p className="text-ink-soft">boş</p>
              </div>
            </div>
          </Card>

          {losers.length > 0 && (
            <Card className="border-brand/30">
              <CardTitle className="text-[13px] text-brand">Koç</CardTitle>
              <p className="mt-1 text-[15px] leading-relaxed text-ink">
                {lostTotal > 0 && lostInTop3 / lostTotal >= 0.5
                  ? `Kaybının %${Math.round((lostInTop3 / lostTotal) * 100)}'i ${losers.length} konudan — sıralamaya değil şu tabloya bak, hepsi kapatılabilir.`
                  : "Kaybın konulara dağılmış — en çok kaybettirenlerden başla, her satırın kapatma seansı hazır."}
              </p>
            </Card>
          )}

          <div className="flex flex-wrap gap-3">
            <ButtonLink href={`/siralama/${result.exam.id}`} variant="secondary">
              Sıralamayı gör
            </ButtonLink>
            <ButtonLink href="/denemeler" variant="secondary">
              Denemeler
            </ButtonLink>
            <ButtonLink href="/bugun" variant="ghost">
              Bugün&apos;e dön
            </ButtonLink>
          </div>
        </div>

        {/* Sağ: kayıp tablosu — her satır eyleme bağlı */}
        <Card>
          <CardTitle>Konu kırılımı — kaybettirenler üstte</CardTitle>
          {breakdown.length > 0 ? (
            <table className="mt-2 w-full text-[14px]">
              <thead>
                <tr className="tk-caption border-b border-line text-left">
                  <th className="py-2 font-semibold">Konu</th>
                  <th className="py-2 text-right font-semibold">D</th>
                  <th className="py-2 text-right font-semibold">Y</th>
                  <th className="py-2 text-right font-semibold">B</th>
                  <th className="py-2 text-right font-semibold">Kayıp net</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {breakdown.map((t) => {
                  // Kayıp net = yanlışın kendisi + götürdüğü çeyrekler + boşlar.
                  const lostNet = t.wrong * 1.25 + t.blank;
                  return (
                    <tr key={t.topicId} className="border-b border-line last:border-0">
                      <td className="py-2.5 pr-2 text-ink">{t.topicName}</td>
                      <td className="tabular py-2.5 text-right text-success">{t.correct}</td>
                      <td className="tabular py-2.5 text-right text-danger">{t.wrong}</td>
                      <td className="tabular py-2.5 text-right text-ink-soft">{t.blank}</td>
                      <td className="tabular py-2.5 text-right font-bold text-ink">
                        {lostNet > 0 ? `−${String(lostNet.toFixed(2)).replace(/\.?0+$/, "")}` : "0"}
                      </td>
                      <td className="py-2.5 pl-2 text-right">
                        {t.wrong + t.blank > 0 && (
                          <Link
                            href={`/seans?topicId=${t.topicId}&scope=${encodeURIComponent(`${t.topicName} · kapatma`)}`}
                            className="tk-interactive inline-block rounded-full border border-line px-3 py-1 text-[12px] font-bold text-ink-soft hover:border-brand hover:text-brand"
                          >
                            kapat
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="mt-2 text-[14px] text-ink-soft">Konu kırılımı bu deneme için yok.</p>
          )}
          <p className="tk-caption mt-3">
            Kayıp net = yanlış×1,25 + boş. &quot;kapat&quot; o konudan akıllı seans başlatır;
            yanlışların zaten tekrar kuyruğunda.
          </p>
        </Card>
      </div>

      {/* Cevap incelemesi (miras bileşen — işlevsel; görsel tazeleme W4) */}
      <h2 className="mb-2 mt-8 font-heading text-lg font-bold text-ink">Cevap incelemesi</h2>
      <Card className="p-0">
        <ReviewList questions={result.review} showAnswers />
      </Card>
    </div>
  );
}

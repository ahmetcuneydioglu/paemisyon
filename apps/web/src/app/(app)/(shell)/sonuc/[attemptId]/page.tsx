import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Flag } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { AttemptResult, MyAttempt } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ReviewList } from "@/components/review-list";
import { TimingStrip } from "@/components/exam/timing-strip";

export const metadata: Metadata = {
  title: "Sınav Sonucu",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

/**
 * Deneme Sonucu + Derin Analiz (Doc 27 §3.8). Şok değil yol haritası: önce kendi
 * kıyasın ve kapatılabilir kayıplar, sıralama sonra. Her kayıp satırı eyleme bağlanır.
 * "Emin değilim" bayrakları (S1-C) ayrı listelenir.
 */
export default async function SonucPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;

  let result: AttemptResult;
  try {
    result = await api<AttemptResult>(`/exams/attempts/${attemptId}`);
  } catch (e) {
    if (e instanceof ApiError && e.code === "EXAM_IN_PROGRESS") {
      const examId = (e.details as { examId?: string } | undefined)?.examId;
      return (
        <div className="grid min-h-[70vh] place-items-center px-4">
          <Card className="w-full max-w-md">
            <EmptyState
              icon={Clock}
              title="Sınav devam ediyor"
              body="Süre dolmadan sonuç açılmaz — herkese aynı anda, adil."
              action={
                examId ? (
                  <ButtonLink href={`/sinav/${examId}`}>Sınava dön</ButtonLink>
                ) : undefined
              }
            />
          </Card>
        </div>
      );
    }
    throw e;
  }

  const mine = await api<MyAttempt[]>("/exams/attempts/mine").catch(
    () => [] as MyAttempt[],
  );
  const completedMine = mine
    .filter((a) => a.status === "completed" && a.score != null)
    .sort((a, b) => +new Date(a.startedAt) - +new Date(b.startedAt));
  const myIndex = completedMine.findIndex((a) => a.attemptId === attemptId);
  const prev = myIndex > 0 ? completedMine[myIndex - 1] : null;
  const delta =
    prev != null && result.score != null
      ? result.score - Number(prev.score)
      : null;

  const breakdown = result.topicBreakdown ?? [];
  const losers = breakdown.filter((t) => t.wrong + t.blank > 0).slice(0, 3);
  const lostTotal = breakdown.reduce((s, t) => s + t.wrong + t.blank, 0);
  const lostInTop3 = losers.reduce((s, t) => s + t.wrong + t.blank, 0);
  const minutes =
    result.durationSeconds != null
      ? Math.max(1, Math.round(result.durationSeconds / 60))
      : null;
  const flagged = result.review.filter((q) => q.flagged);
  const fmt = (n: number) => n.toFixed(2).replace(/\.?0+$/, "");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <Breadcrumb
        className="mb-4"
        items={[
          { label: "Denemeler", href: "/denemeler" },
          { label: result.exam.title },
          { label: "Analiz" },
        ]}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_1.4fr]">
        {/* Sol: skor + koç + eylemler — uzun tabloya eşlik etsin diye yapışkan */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-20">
          <Card className="flex flex-col items-center gap-1 p-6 text-center">
            <span className="type-label text-ink-subtle">
              {result.exam.title}
              {minutes ? ` · ${minutes} dk` : ""}
            </span>
            <p className="type-display tabular text-ink">
              {result.score != null ? fmt(result.score) : "—"}
            </p>
            <span className="type-label text-ink-subtle">
              NET (doğru − yanlış/4)
            </span>
            {delta != null ? (
              <Badge
                tone={delta > 0 ? "success" : delta < 0 ? "warning" : "neutral"}
              >
                geçen denemeden {delta > 0 ? "+" : ""}
                {fmt(delta)} net
              </Badge>
            ) : null}
            {myIndex === 0 ? (
              <span className="type-body-sm text-ink-subtle">
                ilk denemen — kıyas çizgin buradan başlıyor
              </span>
            ) : null}
            <div className="mt-3 grid w-full grid-cols-3 gap-2">
              {[
                [
                  "doğru",
                  result.correctCount,
                  "bg-success-soft text-success-ink",
                ],
                ["yanlış", result.wrongCount, "bg-danger-soft text-danger-ink"],
                ["boş", result.blankCount, "bg-surface-alt text-ink"],
              ].map(([k, v, cls]) => (
                <div
                  key={String(k)}
                  className={cn(
                    "flex flex-col rounded-control py-2",
                    String(cls),
                  )}
                >
                  <span className="type-stat tabular">{v}</span>
                  <span className="type-body-sm">{k}</span>
                </div>
              ))}
            </div>
          </Card>

          {losers.length > 0 ? (
            <Card className="flex flex-col gap-1 border-accent/40">
              <span className="type-label text-accent-ink">Koç</span>
              <p className="type-body text-ink">
                {lostTotal > 0 && lostInTop3 / lostTotal >= 0.5
                  ? `Kaybının %${Math.round((lostInTop3 / lostTotal) * 100)}'i ${losers.length} konudan — sıralamaya değil şu tabloya bak, hepsi kapatılabilir.`
                  : "Kaybın konulara dağılmış — en çok kaybettirenlerden başla, her satırın kapatma turu hazır."}
              </p>
            </Card>
          ) : null}

          {flagged.length > 0 ? (
            <Card className="flex flex-col gap-2">
              <span className="type-label inline-flex items-center gap-1.5 text-ink-subtle">
                <Flag size={12} aria-hidden /> Emin olmadığın sorular
              </span>
              <p className="type-body-sm text-ink-soft">
                {flagged.length} soruyu bayraklamıştın;{" "}
                {
                  flagged.filter((q) =>
                    q.options.some(
                      (o) => o.isCorrect && o.id === q.selectedOptionId,
                    ),
                  ).length
                }{" "}
                tanesi doğruymuş. Aşağıda işaretli.
              </p>
            </Card>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {!result.isArchive ? (
              <ButtonLink
                href={`/siralama/${result.exam.id}`}
                variant="secondary"
              >
                Sıralamayı gör
              </ButtonLink>
            ) : null}
            <ButtonLink href="/denemeler" variant="secondary">
              Denemeler
            </ButtonLink>
            <ButtonLink href="/bugun" variant="ghost">
              Bugün&apos;e dön
            </ButtonLink>
          </div>
        </div>

        {/* Sağ: kayıp tablosu — her satır eyleme bağlı */}
        <div className="flex flex-col gap-2">
          <h2 className="type-heading text-ink">
            Konu kırılımı — kaybettirenler üstte
          </h2>
          <DataTable
            caption="Konu kırılımı"
            rows={breakdown}
            rowKey={(t) => t.topicId}
            empty="Konu kırılımı bu deneme için yok."
            columns={[
              {
                key: "konu",
                header: "Konu",
                cell: (t) => (
                  <span className="type-subhead text-ink">{t.topicName}</span>
                ),
              },
              {
                key: "d",
                header: "D",
                align: "right",
                cell: (t) => (
                  <span className="text-success-ink">{t.correct}</span>
                ),
              },
              {
                key: "y",
                header: "Y",
                align: "right",
                cell: (t) => <span className="text-danger-ink">{t.wrong}</span>,
              },
              {
                key: "b",
                header: "B",
                align: "right",
                hideBelowMd: true,
                cell: (t) => <span className="text-ink-soft">{t.blank}</span>,
              },
              {
                key: "kayip",
                header: "Kayıp net",
                align: "right",
                cell: (t) => {
                  const lostNet = t.wrong * 1.25 + t.blank;
                  return (
                    <span className="font-semibold text-ink">
                      {lostNet > 0 ? `−${fmt(lostNet)}` : "0"}
                    </span>
                  );
                },
              },
              {
                key: "eylem",
                header: "",
                align: "right",
                cell: (t) =>
                  t.wrong + t.blank > 0 ? (
                    <Link
                      href={`/seans?topicId=${t.topicId}&scope=${encodeURIComponent(`${t.topicName} · kapatma`)}`}
                      className="tk-interactive inline-flex h-9 items-center rounded-control border border-line px-3 text-[13px] font-semibold text-ink-soft hover:border-ink-soft hover:text-ink"
                    >
                      Kapat
                    </Link>
                  ) : null,
              },
            ]}
          />
          <p className="type-body-sm text-ink-subtle">
            Kayıp net = yanlış×1,25 + boş. &quot;Kapat&quot; o konudan akıllı
            tur başlatır; yanlışların zaten tekrar kuyruğunda.
          </p>
        </div>
      </div>

      <TimingStrip timing={result.timing ?? []} />

      <h2 className="type-heading mt-8 mb-3 text-ink">Cevap incelemesi</h2>
      <ReviewList questions={result.review} showAnswers />
    </div>
  );
}

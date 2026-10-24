import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Lock, Timer } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { AttemptResult, AttemptReview } from "@/lib/types";
import { fmtDuration, fmtNet, rankSentence } from "@/lib/exam-ui";
import { formatDate, formatTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ListRow } from "@/components/ui/list-row";
import { Notice } from "@/components/ui/notice";
import { PremiumBadge } from "@/components/ui/premium-badge";
import { SectionHeader } from "@/components/ui/section-header";
import { StatTile } from "@/components/ui/stat-tile";
import { CourseBreakdown } from "@/components/exam/course-breakdown";
import { ReviewTable } from "@/components/exam/review-table";
import { TimingStrip } from "@/components/exam/timing-strip";
import { CoachLine } from "@/components/rooms/coach-line";
import { ResultPanel } from "@/components/session/seans-kit";

export const metadata: Metadata = { title: "Sınav Sonucu", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Deneme sonucu (Doc 50 M4/W3). Dört varyant tek sayfa: resmî (sıra + Türkiye kıyası),
 * tekrar çözüm (sıralamaya girmedi), kişisel (sıra yok), haftalık sonuç bekliyor (kilit).
 * Sol: net, D/Y/B, ders dağılımı. Sağ: Türkiye kıyası, çalışılacak konular. Altta inceleme.
 */
export default async function SonucPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;

  let result: AttemptResult;
  try {
    result = await api<AttemptResult>(`/exams/attempts/${attemptId}`);
  } catch (e) {
    if (e instanceof ApiError && e.code === "EXAM_IN_PROGRESS") {
      const d = (e.details ?? {}) as { examId?: string };
      return (
        <div className="grid min-h-[70vh] place-items-center px-4">
          <Card className="w-full max-w-md">
            <EmptyState
              icon={Clock}
              title="Sınav devam ediyor"
              body="Süre dolmadan sonuç açılmaz."
              action={d.examId ? <ButtonLink href={`/sinav/${d.examId}`}>Sınava dön</ButtonLink> : undefined}
            />
          </Card>
        </div>
      );
    }
    throw e;
  }

  const title = result.personal ? "Kişisel deneme" : result.exam.title;
  const crumbs = [{ label: "Denemeler", href: "/denemeler" }, { label: title }, { label: "Sonuç" }];

  // ── Haftalık: sonuç bekliyor ──
  if (result.resultLocked) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 md:px-6">
        <Breadcrumb items={crumbs} />
        <Card className="flex flex-col items-center gap-2 border-panel bg-panel p-8 text-center">
          <Timer size={28} className="text-accent" aria-hidden />
          <p className="type-subhead text-panel-ink">
            Teslim edildi{result.completedAt ? ` · ${formatTime(result.completedAt)}` : ""}
          </p>
          <p className="type-body-sm max-w-md text-panel-soft">
            Sonuçlar ve sıralama {result.resultAt ? `${formatDate(result.resultAt)} ${formatTime(result.resultAt)}'de` : "sınav penceresi kapanınca"} herkese aynı anda açıklanır. Sana bildirim göndereceğiz.
          </p>
        </Card>
        <div className="grid grid-cols-3 gap-3">
          <StatTile label="Cevaplanan" value={result.answeredCount ?? null} />
          <StatTile label="Boş" value={result.blankCount} />
          <StatTile label="Süre" value={fmtDuration(result.durationSeconds)} />
        </div>
        <ButtonLink href="/denemeler" variant="secondary">Denemelere dön</ButtonLink>
      </div>
    );
  }

  const review = await api<AttemptReview>(`/exams/attempts/${attemptId}/review`).catch(() => null);
  const official = result.role === "official" && !result.personal && !result.isArchive;
  const rank = result.rank;
  const rankText = rank?.available && rank.rank != null ? rankSentence(rank.rank, rank.total) : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:px-6">
      <Breadcrumb items={crumbs} />

      {result.scoreUpdate ? (
        <Notice tone="success" title="Netin güncellendi">
          Bir soru iptal edildi; netin {fmtNet(result.scoreUpdate.from)}&apos;ten {fmtNet(result.scoreUpdate.to)}&apos;e çıktı.
        </Notice>
      ) : null}
      {result.role === "practice" && !result.personal ? (
        <Notice tone="info">Bu çözüm sıralamaya girmedi; resmî sonucun kartta duruyor.</Notice>
      ) : null}
      {result.closedReason === "timeout" ? (
        <Notice tone="warning">Süre doldu; cevapların otomatik teslim edildi.</Notice>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        {/* Sol sütun */}
        <div className="flex flex-col gap-5">
          {/* Net hero — F10-C seans kiti (ResultPanel); alt satır sıra ya da D/Y/B. */}
          <ResultPanel
            label={`Deneme sonucu · ${official ? "resmî çözüm" : result.personal ? "kişisel deneme" : "tekrar çözüm"}`}
            hero={`${fmtNet(result.score)} net`}
            correct={result.correctCount ?? 0}
            total={result.totalQuestions}
            pct={null}
            durationLabel={null}
            sub={
              rankText
                ? `${rankText}${rank?.percentile ? ` · ilk %${rank.percentile}` : ""}`
                : official && rank && !rank.available
                  ? `Sıralama en az 10 resmî çözümle açılır · şu an ${rank.total}`
                  : `D ${result.correctCount} · Y ${result.wrongCount} · B ${result.blankCount}`
            }
          />
          {result.weakTopics.length > 0 ? (
            <CoachLine
              text={`En çok kaybın ${result.weakTopics[0].topicName}: Y ${result.weakTopics[0].wrong} · B ${result.weakTopics[0].blank}. Sıralamaya değil sağdaki listeye bak; hepsi kapatılabilir.`}
            />
          ) : null}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Doğru" value={result.correctCount} tone="success" />
            <StatTile label="Yanlış" value={result.wrongCount} tone="danger" />
            <StatTile label="Boş" value={result.blankCount} />
            <StatTile label="Süre" value={fmtDuration(result.durationSeconds)} />
          </div>
          <p className="type-body-sm text-ink-subtle">
            {result.totalQuestions} soru{result.completedAt ? ` · ${formatDate(result.completedAt)}` : ""} · net = doğru − yanlış/4
          </p>

          <CourseBreakdown rows={result.courses} />
          <TimingStrip timing={result.timing ?? []} />
        </div>

        {/* Sağ sütun */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-20">
          {official && result.turkey ? (
            <Card className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="type-heading text-ink">Türkiye kıyası</h2>
                <PremiumBadge variant="soft" />
              </div>
              {result.turkey.locked ? (
                <>
                  <p className="type-body-sm inline-flex items-start gap-2 text-ink-soft">
                    <Lock size={16} className="mt-0.5 shrink-0 text-ink-subtle" aria-hidden />
                    Türkiye ortalaması, medyan ve soru bazlı doğru oranı Premium ile açılır.
                  </p>
                  <ButtonLink href="/premium" variant="secondary">Premium ile aç</ButtonLink>
                </>
              ) : result.turkey.sample < result.turkey.minSample ? (
                <p className="type-body-sm text-ink-soft">
                  En az {result.turkey.minSample} resmî çözümle açılır; şu an {result.turkey.sample} çözüm var.
                </p>
              ) : (
                <>
                  <Row k="Türkiye ortalaması" v={`${fmtNet(result.turkey.mean)} net`} />
                  <Row k="Medyan" v={`${fmtNet(result.turkey.median)} net`} />
                  <Row k="Sen" v={`${result.turkey.diff != null && result.turkey.diff >= 0 ? "+" : ""}${fmtNet(result.turkey.diff)} net`} accent />
                  <p className="type-body-sm text-ink-subtle">Soru bazlı Türkiye oranı ve süreler cevap incelemesinde.</p>
                </>
              )}
            </Card>
          ) : null}

          {result.weakTopics.length > 0 ? (
            <section className="flex flex-col gap-2">
              <SectionHeader title="Çalışılacak konular" />
              <Card className="py-1">
                {result.weakTopics.slice(0, 3).map((t, i, arr) => (
                  <ListRow
                    key={t.topicId}
                    title={t.topicName}
                    subtitle={`Y ${t.wrong} · B ${t.blank} · ${t.total} soru`}
                    trailing={<span className="type-subhead text-accent-ink">Çalış</span>}
                    href={`/seans?topicId=${t.topicId}&scope=${encodeURIComponent(`${t.topicName} · kapatma`)}`}
                    divider={i < arr.length - 1}
                  />
                ))}
              </Card>
            </section>
          ) : null}

          <div className="flex flex-col gap-2">
            {official ? (
              <ButtonLink href={`/siralama/${result.exam.id}`} variant="secondary">Sıralamayı gör</ButtonLink>
            ) : result.personal ? (
              <ButtonLink href="/denemeler/kisisel" variant="secondary">Yeni kişisel deneme</ButtonLink>
            ) : (
              <ButtonLink href="/profil/denemelerim" variant="secondary">Deneme geçmişi</ButtonLink>
            )}
            <ButtonLink href="/denemeler" variant="ghost">Denemelere dön</ButtonLink>
          </div>
          {result.personal ? (
            <p className="type-body-sm text-center text-ink-subtle">Kişisel deneme sıralamaya ve net gelişim çizgisine girmez.</p>
          ) : null}
          {result.review.some((q) => q.flagged) ? (
            <p className="type-body-sm text-ink-subtle">
              <Badge tone="neutral">emin değildim</Badge> işaretlediğin {result.review.filter((q) => q.flagged).length} soru incelemede süzülebilir.
            </p>
          ) : null}
        </div>
      </div>

      {review ? (
        <ReviewTable review={review} questions={result.review} />
      ) : (
        <Card>
          <p className="type-body-sm text-ink-soft">
            Cevap incelemesi şu an yüklenemedi.{" "}
            <Link href={`/sonuc/${attemptId}`} className="font-semibold text-accent-ink hover:underline">Yenile</Link>
          </p>
        </Card>
      )}
    </div>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="type-body-sm text-ink-soft">{k}</span>
      <span className={accent ? "type-subhead tabular text-accent-ink" : "type-subhead tabular text-ink"}>{v}</span>
    </div>
  );
}

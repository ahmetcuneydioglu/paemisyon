import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookOpen, Bookmark, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { TopicRoom } from "@/lib/public-api";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { CoachLine } from "@/components/rooms/coach-line";
import { RoomStatPanel } from "@/components/rooms/room-stat-panel";
import { ToolRow } from "@/components/rooms/tool-row";
import { CoachRail } from "@/components/shell/coach-rail";

export const metadata: Metadata = { title: "Konu", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Konu odası (Doc 49/14): kompakt durum → koç cümlesi → "Bu konuda" (yanlışlar, favoriler,
 * ilgili maddeler) → "Başla · 10 soru · <konu>" + "Yanlışları çöz". Bilgi kartları ve tur
 * geçmişi yok (karar/veri bekliyor).
 */
export default async function KonuOdasiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const d = await api<TopicRoom>(`/me/topic-room/${id}`).catch(() => null);
  if (!d) notFound();
  const t = d.topic;
  const yanlis =
    d.wrongCount > 0
      ? `/seans?mode=review&topicId=${t.id}&count=${Math.min(20, d.wrongCount)}&source=topic_room&scope=${encodeURIComponent(`${t.name} · yanlışlar`)}`
      : null;

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 md:px-6">
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <Breadcrumb
          items={[
            { label: "Kütüphane", href: "/kutuphane" },
            { label: t.courseName, href: `/kutuphane/ders/${t.courseId}` },
            { label: t.name },
          ]}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="type-title text-ink">{t.name}</h1>
          <div className="flex flex-wrap gap-2">
            {yanlis ? (
              <ButtonLink href={yanlis} variant="secondary">
                Yanlışları çöz · {Math.min(20, d.wrongCount)}
              </ButtonLink>
            ) : null}
            <ButtonLink
              href={`/seans?topicId=${t.id}&count=10&source=topic_room&scope=${encodeURIComponent(`${t.courseName} · ${t.name}`)}`}
            >
              Başla · 10 soru · {t.name}
            </ButtonLink>
          </div>
        </div>

        <RoomStatPanel
          label={t.courseName}
          pct={d.summary.accuracyPct}
          sub={
            d.summary.solved > 0
              ? `${d.summary.solved} soru · ${d.summary.correct} doğru`
              : "10 soruyla başla"
          }
          right={
            d.summary.inPlanThisWeek ? (
              <Badge tone="accent">Planında bu hafta</Badge>
            ) : null
          }
        />
        <CoachLine text={d.coach} />

        <section className="flex flex-col gap-2" aria-label="Bu konuda">
          <SectionHeader title="Bu konuda" />
          <ToolRow
            icon={XCircle}
            title="Yanlışların"
            subtitle={
              d.wrongCount > 0 ? `${d.wrongCount} soru` : "Açık yanlış yok"
            }
            href={yanlis}
          />
          <ToolRow
            icon={Bookmark}
            title="Favorilerin"
            subtitle={
              d.favoriteCount > 0
                ? `${d.favoriteCount} soru`
                : "Henüz favori yok"
            }
            href={
              d.favoriteCount > 0
                ? `/seans?mode=favorites&topicId=${t.id}&count=${Math.min(20, d.favoriteCount)}&source=topic_room&scope=${encodeURIComponent(`${t.name} · favoriler`)}`
                : null
            }
            divider={d.legislation != null}
          />
          {d.legislation ? (
            <ToolRow
              icon={BookOpen}
              title="İlgili maddeler"
              subtitle={[
                d.legislation.name,
                d.legislation.articleRange ??
                  (d.legislation.articleCount
                    ? `${d.legislation.articleCount} madde`
                    : null),
              ]
                .filter(Boolean)
                .join(" ")}
              href={d.legislation.slug ? `/kanun/${d.legislation.slug}` : null}
              divider={false}
            />
          ) : null}
        </section>
        {d.summary.planRemainingMinutes != null ? (
          <p className="type-body-sm text-ink-subtle">
            Bu hafta planında {d.summary.planRemainingMinutes} dk kaldı.
          </p>
        ) : null}
      </div>
      <CoachRail />
    </div>
  );
}

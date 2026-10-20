import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Bookmark, Lock, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { CourseRoom, RoomTopic } from "@/lib/public-api";
import { bandTextClass, kisaAd } from "@/lib/rooms";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import { SectionHeader } from "@/components/ui/section-header";
import { CoachLine } from "@/components/rooms/coach-line";
import { RoomStatPanel } from "@/components/rooms/room-stat-panel";
import { ToolRow } from "@/components/rooms/tool-row";
import { CoachRail } from "@/components/shell/coach-rail";

export const metadata: Metadata = { title: "Ders", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Ders odası (Doc 49/14): durum paneli → koç satırı → konular (gövde) → araçlar → tek "Başla".
 * Konu satırı konu odasına gider; eşikler ve cümleler sunucudan. Bilgi kartları karar bekliyor.
 */
export default async function DersOdasiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const d = await api<CourseRoom>(`/me/course-room/${id}`).catch(() => null);
  if (!d) notFound();
  const kisa = kisaAd(d.course.name);
  const legs = d.tools.legislation;

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 md:px-6">
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <Breadcrumb
          items={[
            { label: "Kütüphane", href: "/kutuphane" },
            { label: "Dersler", href: "/kutuphane" },
            { label: d.course.name },
          ]}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="type-title text-ink">{d.course.name}</h1>
          <ButtonLink
            href={`/seans?courseId=${d.course.id}&count=10&source=course_room&scope=${encodeURIComponent(d.course.name)}`}
          >
            Başla · 10 soru · {kisa}
          </ButtonLink>
        </div>

        <RoomStatPanel
          pct={d.summary.accuracyPct}
          sub={
            d.summary.solved > 0
              ? `doğruluk · ${d.summary.solved} soru`
              : "İlk tur seni bekliyor"
          }
          right={
            <>
              {d.summary.examWeightPercent != null ? (
                <span className="type-body-sm">
                  Sınavda %{d.summary.examWeightPercent}
                </span>
              ) : null}
              {d.summary.weakest ? (
                <span className="type-body-sm text-panel-soft">
                  En zayıf: {d.summary.weakest.name} %
                  {d.summary.weakest.accuracyPct}
                </span>
              ) : null}
            </>
          }
        />
        <CoachLine text={d.coach} />

        <section className="flex flex-col gap-2" aria-label="Konular">
          <SectionHeader title="Konular" />
          {d.topics.length === 0 ? (
            <p className="type-body-sm text-ink-soft">
              Bu dersin konuları hazırlanıyor.
            </p>
          ) : (
            <ul>
              {d.topics.map((t, i) => (
                <li key={t.id}>
                  <KonuSatiri
                    topic={t}
                    divider={i < d.topics.length - 1 || t.children.length > 0}
                  />
                  {t.children.map((c, j) => (
                    <div key={c.id} className="pl-5">
                      <KonuSatiri
                        topic={c}
                        divider={
                          j < t.children.length - 1 || i < d.topics.length - 1
                        }
                      />
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-2" aria-label="Araçlar">
          <SectionHeader title="Araçlar" />
          <ToolRow
            icon={XCircle}
            title="Yanlışlarım"
            subtitle={
              d.tools.wrongCount > 0
                ? `${d.tools.wrongCount} soru`
                : "Açık yanlış yok"
            }
            href={
              d.tools.wrongCount > 0
                ? `/seans?mode=review&courseId=${d.course.id}&count=${Math.min(20, d.tools.wrongCount)}&source=course_room&scope=${encodeURIComponent(`${kisa} · yanlışlar`)}`
                : null
            }
          />
          <ToolRow
            icon={Bookmark}
            title="Favoriler"
            subtitle={
              d.tools.favoriteCount > 0
                ? `${d.tools.favoriteCount} soru`
                : "Henüz favori yok"
            }
            href={
              d.tools.favoriteCount > 0
                ? `/seans?mode=favorites&courseId=${d.course.id}&count=${Math.min(20, d.tools.favoriteCount)}&source=course_room&scope=${encodeURIComponent(`${kisa} · favoriler`)}`
                : null
            }
            divider={legs.length > 0}
          />
          {legs.slice(0, 3).map((l, i) => (
            <ToolRow
              key={l.slug}
              icon={BookOpen}
              title={`${l.name} metni`}
              subtitle={`${l.articleCount} madde`}
              href={`/kanun/${l.slug}`}
              divider={i < Math.min(3, legs.length) - 1 || legs.length > 3}
            />
          ))}
          {legs.length > 3 ? (
            <ToolRow
              icon={BookOpen}
              title={`${legs.length - 3} mevzuat daha`}
              subtitle="Mevzuat kütüphanesinde"
              href="/kanunlar"
              divider={false}
            />
          ) : null}
        </section>
      </div>
      <CoachRail />
    </div>
  );
}

function KonuSatiri({
  topic,
  divider,
}: {
  topic: Omit<RoomTopic, "children"> | RoomTopic;
  divider: boolean;
}) {
  const yeni = topic.band === "new";
  return (
    <Link
      href={`/kutuphane/konu/${topic.id}`}
      aria-label={`${topic.name}${topic.accuracyPct == null ? ", henüz çözülmedi" : `, yüzde ${topic.accuracyPct} doğru`}`}
      className={cn(
        "tk-interactive flex flex-col gap-2 py-3 hover:opacity-80",
        divider && "border-b border-line",
      )}
    >
      <span className="flex items-center gap-3">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "type-subhead",
                yeni ? "text-ink-soft" : "text-ink",
              )}
            >
              {topic.name}
            </span>
            {topic.isPremium ? (
              <Lock
                size={14}
                className="text-ink-subtle"
                aria-label="premium konu"
              />
            ) : null}
            {topic.inPlanThisWeek ? (
              <Badge tone="accent">Planında</Badge>
            ) : null}
          </span>
          <span className="type-body-sm text-ink-subtle">
            {yeni
              ? "Henüz çözülmedi"
              : `${topic.solved} soru · %${topic.accuracyPct} doğru`}
          </span>
        </span>
        {!yeni ? (
          <span
            className={cn(
              "type-subhead tabular shrink-0",
              bandTextClass(topic.band),
            )}
          >
            %{topic.accuracyPct}
          </span>
        ) : null}
        <span aria-hidden className="text-ink-subtle">
          ›
        </span>
      </span>
      {!yeni ? (
        <ProgressBar
          value={(topic.accuracyPct ?? 0) / 100}
          tone={topic.band === "weak" ? "warning" : "accent"}
          height={2}
          label={`${topic.name} doğruluk`}
        />
      ) : null}
    </Link>
  );
}

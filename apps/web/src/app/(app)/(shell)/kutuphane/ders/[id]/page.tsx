import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import type { CourseRoom } from "@/lib/public-api";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CoachLine } from "@/components/rooms/coach-line";
import { CourseRoomBody } from "@/components/rooms/course-room-body";
import { RoomStatPanel } from "@/components/rooms/room-stat-panel";
import { CoachRail } from "@/components/shell/coach-rail";

export const metadata: Metadata = { title: "Ders", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Ders odası (Doc 49/14 → Çalış v2, Doc 49/17): durum paneli → koç satırı → 2×2 eylem
 * (Soru çöz · Konu oku · Yanlışlarım · Favorilerim) → konular. Konuya tıklamak aynı dört eylemi
 * konuya daraltan diyaloğu açar. Eşikler ve cümleler sunucudan.
 */
export default async function DersOdasiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const d = await api<CourseRoom>(`/me/course-room/${id}`).catch(() => null);
  if (!d) notFound();

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

        <h1 className="type-title text-ink">{d.course.name}</h1>

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
                  {d.summary.examWeightLabel ??
                    `Sınavda %${d.summary.examWeightPercent}`}
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
        <CourseRoomBody room={d} />
      </div>
      <CoachRail />
    </div>
  );
}

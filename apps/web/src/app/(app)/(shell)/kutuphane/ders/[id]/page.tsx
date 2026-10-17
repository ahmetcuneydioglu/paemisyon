import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { MasteryBar } from "@/components/ui/mastery-bar";
import { CoachRail } from "@/components/shell/coach-rail";

export const metadata: Metadata = { title: "Ders", robots: { index: false } };
export const dynamic = "force-dynamic";

interface TopicLeaf {
  id: string;
  name: string;
  isPremium: boolean;
  solvedCount: number;
  mastery: number | null;
}
interface TopicNode extends TopicLeaf {
  children: TopicLeaf[];
}
interface TopicsResponse {
  topics: TopicNode[];
  summary: {
    solvedCount: number;
    mastery: number | null;
    unresolvedWrongCount: number;
  };
}
interface Module {
  id: string;
  isPreferred: boolean;
}
interface Course {
  id: string;
  name: string;
  sectionName: string;
  weightPercent: number;
}

async function findCourse(courseId: string): Promise<Course | null> {
  const modules = await api<Module[]>("/catalog/modules");
  for (const m of [...modules].sort(
    (a, b) => Number(b.isPreferred) - Number(a.isPreferred),
  )) {
    const courses = await api<Course[]>(
      `/catalog/modules/${m.id}/courses`,
    ).catch(() => []);
    const hit = courses.find((c) => c.id === courseId);
    if (hit) return hit;
  }
  return null;
}

/**
 * Ders detay — öğrenme merkezi (Doc 27 §3.3): konular tablosu + benim durumum;
 * her satırdan tek tıkla tur (2 dokunuş kuralı — Doc 25 Karar 2).
 */
export default async function DersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [course, data] = await Promise.all([
    findCourse(id),
    api<TopicsResponse>(`/catalog/courses/${id}/topics`).catch(() => null),
  ]);
  if (!course || !data) notFound();

  const flat = data.topics.flatMap((t) => [
    { ...t, depth: 0 },
    ...t.children.map((c) => ({ ...c, depth: 1 })),
  ]);
  const s = data.summary;

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 md:px-6">
      <div className="min-w-0 flex-1">
        <Breadcrumb
          className="mb-3"
          items={[
            { label: "Kütüphane", href: "/kutuphane" },
            { label: "Dersler", href: "/kutuphane" },
            { label: course.name },
          ]}
        />

        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="type-title text-ink">{course.name}</h1>
              <Badge>
                %{course.weightPercent}
                {course.sectionName !== course.name
                  ? ` · ${course.sectionName}`
                  : ""}
              </Badge>
            </div>
            <p className="type-body-sm text-ink-soft">
              {s.solvedCount > 0 ? (
                <>
                  Bu derste <b className="tabular text-ink">{s.solvedCount}</b>{" "}
                  soru çözdün · doğruluk{" "}
                  <b className="tabular text-ink">%{s.mastery ?? 0}</b>
                  {s.unresolvedWrongCount > 0 ? (
                    <>
                      {" "}
                      ·{" "}
                      <b className="tabular text-danger-ink">
                        {s.unresolvedWrongCount}
                      </b>{" "}
                      çözülmemiş yanlış
                    </>
                  ) : null}
                </>
              ) : (
                <>Bu derse henüz başlamadın — ilk tur haritanı başlatır.</>
              )}
            </p>
          </div>
          <ButtonLink
            href={`/seans?courseId=${course.id}&count=15&scope=${encodeURIComponent(course.name)}`}
          >
            Bu dersten tur başlat
          </ButtonLink>
        </div>

        <DataTable
          caption={`${course.name} konuları`}
          rows={flat}
          rowKey={(t) => t.id}
          empty="Bu dersin konuları hazırlanıyor."
          columns={[
            {
              key: "konu",
              header: "Konu",
              cell: (t) => (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5",
                    t.depth ? "pl-4 text-ink-soft" : "type-subhead text-ink",
                  )}
                >
                  {t.name}
                  {t.isPremium ? (
                    <Lock
                      size={14}
                      className="text-ink-subtle"
                      aria-label="premium konu"
                    />
                  ) : null}
                </span>
              ),
            },
            {
              key: "cozulen",
              header: "Çözülen",
              align: "right",
              hideBelowMd: true,
              cell: (t) => (t.solvedCount > 0 ? t.solvedCount : "—"),
            },
            {
              key: "dogruluk",
              header: "Doğruluğum",
              cell: (t) => <MasteryBar value={t.mastery} />,
            },
            {
              key: "eylem",
              header: "",
              align: "right",
              cell: (t) => (
                <Link
                  href={`/seans?topicId=${t.id}&scope=${encodeURIComponent(`${course.name} · ${t.name}`)}`}
                  className="tk-interactive inline-flex h-9 items-center rounded-control border border-line px-3 text-[13px] font-semibold text-ink-soft hover:border-ink-soft hover:text-ink"
                >
                  {t.solvedCount > 0 ? "Çalış" : "Başla"}
                </Link>
              ),
            },
          ]}
        />
      </div>

      <CoachRail />
    </div>
  );
}

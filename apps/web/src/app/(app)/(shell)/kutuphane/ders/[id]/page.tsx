import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { MasteryBar } from "@/components/ui/mastery-bar";
import { CoachRail } from "@/components/shell/coach-rail";

export const metadata: Metadata = { title: "Ders", robots: { index: false } };
export const dynamic = "force-dynamic";

interface TopicNode {
  id: string;
  name: string;
  isPremium: boolean;
  solvedCount: number;
  mastery: number | null;
  children: { id: string; name: string; isPremium: boolean; solvedCount: number; mastery: number | null }[];
}
interface TopicsResponse {
  topics: TopicNode[];
  summary: { solvedCount: number; mastery: number | null; unresolvedWrongCount: number };
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

/** Ders adını çöz: tercih edilen sınavın ders listesinde ara (ekstra endpoint istemez). */
async function findCourse(courseId: string): Promise<Course | null> {
  const modules = await api<Module[]>("/catalog/modules");
  for (const m of [...modules].sort((a, b) => Number(b.isPreferred) - Number(a.isPreferred))) {
    const courses = await api<Course[]>(`/catalog/modules/${m.id}/courses`).catch(() => []);
    const hit = courses.find((c) => c.id === courseId);
    if (hit) return hit;
  }
  return null;
}

/**
 * Ders detay — öğrenme merkezi (Doc 27 §3.3, wireframe 05): dersin tek yaşayan
 * mekânı. Konular tablosu + benim durumum; her satırdan tek tıkla seans
 * (2 dokunuş kuralı — Doc 25 Karar 2).
 */
export default async function DersPage({ params }: { params: Promise<{ id: string }> }) {
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

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-6 py-6">
      <div className="min-w-0 flex-1">
        <nav className="tk-caption mb-3" aria-label="breadcrumb">
          <Link href="/kutuphane" className="hover:text-ink">Kütüphane</Link> › Dersler ›{" "}
          {course.name}
        </nav>

        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-xl font-bold text-ink">
              {course.name}{" "}
              <span className="tk-caption ml-1 rounded-full border border-line px-2 py-0.5 align-middle">
                %{course.weightPercent}
                {course.sectionName !== course.name && <> · {course.sectionName}</>}
              </span>
            </h1>
            <p className="mt-1 text-[13px] text-ink-soft">
              {data.summary.solvedCount > 0 ? (
                <>
                  Bu derste <b className="tabular text-ink">{data.summary.solvedCount}</b> soru
                  çözdün · doğruluk{" "}
                  <b className="tabular text-ink">%{data.summary.mastery ?? 0}</b>
                  {data.summary.unresolvedWrongCount > 0 && (
                    <> · <b className="tabular text-danger">{data.summary.unresolvedWrongCount}</b> çözülmemiş yanlış</>
                  )}
                </>
              ) : (
                <>Bu derse henüz başlamadın — ilk seans haritanı başlatır.</>
              )}
            </p>
          </div>
          <ButtonLink
            href={`/seans?courseId=${course.id}&count=15&scope=${encodeURIComponent(course.name)}`}
          >
            Bu dersten seans başlat
          </ButtonLink>
        </div>

        <Card className="overflow-x-auto p-0">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="tk-caption border-b border-line text-left">
                <th className="px-4 py-2.5 font-semibold">Konu</th>
                <th className="px-3 py-2.5 text-right font-semibold">Çözülen</th>
                <th className="px-3 py-2.5 font-semibold">Doğruluğum</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {flat.map((t) => (
                <tr key={t.id} className="border-b border-line last:border-0">
                  <td
                    className={["px-4 py-2.5 text-ink", t.depth ? "pl-8 text-ink-soft" : "font-medium"].join(" ")}
                  >
                    {t.name}
                    {t.isPremium && (
                      <span className="ml-1.5" title="Premium konu" aria-label="premium">🔒</span>
                    )}
                  </td>
                  <td className="tabular px-3 py-2.5 text-right text-ink-soft">
                    {t.solvedCount > 0 ? t.solvedCount : "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <MasteryBar value={t.mastery} />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/seans?topicId=${t.id}&scope=${encodeURIComponent(`${course.name} · ${t.name}`)}`}
                      className="tk-interactive inline-block rounded-full border border-line px-3 py-1 text-[12px] font-bold text-ink-soft hover:border-brand hover:text-brand"
                    >
                      {t.solvedCount > 0 ? "çalış" : "başla"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {flat.length === 0 && (
            <p className="p-6 text-center text-[14px] text-ink-soft">
              Bu dersin konuları hazırlanıyor.
            </p>
          )}
        </Card>
      </div>

      <CoachRail />
    </div>
  );
}

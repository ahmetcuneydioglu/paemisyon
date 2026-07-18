import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { MasteryBar } from "@/components/ui/mastery-bar";
import { CoachRail } from "@/components/shell/coach-rail";

export const metadata: Metadata = { title: "Kütüphane", robots: { index: false } };
export const dynamic = "force-dynamic";

interface Module {
  id: string;
  key: string;
  name: string;
  questionCount: number;
  isPreferred: boolean;
}
interface Course {
  id: string;
  name: string;
  sectionName: string;
  weightPercent: number;
}
interface TopicProgressRow {
  topicName: string;
  courseName: string;
  solvedCount: number;
  correctCount: number;
  mastery: number;
}

/**
 * Kütüphane ana (Doc 27 §3.3, wireframe 04): kapsam haritası — dersler
 * müfredat ağırlığına göre, her kartta benim durumum. Mevzuat rafı ayrı kapı.
 * Koç rayı ilk kez burada (onay: yalnız L2).
 */
export default async function KutuphanePage({
  searchParams,
}: {
  searchParams: Promise<{ sinav?: string | string[] }>;
}) {
  const sp = await searchParams;
  const wanted = Array.isArray(sp.sinav) ? sp.sinav[0] : sp.sinav;

  const [modules, progress, wrongs] = await Promise.all([
    api<Module[]>("/catalog/modules"),
    api<TopicProgressRow[]>("/progress/topics").catch(() => [] as TopicProgressRow[]),
    api<{ questionId: string }[]>("/review/wrong-answers").catch(
      () => [] as { questionId: string }[],
    ),
  ]);
  const current =
    modules.find((m) => m.key === wanted) ??
    modules.find((m) => m.isPreferred) ??
    modules[0];
  const courses = current
    ? await api<Course[]>(`/catalog/modules/${current.id}/courses`)
    : [];

  // Ders bazlı benim durumum: konu ilerlemelerini derse topla.
  const byCourse = new Map<string, { solved: number; correct: number }>();
  for (const r of progress) {
    const acc = byCourse.get(r.courseName) ?? { solved: 0, correct: 0 };
    acc.solved += r.solvedCount;
    acc.correct += r.correctCount;
    byCourse.set(r.courseName, acc);
  }
  const masteryOf = (name: string): number | null => {
    const p = byCourse.get(name);
    return p && p.solved > 0 ? Math.round((p.correct / p.solved) * 100) : null;
  };

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-6 py-6">
      <div className="min-w-0 flex-1">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-xl font-bold text-ink">Kütüphane</h1>
          {modules.length > 1 && (
            <nav className="flex gap-1.5" aria-label="Sınav bağlamı">
              {modules.map((m) => (
                <Link
                  key={m.id}
                  href={`/kutuphane?sinav=${m.key}`}
                  aria-current={m.id === current?.id ? "page" : undefined}
                  className={[
                    "tk-interactive rounded-full border px-3 py-1 text-[13px] font-bold",
                    m.id === current?.id
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-line text-ink-soft hover:text-ink",
                  ].join(" ")}
                >
                  {m.name}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* Kütüphane kapıları: Mevzuat (taç) + Yanlışlarım + Favorilerim */}
        <div className="mb-5 grid gap-3 lg:grid-cols-3">
          <Link
            href="/kanunlar"
            className="tk-interactive flex items-center justify-between gap-3 rounded-md border border-atlas/40 bg-atlas/5 p-4 hover:border-atlas"
          >
            <span>
              <span className="font-heading text-[15px] font-bold text-ink">
                ⚖️ Mevzuat — Madde Atlası
              </span>
              <span className="mt-0.5 block text-[13px] text-ink-soft">
                Kanun kanun ısı haritası ve fetih ilerlemen.
              </span>
            </span>
            <span aria-hidden className="text-atlas">→</span>
          </Link>
          <Link
            href="/kutuphane/yanlislar"
            className="tk-interactive flex items-center justify-between gap-3 rounded-md border border-danger/30 bg-danger/5 p-4 hover:border-danger/60"
          >
            <span>
              <span className="font-heading text-[15px] font-bold text-ink">
                🔁 Yanlışlarım
              </span>
              <span className="mt-0.5 block text-[13px] text-ink-soft">
                {wrongs.length > 0
                  ? `${wrongs.length} soru kuyrukta — doğru çözünce düşer.`
                  : "Kuyruk temiz — sistem yanlışlarını unutmaz."}
              </span>
            </span>
            <span aria-hidden className="text-danger">→</span>
          </Link>
          <Link
            href="/kutuphane/favoriler"
            className="tk-interactive flex items-center justify-between gap-3 rounded-md border border-streak/40 bg-streak/5 p-4 hover:border-streak"
          >
            <span>
              <span className="font-heading text-[15px] font-bold text-ink">★ Favorilerim</span>
              <span className="mt-0.5 block text-[13px] text-ink-soft">
                Yıldızladığın sorular — toplu çöz.
              </span>
            </span>
            <span aria-hidden className="text-streak">→</span>
          </Link>
        </div>

        <p className="tk-caption mb-3">
          {current?.name} müfredatı · bölüm ağırlığına göre
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[...courses]
            .sort((a, b) => b.weightPercent - a.weightPercent)
            .map((c) => (
              <Link key={c.id} href={`/kutuphane/ders/${c.id}`} className="group">
                <Card className="tk-interactive h-full group-hover:border-ink-soft">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-heading text-[15px] font-bold leading-snug text-ink">
                      {c.name}
                    </p>
                    <span className="tk-caption shrink-0 rounded-full border border-line px-2 py-0.5">
                      %{c.weightPercent}
                    </span>
                  </div>
                  {c.sectionName !== c.name && (
                    <p className="mt-1 text-[12px] text-ink-soft">{c.sectionName}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="tk-caption">benim durumum</span>
                    <MasteryBar value={masteryOf(c.name)} />
                  </div>
                </Card>
              </Link>
            ))}
        </div>
        {courses.length === 0 && (
          <Card className="border-dashed text-center text-[14px] text-ink-soft">
            Bu sınavın müfredatı hazırlanıyor — koçun eklendiğinde haber verecek.
          </Card>
        )}
      </div>

      <CoachRail />
    </div>
  );
}

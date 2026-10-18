import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, RotateCcw, Scale, Star } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MasteryBar } from "@/components/ui/mastery-bar";
import { CoachRail } from "@/components/shell/coach-rail";

export const metadata: Metadata = {
  title: "Kütüphane",
  robots: { index: false },
};
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
 * Kütüphane ana (Doc 27 §3.3): kapsam haritası — dersler müfredat ağırlığına göre,
 * her kartta benim durumum. Üç kapı (Mevzuat, Yanlışlarım, Favorilerim) tek vurgu
 * diliyle; ikon farkı, renk farkı değil (Doc 49 §1.1).
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
    api<TopicProgressRow[]>("/progress/topics").catch(
      () => [] as TopicProgressRow[],
    ),
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

  const gates = [
    {
      href: "/planim",
      icon: CalendarDays,
      title: "Haftalık planım",
      body: "Bu haftanın kalemleri ve sınava kadar dağılım.",
    },
    {
      href: "/kanunlar",
      icon: Scale,
      title: "Mevzuat — Madde Atlası",
      body: "Kanun kanun ısı haritası ve fetih ilerlemen.",
    },
    {
      href: "/kutuphane/yanlislar",
      icon: RotateCcw,
      title: "Yanlışlarım",
      body:
        wrongs.length > 0
          ? `${wrongs.length} soru kuyrukta — doğru çözünce düşer.`
          : "Kuyruk temiz — sistem yanlışlarını unutmaz.",
    },
    {
      href: "/kutuphane/favoriler",
      icon: Star,
      title: "Favorilerim",
      body: "Yıldızladığın sorular — toplu çöz.",
    },
  ];

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 md:px-6">
      <div className="min-w-0 flex-1">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="type-title text-ink">Kütüphane</h1>
          {modules.length > 1 ? (
            <nav className="flex gap-1.5" aria-label="Sınav bağlamı">
              {modules.map((m) => {
                const active = m.id === current?.id;
                return (
                  <Link
                    key={m.id}
                    href={`/kutuphane?sinav=${m.key}`}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "tk-interactive inline-flex h-10 items-center rounded-pill border px-3.5 type-subhead",
                      active
                        ? "border-accent bg-accent text-on-accent"
                        : "border-line text-ink hover:border-ink-soft",
                    )}
                  >
                    {m.name}
                  </Link>
                );
              })}
            </nav>
          ) : null}
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {gates.map(({ href, icon: Icon, title, body }) => (
            <Link
              key={href}
              href={href}
              className="tk-interactive flex items-center gap-3 rounded-card border border-line bg-surface p-4 hover:border-ink-soft"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent-ink">
                <Icon size={20} strokeWidth={1.75} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="type-subhead block text-ink">{title}</span>
                <span className="type-body-sm block text-ink-soft">{body}</span>
              </span>
              <ArrowRight
                size={18}
                className="shrink-0 text-ink-subtle"
                aria-hidden
              />
            </Link>
          ))}
        </div>

        <p className="type-label mb-3 text-ink-subtle">
          {current?.name} müfredatı · bölüm ağırlığına göre
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[...courses]
            .sort((a, b) => b.weightPercent - a.weightPercent)
            .map((c) => (
              <Link
                key={c.id}
                href={`/kutuphane/ders/${c.id}`}
                className="group"
              >
                <Card className="tk-interactive flex h-full flex-col gap-3 group-hover:border-ink-soft">
                  <div className="flex items-start justify-between gap-2">
                    <p className="type-subhead text-ink">{c.name}</p>
                    <Badge>%{c.weightPercent}</Badge>
                  </div>
                  {c.sectionName !== c.name ? (
                    <p className="type-body-sm -mt-2 text-ink-soft">
                      {c.sectionName}
                    </p>
                  ) : null}
                  <div className="mt-auto flex items-center justify-between">
                    <span className="type-label text-ink-subtle">
                      benim durumum
                    </span>
                    <MasteryBar value={masteryOf(c.name)} />
                  </div>
                </Card>
              </Link>
            ))}
        </div>
        {courses.length === 0 ? (
          <Card className="type-body-sm border-dashed text-center text-ink-soft">
            Bu sınavın müfredatı hazırlanıyor — koçun eklendiğinde haber
            verecek.
          </Card>
        ) : null}
      </div>

      <CoachRail />
    </div>
  );
}

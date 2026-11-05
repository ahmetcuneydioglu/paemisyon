import type { Metadata } from "next";
import Link from "next/link";
import { Layers, RotateCcw, Shuffle } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { kartlarHref } from "@/lib/kartlar";
import type { StudyHub } from "@/lib/public-api";
import { Card } from "@/components/ui/card";
import { CourseCard } from "@/components/rooms/course-card";
import { ResumeStrip } from "@/components/rooms/resume-strip";
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

/** Hap etiketi kısa kalır (375 px'te tek satır): yanlış varsa yanlış, yoksa favori. */
function tekrarEtiketi(t: StudyHub["totals"]) {
  if (t.wrongCount > 0) return `Yanlışlar · ${t.wrongCount}`;
  if (t.favoriteCount > 0) return `Favoriler · ${t.favoriteCount}`;
  return "Yanlışlarım";
}

/* Üç hap dar ekranda ikinci satıra sarar (min 140 px); geniş ekranda tek satır. */
const hap =
  "tk-interactive inline-flex h-11 min-w-[140px] flex-1 whitespace-nowrap items-center justify-center gap-1.5 rounded-pill border border-line bg-surface px-3.5 type-subhead text-ink hover:border-ink-soft";

/**
 * Kütüphane (Çalış v2, Doc 49/17; Expo Çalış ile aynı yapı) — "ders seç → ne yapacağını seç".
 * Kaldığın yer şeridi (yalnız taze yarım tur), ağırlığa göre ders kartları, hızlı eylemler
 * (karışık tur, yanlış/favori; vadesi gelen kart varsa "Kart tekrarı · N", Doc 56).
 * Plan, Mevzuat, Yanlışlarım ve Favorilerim kenar çubuğunda; burada tekrar edilmez. Sayılar,
 * sıralama ve kart künyesi `/me/study`'den.
 */
export default async function KutuphanePage({
  searchParams,
}: {
  searchParams: Promise<{ sinav?: string | string[] }>;
}) {
  const sp = await searchParams;
  const wanted = Array.isArray(sp.sinav) ? sp.sinav[0] : sp.sinav;

  const modules = await api<Module[]>("/catalog/modules");
  const current =
    modules.find((m) => m.key === wanted) ??
    modules.find((m) => m.isPreferred) ??
    modules[0];
  const d = await api<StudyHub>(
    current ? `/me/study?moduleId=${current.id}` : "/me/study",
  ).catch(() => null);
  if (!d)
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        <h1 className="type-title mb-4 text-ink">Kütüphane</h1>
        <Card className="type-body-sm text-ink-soft">
          Dersler şu an yüklenemedi. Sayfayı yenilemeyi dene.
        </Card>
      </div>
    );

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 md:px-6">
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
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

        {d.resume ? (
          <ResumeStrip
            href={`/seans?resume=${d.resume.sessionId}&source=home_resume&scope=${encodeURIComponent(d.resume.scopeName)}`}
            scopeName={d.resume.scopeName}
            detail={d.resume.detail}
          />
        ) : null}

        <section className="flex flex-col gap-3" aria-label="Dersler">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="type-heading text-ink">Dersler</h2>
            <span className="type-body-sm text-ink-subtle">
              hâkimiyet · ağırlığa göre
            </span>
          </div>
          {d.courses.length === 0 ? (
            <Card className="type-body-sm border-dashed text-center text-ink-soft">
              Bu sınavın müfredatı hazırlanıyor — koçun eklendiğinde haber
              verecek.
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-4">
              {d.courses.map((c) => (
                <CourseCard
                  key={c.id}
                  href={`/kutuphane/ders/${c.id}`}
                  name={c.name}
                  accuracyPct={c.accuracyPct}
                  band={c.band}
                  note={c.note}
                />
              ))}
            </div>
          )}
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/seans?count=10&source=study_hub&scope=${encodeURIComponent("Karışık tur")}`}
            className={hap}
          >
            <Shuffle
              size={18}
              strokeWidth={1.75}
              aria-hidden
              className="text-accent-ink"
            />
            Karışık 10 soru
          </Link>
          <Link
            href={
              d.totals.wrongCount > 0 || d.totals.favoriteCount === 0
                ? "/kutuphane/yanlislar"
                : "/kutuphane/favoriler"
            }
            className={hap}
          >
            <RotateCcw
              size={18}
              strokeWidth={1.75}
              aria-hidden
              className="text-accent-ink"
            />
            {tekrarEtiketi(d.totals)}
          </Link>
          {(d.totals.flashcardsDue ?? 0) > 0 ? (
            <Link href={kartlarHref({}, "due", "study_hub", "Kart tekrarı")} className={hap}>
              <Layers
                size={18}
                strokeWidth={1.75}
                aria-hidden
                className="text-accent-ink"
              />
              Kart tekrarı · {d.totals.flashcardsDue}
            </Link>
          ) : null}
        </div>
      </div>

      <CoachRail />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { MixedLawSessionCard } from "@/components/atlas/mixed-law-session-card";
import { publicApi, type LawSummary } from "@/lib/public-api";

export const metadata: Metadata = {
  title: "Kanun Kütüphanesi — Polis Sınavlarında Çıkan Mevzuat",
  description:
    "PAEM ve Misyon sınavlarında sorumlu olduğun tüm kanun ve yönetmelikler: hangi sınavda hangi ağırlıkla çıkıyor, kaç çıkmış soru var — kanun kanun çalış.",
  alternates: { canonical: "/kanunlar" },
};

// Kabuk oturuma göre değişir (Doc 27 aynı URL iki derinlik); veri fetch-ISR'lı.
export const dynamic = "force-dynamic";

/** Kanun kütüphanesi (Doc 23): tüm mevzuat, derse göre gruplu — SEO iç bağlantı merkezi. */
export default async function KanunlarPage() {
  const laws = await publicApi<LawSummary[]>("/public/laws", 3600).catch(() => [] as LawSummary[]);

  const byCourse = new Map<string, LawSummary[]>();
  for (const l of laws) {
    const list = byCourse.get(l.courseName) ?? [];
    list.push(l);
    byCourse.set(l.courseName, list);
  }
  const groups = [...byCourse.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="tk-scope bg-surface-alt">
      <div className="mx-auto max-w-6xl px-4 py-8 text-ink">
        <h1 className="mb-1 font-heading text-2xl font-bold text-brand">
          📚 Kanun Kütüphanesi
        </h1>
        <p className="mb-8 text-ink-soft">
          Polis sınavlarında sorumlu olduğun {laws.length} kanun ve yönetmelik. Her sayfada: hangi
          sınavda hangi ağırlıkla çıkıyor, örnek çıkmış soru ve ilgili mevzuat.
        </p>

        {groups.map(([course, items]) => {
          const isPoliceLaw = course.toLocaleLowerCase("tr-TR").includes("polis mevzuat");
          const questionCount = items.reduce((sum, item) => sum + item.questionCount, 0);
          const courseId = items[0]?.courseId;

          return (
          <section key={course} className="mb-8">
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-line pb-2">
              <h2 className="font-heading text-lg font-bold text-ink">{course}</h2>
              <span className="tk-caption shrink-0">{items.length} mevzuat</span>
            </div>
            {isPoliceLaw && courseId && questionCount > 0 && (
              <MixedLawSessionCard
                courseId={courseId}
                courseName={course}
                lawCount={items.length}
                questionCount={questionCount}
              />
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items
                .sort((a, b) => b.questionCount - a.questionCount)
                .map((l) => (
                  <Link
                    key={l.slug}
                    href={`/kanun/${l.slug}`}
                    className="tk-interactive rounded-md border border-line bg-surface p-4 text-ink hover:border-brand hover:shadow-card"
                  >
                    <p className="mb-1 text-sm font-medium">{l.name}</p>
                    <p className="text-xs text-ink-soft">
                      {l.questionCount > 0 ? `${l.questionCount} çıkmış soru · ` : ""}
                      {l.exams.map((e) => `${e.examName} %${e.weightPercent}`).join(" · ") ||
                        "müfredat konusu"}
                    </p>
                  </Link>
                ))}
            </div>
          </section>
          );
        })}

        {laws.length === 0 && <p className="text-ink-soft">Kütüphane hazırlanıyor.</p>}
      </div>
    </div>
  );
}

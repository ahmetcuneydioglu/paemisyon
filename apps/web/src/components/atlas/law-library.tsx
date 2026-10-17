import { LawCardGrid } from "@/components/atlas/law-card";
import { LawPicker } from "@/components/atlas/law-picker";
import type { LawSummary } from "@/lib/public-api";

/**
 * Kanun Kütüphanesi listesi (Doc 23) — derse göre gruplu, SEO iç bağlantı merkezi.
 * Anon (statik `(site)`) ve girişli (`/calisma` app kabuğu) sürümler AYNI listeyi
 * kullanır; kabuk çağırana bırakılır (aynı URL iki derinlik, Doc 27).
 */
export function LawLibrary({ laws }: { laws: LawSummary[] }) {
  const byCourse = new Map<string, LawSummary[]>();
  for (const l of laws) {
    const list = byCourse.get(l.courseName) ?? [];
    list.push(l);
    byCourse.set(l.courseName, list);
  }
  const groups = [...byCourse.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  );

  return (
    <div className="bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-8 text-ink md:px-6">
        <h1 className="type-title mb-1 text-ink">Kanun Kütüphanesi</h1>
        <p className="type-body mb-8 text-ink-soft">
          Polis sınavlarında sorumlu olduğun {laws.length} kanun ve yönetmelik.
          Her sayfada: hangi sınavda hangi ağırlıkla çıkıyor, örnek çıkmış soru
          ve ilgili mevzuat.
        </p>

        {groups.map(([course, items]) => {
          const isPoliceLaw = course
            .toLocaleLowerCase("tr-TR")
            .includes("polis mevzuat");
          const questionCount = items.reduce(
            (sum, item) => sum + item.questionCount,
            0,
          );
          const courseId = items[0]?.courseId;

          return (
            <section key={course} className="mb-8">
              <div className="mb-3 flex items-center justify-between gap-3 border-b border-line pb-2">
                <h2 className="type-heading text-ink">{course}</h2>
                <span className="type-label shrink-0 text-ink-subtle">
                  {items.length} mevzuat
                </span>
              </div>
              {/* Polis mevzuatı: karışık tur kartı + kanun seçerek çözme (1 Eki 2026).
                  Seçici gezinme modunda aynı ızgarayı gösterir — anon/girişli ortak. */}
              {isPoliceLaw && courseId && questionCount > 0 ? (
                <LawPicker
                  courseId={courseId}
                  courseName={course}
                  laws={items}
                />
              ) : (
                <LawCardGrid laws={items} />
              )}
            </section>
          );
        })}

        {laws.length === 0 && (
          <p className="type-body text-ink-soft">Kütüphane hazırlanıyor.</p>
        )}
      </div>
    </div>
  );
}

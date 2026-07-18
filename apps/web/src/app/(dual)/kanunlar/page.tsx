import type { Metadata } from "next";
import Link from "next/link";
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-heading mb-1 text-2xl font-bold text-(--color-navy)">
        📚 Kanun Kütüphanesi
      </h1>
      <p className="mb-8 text-gray-600">
        Polis sınavlarında sorumlu olduğun {laws.length} kanun ve yönetmelik. Her sayfada: hangi
        sınavda hangi ağırlıkla çıkıyor, örnek çıkmış soru ve ilgili mevzuat.
      </p>

      {groups.map(([course, items]) => (
        <section key={course} className="mb-8">
          <h2 className="font-heading mb-3 border-b border-gray-200 pb-2 text-lg font-bold text-(--color-navy)">
            {course}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items
              .sort((a, b) => b.questionCount - a.questionCount)
              .map((l) => (
                <Link
                  key={l.slug}
                  href={`/kanun/${l.slug}`}
                  className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-(--color-navy) hover:shadow-sm"
                >
                  <p className="mb-1 text-sm font-medium">{l.name}</p>
                  <p className="text-xs text-gray-500">
                    {l.questionCount > 0 ? `${l.questionCount} çıkmış soru · ` : ""}
                    {l.exams.map((e) => `${e.examName} %${e.weightPercent}`).join(" · ") ||
                      "müfredat konusu"}
                  </p>
                </Link>
              ))}
          </div>
        </section>
      ))}

      {laws.length === 0 && <p className="text-gray-500">Kütüphane hazırlanıyor.</p>}
    </div>
  );
}

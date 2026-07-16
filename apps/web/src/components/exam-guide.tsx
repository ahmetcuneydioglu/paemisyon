import Link from "next/link";
import type { ExamGuide } from "@/lib/public-api";

/**
 * Sınav rehberi gövdesi (Doc 23): bölüm ağırlıkları + ders/konu envanteri,
 * tamamı DB'den — içerik yazımı yok. /paem ve /misyon bunu paylaşır.
 */
export function ExamGuideBody({ guide }: { guide: ExamGuide }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-heading mb-2 text-2xl font-bold text-(--color-navy)">
        {guide.name} Sınavı Rehberi
      </h1>
      {guide.description && <p className="mb-4 text-gray-600">{guide.description}</p>}
      <p className="mb-8 text-sm text-gray-500">
        {guide.sections.length} bölüm · Paemisyon bankasında {guide.totalQuestions} kaynaklı çıkmış
        soru
      </p>

      {/* Ağırlık çubuğu */}
      <div className="mb-8">
        <h2 className="font-heading mb-3 text-lg font-bold text-(--color-navy)">
          Bölümler ve ağırlıkları
        </h2>
        <div className="flex h-8 w-full overflow-hidden rounded-lg">
          {guide.sections.map((s, i) => (
            <div
              key={s.name}
              className="flex items-center justify-center text-[11px] font-bold text-white"
              style={{
                width: `${s.weightPercent}%`,
                background: `hsl(${210 + i * 24} 55% ${38 + (i % 3) * 8}%)`,
              }}
              title={`${s.name} %${s.weightPercent}`}
            >
              %{s.weightPercent}
            </div>
          ))}
        </div>
        <ul className="mt-3 grid gap-1 text-sm text-gray-600 sm:grid-cols-2">
          {guide.sections.map((s, i) => (
            <li key={s.name} className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-sm"
                style={{ background: `hsl(${210 + i * 24} 55% ${38 + (i % 3) * 8}%)` }}
              />
              {s.name} — %{s.weightPercent}
            </li>
          ))}
        </ul>
      </div>

      {/* Bölüm detayları */}
      {guide.sections.map((s) => (
        <section key={s.name} className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-heading font-bold text-(--color-navy)">{s.name}</h3>
            <span className="rounded-full bg-(--color-navy)/10 px-2.5 py-0.5 text-xs font-bold text-(--color-navy)">
              %{s.weightPercent}
            </span>
          </div>
          {s.courses.map((c) => (
            <div key={c.name} className="mt-3 border-t border-gray-100 pt-3">
              <p className="text-sm font-medium">
                {c.name}
                <span className="ml-2 text-xs text-gray-500">
                  {c.topicCount} konu{c.questionCount > 0 ? ` · ${c.questionCount} çıkmış soru` : ""}
                </span>
              </p>
              {c.lawTopics.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.lawTopics.map((t) => (
                    <Link
                      key={t.slug}
                      href={`/kanun/${t.slug}`}
                      className="rounded-full border border-gray-200 px-2.5 py-0.5 text-xs text-gray-600 transition hover:border-(--color-navy) hover:text-(--color-navy)"
                    >
                      {t.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>
      ))}

      <div className="mt-8 rounded-xl bg-(--color-navy) p-6 text-center text-white">
        <p className="font-heading mb-3 text-lg font-bold">
          {guide.name} hazırlığına bugün başla
        </p>
        <p className="mb-4 text-sm text-white/80">
          Kaynaklı çıkmış sorular, canlı denemeler ve seni tanıyan kişisel koç — ücretsiz.
        </p>
        <Link href="/kayit" className="btn2 btn2-green">
          Ücretsiz Kayıt Ol
        </Link>
      </div>
    </div>
  );
}

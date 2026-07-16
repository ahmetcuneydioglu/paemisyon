import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articleSlug, publicApi, type LawDetail, type LawSummary } from "@/lib/public-api";
import { config } from "@/lib/config";

export const revalidate = 3600;
export const dynamicParams = true;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const laws = await publicApi<LawSummary[]>("/public/laws", 3600).catch(() => [] as LawSummary[]);
  return laws.map((l) => ({ slug: l.slug }));
}

async function getLaw(slug: string): Promise<LawDetail | null> {
  return publicApi<LawDetail>(`/public/laws/${slug}`, 3600).catch(() => null);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const law = await getLaw(slug);
  if (!law) return { title: "Kanun bulunamadı" };
  const examStr = law.exams.map((e) => `${e.examName} %${e.weightPercent}`).join(", ");
  return {
    title: `${law.name} — Çıkmış Sorular ve Sınav Ağırlığı`,
    description: `${law.name}: ${examStr || "polis sınavı müfredatı"} kapsamında${
      law.questionCount > 0 ? `, ${law.questionCount} kaynaklı çıkmış soru ile` : ""
    } konu çalış. Örnek soru ve açıklaması sayfada.`,
    alternates: { canonical: `/kanun/${slug}` },
  };
}

/**
 * Kanun sayfası (Doc 23 SEO omurgası): sınav bağlamı + örnek çıkmış soru
 * (cevap anahtarı sızdırma kuralının bilinçli istisnası) + ilgili mevzuat.
 */
export default async function KanunPage({ params }: { params: Params }) {
  const { slug } = await params;
  const law = await getLaw(slug);
  if (!law) notFound();

  const q = law.sampleQuestion;
  const correct = q?.options.find((o) => o.isCorrect);

  const jsonLd = q
    ? {
        "@context": "https://schema.org",
        "@type": "Quiz",
        name: `${law.name} örnek çıkmış soru`,
        about: law.name,
        url: `${config.siteUrl}/kanun/${slug}`,
        hasPart: [
          {
            "@type": "Question",
            name: q.stem,
            suggestedAnswer: q.options
              .filter((o) => !o.isCorrect)
              .map((o) => ({ "@type": "Answer", text: o.text })),
            acceptedAnswer: correct ? { "@type": "Answer", text: correct.text } : undefined,
          },
        ],
      }
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/kanunlar" className="hover:underline">Kanun Kütüphanesi</Link> ›{" "}
        <span>{law.courseName}</span>
      </nav>

      <h1 className="font-heading mb-2 text-2xl font-bold text-(--color-navy)">{law.name}</h1>

      {/* Sınav bağlamı — adayın ilk sorusu: "bu benim sınavımda çıkıyor mu?" */}
      <div className="mb-6 flex flex-wrap gap-2">
        {law.exams.map((e) => (
          <span
            key={e.examKey + e.sectionName}
            className="rounded-full bg-(--color-navy)/10 px-3 py-1 text-sm font-medium text-(--color-navy)"
          >
            {e.examName} · {e.sectionName} · %{e.weightPercent}
          </span>
        ))}
        {law.questionCount > 0 && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
            {law.questionCount} kaynaklı çıkmış soru
          </span>
        )}
      </div>

      {/* Madde Isı Haritası (Doc 25 §4) — hangi maddeden kaç soru çıkmış */}
      {law.articles.length > 0 && (
        <section className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-heading mb-1 text-lg font-bold text-(--color-navy)">
            En çok soru çıkan maddeler
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            Kaynaklı çıkmış sorulardan üretilen dağılım — hangi maddeye
            yoğunlaşman gerektiğini gösterir.
          </p>
          <ul className="space-y-2">
            {law.articles.slice(0, 10).map((a) => {
              const max = law.articles[0].questionCount;
              const ratio = max > 0 ? a.questionCount / max : 0;
              return (
                <li key={a.no}>
                  <Link
                    href={`/kanun/${slug}/madde/${articleSlug(a.no)}`}
                    className="flex items-center gap-3 rounded px-1 py-0.5 text-sm transition hover:bg-gray-50"
                  >
                    <span className="w-14 shrink-0 font-mono font-medium">m.{a.no}</span>
                    <span className="h-2.5 flex-1 overflow-hidden rounded bg-gray-100">
                      <span
                        className="block h-full rounded"
                        style={{
                          width: `${Math.max(8, ratio * 100)}%`,
                          background:
                            ratio >= 0.6 ? "var(--tk-accent-atlas)" : "color-mix(in srgb, var(--tk-accent-atlas) 40%, transparent)",
                        }}
                      />
                    </span>
                    <span className="w-8 shrink-0 text-right text-gray-500">
                      {a.questionCount}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {law.articles.length > 10 && (
            <p className="mt-3 text-xs text-gray-400">
              + {law.articles.length - 10} madde daha — tamamı uygulamada.
            </p>
          )}
        </section>
      )}

      {/* Örnek çıkmış soru */}
      {q ? (
        <section className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-heading mb-3 text-lg font-bold text-(--color-navy)">
            Örnek çıkmış soru
          </h2>
          <p className="mb-3 font-medium">{q.stem}</p>
          <ul className="mb-4 space-y-1.5 text-sm">
            {q.options.map((o) => (
              <li key={o.id}>
                <b>{o.label})</b> {o.text}
              </li>
            ))}
          </ul>
          <details className="rounded-lg bg-gray-50 p-3 text-sm">
            <summary className="cursor-pointer font-bold text-(--color-navy)">
              Cevabı ve açıklamayı göster
            </summary>
            <div className="mt-2 space-y-1">
              {correct && (
                <p>
                  Doğru cevap: <b>{correct.label}) {correct.text}</b>
                </p>
              )}
              {q.explanation && <p className="text-gray-600">{q.explanation}</p>}
              {q.source && <p className="text-xs text-gray-400">Kaynak: {q.source}</p>}
            </div>
          </details>
          <div className="mt-4">
            <Link href="/kayit" className="btn2 btn2-green">
              {law.questionCount > 1
                ? `${law.questionCount} sorunun tamamını çöz — ücretsiz kayıt ol`
                : "Ücretsiz kayıt ol, çalışmaya başla"}
            </Link>
          </div>
        </section>
      ) : (
        <section className="mb-8 rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500">
          Bu mevzuatın çıkmış soruları yakında ekleniyor. Müfredattaki yeri yukarıda —{" "}
          <Link href="/kayit" className="font-bold text-(--color-navy) hover:underline">
            kayıt ol
          </Link>
          , eklendiğinde koçun sana haber versin.
        </section>
      )}

      {/* İlgili mevzuat — iç bağlantı ağı */}
      {law.related.length > 0 && (
        <section>
          <h2 className="font-heading mb-3 text-lg font-bold text-(--color-navy)">
            {law.courseName} dersindeki diğer mevzuat
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {law.related.map((r) => (
              <Link
                key={r.slug}
                href={`/kanun/${r.slug}`}
                className="rounded-lg border border-gray-200 bg-white p-3 text-sm transition hover:border-(--color-navy)"
              >
                <span className="font-medium">{r.name}</span>
                {r.questionCount > 0 && (
                  <span className="ml-2 text-xs text-gray-500">{r.questionCount} soru</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

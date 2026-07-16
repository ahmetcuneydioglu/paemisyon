import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicApi, type LawArticleDetail } from "@/lib/public-api";
import { config } from "@/lib/config";

export const revalidate = 3600;

type Params = Promise<{ slug: string; no: string }>;

async function getArticle(slug: string, no: string): Promise<LawArticleDetail | null> {
  return publicApi<LawArticleDetail>(`/public/laws/${slug}/articles/${no}`, 3600).catch(
    () => null,
  );
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, no } = await params;
  const a = await getArticle(slug, no);
  if (!a) return { title: "Madde bulunamadı" };
  return {
    title: `${a.lawName} Madde ${a.no} — Çıkmış Sorular`,
    description: `${a.lawName} m.${a.no}: polis sınavlarında ${a.questionCount} kez soruldu. Hangi sınavda kaç kez çıktığını gör, sorularını çöz.`,
    alternates: { canonical: `/kanun/${slug}/madde/${no}` },
  };
}

/**
 * Madde detay sayfası (Doc 25 §4, wireframe 07'nin v1'i).
 * Resmî metin + AI sadeleştirme V2 (kanun metni içerik hattı ayrı iş) —
 * v1 mevcut gerçek veriyle değerli: sınav geçmişi + teaser kökler + gezinme.
 * Cevap anahtarı SIZMAZ; kökler sunucuda kısaltılır.
 */
export default async function MaddePage({ params }: { params: Params }) {
  const { slug, no } = await params;
  const a = await getArticle(slug, no);
  if (!a) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${a.lawName} Madde ${a.no} — çıkmış soru analizi`,
    about: a.lawName,
    url: `${config.siteUrl}/kanun/${a.lawSlug}/madde/${a.slug}`,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/kanunlar" className="hover:underline">Kanun Kütüphanesi</Link> ›{" "}
        <Link href={`/kanun/${a.lawSlug}`} className="hover:underline">{a.lawName}</Link> ›{" "}
        <span className="font-medium text-gray-700">m.{a.no}</span>
      </nav>

      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-2xl font-bold text-(--color-navy)">
          Madde {a.no}
        </h1>
        <span className="rounded-full bg-(--tk-accent-atlas)/10 px-3 py-1 text-sm font-medium"
          style={{ color: "var(--tk-accent-atlas)" }}>
          🔥 {a.questionCount} çıkmış soru
        </span>
      </div>
      <p className="mb-6 text-gray-600">{a.lawName} · {a.courseName}</p>

      {/* Sınav bağlamı */}
      <div className="mb-6 flex flex-wrap gap-2">
        {a.exams.map((e) => (
          <span
            key={e.examKey + e.sectionName}
            className="rounded-full bg-(--color-navy)/10 px-3 py-1 text-sm font-medium text-(--color-navy)"
          >
            {e.examName} · %{e.weightPercent}
          </span>
        ))}
      </div>

      {/* Sınav geçmişi — hangi sınavda kaç kez */}
      {a.sources.length > 0 && (
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-heading mb-3 text-lg font-bold text-(--color-navy)">
            Bu madde hangi sınavlarda soruldu?
          </h2>
          <ul className="space-y-1.5 text-sm">
            {a.sources.map((s) => (
              <li key={s.source} className="flex items-center justify-between">
                <span>{s.source}</span>
                <span className="font-medium text-gray-500">
                  {s.count} soru
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Teaser kökler — cevap/şık YOK (banka sızdırma politikası) */}
      {a.previews.length > 0 && (
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-heading mb-3 text-lg font-bold text-(--color-navy)">
            Örnek soru kökleri
          </h2>
          <ul className="space-y-3">
            {a.previews.map((p, i) => (
              <li key={i} className="rounded-lg bg-gray-50 p-4 text-sm italic text-gray-700">
                “{p}”
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link href="/kayit" className="btn2 btn2-green">
              {a.questionCount} sorunun tamamını çöz — ücretsiz kayıt ol
            </Link>
            <span className="text-xs text-gray-400">
              Cevaplar ve açıklamalar uygulamada.
            </span>
          </div>
        </section>
      )}

      {/* Komşu madde gezinme */}
      <div className="mb-6 flex items-center justify-between text-sm">
        {a.neighbors.prev ? (
          <Link
            href={`/kanun/${a.lawSlug}/madde/${a.neighbors.prev.slug}`}
            className="font-bold text-(--color-navy) hover:underline"
          >
            ← m.{a.neighbors.prev.no}
          </Link>
        ) : (
          <span />
        )}
        {a.neighbors.next ? (
          <Link
            href={`/kanun/${a.lawSlug}/madde/${a.neighbors.next.slug}`}
            className="font-bold text-(--color-navy) hover:underline"
          >
            m.{a.neighbors.next.no} →
          </Link>
        ) : (
          <span />
        )}
      </div>

      {/* Kanunun diğer etiketli maddeleri */}
      {a.siblings.length > 1 && (
        <section>
          <h2 className="font-heading mb-3 text-lg font-bold text-(--color-navy)">
            {a.lawName} — soru çıkan maddeler
          </h2>
          <div className="flex flex-wrap gap-2">
            {a.siblings.map((s) => (
              <Link
                key={s.slug}
                href={`/kanun/${a.lawSlug}/madde/${s.slug}`}
                className={`rounded-full border px-3 py-1 text-sm transition hover:border-(--color-navy) ${
                  s.no === a.no
                    ? "border-(--color-navy) bg-(--color-navy)/10 font-bold text-(--color-navy)"
                    : "border-gray-200 text-gray-600"
                }`}
              >
                m.{s.no} <span className="text-xs text-gray-400">({s.questionCount})</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

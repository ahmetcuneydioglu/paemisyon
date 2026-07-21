import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicApi, type LawReading, type LawSummary } from "@/lib/public-api";
import { config } from "@/lib/config";

type Params = Promise<{ slug: string }>;

async function getReading(slug: string): Promise<LawReading | null> {
  return publicApi<LawReading>(`/public/laws/${slug}/read`, 3600).catch(() => null);
}

/** Yayınlanmış metni olan kanunları prerender et (SEO); yenisi ilk istekte ISR. */
export async function generateStaticParams() {
  const laws = await publicApi<LawSummary[]>("/public/laws", 3600).catch(
    () => [] as LawSummary[],
  );
  return laws.filter((l) => l.readable).map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const law = await getReading(slug);
  if (!law) return { title: "Kanun metni bulunamadı" };
  return {
    title: `${law.lawName} — Tam Metin (Güncel Maddeler)`,
    description: `${law.lawName} güncel tam metni: ${law.articleCount} madde, resmî kaynaktan (${law.source}). Madde madde oku.`,
    alternates: { canonical: `/kanun/${slug}/oku` },
  };
}

/** ISO → "GG.AA.YYYY" (deterministik; locale/TZ yok → hydration güvenli). */
function fmtDate(iso: string): string {
  const d = iso.slice(0, 10).split("-");
  return d.length === 3 ? `${d[2]}.${d[1]}.${d[0]}` : iso;
}

/** Anchor id: "4/A" → "m-4-a", "Ek 6" → "m-ek-6". */
function anchorId(slug: string): string {
  return `m-${slug}`;
}

/**
 * Kanunu oku — ANON/SEO okuma katmanı (Doc 25 §4). Kanunun tüm yayınlanmış
 * maddeleri, madde sırasıyla, birebir resmî metin. Kanun metni kamuya açıktır;
 * cevap/soru sızmaz.
 */
export default async function KanunOkuPage({ params }: { params: Params }) {
  const { slug } = await params;
  const law = await getReading(slug);
  if (!law) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Legislation",
    name: law.lawName,
    legislationType: "Kanun",
    url: `${config.siteUrl}/kanun/${slug}/oku`,
    isBasedOn: law.sourceUrl ?? undefined,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/kanunlar" className="hover:underline">
          Kanun Kütüphanesi
        </Link>{" "}
        ›{" "}
        <Link href={`/kanun/${slug}`} className="hover:underline">
          {law.lawName.split(" ")[0]}
        </Link>{" "}
        › Tam metin
      </nav>

      <h1 className="font-heading mb-1 text-2xl font-bold text-(--color-navy)">{law.lawName}</h1>
      <p className="mb-4 text-sm text-gray-500">
        {law.courseName} · {law.articleCount} madde · güncel tam metin
      </p>

      {/* Kaynak künyesi — güven vaadi */}
      <p className="mb-6 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
        Kaynak:{" "}
        {law.sourceUrl ? (
          <a
            href={law.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-700"
          >
            {law.source}
          </a>
        ) : (
          law.source
        )}
        {law.effectiveInfo ? ` · ${law.effectiveInfo}` : ""}
        {law.verifiedAt ? ` · ${fmtDate(law.verifiedAt)} itibarıyla` : ""}
      </p>

      {/* İçindekiler — madde madde atlama */}
      {law.articles.length > 1 && (
        <nav className="mb-8 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-bold text-(--color-navy)">İçindekiler</h2>
          <div className="flex flex-wrap gap-1.5">
            {law.articles.map((a) => (
              <a
                key={a.slug}
                href={`#${anchorId(a.slug)}`}
                className="rounded border border-gray-200 px-2 py-0.5 font-mono text-xs text-gray-600 hover:border-(--color-navy) hover:text-(--color-navy)"
              >
                m.{a.no}
              </a>
            ))}
          </div>
        </nav>
      )}

      {/* Maddeler — birebir resmî metin */}
      <div className="space-y-6">
        {law.articles.map((a) => (
          <article key={a.slug} id={anchorId(a.slug)} className="scroll-mt-20">
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <h2 className="font-heading text-lg font-bold text-(--color-navy)">
                Madde {a.no}
              </h2>
              <Link
                href={`/kanun/${slug}/madde/${a.slug}`}
                className="text-xs text-gray-400 hover:text-(--color-navy) hover:underline"
              >
                madde sayfası →
              </Link>
            </div>
            <div className="whitespace-pre-line text-[15px] leading-relaxed text-gray-800">
              {a.text}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-gray-200 bg-white p-6 text-center">
        <p className="mb-3 text-sm text-gray-600">
          Bu maddelerden çıkmış soruları çözerek pekiştir.
        </p>
        <Link href="/kayit" className="btn2 btn2-green">
          Ücretsiz kayıt ol, çalışmaya başla
        </Link>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  publicApi,
  type LawSummary,
  type MevzuatReading,
} from "@/lib/public-api";
import { config } from "@/lib/config";
import {
  PageFrame,
  PageIntro,
  ClosingCta,
} from "@/components/public/page-frame";
import { ButtonLink } from "@/components/ui/button";

type Params = Promise<{ slug: string }>;

async function getReading(slug: string): Promise<MevzuatReading | null> {
  // Doc 29: bölüm başlıkları + madde başlıkları taşıyan yeni okuma ucu.
  return publicApi<MevzuatReading>(`/public/mevzuat/${slug}/oku`, 3600).catch(
    () => null,
  );
}

/** Yayınlanmış metni olan kanunları prerender et (SEO); yenisi ilk istekte ISR. */
export async function generateStaticParams() {
  const laws = await publicApi<LawSummary[]>("/public/laws", 3600).catch(
    () => [] as LawSummary[],
  );
  return laws.filter((l) => l.readable).map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const law = await getReading(slug);
  if (!law) return { title: "Kanun metni bulunamadı" };
  return {
    title: `${law.name} — Tam Metin (Güncel Maddeler)`,
    description: `${law.name} güncel tam metni: ${law.articleCount} madde, resmî kaynaktan (${law.source}). Madde madde oku.`,
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
    name: law.name,
    legislationType: "Kanun",
    url: `${config.siteUrl}/kanun/${slug}/oku`,
    isBasedOn: law.sourceUrl ?? undefined,
  };

  const bySection = new Map(law.sections.map((s) => [s.id, s.heading]));
  const groups: { heading: string | null; items: typeof law.articles }[] = [];
  for (const a of law.articles) {
    const heading = a.sectionId ? (bySection.get(a.sectionId) ?? null) : null;
    const last = groups[groups.length - 1];
    if (!last || last.heading !== heading) groups.push({ heading, items: [a] });
    else last.items.push(a);
  }

  return (
    <PageFrame className="flex flex-col gap-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageIntro
        breadcrumb={[
          { label: "Kanun Kütüphanesi", href: "/kanunlar" },
          { label: law.name.split(" ")[0], href: `/kanun/${slug}` },
          { label: "Tam metin" },
        ]}
        eyebrow={`${law.articleCount} madde · güncel tam metin`}
        title={law.name}
        meta={
          // Kaynak künyesi — güven vaadi
          <span className="rounded-control bg-surface-alt px-3 py-1.5 text-ink-soft">
            Kaynak:{" "}
            {law.sourceUrl ? (
              <a
                href={law.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-ink"
              >
                {law.source}
              </a>
            ) : (
              law.source
            )}
            {law.effectiveInfo ? ` · ${law.effectiveInfo}` : ""}
            {law.verifiedAt ? ` · ${fmtDate(law.verifiedAt)} itibarıyla` : ""}
          </span>
        }
      />

      {/* İçindekiler — bölüm başlıklarıyla gruplu madde atlama (Doc 29 §9) */}
      {law.articles.length > 1 && (
        <nav
          className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4"
          aria-label="İçindekiler"
        >
          <h2 className="type-subhead text-ink">İçindekiler</h2>
          {groups.map((g, gi) => (
            <div key={gi} className="flex flex-col gap-1.5">
              {g.heading && (
                <p className="type-label text-ink-subtle">
                  {g.heading.toLocaleUpperCase("tr-TR")}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {g.items.map((a) => (
                  <a
                    key={a.slug}
                    href={`#${anchorId(a.slug)}`}
                    title={a.title ?? undefined}
                    className="tk-interactive inline-flex min-h-8 items-center rounded-control border border-line px-2 font-mono text-[12px] text-ink-soft hover:border-ink-soft hover:text-ink"
                  >
                    m.{a.no}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </nav>
      )}

      {/* Maddeler — birebir resmî metin; bölüm başlıkları akışta */}
      <div className="flex flex-col gap-6">
        {law.articles.map((a, i) => {
          const prev = i > 0 ? law.articles[i - 1] : null;
          const sectionHeading =
            a.sectionId && a.sectionId !== prev?.sectionId
              ? bySection.get(a.sectionId)
              : null;
          return (
            <article
              key={a.slug}
              id={anchorId(a.slug)}
              className="scroll-mt-20"
            >
              {sectionHeading && (
                <p className="type-label mb-3 mt-6 border-b border-line pb-1 text-accent-ink">
                  {sectionHeading.toLocaleUpperCase("tr-TR")}
                </p>
              )}
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <h2 className="type-heading text-ink">
                  Madde {a.no}
                  {a.title && (
                    <span className="type-body-sm ml-2 font-normal text-ink-soft">
                      {a.title}
                    </span>
                  )}
                </h2>
                <Link
                  href={`/kanun/${slug}/madde/${a.slug}`}
                  className="type-body-sm shrink-0 text-ink-subtle hover:text-accent-ink hover:underline"
                >
                  madde sayfası ›
                </Link>
              </div>
              <div className="type-body max-w-[72ch] whitespace-pre-line text-ink">
                {a.text}
              </div>
            </article>
          );
        })}
      </div>

      <ClosingCta
        title="Bu maddelerden çıkmış soruları çöz"
        body="Okuduğunu soruyla pekiştir; yanlışların tekrar listesine düşsün."
        actions={<ButtonLink href="/kayit">Ücretsiz kayıt ol</ButtonLink>}
      />
    </PageFrame>
  );
}

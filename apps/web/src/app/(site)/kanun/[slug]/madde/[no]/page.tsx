import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Flame } from "lucide-react";
import { publicApi, type LawArticleDetail } from "@/lib/public-api";
import { config } from "@/lib/config";
import { PageFrame, PageIntro } from "@/components/public/page-frame";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/cn";

type Params = Promise<{ slug: string; no: string }>;

/**
 * ISR 24 saat (10 Ekim 2026): madde sayfaları `generateStaticParams` olmadan istek anında üretilir; binlerce madde
 * adresini her gece gezen tarayıcılar 1 saatlik süreyle her saat yeni işlev çağrısı tetikliyordu (Vercel uyarısı:
 * 5 saatte 33K çağrı). Madde metni ve soru sayıları günde bir tazelenir; içerik zaten günlük işlerle değişir.
 */
const MADDE_REVALIDATE_SECONDS = 86_400;

async function getArticle(
  slug: string,
  no: string,
): Promise<LawArticleDetail | null> {
  return publicApi<LawArticleDetail>(
    `/public/laws/${slug}/articles/${no}`,
    MADDE_REVALIDATE_SECONDS,
  ).catch(() => null);
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
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
 * Madde detay sayfası — ANON/SEO sürümü (public kabuk). İstek durumu OKUNMAZ.
 * Girişli kullanıcı middleware ile /calisma/kanun/[slug]/madde/[no] app kabuğuna
 * (ArticleWorkspace) rewrite'lanır; URL değişmez (Doc 27 §3.5). Cevap anahtarı SIZMAZ.
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
    <PageFrame className="flex flex-col gap-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageIntro
        breadcrumb={[
          { label: "Kanun Kütüphanesi", href: "/kanunlar" },
          { label: a.lawName, href: `/kanun/${a.lawSlug}` },
          { label: `m.${a.no}` },
        ]}
        eyebrow={`${a.lawName} · ${a.courseName}`}
        title={`Madde ${a.no}`}
        meta={
          <>
            <Badge tone="warning">
              <Flame size={12} aria-hidden /> {a.questionCount} çıkmış soru
            </Badge>
            {a.exams.map((e) => (
              <Badge key={e.examKey + e.sectionName} tone="accent">
                {e.examName} · %{e.weightPercent}
              </Badge>
            ))}
          </>
        }
      />

      {/* Sınav geçmişi — hangi sınavda kaç kez */}
      {a.sources.length > 0 && (
        <Card className="flex flex-col gap-3 p-5 sm:p-6">
          <h2 className="type-heading text-ink">
            Bu madde hangi sınavlarda soruldu?
          </h2>
          <ul className="flex flex-col divide-y divide-line">
            {a.sources.map((s) => (
              <li
                key={s.source}
                className="type-body-sm flex items-center justify-between gap-3 py-2"
              >
                <span className="text-ink">{s.source}</span>
                <span className="tabular shrink-0 font-semibold text-ink-soft">
                  {s.count} soru
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Teaser kökler — cevap/şık YOK (banka sızdırma politikası) */}
      {a.previews.length > 0 && (
        <Card className="flex flex-col gap-4 p-5 sm:p-6">
          <h2 className="type-heading text-ink">Örnek soru kökleri</h2>
          <ul className="flex flex-col gap-3">
            {a.previews.map((p, i) => (
              <li
                key={i}
                className="type-body-sm rounded-control border-l-2 border-accent bg-surface-alt p-4 text-ink"
              >
                “{p}”
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="/kayit">
              {a.questionCount} sorunun tamamını çöz — ücretsiz kayıt ol
            </ButtonLink>
            <span className="type-body-sm text-ink-subtle">
              Cevaplar ve açıklamalar uygulamada.
            </span>
          </div>
        </Card>
      )}

      {/* Komşu madde gezinme */}
      <nav
        className="flex items-center justify-between gap-3"
        aria-label="Komşu maddeler"
      >
        {a.neighbors.prev ? (
          <ButtonLink
            href={`/kanun/${a.lawSlug}/madde/${a.neighbors.prev.slug}`}
            variant="secondary"
            size="sm"
            leadingIcon={<ArrowLeft size={16} aria-hidden />}
          >
            m.{a.neighbors.prev.no}
          </ButtonLink>
        ) : (
          <span />
        )}
        {a.neighbors.next ? (
          <ButtonLink
            href={`/kanun/${a.lawSlug}/madde/${a.neighbors.next.slug}`}
            variant="secondary"
            size="sm"
          >
            m.{a.neighbors.next.no} <ArrowRight size={16} aria-hidden />
          </ButtonLink>
        ) : (
          <span />
        )}
      </nav>

      {/* Kanunun diğer etiketli maddeleri */}
      {a.siblings.length > 1 && (
        <section className="flex flex-col gap-3">
          <SectionHeader title={`${a.lawName} — soru çıkan maddeler`} />
          <div className="flex flex-wrap gap-2">
            {a.siblings.map((s) => {
              const current = s.no === a.no;
              return (
                <Link
                  key={s.slug}
                  href={`/kanun/${a.lawSlug}/madde/${s.slug}`}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "tk-interactive inline-flex min-h-9 items-center gap-1 rounded-pill border px-3 type-body-sm",
                    current
                      ? "border-accent bg-accent-soft font-semibold text-accent-ink"
                      : "border-line text-ink-soft hover:border-ink-soft hover:text-ink",
                  )}
                >
                  m.{s.no}{" "}
                  <span
                    className={cn(
                      "tabular",
                      current ? "text-accent-ink" : "text-ink-subtle",
                    )}
                  >
                    ({s.questionCount})
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </PageFrame>
  );
}

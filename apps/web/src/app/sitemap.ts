import type { MetadataRoute } from "next";
import { config } from "@/lib/config";
import { articleSlug, publicApi, type LawDetail, type LawSummary } from "@/lib/public-api";

/** Sitemap (Doc 23 SEO omurgası) — statik sayfalar + DB'den kanun ve madde sayfaları. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = config.siteUrl;
  const laws = await publicApi<LawSummary[]>("/public/laws", 3600).catch(() => [] as LawSummary[]);

  // Madde sayfaları (Doc 27 W4): yalnız soru sayısı olan kanunların detayına inilir;
  // fetch-ISR sayesinde saatte bir tazelenir, istek maliyeti sabittir.
  const details = await Promise.all(
    laws
      .filter((l) => l.questionCount > 0)
      .map((l) => publicApi<LawDetail>(`/public/laws/${l.slug}`, 3600).catch(() => null)),
  );
  const articlePages: MetadataRoute.Sitemap = details
    .filter((d): d is LawDetail => d != null)
    .flatMap((d) =>
      d.articles.map((a) => ({
        url: `${base}/kanun/${d.slug}/madde/${articleSlug(a.no)}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    );

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/gunun-sorusu`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/kanunlar`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/paem`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/misyon`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/hesaplayici/paem-puan`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/denemeler`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/premium`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/lider-tablosu`, changeFrequency: "daily", priority: 0.5 },
    { url: `${base}/sss`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/gizlilik`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/kosullar`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const lawPages: MetadataRoute.Sitemap = laws.map((l) => ({
    url: `${base}/kanun/${l.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...lawPages, ...articlePages];
}

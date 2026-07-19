import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publicApi, type LawArticleDetail, type TopicAtlas } from "@/lib/public-api";
import { api } from "@/lib/api";
import { ArticleWorkspace } from "@/components/atlas/article-workspace";

// İç (rewrite hedefi) rota — auth korumalı + noindex; URL /kanun/[slug]/madde/[no] kalır.
export const metadata: Metadata = { robots: { index: false } };

type Params = Promise<{ slug: string; no: string }>;

/**
 * Madde detay — GİRİŞLİ çalışma alanı (L4, Doc 27 §3.5). Middleware girişli
 * kullanıcının /kanun/[slug]/madde/[no] isteğini buraya rewrite eder.
 */
export default async function CalismaMaddePage({ params }: { params: Params }) {
  const { slug, no } = await params;
  const a = await publicApi<LawArticleDetail>(
    `/public/laws/${slug}/articles/${no}`,
    3600,
  ).catch(() => null);
  if (!a) notFound();
  const atlas = await api<TopicAtlas>(`/catalog/topics/${a.topicId}/atlas`).catch(
    () => null,
  );
  return <ArticleWorkspace article={a} atlas={atlas} />;
}

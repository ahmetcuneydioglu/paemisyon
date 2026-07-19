import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publicApi, type LawDetail, type TopicAtlas } from "@/lib/public-api";
import { api } from "@/lib/api";
import { LawWorkspace } from "@/components/atlas/law-workspace";

// İç (rewrite hedefi) rota — auth korumalı + noindex; URL /kanun/[slug] kalır.
export const metadata: Metadata = { robots: { index: false } };

type Params = Promise<{ slug: string }>;

/**
 * Kanun sayfası — GİRİŞLİ çalışma alanı (app kabuğu, L3 atlas). Middleware
 * girişli kullanıcının /kanun/[slug] isteğini buraya rewrite eder (Doc 27 §3.4).
 */
export default async function CalismaKanunPage({ params }: { params: Params }) {
  const { slug } = await params;
  const law = await publicApi<LawDetail>(`/public/laws/${slug}`, 3600).catch(() => null);
  if (!law) notFound();
  const atlas = await api<TopicAtlas>(`/catalog/topics/${law.topicId}/atlas`).catch(
    () => null,
  );
  return <LawWorkspace law={law} atlas={atlas} />;
}

import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import { TopicMap, type TopicProgressRow } from "@/components/performans/topic-map";

export const metadata: Metadata = { title: "Konu Haritası", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Konu haritası sayfası — veri sunucudan, etkileşim istemciden (Doc 27 §3.9). */
export default async function KonuHaritasiPage() {
  const rows = await api<TopicProgressRow[]>("/progress/topics").catch(
    () => [] as TopicProgressRow[],
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <nav className="tk-caption mb-3" aria-label="breadcrumb">
        <Link href="/performans" className="hover:text-ink">Performans</Link> › Konu haritası
      </nav>
      <h1 className="mb-5 font-heading text-xl font-bold text-ink">Konu haritası</h1>
      <TopicMap rows={rows} />
    </div>
  );
}

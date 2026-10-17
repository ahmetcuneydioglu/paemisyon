import type { Metadata } from "next";
import { api } from "@/lib/api";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  TopicMap,
  type TopicProgressRow,
} from "@/components/performans/topic-map";

export const metadata: Metadata = {
  title: "Konu Haritası",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

/** Konu haritası sayfası — veri sunucudan, etkileşim istemciden (Doc 27 §3.9). */
export default async function KonuHaritasiPage() {
  const rows = await api<TopicProgressRow[]>("/progress/topics").catch(
    () => [] as TopicProgressRow[],
  );
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <Breadcrumb
        className="mb-3"
        items={[
          { label: "Performans", href: "/performans" },
          { label: "Konu haritası" },
        ]}
      />
      <h1 className="type-title mb-5 text-ink">Konu haritası</h1>
      <TopicMap rows={rows} />
    </div>
  );
}

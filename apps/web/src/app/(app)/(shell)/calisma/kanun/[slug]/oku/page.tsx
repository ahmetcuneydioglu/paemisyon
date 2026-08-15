import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LawReader } from "@/components/mevzuat/law-reader";
import { publicApi, type MevzuatReading } from "@/lib/public-api";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: "Kanunu Oku",
    robots: { index: false },
    alternates: { canonical: `/kanun/${slug}/oku` },
  };
}

/** Girişli okuyucu (Doc 29 §33) — middleware /kanun/:slug/oku isteğini buraya
 *  rewrite eder; kaydet + devam + hâkimiyet araçları LawReader'da. */
export default async function CalismaKanunOkuPage({ params }: { params: Params }) {
  const { slug } = await params;
  const law = await publicApi<MevzuatReading>(`/public/mevzuat/${slug}/oku`, 300).catch(
    () => null,
  );
  if (!law) notFound();
  return <LawReader law={law} />;
}

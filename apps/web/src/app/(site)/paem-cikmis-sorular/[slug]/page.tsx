import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  publicApi,
  publicApiList,
  type CikmisSinavDetay,
  type CikmisSinavOzet,
} from "@/lib/public-api";
import { SinavDetay } from "@/components/cikmis/sinav-detay";

async function getir(slug: string): Promise<CikmisSinavDetay | null> {
  return publicApi<CikmisSinavDetay>(`/public/cikmis-sinavlar/${slug}`, 3600).catch(
    () => null,
  );
}

/** Yayındaki dönemler build sırasında üretilir; yenisi ISR ile eklenir. */
export async function generateStaticParams() {
  const { items } = await publicApiList<CikmisSinavOzet>("/public/cikmis-sinavlar");
  return items.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sinav = await getir(slug);
  if (!sinav) return { title: "Çıkmış sınav bulunamadı" };

  const donem = sinav.donem ? `PAEM ${sinav.donem}` : sinav.ad;
  const yil = sinav.tarih ? ` (${new Date(sinav.tarih).getFullYear()})` : "";
  // Başlık ve açıklama TÜRE göre değişir: konu analizi sayfasını "çıkmış
  // sorular" diye aratıp tıklayan aday, aradığını bulamadığını sayfaya
  // girmeden bilmeli (Doc 36 §1).
  return {
    title:
      sinav.tur === "resmi"
        ? `${donem} Çıkmış Sorular${yil} — Cevaplı ve Açıklamalı`
        : `${donem} Konu Analizi${yil} — Hangi Dersten Kaç Soru Çıktı`,
    description:
      sinav.tur === "resmi"
        ? `${sinav.ad} sorularından ${sinav.sorular.length} tanesi resmî cevabı, açıklaması ve kanun dayanağıyla birlikte. Sınavın ders dağılımı da sayfada.`
        : `${sinav.ad} yayımlanmadı. Sınava girenlerin derlediği kayıtlardan çıkarılan ders ve kanun dağılımı; hangi konudan kaç soru geldiğini gösteriyor.`,
    alternates: { canonical: `/paem-cikmis-sorular/${slug}` },
  };
}

/** Dönem sayfası (Doc 36) — girişsiz SEO katmanı, ISR. */
export default async function CikmisSinavPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sinav = await getir(slug);
  if (!sinav) notFound();
  return <SinavDetay sinav={sinav} />;
}

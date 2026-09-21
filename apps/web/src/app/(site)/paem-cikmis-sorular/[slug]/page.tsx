import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  publicApi,
  publicApiList,
  type CikmisSinavDetay,
  type CikmisSinavOzet,
} from "@/lib/public-api";
import { SinavDetay } from "@/components/cikmis/sinav-detay";
import { config } from "@/lib/config";

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
  const baslik =
    sinav.tur === "resmi"
      ? `${donem} Çıkmış Sorular${yil} — Cevaplı ve Açıklamalı`
      : `${donem} Konu Analizi${yil} — Hangi Dersten Kaç Soru Çıktı`;
  const aciklama =
    sinav.tur === "resmi"
      ? `${sinav.ad} sorularından ${sinav.sorular.length} tanesi resmî cevabı, açıklaması ve kanun dayanağıyla birlikte. Sınavın ders dağılımı da sayfada.`
      : `${sinav.ad} yayımlanmadı. Sınava girenlerin derlediği kayıtlardan çıkarılan ders ve kanun dağılımı; hangi konudan kaç soru geldiğini gösteriyor.`;
  const yol = `/paem-cikmis-sorular/${slug}`;

  return {
    title: baslik,
    description: aciklama,
    alternates: { canonical: yol },
    // Paylaşım kartı: başlık/açıklama metadata'dan miras alınmıyor, açıkça
    // verilmesi gerekiyor. `url` metadataBase ile mutlaklaşır.
    openGraph: { type: "article", url: yol, title: baslik, description: aciklama },
  };
}

/**
 * Google "practice problems" zengin sonucu için `Quiz` yapısal verisi.
 *
 * Sayfa bu şemaya birebir oturuyor: çoktan seçmeli soru, şıklar, resmî doğru
 * cevap ve açıklama. Açıklama `acceptedAnswer.comment` alanına gider — şemanın
 * çözüm metni için ayırdığı yer orası ve bizim PDF'ten farkımız da tam olarak o.
 *
 * Yalnız RESMÎ dönemlerde üretilir: `analiz` türünde bankada soru yok, sayfada
 * yalnız ders dağılımı var. İPTAL edilmiş sorular dışarıda kalır — puanlanmayan
 * bir soruyu "doğru cevabı şudur" diye işaretlemek yanlış olur.
 */
function quizJsonLd(sinav: CikmisSinavDetay, slug: string) {
  if (sinav.tur !== "resmi") return null;
  const sorular = sinav.sorular.filter((s) => !s.iptal && s.siklar.some((x) => x.dogru));
  if (!sorular.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: `${sinav.ad} — çıkmış sorular`,
    url: `${config.canonicalOrigin}/paem-cikmis-sorular/${slug}`,
    about: { "@type": "Thing", name: sinav.ad },
    educationalLevel: "professional",
    hasPart: sorular.map((s) => {
      const dogru = s.siklar.find((x) => x.dogru)!;
      return {
        "@type": "Question",
        eduQuestionType: "Multiple choice",
        name: s.kok,
        text: s.kok,
        about: { "@type": "Thing", name: s.konu },
        acceptedAnswer: {
          "@type": "Answer",
          text: dogru.metin,
          ...(s.aciklama ? { comment: { "@type": "Comment", text: s.aciklama } } : {}),
        },
        suggestedAnswer: s.siklar
          .filter((x) => !x.dogru)
          .map((x) => ({ "@type": "Answer", text: x.metin })),
      };
    }),
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
  const jsonLd = quizJsonLd(sinav, slug);
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <SinavDetay sinav={sinav} />
    </>
  );
}

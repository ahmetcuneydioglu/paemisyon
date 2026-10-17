import type { Metadata } from "next";
import { publicApiList, type CikmisSinavOzet } from "@/lib/public-api";
import { SinavListesi } from "@/components/cikmis/sinav-listesi";
import { PageFrame, PageIntro } from "@/components/public/page-frame";

export const metadata: Metadata = {
  title: "PAEM Çıkmış Sorular — Dönem Dönem Sorular ve Konu Analizi",
  description:
    "PAEM İlk Derece Amirlik Eğitimi yazılı sınavlarının çıkmış soruları ve konu dağılımı: hangi dönemde hangi dersten kaç soru çıktı, cevaplar ve kanun dayanakları.",
  alternates: { canonical: "/paem-cikmis-sorular" },
};

/**
 * PAEM çıkmış sorular vitrini (Doc 36) — girişsiz SEO katmanı, ISR.
 * İstek durumu OKUNMAZ, böylece sayfa statik üretilip edge'de önbelleklenir.
 */
export default async function CikmisSorularPage() {
  const { items: sinavlar, erisilemedi } = await publicApiList<CikmisSinavOzet>(
    "/public/cikmis-sinavlar",
  );

  return (
    <PageFrame width="wide" className="flex max-w-5xl flex-col gap-8">
      <PageIntro
        eyebrow="Resmî dönemler ve konu analizleri"
        title="PAEM Çıkmış Sorular"
        lead="İlk Derece Amirlik Eğitimi yazılı sınavının yayımlanmış dönemleri, resmî cevap anahtarıyla ve her sorunun kanun dayanağıyla birlikte. Yayımlanmayan dönemler için adayların derlediği konu dağılımını veriyoruz — ikisini birbirine karıştırmıyoruz, hangisine baktığın kartın üstünde yazıyor."
      />

      <SinavListesi sinavlar={sinavlar} erisilemedi={erisilemedi} />

      <section className="flex flex-col gap-2 border-t border-line pt-6">
        <h2 className="type-heading text-ink">
          Çıkmış soru çalışmanın en verimli yolu
        </h2>
        <p className="type-body max-w-[68ch] text-ink-soft">
          Soruyu okuyup cevabı görmek yetmiyor; okurken her şey anlaşılır
          görünür, asıl fark çözerken çıkar. Bu yüzden buradaki sorular
          çözülüyor: şıkka dokunuyorsun, doğru mu yanlış mı anında görüyorsun ve
          altında dayandığı madde yazıyor. Sınav aynı maddeyi başka bir yüzle
          tekrar sorduğu için kalıcı olan da bu.
        </p>
      </section>
    </PageFrame>
  );
}

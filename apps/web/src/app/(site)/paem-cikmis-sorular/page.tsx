import type { Metadata } from "next";
import { publicApiList, type CikmisSinavOzet } from "@/lib/public-api";
import { SinavListesi } from "@/components/cikmis/sinav-listesi";

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
  const { items: sinavlar, erisilemedi } =
    await publicApiList<CikmisSinavOzet>("/public/cikmis-sinavlar");

  // Yeni ekranların taban yüzeyi `.tk-scope`: koyu temada doğru zemini ve
  // token'ları verir (Doc 26). Wrapper olmadan sayfa beyaz gövdede kalıyor.
  return (
    <div className="tk-scope bg-surface-alt">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 text-ink">
        <header className="space-y-3">
          <h1 className="font-heading text-2xl font-bold leading-tight text-brand sm:text-[30px]">
            PAEM Çıkmış Sorular
          </h1>
          <p className="max-w-[68ch] text-[15px] leading-relaxed text-ink-soft">
            İlk Derece Amirlik Eğitimi yazılı sınavının yayımlanmış dönemleri, resmî
            cevap anahtarıyla ve her sorunun kanun dayanağıyla birlikte. Yayımlanmayan
            dönemler için adayların derlediği konu dağılımını veriyoruz — ikisini
            birbirine karıştırmıyoruz, hangisine baktığın kartın üstünde yazıyor.
          </p>
        </header>

        <SinavListesi sinavlar={sinavlar} erisilemedi={erisilemedi} />

        <section className="space-y-2 border-t border-line pt-6">
          <h2 className="font-heading text-[17px] font-bold text-ink">
            Çıkmış soru çalışmanın en verimli yolu
          </h2>
          <p className="max-w-[68ch] text-[15px] leading-relaxed text-ink-soft">
            Soruyu okuyup cevabı görmek yetmiyor; sınav aynı maddeyi başka bir yüzle
            tekrar soruyor. Bu yüzden her sorunun altına dayandığı maddeyi ve
            çeldiricinin neden yanlış olduğunu yazdık. Bir dönemi bitirince aynı
            konudan alıştırma yapmak, o maddeyi kalıcı hâle getiriyor.
          </p>
        </section>
      </div>
    </div>
  );
}

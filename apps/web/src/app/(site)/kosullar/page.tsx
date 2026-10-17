import type { Metadata } from "next";
import { PageFrame, PageIntro, Prose } from "@/components/public/page-frame";
import Link from "next/link";
import { CONTACT_HANDLE } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description:
    "Paemisyon kullanım koşulları: hizmetin kapsamı, hesap ve abonelik kuralları, içerik hakları ve sorumluluk esasları.",
  alternates: { canonical: "/kosullar" },
};

export default function KosullarPage() {
  return (
    <PageFrame width="narrow" className="flex flex-col gap-8">
      <PageIntro title="Kullanım Koşulları" meta={<span>Son güncelleme: 21 Temmuz 2026</span>} />

      <Prose>
        <section>
          <h2>
            1. Hizmetin Tanımı
          </h2>
          <p>
            Paemisyon (&quot;Platform&quot;), polis meslek sınavlarına (PAEM, Misyon
            Koruma vb.) hazırlanan adaylar için soru bankası, deneme sınavları,
            kişisel çalışma koçu ve ilerleme takibi sunan bir dijital eğitim
            platformudur. Hizmet, web sitesi (paemisyon.com) ve mobil uygulama
            üzerinden sunulur.
          </p>
        </section>

        <section>
          <h2>
            2. Resmî Kurumlarla İlişki — Önemli Uyarı
          </h2>
          <p>
            Paemisyon; <strong>Emniyet Genel Müdürlüğü, Polis Akademisi, MEB/ÖDSGM
            veya herhangi bir resmî kurumla bağlantılı değildir</strong> ve bu
            kurumlar tarafından onaylanmamıştır. Platformdaki bilgiler yalnızca
            sınava hazırlık amaçlıdır; sınav başvurusu, tarih ve resmî müfredat
            için tek geçerli kaynak ilgili kurumların resmî duyurularıdır.
            Platformdaki hesaplayıcı ve skor tahminleri resmî değerlendirme
            formülü değildir.
          </p>
        </section>

        <section>
          <h2>
            3. Hesap ve Kullanım Kuralları
          </h2>
          <ul>
            <li>Hesap bilgilerinizin gizliliğinden siz sorumlusunuz.</li>
            <li>
              Hesap kişiseldir; paylaşılamaz, devredilemez, ticari amaçla
              kullanılamaz.
            </li>
            <li>
              Platform içeriğinin sistematik olarak kopyalanması, kazınması
              (scraping) veya yeniden yayımlanması yasaktır.
            </li>
            <li>
              Kurallara aykırı kullanımda Platform, hesabı askıya alma veya
              sonlandırma hakkını saklı tutar.
            </li>
          </ul>
        </section>

        <section>
          <h2>
            4. Premium Abonelik
          </h2>
          <ul>
            <li>
              Premium, <strong>3 aylık tek paket</strong> olarak sunulur. Uygulama
              içi satın alma yoktur: talebinizi Telegram veya Instagram hesabımız
              (<strong>{CONTACT_HANDLE}</strong>) üzerinden iletirsiniz, ödeme
              bilgileri size bu kanaldan bildirilir ve ödemeniz teyit edildiğinde
              Premium erişiminiz hesabınıza tanımlanır.
            </li>
            <li>
              Abonelik <strong>otomatik yenilenmez</strong>; sizden yinelenen bir
              tahsilat yapılmaz ve iptal etmeniz gereken bir abonelik oluşmaz. 3
              aylık süre dolduğunda hesabınız ücretsiz katmana döner.
            </li>
            <li>
              Ödemeyi Platform doğrudan tahsil ettiği için{" "}
              <strong>iade talepleri de doğrudan Platform&apos;a</strong> iletilir.
              Talebinizi aynı iletişim kanallarından veya{" "}
              <a href="mailto:destek@paemisyon.com" className="underline">
                destek@paemisyon.com
              </a>{" "}
              adresinden iletebilirsiniz; mevzuattan doğan haklarınız saklıdır.
            </li>
            <li>
              Ücretsiz katmanın kapsamı (günlük soru hakkı vb.) ve Premium
              özellikleri zaman içinde değişebilir; mevcut aboneliklerin dönem
              hakları korunur.
            </li>
          </ul>
        </section>

        <section>
          <h2>
            5. İçerik ve Fikri Haklar
          </h2>
          <p>
            Platformda yer alan geçmiş sınav soruları, ilgili kurumlarca kamuya
            açıklanmış sorulardır ve kaynağı soruların üzerinde belirtilir.
            Soruların derlenmesi, sınıflandırılması, açıklamaları, madde
            eşlemeleri, yazılım ve tasarım dâhil Platform&apos;a ait tüm özgün
            içerik fikri mülkiyet koruması altındadır; izinsiz kullanılamaz.
          </p>
        </section>

        <section>
          <h2>
            6. Sorumluluğun Sınırlandırılması
          </h2>
          <p>
            Platform, içeriğin doğruluğu için azami özeni gösterir; ancak sınav
            sonucu, başarı veya kazanım garantisi vermez. Yapay zekâ destekli
            açıklamalar yardımcı niteliktedir ve hata içerebilir — nihai kaynak
            her zaman ilgili mevzuatın resmî metnidir. Hizmet &quot;olduğu
            gibi&quot; sunulur; kesintisiz veya hatasız çalışacağı taahhüt edilmez.
          </p>
        </section>

        <section>
          <h2>
            7. Değişiklikler ve İletişim
          </h2>
          <p>
            Bu koşullar güncellenebilir; önemli değişiklikler Platform üzerinden
            duyurulur. Kişisel verilerin işlenmesine ilişkin esaslar{" "}
            <Link href="/gizlilik">
              Gizlilik Politikası
            </Link>
            &apos;nda düzenlenmiştir. Sorularınız için:{" "}
            <a href="mailto:destek@paemisyon.com">
              destek@paemisyon.com
            </a>
          </p>
        </section>
      </Prose>
    </PageFrame>
  );
}

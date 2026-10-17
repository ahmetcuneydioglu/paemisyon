import type { Metadata } from "next";
import { PageFrame, PageIntro, Prose } from "@/components/public/page-frame";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hesabımı Sil",
  description:
    "Paemisyon hesabınızı ve verilerinizi nasıl silersiniz: uygulama içinden tek dokunuşla veya e-posta ile talep ederek. Hangi verilerin silindiği, hangilerinin anonimleştirildiği ve süreler.",
  alternates: { canonical: "/hesap-sil" },
};

/**
 * Hesap silme sayfası — Google Play "Veri güvenliği" bölümünün talep ettiği,
 * uygulamayı KURMADAN da erişilebilen silme kanalı (App Store 5.1.1(v)
 * karşılığının web tarafı).
 *
 * İçerik `users.service.ts#deleteAccount` davranışının BİREBİR karşılığıdır:
 * PII anonimleştirilir, Supabase Auth kimliği silinir, satırlar istatistik
 * bütünlüğü için anonim olarak kalır. Silme mantığı değişirse bu sayfa da
 * güncellenmelidir.
 */
export default function HesapSilPage() {
  return (
    <PageFrame width="narrow" className="flex flex-col gap-8">
      <PageIntro title="Hesabımı Sil" meta={<span>Paemisyon · com.paemisyon.paemisyon</span>} />

      <Prose>
        <section>
          <h2>
            1. Uygulama içinden silme (en hızlısı)
          </h2>
          <p>
            Hesabınızı istediğiniz an kendiniz silebilirsiniz; kimseden onay
            beklemenize gerek yoktur:
          </p>
          <ol>
            <li>Paemisyon uygulamasını açın ve giriş yapın.</li>
            <li>
              Alt menüden <strong>Ben</strong> sekmesine, ardından sağ üstteki
              <strong> ayarlar</strong> (dişli) simgesine dokunun.
            </li>
            <li>
              Sayfanın en altındaki{" "}
              <strong>&quot;Hesabımı kalıcı olarak sil&quot;</strong> seçeneğine
              dokunun ve onaylayın.
            </li>
          </ol>
          <p>
            İşlem anında tamamlanır ve geri alınamaz.
          </p>
        </section>

        <section>
          <h2>
            2. Uygulamayı kurmadan silme talebi
          </h2>
          <p>
            Uygulamayı kaldırdıysanız veya giriş yapamıyorsanız, hesabınızın
            kayıtlı olduğu e-posta adresinden{" "}
            <a
              href="mailto:destek@paemisyon.com?subject=Hesap%20silme%20talebi"
             
            >
              destek@paemisyon.com
            </a>{" "}
            adresine <strong>&quot;Hesap silme talebi&quot;</strong> konulu bir
            e-posta gönderin. Kimliğinizi doğruladıktan sonra hesabınızı{" "}
            <strong>en geç 30 gün içinde</strong> sileriz; talebiniz alındığında
            size bilgi verilir.
          </p>
        </section>

        <section>
          <h2>
            3. Hangi veriler silinir?
          </h2>
          <p>
            Silme işleminde aşağıdaki kişisel veriler <strong>kalıcı olarak
            kaldırılır</strong>:
          </p>
          <ul>
            <li>E-posta adresiniz ve görünen adınız</li>
            <li>Profil fotoğrafınız</li>
            <li>
              Kimlik kaydınız (Apple/Google ile giriş bağlantısı dahil) — aynı
              hesapla tekrar giriş yapılamaz
            </li>
            <li>Bildirim (cihaz) kayıtlarınız</li>
            <li>Premium erişiminiz</li>
          </ul>
        </section>

        <section>
          <h2>
            4. Hangi veriler anonim olarak kalır?
          </h2>
          <p>
            Çözülen soru sayısı, doğru/yanlış dağılımı ve deneme sonuçları gibi
            <strong> istatistiksel kayıtlar</strong>, kimliğinizle bağı koparılmış
            (anonimleştirilmiş) biçimde saklanır. Bu kayıtlar artık size ait
            değildir; hiçbir şekilde sizinle ilişkilendirilemez. Amaçları soru
            bankasının zorluk ölçümü ve platform genel istatistikleridir.
          </p>
          <p>
            Ayrıca mevzuatın zorunlu kıldığı hallerde (ör. satın alma ve fatura
            kayıtları) ilgili belgeler yasal saklama süreleri boyunca tutulur.
            Bu süreler dolduğunda kayıtlar silinir.
          </p>
        </section>

        <section>
          <h2>
            5. Aboneliğinizi ayrıca iptal edin
          </h2>
          <p>
            Hesabınızı silmek, mağaza aboneliğinizi otomatik olarak iptal{" "}
            <strong>etmez</strong>. Aktif bir aboneliğiniz varsa iptalini kendi
            mağaza hesabınızdan yapmalısınız:
          </p>
          <ul>
            <li>
              <strong>Android:</strong> Google Play → Profil → Ödemeler ve
              abonelikler → Abonelikler
            </li>
            <li>
              <strong>iPhone:</strong> Ayarlar → Apple Hesabı → Abonelikler
            </li>
          </ul>
        </section>

        <section>
          <h2>
            6. Sorularınız için
          </h2>
          <p>
            Verilerinizle ilgili tüm talepleriniz (erişim, düzeltme, silme) için{" "}
            <a
              href="mailto:destek@paemisyon.com"
             
            >
              destek@paemisyon.com
            </a>
            . Ayrıntılar için{" "}
            <Link
              href="/gizlilik"
             
            >
              Gizlilik Politikası ve KVKK Aydınlatma Metni
            </Link>
            .
          </p>
        </section>
      </Prose>
    </PageFrame>
  );
}

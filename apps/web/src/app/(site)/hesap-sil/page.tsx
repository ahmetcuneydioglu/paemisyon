import type { Metadata } from "next";
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
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-heading mb-2 text-2xl font-bold text-(--color-navy)">
        Hesabımı Sil
      </h1>
      <p className="mb-8 text-sm text-gray-500">
        Paemisyon · com.paemisyon.paemisyon
      </p>

      <div className="space-y-8 text-[15px] leading-relaxed text-gray-700">
        <section>
          <h2 className="font-heading mb-2 text-lg font-bold text-(--color-navy)">
            1. Uygulama içinden silme (en hızlısı)
          </h2>
          <p className="mb-3">
            Hesabınızı istediğiniz an kendiniz silebilirsiniz; kimseden onay
            beklemenize gerek yoktur:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
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
          <p className="mt-3">
            İşlem anında tamamlanır ve geri alınamaz.
          </p>
        </section>

        <section>
          <h2 className="font-heading mb-2 text-lg font-bold text-(--color-navy)">
            2. Uygulamayı kurmadan silme talebi
          </h2>
          <p>
            Uygulamayı kaldırdıysanız veya giriş yapamıyorsanız, hesabınızın
            kayıtlı olduğu e-posta adresinden{" "}
            <a
              href="mailto:destek@paemisyon.com?subject=Hesap%20silme%20talebi"
              className="font-medium text-(--color-navy) underline"
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
          <h2 className="font-heading mb-2 text-lg font-bold text-(--color-navy)">
            3. Hangi veriler silinir?
          </h2>
          <p className="mb-2">
            Silme işleminde aşağıdaki kişisel veriler <strong>kalıcı olarak
            kaldırılır</strong>:
          </p>
          <ul className="list-disc space-y-1 pl-5">
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
          <h2 className="font-heading mb-2 text-lg font-bold text-(--color-navy)">
            4. Hangi veriler anonim olarak kalır?
          </h2>
          <p>
            Çözülen soru sayısı, doğru/yanlış dağılımı ve deneme sonuçları gibi
            <strong> istatistiksel kayıtlar</strong>, kimliğinizle bağı koparılmış
            (anonimleştirilmiş) biçimde saklanır. Bu kayıtlar artık size ait
            değildir; hiçbir şekilde sizinle ilişkilendirilemez. Amaçları soru
            bankasının zorluk ölçümü ve platform genel istatistikleridir.
          </p>
          <p className="mt-3">
            Ayrıca mevzuatın zorunlu kıldığı hallerde (ör. satın alma ve fatura
            kayıtları) ilgili belgeler yasal saklama süreleri boyunca tutulur.
            Bu süreler dolduğunda kayıtlar silinir.
          </p>
        </section>

        <section>
          <h2 className="font-heading mb-2 text-lg font-bold text-(--color-navy)">
            5. Aboneliğinizi ayrıca iptal edin
          </h2>
          <p>
            Hesabınızı silmek, mağaza aboneliğinizi otomatik olarak iptal{" "}
            <strong>etmez</strong>. Aktif bir aboneliğiniz varsa iptalini kendi
            mağaza hesabınızdan yapmalısınız:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
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
          <h2 className="font-heading mb-2 text-lg font-bold text-(--color-navy)">
            6. Sorularınız için
          </h2>
          <p>
            Verilerinizle ilgili tüm talepleriniz (erişim, düzeltme, silme) için{" "}
            <a
              href="mailto:destek@paemisyon.com"
              className="font-medium text-(--color-navy) underline"
            >
              destek@paemisyon.com
            </a>
            . Ayrıntılar için{" "}
            <Link
              href="/gizlilik"
              className="font-medium text-(--color-navy) underline"
            >
              Gizlilik Politikası ve KVKK Aydınlatma Metni
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}

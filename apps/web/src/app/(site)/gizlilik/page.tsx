import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Politikası ve KVKK Aydınlatma Metni",
  description:
    "Paemisyon'un kişisel verileri işleme esasları: hangi veriler, hangi amaçla, hangi hukuki sebeple işlenir; haklarınız ve başvuru yolları.",
  alternates: { canonical: "/gizlilik" },
};

/**
 * KVKK aydınlatma + gizlilik politikası. İçerik GERÇEK veri akışlarına
 * dayalıdır (Supabase/Frankfurt, Railway, Apple IAP, Anthropic) — yeni bir
 * veri akışı eklendiğinde bu sayfa da güncellenmelidir.
 */
export default function GizlilikPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-heading mb-2 text-2xl font-bold text-(--color-navy)">
        Gizlilik Politikası ve KVKK Aydınlatma Metni
      </h1>
      <p className="mb-8 text-sm text-gray-500">Son güncelleme: 21 Temmuz 2026</p>

      <div className="space-y-8 text-[15px] leading-relaxed text-gray-700">
        <section>
          <h2 className="font-heading mb-2 text-lg font-bold text-(--color-navy)">
            1. Veri Sorumlusu
          </h2>
          <p>
            Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu
            (&quot;KVKK&quot;) uyarınca, <strong>Paemisyon</strong> (&quot;Platform&quot;)
            tarafından veri sorumlusu sıfatıyla hazırlanmıştır. Sorularınız için:{" "}
            <a href="mailto:destek@paemisyon.com" className="font-medium text-(--color-navy) underline">
              destek@paemisyon.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="font-heading mb-2 text-lg font-bold text-(--color-navy)">
            2. Hangi Verileri İşliyoruz?
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Kimlik ve iletişim:</strong> ad-soyad / görünen ad, e-posta
              adresi (kayıt sırasında siz verirsiniz).
            </li>
            <li>
              <strong>Kullanım verileri:</strong> çözdüğünüz sorular, cevaplarınız,
              başarı istatistikleriniz, çalışma seriniz, rozet ve rütbe ilerlemeniz,
              hedef sınav ve tarih tercihiniz.
            </li>
            <li>
              <strong>İşlem güvenliği:</strong> IP adresi, oturum kayıtları, cihaz
              ve tarayıcı bilgisi (hata ayıklama ve güvenlik logları).
            </li>
            <li>
              <strong>Ödeme ve iletişim:</strong> Premium talebinizi Telegram veya
              Instagram üzerinden ilettiğinizde, o platformdaki kullanıcı adınız ve
              bize yazdığınız mesaj içeriği (ödemeyi eşleştirmek için ilettiğiniz
              hesap e-postanız ve dekont dahil) tarafımıza ulaşır. Bu veriler yalnızca
              ödemeyi doğrulamak ve Premium erişimini hesabınıza tanımlamak için
              kullanılır. <strong>Kart bilgilerinizi bizimle paylaşmayın</strong>;
              Platform kart verisi talep etmez, işlemez ve saklamaz.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading mb-2 text-lg font-bold text-(--color-navy)">
            3. İşleme Amaçları ve Hukuki Sebepler
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Hesabınızın oluşturulması ve hizmetin sunulması — KVKK m.5/2(c):
              sözleşmenin kurulması ve ifası.
            </li>
            <li>
              Kişisel çalışma koçu önerileri, ilerleme takibi ve istatistikler —
              KVKK m.5/2(c) ve m.5/2(f): meşru menfaat (hizmetin temel işlevi).
            </li>
            <li>
              Güvenlik, hata ayıklama ve kötüye kullanımın önlenmesi — KVKK
              m.5/2(f): meşru menfaat.
            </li>
            <li>
              Yasal yükümlülüklerin yerine getirilmesi — KVKK m.5/2(ç).
            </li>
          </ul>
          <p className="mt-2">
            Verileriniz pazarlama amacıyla üçüncü kişilere <strong>satılmaz</strong>{" "}
            ve reklam ağlarıyla paylaşılmaz.
          </p>
        </section>

        <section>
          <h2 className="font-heading mb-2 text-lg font-bold text-(--color-navy)">
            4. Verilerin Aktarıldığı Taraflar
          </h2>
          <p className="mb-2">
            Hizmetin çalışması için verileriniz, veri işleyen sıfatıyla hizmet
            aldığımız aşağıdaki altyapı sağlayıcılarında barındırılır:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Supabase</strong> (veritabanı ve kimlik doğrulama — sunucular
              AB/Frankfurt bölgesindedir),
            </li>
            <li>
              <strong>Railway</strong> (uygulama sunucusu) ve{" "}
              <strong>Vercel</strong> (web sitesi barındırma),
            </li>
            <li>
              <strong>Telegram</strong> ve <strong>Meta/Instagram</strong> (Premium
              talebi ve ödeme koordinasyonu için bu kanallardan yazdığınızda; yalnız
              sizin başlattığınız yazışma kapsamında),
            </li>
            <li>
              <strong>Anthropic</strong> (yapay zekâ soru açıklamaları — bu hizmete
              yalnızca <em>soru metni ve şıklar</em> iletilir;{" "}
              <strong>kimliğiniz veya kişisel verileriniz iletilmez</strong>).
            </li>
          </ul>
          <p className="mt-2">
            Sunucuların bir kısmı yurt dışında bulunduğundan, kayıt olarak
            hizmeti kullanmanız kapsamında verileriniz KVKK m.9 çerçevesinde yurt
            dışına aktarılmaktadır.
          </p>
        </section>

        <section>
          <h2 className="font-heading mb-2 text-lg font-bold text-(--color-navy)">
            5. Saklama Süresi
          </h2>
          <p>
            Verileriniz, hesabınız aktif olduğu sürece saklanır. Hesabınızı
            sildiğinizde kimlik ve iletişim verileriniz geri döndürülemez şekilde
            anonimleştirilir; yalnızca kişiyle ilişkilendirilemeyen toplu
            istatistikler kalır. Yasal saklama yükümlülüğü bulunan kayıtlar
            (ör. işlem logları) ilgili mevzuattaki süre kadar tutulur.
          </p>
        </section>

        <section>
          <h2 className="font-heading mb-2 text-lg font-bold text-(--color-navy)">
            6. Çerezler
          </h2>
          <p>
            Web sitemiz yalnızca oturumunuzu ayakta tutan{" "}
            <strong>zorunlu çerezleri</strong> kullanır. Reklam veya üçüncü taraf
            takip çerezi kullanılmaz.
          </p>
        </section>

        <section>
          <h2 className="font-heading mb-2 text-lg font-bold text-(--color-navy)">
            7. KVKK m.11 Kapsamındaki Haklarınız
          </h2>
          <p className="mb-2">
            Kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi
            talep etme, düzeltilmesini veya silinmesini isteme, aktarıldığı
            üçüncü kişileri bilme ve zarara uğramanız hâlinde giderilmesini talep
            etme haklarına sahipsiniz.
          </p>
          <p>
            Başvurularınızı{" "}
            <a href="mailto:destek@paemisyon.com" className="font-medium text-(--color-navy) underline">
              destek@paemisyon.com
            </a>{" "}
            adresine iletebilirsiniz. Hesap silme işlemini ayrıca uygulama içinden
            (Profil → Hesabı Sil) anında yapabilirsiniz.
          </p>
        </section>
      </div>
    </div>
  );
}

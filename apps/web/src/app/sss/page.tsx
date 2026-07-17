import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sık Sorulan Sorular",
  description:
    "Paemisyon hakkında merak edilenler: sorular gerçek mi, Premium ne sunar, seri ve sigorta nasıl çalışır, hesap nasıl silinir?",
  alternates: { canonical: "/sss" },
};

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Sorular gerçekten çıkmış sorular mı?",
    a: "Evet — bankamızın varlık nedeni bu. Sorular resmî kurumlarca kamuya açıklanmış geçmiş sınav kitapçıklarından derlenir ve her sorunun üzerinde kaynağı (hangi yıl, hangi sınav) yazar. Yapay zekâya soru ÜRETTİRMEYİZ; yapay zekâ yalnızca mevcut soruların açıklamasında yardımcı olur.",
  },
  {
    q: "Ücretsiz hesapla neler yapabilirim?",
    a: "Günde 15 soru çözebilir, canlı denemelere katılabilir, kişisel koçunu ve ilerleme haritanı kullanabilirsin. Ücretsiz katman gerçek bir antrenman verir — tavsiye edilebilir kalması bizim ilkemiz.",
  },
  {
    q: "Premium ne sunar?",
    a: "Sınırsız soru, süresiz akıllı tekrar hafızası, sınırsız yapay zekâ açıklaması ('Koça sor: neden yanlış?'), haftada 3 seri sigortası ve tüm premium konular. Kısacası: koçunun tam beyni.",
  },
  {
    q: "Seri (streak) ve sigorta nasıl çalışır?",
    a: "Her aktif gün serini büyütür. Bir günü kaçırırsan seri sigortan devreye girer: haftada 1 (Premium'da 3) kaçırılan TEK gün affedilir — bir gece nöbeti emeğini yakmasın diye. İki gün üst üste boşluk seriyi sıfırlar.",
  },
  {
    q: "Sınav tarihimi girersem ne değişir?",
    a: "Koç, sınava 30 gün kala seni otomatik sınav moduna alır (yeni konu durur, deneme ve yanlış tekrarı ağırlık kazanır); son 3 günde yoğunluğu bilinçli düşürür. Tarihi Profil'den her zaman değiştirebilirsin.",
  },
  {
    q: "Madde Atlası nedir?",
    a: "Kanun konularında soruların hangi maddeden çıktığını gösteren haritamız: en çok soru çıkan maddeleri görür, maddeye dokunup o maddenin sorularını çözer, kanunu madde madde 'fethedersin'.",
  },
  {
    q: "Aboneliğimi nasıl iptal ederim?",
    a: "Abonelikler Apple App Store üzerinden yönetilir: iPhone'da Ayarlar → Ad Soyad → Abonelikler → Paemisyon → İptal. Dönem sonuna kadar Premium hakların devam eder.",
  },
  {
    q: "Hesabımı ve verilerimi nasıl silerim?",
    a: "Uygulamada Profil → Hesabı Sil ile anında ve geri döndürülemez şekilde silebilirsin; kişisel verilerin anonimleştirilir. Ayrıntılar Gizlilik Politikası'nda.",
  },
  {
    q: "Paemisyon resmî bir kurum mu?",
    a: "Hayır. Paemisyon bağımsız bir hazırlık platformudur; EGM, Polis Akademisi veya MEB ile bağlantısı yoktur. Sınav başvurusu ve resmî duyurular için tek kaynak ilgili kurumlardır.",
  },
];

export default function SssPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: typeof f.a === "string" ? f.a : f.q },
    })),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="font-heading mb-6 text-2xl font-bold text-(--color-navy)">
        Sık Sorulan Sorular
      </h1>

      <div className="space-y-3">
        {FAQS.map((f) => (
          <details
            key={f.q}
            className="rounded-xl border border-gray-200 bg-white p-5"
          >
            <summary className="cursor-pointer font-medium text-(--color-navy)">
              {f.q}
            </summary>
            <p className="mt-3 text-[15px] leading-relaxed text-gray-700">{f.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-(--color-grey-bg) p-5 text-sm text-gray-600">
        Cevabını bulamadın mı? Bize yaz:{" "}
        <a href="mailto:destek@paemisyon.com" className="font-medium text-(--color-navy) underline">
          destek@paemisyon.com
        </a>{" "}
        · Ayrıca bkz.{" "}
        <Link href="/gizlilik" className="underline">Gizlilik Politikası</Link> ·{" "}
        <Link href="/kosullar" className="underline">Kullanım Koşulları</Link>
      </div>
    </div>
  );
}

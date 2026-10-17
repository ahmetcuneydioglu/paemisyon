import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT } from "@/lib/contact";
import {
  formatPrice,
  getPricing,
  periodLabel,
  primaryPlan,
} from "@/lib/pricing";
import { PageFrame, PageIntro } from "@/components/public/page-frame";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sık Sorulan Sorular",
  description:
    "Paemisyon hakkında merak edilenler: sorular gerçek mi, Premium ne sunar ve nasıl alınır, seri ve sigorta nasıl çalışır, hesap nasıl silinir?",
  alternates: { canonical: "/sss" },
};

/** Fiyat ve günlük limit sunucudan gelir — metne gömülmez (Doc 27). */
function buildFaqs(
  freeLimit: number,
  priceText: string | null,
): { q: string; a: React.ReactNode }[] {
  return [
    {
      q: "Sorular gerçekten çıkmış sorular mı?",
      a: "Evet — bankamızın varlık nedeni bu. Sorular resmî kurumlarca kamuya açıklanmış geçmiş sınav kitapçıklarından derlenir ve her sorunun kaynağı (hangi yıl, hangi sınav) bankada kayıtlıdır. Yapay zekâya soru ÜRETTİRMEYİZ; yapay zekâ yalnızca mevcut soruların açıklamasında yardımcı olur.",
    },
    {
      q: "Ücretsiz hesapla neler yapabilirim?",
      a: `Günde ${freeLimit} soru çözebilir, canlı denemelere katılabilir, kişisel koçunu ve ilerleme haritanı kullanabilirsin. Ücretsiz katman gerçek bir antrenman verir — tavsiye edilebilir kalması bizim ilkemiz.`,
    },
    {
      q: "Premium ne sunar?",
      a: "Sınırsız soru, süresiz akıllı tekrar hafızası, sınırsız yapay zekâ açıklaması ('Koça sor: neden yanlış?'), haftada 3 seri sigortası ve tüm premium konular. Kısacası: koçunun tam beyni.",
    },
    {
      q: "Premium'a nasıl geçerim?",
      a:
        `Premium ${priceText ? `${priceText} olarak sunulur` : "tek paket olarak sunulur"} ve uygulama içi satın alma ile değil, doğrudan bizimle yapılır: ` +
        `Telegram (${CONTACT.telegram.handle}) veya Instagram (${CONTACT.instagram.handle}) üzerinden bize yazarsın, ödeme bilgilerini paylaşırız, ` +
        "ödemen ulaştığında hesabını elimizle premium yaparız. Aynı hesapla giriş yaptığın her yerde geçerli olur.",
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
      q: "Premium süresi bitince ne olur?",
      a: "Otomatik yenileme yoktur — kartından tekrar çekim yapılmaz, iptal etmen gereken bir abonelik de yoktur. Süre dolduğunda hesabın ücretsiz katmana döner; çözdüğün sorular, serin, istatistiklerin ve rozetlerin durur. Devam etmek istersen bize tekrar yazman yeterli.",
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
}

export default async function SssPage() {
  const pricing = await getPricing();
  const plan = primaryPlan(pricing);
  // Düz metin cümlede (ve FAQPage JSON-LD'sinde) okunacağı için "/" gösterimi
  // yerine tam Türkçe kuruluş: "3 ay için 499,99 TL".
  const FAQS = buildFaqs(
    pricing.freeDailyLimit,
    plan
      ? `${periodLabel(plan.period)} için ${formatPrice(plan.price, plan.currency)}`
      : null,
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: typeof f.a === "string" ? f.a : f.q,
      },
    })),
  };

  const linkClass =
    "font-semibold text-accent-ink underline underline-offset-2 hover:text-ink";

  return (
    <PageFrame width="narrow" className="flex flex-col gap-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageIntro eyebrow="Yardım" title="Sık Sorulan Sorular" />

      <div className="flex flex-col gap-2">
        {FAQS.map((f) => (
          <details
            key={f.q}
            className="rounded-card border border-line bg-surface p-4"
          >
            <summary className="type-subhead cursor-pointer text-ink">
              {f.q}
            </summary>
            <p className="type-body mt-3 text-ink-soft">{f.a}</p>
          </details>
        ))}
      </div>

      <Card tone="alt" className="type-body-sm text-ink-soft">
        Cevabını bulamadın mı? Bize yaz:{" "}
        <a
          href={CONTACT.telegram.href}
          target="_blank"
          rel="noreferrer"
          className={linkClass}
        >
          Telegram {CONTACT.telegram.handle}
        </a>{" "}
        ·{" "}
        <a
          href={CONTACT.instagram.href}
          target="_blank"
          rel="noreferrer"
          className={linkClass}
        >
          Instagram {CONTACT.instagram.handle}
        </a>{" "}
        ·{" "}
        <a href="mailto:destek@paemisyon.com" className={linkClass}>
          destek@paemisyon.com
        </a>{" "}
        · Ayrıca bkz.{" "}
        <Link href="/gizlilik" className={linkClass}>
          Gizlilik Politikası
        </Link>{" "}
        ·{" "}
        <Link href="/kosullar" className={linkClass}>
          Kullanım Koşulları
        </Link>
      </Card>
    </PageFrame>
  );
}

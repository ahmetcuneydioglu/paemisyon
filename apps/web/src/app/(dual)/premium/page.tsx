import type { Metadata } from "next";
import { api } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPricing, formatPrice, monthlyEquivalent, periodLabel, primaryPlan } from "@/lib/pricing";
import type { MeProfile } from "@/lib/public-api";
import { CONTACT } from "@/lib/contact";
import { Card, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { PlanCard } from "@/components/ui/plan-card";
import { ContactChannels } from "@/components/contact-channels";

export const metadata: Metadata = {
  title: "Premium — Koçun Tam Beyni",
  description:
    "Paemisyon Premium: sınırsız soru, süresiz tekrar hafızası, sınırsız AI açıklaması ve haftada 3 seri sigortası. 3 aylık tek paket; Telegram veya Instagram'dan yazarak edinilir.",
  alternates: { canonical: "/premium" },
};

export const dynamic = "force-dynamic";

/** Doc 24 §11 tablosu — dürüst karşılaştırma, karanlık desen yok. */
function rows(freeDailyLimit: number): { feature: string; free: string; premium: string }[] {
  return [
    { feature: "Günlük soru", free: `${freeDailyLimit} soru`, premium: "Sınırsız" },
    { feature: "Koç", free: "Temel kartlar (seri, hedef, deneme)", premium: "Tam koç: zayıf konu planı, madde bazlı tekrar" },
    { feature: "Yanlış tekrarı", free: "Son 7 günün yanlışları", premium: "Süresiz tekrar hafızası (spaced repetition)" },
    { feature: "AI açıklaması", free: "Günde 3", premium: "Sınırsız + madde sadeleştirme" },
    { feature: "Haftalık rapor", free: "Özet kart", premium: "Doğal dilli koç raporu + gelişim arşivi" },
    { feature: "Deneme", free: "Canlı denemelere katılım", premium: "+ Geçmiş arşivi ve sınırsız prova" },
    { feature: "Seri sigortası", free: "Haftada 1", premium: "Haftada 3 (vardiya dostu)" },
    { feature: "Rütbe ve rozetler", free: "✓ herkese", premium: "✓ herkese — satılmaz" },
  ];
}

const PREMIUM_FEATURES = [
  "Sınırsız soru — günlük hak yok",
  "Süresiz tekrar hafızası: yanlışın unutulmadan önce geri gelir",
  "Sınırsız AI açıklaması ve madde sadeleştirme",
  "Zayıf konu planı ve madde bazlı koç raporu",
  "Haftada 3 seri sigortası — nöbet serini yakmasın",
  "Deneme arşivi ve sınırsız prova",
];

/** Satın alma adımları — ödeme mağazadan değil, manuel yürür (Telegram/Instagram). */
const STEPS = [
  {
    title: "Bize yaz",
    body: `Telegram (${CONTACT.telegram.handle}) veya Instagram (${CONTACT.instagram.handle}) üzerinden mesaj at, "3 aylık premium" de.`,
  },
  {
    title: "Ödemeyi yap",
    body: "Ödeme bilgilerini mesajda paylaşıyoruz. Ödemeni yapıp dekontu gönderiyorsun.",
  },
  {
    title: "Hesabın açılır",
    body: "Hesabını elimizle premium yapıyoruz. Aynı hesapla giriş yaptığın her yerde 3 ay boyunca geçerli.",
  },
];

export default async function PremiumPage() {
  const userId = await getCurrentUser();
  const [pricing, me] = await Promise.all([
    getPricing(),
    userId ? api<MeProfile>("/me").catch(() => null) : Promise.resolve(null),
  ]);

  const plan = primaryPlan(pricing);
  const alreadyPremium = me?.isPremium === true;

  return (
    <div className={userId ? "" : "tk-scope font-body"}>
      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* ── Başlık ── */}
        <header className="text-center">
          <span className="tk-caption text-brand">Premium</span>
          <h1 className="mt-1 font-heading text-2xl font-bold text-ink">
            Koçun tam beynini aç
          </h1>
          <p className="mx-auto mt-2 max-w-[52ch] text-[15px] leading-relaxed text-ink-soft">
            Ücretsiz katman gerçek antrenman verir — Premium, seni tanıyan koçun tamamını:
            plan, süresiz tekrar hafızası, sınırsız açıklama. Bir dershanenin günlük çayı
            parasına, seni tanıyan antrenör.
          </p>
        </header>

        {/* ── Zaten premium: dürüst durum kartı, satış baskısı yok ── */}
        {alreadyPremium ? (
          <Card className="mt-8 text-center">
            <p className="text-3xl" aria-hidden>
              ⭐
            </p>
            {/* h2: sayfada h1'den sonra gelen ilk başlık — CardTitle (h3) kullanılsaydı
                başlık sırası h1 → h3 → h2 diye atlardı. */}
            <h2 className="mt-2 font-heading text-[15px] font-bold text-ink">
              Premium hesabın aktif
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
              {me?.validUntil
                ? `Erişimin ${new Date(me.validUntil).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })} tarihine kadar geçerli. Süre bitmeden yenilemek için bize yazman yeterli.`
                : "Erişimin süresiz. Koçun tam beyni açık."}
            </p>
            <div className="mt-5">
              <ButtonLink href="/bugun" size="lg">
                Bugün&apos;e dön
              </ButtonLink>
            </div>
          </Card>
        ) : (
          plan && (
            <div className="mt-8">
              <PlanCard
                name={plan.name}
                price={formatPrice(plan.price, plan.currency)}
                periodLabel={periodLabel(plan.period)}
                note={
                  monthlyEquivalent(plan)
                    ? `Ayda ${monthlyEquivalent(plan)} — tek seferlik ödeme, otomatik yenileme yok`
                    : "Tek seferlik ödeme, otomatik yenileme yok"
                }
                badge="Tek paket"
                features={PREMIUM_FEATURES}
                highlight
              >
                {userId ? (
                  <ContactChannels />
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <ButtonLink href="/kayit" size="lg" className="w-full sm:w-auto">
                      Önce ücretsiz kaydol
                    </ButtonLink>
                    <p className="text-[13px] text-ink-soft">
                      Premium bir hesaba tanımlanır — önce hesabını aç, sonra bize yaz.
                    </p>
                  </div>
                )}
              </PlanCard>
            </div>
          )
        )}

        {/* ── Nasıl alınır (manuel akış) ── */}
        {!alreadyPremium && (
          <section className="mt-10" aria-labelledby="nasil-alinir">
            <h2 id="nasil-alinir" className="text-center font-heading text-lg font-bold text-ink">
              Nasıl premium olurum?
            </h2>
            <p className="mx-auto mt-2 max-w-[52ch] text-center text-[14px] leading-relaxed text-ink-soft">
              Uygulama içi satın alma yok. Ödemeyi doğrudan bizimle yapıyorsun, hesabını
              elimizle açıyoruz — arada mağaza komisyonu yok.
            </p>

            <ol className="mt-6 grid gap-3 sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title}>
                  <Card className="h-full">
                    <p className="tk-caption text-brand">{i + 1}. adım</p>
                    <CardTitle className="mt-1">{s.title}</CardTitle>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{s.body}</p>
                  </Card>
                </li>
              ))}
            </ol>

            <div className="mt-6">
              <ContactChannels />
            </div>

            {/* Manuel akışta eşleştirme hesap e-postası üzerinden yapılır: girişli
                kullanıcı kendi adresini görür, girişsiz ziyaretçi önce kaydolmalı. */}
            <p className="mt-4 text-center text-[13px] leading-relaxed text-ink-soft">
              {me?.email ? (
                <>
                  Yazarken hesap e-postanı da ilet:{" "}
                  <strong className="font-semibold text-ink">{me.email}</strong> — premiumu bu
                  hesaba tanımlıyoruz.
                </>
              ) : (
                <>
                  Premium bir hesaba tanımlandığı için önce{" "}
                  <strong className="font-semibold text-ink">ücretsiz kaydol</strong>, sonra bize
                  yazarken hesap e-postanı ilet.
                </>
              )}
            </p>
          </section>
        )}

        {/* ── Dürüst karşılaştırma ── */}
        <section className="mt-10" aria-labelledby="karsilastirma">
          <h2 id="karsilastirma" className="mb-3 text-center font-heading text-lg font-bold text-ink">
            Ücretsiz ve Premium
          </h2>
          {/* Mobilde satırlar bloklara açılır (yan kaydırma yok); sm+ gerçek tablo.
              Tek DOM + tek semantik yapı: başlık satırı mobilde gizlenir, değerler
              data-label ile etiketlenir.

              AÇIK ROLLER ŞART: tr/th/td'ye `block` verilince tarayıcılar tablo
              semantiğini erişilebilirlik ağacından düşürür (CSS display → ARIA
              eşlemesi), yani scope="row" ve <caption> mobilde etkisiz kalırdı.
              role="table/rowgroup/row/rowheader/cell" bunu geri getirir. */}
          <Card className="p-0 sm:overflow-x-auto">
            <table role="table" className="w-full text-[14px] sm:min-w-[520px]">
              <caption className="sr-only">
                Ücretsiz ve Premium katmanların özellik karşılaştırması
              </caption>
              <thead role="rowgroup" className="hidden sm:table-header-group">
                <tr role="row" className="tk-caption border-b border-line text-left">
                  <th role="columnheader" scope="col" className="px-4 py-3 font-semibold">
                    Özellik
                  </th>
                  <th role="columnheader" scope="col" className="px-4 py-3 font-semibold">
                    Ücretsiz
                  </th>
                  <th role="columnheader" scope="col" className="px-4 py-3 font-semibold text-brand">
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {rows(pricing.freeDailyLimit).map((r) => (
                  <tr
                    key={r.feature}
                    role="row"
                    className="block border-b border-line last:border-0 sm:table-row"
                  >
                    <th
                      role="rowheader"
                      scope="row"
                      className="block px-4 pt-3 text-left font-semibold text-ink sm:table-cell sm:py-3 sm:font-medium"
                    >
                      {r.feature}
                    </th>
                    <td
                      role="cell"
                      data-label="Ücretsiz:"
                      className="block px-4 pt-1.5 text-ink-soft before:mr-1.5 before:font-semibold before:content-[attr(data-label)] sm:table-cell sm:py-3 sm:before:content-none"
                    >
                      {r.free}
                    </td>
                    <td
                      role="cell"
                      data-label="Premium:"
                      className="block px-4 pt-1.5 pb-3 font-medium text-ink before:mr-1.5 before:font-semibold before:text-brand before:content-[attr(data-label)] sm:table-cell sm:py-3 sm:before:content-none"
                    >
                      {r.premium}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <p className="mt-3 text-center text-[13px] leading-relaxed text-ink-soft">
            Ücretsiz katman vitrin değil: günde {pricing.freeDailyLimit} soru, günün quizi ve
            canlı denemeler herkese açık.
          </p>
        </section>

        {!userId && (
          <div className="mt-8 text-center">
            <ButtonLink href="/kayit" size="lg">
              Ücretsiz kayıt ol
            </ButtonLink>
          </div>
        )}
      </div>
    </div>
  );
}

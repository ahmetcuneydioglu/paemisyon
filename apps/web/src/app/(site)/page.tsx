import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import type { ExamListItem } from "@/lib/types";
import { publicApi, type DailyQuiz, type LawSummary } from "@/lib/public-api";
import {
  getPricing,
  formatPrice,
  periodLabel,
  primaryPlan,
} from "@/lib/pricing";
import { StoreBadges } from "@/components/store-badges";
import { Countdown } from "@/components/countdown";
import { DailyQuizCard } from "@/components/daily-quiz";
import { formatDate, formatTime } from "@/lib/format";
import { config } from "@/lib/config";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";

export const metadata: Metadata = {
  title: {
    absolute: "Paemisyon — Polis Sınavlarına Hazırlığın Merkezi | PAEM, Misyon",
  },
  description:
    "PAEM ve Misyon Koruma sınavlarına kaynaklı çıkmış sorular, canlı denemeler, kanun kanun konu çalışması ve kişisel koçla hazırlan. Günün 10 soruluk quizini şimdi çöz.",
  alternates: { canonical: "/" },
};

/** Tıklanabilir kart: tüm yüzey bağlantı, hover'da çizgi koyulaşır. */
function LinkCard({
  href,
  title,
  body,
  className,
}: {
  href: string;
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={[
        "tk-interactive flex h-full flex-col gap-1 rounded-card border border-line bg-surface p-5 hover:border-ink-soft",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="type-subhead text-ink">{title}</span>
      <span className="type-body-sm text-ink-soft">{body}</span>
    </Link>
  );
}

/**
 * Landing (Doc 27 §3.1, wireframe 01): tek hedef — 60 saniyede değer.
 * Hero pazarlama sloganı değil, ÇÖZÜLEBİLİR gerçek çıkmış sorudur; kanıt
 * blokları sıfat değil rakam konuşur; her bölüm bir iç bağlantı kapısıdır.
 *
 * STATİK/ISR: bu sayfa istek durumunu (cookie/header) OKUMAZ, böylece edge
 * cache'inden servis edilir. Girişli kullanıcıyı /bugun'e yönlendirme işi
 * middleware'e taşındı — fetch'lerin per-request revalidate'i CDN cache'ini sürer.
 */
export default async function HomePage() {
  const [exams, dailyQuiz, laws, pricing] = await Promise.all([
    api<ExamListItem[]>("/exams", {
      auth: false,
      next: { revalidate: 30 },
    }).catch(() => [] as ExamListItem[]),
    publicApi<DailyQuiz>("/public/daily-quiz", 600).catch(() => null),
    publicApi<LawSummary[]>("/public/laws", 3600).catch(
      () => [] as LawSummary[],
    ),
    getPricing(),
  ]);
  const freeLimit = pricing.freeDailyLimit;
  const premiumPlan = primaryPlan(pricing);

  const next = [...exams]
    .filter((e) => e.state === "upcoming")
    .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))[0];
  const active = exams.find((e) => e.state === "active");
  const topLaws = [...laws]
    .sort((a, b) => b.questionCount - a.questionCount)
    .slice(0, 8);
  const totalLawQuestions = laws.reduce((s, l) => s + l.questionCount, 0);

  // Quiz şeması (Doc 23 SEO omurgası) — cevap anahtarı SIZMAZ (yalnız sorular).
  const jsonLd = dailyQuiz
    ? {
        "@context": "https://schema.org",
        "@type": "Quiz",
        name: "Günün Quizi — 10 polis sınavı çıkmış soru",
        url: config.siteUrl,
        hasPart: dailyQuiz.questions.map((q) => ({
          "@type": "Question",
          name: q.stem,
        })),
      }
    : null;

  const proofs = [
    {
      title: "Kaynaklı çıkmış sorular",
      body: "AI üretimi soru yok — her sorunun hangi sınavdan geldiği bankada kayıtlı.",
      href: "/kanunlar",
    },
    {
      title: "Madde Isı Haritası",
      body: "Hangi kanunun hangi maddesinden kaç soru çıktı — Türkiye'de başka yerde yok.",
      href: "/kanunlar",
    },
    {
      title: "Canlı deneme + Türkiye sıralaması",
      body: "Herkesle aynı anda yarış; netini ve sıralamanı anında gör.",
      href: "/denemeler",
    },
  ];

  return (
    <div>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {/* ── Hero: çözülebilir günün sorusu ── */}
      <section className="border-b border-line bg-surface-alt px-4 pb-12 pt-10 sm:pb-14 sm:pt-14">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <span className="type-label text-accent-ink">PAEM · Misyon</span>
            <h1 className="type-display text-balance text-ink">
              Polis sınavlarına hazırlığın merkezi
            </h1>
            <p className="type-body max-w-[52ch] text-pretty text-ink-soft">
              Bugünün 10 soruluk quizini şimdi çöz, sonra koçunla devam et.
            </p>
          </div>
          {dailyQuiz && dailyQuiz.count > 0 ? (
            <div className="w-full">
              <DailyQuizCard
                quiz={dailyQuiz}
                loggedIn={false}
                freeDailyLimit={freeLimit}
              />
            </div>
          ) : (
            <ButtonLink href="/denemeler" size="lg">
              Denemelere göz at
            </ButtonLink>
          )}
        </div>
      </section>

      {/* ── Mobil uygulama şeridi: web'den gelen ziyaretçiyi cihaza taşır ── */}
      <section className="border-b border-line px-4 py-5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-6 sm:text-left">
          <div>
            <p className="type-subhead text-ink">
              Koçun cebinde: iOS ve Android uygulaması yayında
            </p>
            <p className="type-body-sm text-ink-soft">
              Çevrimdışı çalış, mevzuatı ara, tekrar zamanı gelince haberin
              olsun.
            </p>
          </div>
          <StoreBadges className="shrink-0" width={138} wrap />
        </div>
      </section>

      {/* ── Kanıt blokları: rakam konuşur ── */}
      <section className="mx-auto grid max-w-6xl gap-3 px-4 py-8 md:grid-cols-3">
        {proofs.map((p) => (
          <LinkCard key={p.title} {...p} />
        ))}
      </section>

      {/* ── Canlı deneme + hesaplayıcı ── */}
      <section className="mx-auto grid max-w-6xl gap-3 px-4 pb-8 md:grid-cols-2">
        <Card
          className="flex flex-col gap-3 p-6"
          tone={active ? "accent" : "surface"}
        >
          <h2 className="type-heading text-ink">
            {active
              ? "Canlı deneme şu an devam ediyor"
              : "Canlı deneme sınavları"}
          </h2>
          {active ? (
            <>
              <p className="type-body text-ink-soft">
                <b className="font-semibold text-ink">{active.title}</b> —{" "}
                {active.participantCount} katılımcı.
              </p>
              <div>
                <ButtonLink href="/denemeler">Hemen katıl</ButtonLink>
              </div>
            </>
          ) : next ? (
            <>
              <p className="type-body text-ink-soft">
                Sıradaki: <b className="font-semibold text-ink">{next.title}</b>{" "}
                — {formatDate(next.startAt)} {formatTime(next.startAt)}
              </p>
              <Countdown target={next.startAt} />
              <p className="type-body-sm text-ink-soft">
                Türkiye genelinde aynı anda yarış, sıralamanı gör.
              </p>
            </>
          ) : (
            <p className="type-body text-ink-soft">
              Yeni deneme takvimi hazırlanıyor — açıklandığında burada ve
              uygulamada duyurulur.
            </p>
          )}
        </Card>
        <Card className="flex flex-col gap-3 p-6">
          <h2 className="type-heading text-ink">Net &amp; skor hesaplayıcı</h2>
          <p className="type-body text-ink-soft">
            Doğru–yanlış sayını gir; netini ve bölüm ağırlıklarına göre skorunu
            anında gör.
          </p>
          <div className="mt-auto">
            <ButtonLink href="/hesaplayici/paem-puan" variant="secondary">
              Hesapla
            </ButtonLink>
          </div>
        </Card>
      </section>

      {/* ── Kanun kütüphanesi (SEO iç bağlantı kapısı) ── */}
      <section className="border-y border-line bg-surface-alt px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <SectionHeader
            title="Kanun kütüphanesi"
            action={{ label: `${laws.length} kanunun tümü`, href: "/kanunlar" }}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {topLaws.map((l) => (
              <LinkCard
                key={l.slug}
                href={`/kanun/${l.slug}`}
                title={l.name}
                body={`${l.questionCount > 0 ? `${l.questionCount} çıkmış soru · ` : ""}${
                  l.exams.map((e) => e.examName).join(" + ") || "müfredat"
                }`}
                className="p-4"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Sınav rehberleri ── */}
      <section className="mx-auto grid max-w-6xl gap-3 px-4 py-8 md:grid-cols-2">
        <LinkCard
          href="/paem"
          title="PAEM Rehberi"
          body="Komiser yardımcılığı yolu: sınav formatı, ders ağırlıkları, konu listesi."
          className="p-6"
        />
        <LinkCard
          href="/misyon"
          title="Misyon Rehberi"
          body="Misyon koruma sınavı: format, ağırlıklar, protokol ve silah bilgisi konuları."
          className="p-6"
        />
      </section>

      {/* ── SSS'den üç soru (wireframe 01 kapanışı) ── */}
      <section className="border-t border-line bg-surface-alt px-4 py-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <SectionHeader
            title="Merak edilenler"
            action={{ label: "Tüm SSS", href: "/sss" }}
          />
          <div className="flex flex-col gap-2">
            {[
              {
                q: "Sorular gerçekten çıkmış sorular mı?",
                a: "Evet — bankamızın varlık nedeni bu. Sorular resmî geçmiş sınav kitapçıklarından derlenir ve her sorunun kaynağı bankada kayıtlıdır. Yapay zekâya soru ürettirmeyiz; AI yalnızca açıklamada yardımcı olur.",
              },
              {
                q: "Ücretsiz hesapla neler yapabilirim?",
                a: `Günde ${freeLimit} soru, günün quizi, canlı denemelere katılım, seri ve rozetler — ücretsiz katman gerçek antrenman verir, vitrin değildir.`,
              },
              {
                q: "Premium ne sunar?",
                a: "Koçun tam beynini: sınırsız soru, süresiz tekrar hafızası, sınırsız AI açıklaması ve haftada 3 seri sigortası.",
              },
            ].map((f) => (
              <details
                key={f.q}
                className="group rounded-card border border-line bg-surface p-4"
              >
                <summary className="type-subhead cursor-pointer list-none text-ink marker:content-none">
                  {f.q}
                </summary>
                <p className="type-body-sm mt-2 text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fiyat özeti (wireframe 01 not 6): ücretsiz katmanın değeri önde ── */}
      <section className="border-t border-line px-4 py-10">
        <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
          <Card className="flex flex-col gap-2 p-5">
            <span className="type-label text-ink-soft">Ücretsiz</span>
            <p className="type-heading text-ink">Sonsuza dek 0 ₺</p>
            <ul className="type-body-sm flex flex-col gap-1 text-ink-soft">
              <li>Günde {freeLimit} soru + günün quizi</li>
              <li>Canlı denemeler ve sıralama</li>
              <li>Seri, rozetler, temel koç</li>
            </ul>
          </Card>
          <Card tone="accent" className="flex flex-col gap-2 p-5">
            <span className="type-label text-accent-ink">Premium</span>
            <p className="type-heading text-ink">
              {premiumPlan
                ? `${formatPrice(premiumPlan.price, premiumPlan.currency)} / ${periodLabel(premiumPlan.period)}`
                : "Koçun tam beyni"}
            </p>
            <ul className="type-body-sm flex flex-col gap-1 text-ink-soft">
              <li>Sınırsız soru + süresiz tekrar hafızası</li>
              <li>Sınırsız AI açıklaması</li>
              <li>Haftada 3 seri sigortası</li>
            </ul>
            <Link
              href="/premium"
              className="type-subhead mt-1 inline-flex items-center gap-1 text-accent-ink hover:underline"
            >
              Premium&apos;u incele <ArrowRight size={16} aria-hidden />
            </Link>
          </Card>
        </div>
      </section>

      {/* ── Kapanış: güven + kayıt ── */}
      <section className="border-t border-line px-4 py-10 text-center">
        <p className="type-body text-ink-soft">
          <b className="font-semibold text-ink">
            {totalLawQuestions > 0
              ? `${totalLawQuestions}+ kanun sorusu`
              : "Büyüyen soru bankası"}
          </b>{" "}
          · kaynaklı çıkmış sorular · mükerrersiz banka · canlı denemeler · her
          cihazdan erişim
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="/kayit" size="lg">
            Ücretsiz başla — günde {freeLimit} soru
          </ButtonLink>
          <ButtonLink href="/premium" variant="ghost" size="lg">
            Premium&apos;u incele
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}

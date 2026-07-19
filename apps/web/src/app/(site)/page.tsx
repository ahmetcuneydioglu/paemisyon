import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import type { ExamListItem } from "@/lib/types";
import { publicApi, type DailyQuiz, type LawSummary } from "@/lib/public-api";
import { Countdown } from "@/components/countdown";
import { DailyQuizCard } from "@/components/daily-quiz";
import { formatDate, formatTime } from "@/lib/format";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: { absolute: "Paemisyon — Polis Sınavlarına Hazırlığın Merkezi | PAEM, Misyon" },
  description:
    "PAEM ve Misyon Koruma sınavlarına kaynaklı çıkmış sorular, canlı denemeler, kanun kanun konu çalışması ve kişisel koçla hazırlan. Günün 10 soruluk quizini şimdi çöz.",
  alternates: { canonical: "/" },
};

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
  const [exams, dailyQuiz, laws] = await Promise.all([
    api<ExamListItem[]>("/exams", { auth: false, next: { revalidate: 30 } }).catch(
      () => [] as ExamListItem[],
    ),
    publicApi<DailyQuiz>("/public/daily-quiz", 600).catch(() => null),
    publicApi<LawSummary[]>("/public/laws", 3600).catch(() => [] as LawSummary[]),
  ]);

  const next = [...exams]
    .filter((e) => e.state === "upcoming")
    .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))[0];
  const active = exams.find((e) => e.state === "active");
  const topLaws = [...laws].sort((a, b) => b.questionCount - a.questionCount).slice(0, 8);
  const totalLawQuestions = laws.reduce((s, l) => s + l.questionCount, 0);

  // Quiz şeması (Doc 23 SEO omurgası) — cevap anahtarı SIZMAZ (yalnız sorular).
  const jsonLd = dailyQuiz
    ? {
        "@context": "https://schema.org",
        "@type": "Quiz",
        name: "Günün Quizi — 10 polis sınavı çıkmış soru",
        url: config.siteUrl,
        hasPart: dailyQuiz.questions.map((q) => ({ "@type": "Question", name: q.stem })),
      }
    : null;

  const proofs = [
    {
      title: "Kaynaklı çıkmış sorular",
      body: "AI üretimi soru yok — her sorunun hangi sınavdan geldiği üzerinde yazar.",
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
    <div className="tk-scope font-body">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {/* ── Hero: çözülebilir günün sorusu ── */}
      <section className="bg-gradient-to-b from-[#0e2547] to-[#1b3a6b] px-4 pb-14 pt-12">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-heading text-3xl font-bold text-white">
            Polis sınavlarına hazırlığın merkezi
          </h1>
          <p className="mb-8 mt-2 text-white/75">
            PAEM · Misyon — bugünün 10 soruluk quizini şimdi çöz, sonra koçunla devam et.
          </p>
          {dailyQuiz && dailyQuiz.count > 0 ? (
            <DailyQuizCard quiz={dailyQuiz} loggedIn={false} />
          ) : (
            <Link
              href="/denemeler"
              className="inline-block rounded-sm bg-white px-6 py-3 font-heading text-[15px] font-bold text-brand"
            >
              Denemelere göz at
            </Link>
          )}
        </div>
      </section>

      {/* ── Kanıt blokları: rakam konuşur ── */}
      <section className="mx-auto grid max-w-6xl gap-3 px-4 py-8 md:grid-cols-3">
        {proofs.map((p) => (
          <Link
            key={p.title}
            href={p.href}
            className="tk-interactive rounded-md border border-line bg-surface p-5 hover:border-ink-soft"
          >
            <p className="font-heading text-[15px] font-bold text-ink">{p.title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{p.body}</p>
          </Link>
        ))}
      </section>

      {/* ── Canlı deneme + hesaplayıcı ── */}
      <section className="mx-auto grid max-w-6xl gap-3 px-4 pb-8 md:grid-cols-2">
        <div className="rounded-md border border-live/40 bg-surface p-6">
          <h2 className="font-heading text-[17px] font-bold text-ink">
            {active ? "● Canlı deneme şu an devam ediyor" : "Canlı deneme sınavları"}
          </h2>
          {active ? (
            <>
              <p className="mt-2 text-[14px] text-ink-soft">
                <b className="text-ink">{active.title}</b> — {active.participantCount} katılımcı.
              </p>
              <Link
                href="/denemeler"
                className="mt-4 inline-block rounded-sm bg-brand px-5 py-2.5 font-heading text-[14px] font-bold text-surface"
              >
                Hemen katıl
              </Link>
            </>
          ) : next ? (
            <>
              <p className="mt-2 text-[14px] text-ink-soft">
                Sıradaki: <b className="text-ink">{next.title}</b> — {formatDate(next.startAt)}{" "}
                {formatTime(next.startAt)}
              </p>
              <div className="mt-3">
                <Countdown target={next.startAt} />
              </div>
              <p className="mt-3 text-[13px] text-ink-soft">
                Türkiye genelinde aynı anda yarış, sıralamanı gör.
              </p>
            </>
          ) : (
            <p className="mt-2 text-[14px] text-ink-soft">
              Yeni deneme takvimi hazırlanıyor — açıklandığında burada ve uygulamada duyurulur.
            </p>
          )}
        </div>
        <div className="rounded-md border border-line bg-surface p-6">
          <h2 className="font-heading text-[17px] font-bold text-ink">Net &amp; skor hesaplayıcı</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
            Doğru–yanlış sayını gir; netini ve bölüm ağırlıklarına göre skorunu anında gör.
          </p>
          <Link
            href="/hesaplayici/paem-puan"
            className="tk-interactive mt-4 inline-block rounded-sm border border-line px-5 py-2.5 font-heading text-[14px] font-bold text-ink hover:border-ink-soft"
          >
            Hesapla
          </Link>
        </div>
      </section>

      {/* ── Kanun kütüphanesi (SEO iç bağlantı kapısı) ── */}
      <section className="border-y border-line bg-surface-alt px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-ink">Kanun kütüphanesi</h2>
            <Link href="/kanunlar" className="text-[13px] font-bold text-brand hover:underline">
              {laws.length} kanunun tümü →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {topLaws.map((l) => (
              <Link
                key={l.slug}
                href={`/kanun/${l.slug}`}
                className="tk-interactive rounded-md border border-line bg-surface p-4 hover:border-atlas"
              >
                <p className="line-clamp-2 text-[14px] font-medium text-ink">{l.name}</p>
                <p className="mt-1 text-[12px] text-ink-soft">
                  {l.questionCount > 0 ? `${l.questionCount} çıkmış soru · ` : ""}
                  {l.exams.map((e) => e.examName).join(" + ") || "müfredat"}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sınav rehberleri ── */}
      <section className="mx-auto grid max-w-6xl gap-3 px-4 py-8 md:grid-cols-2">
        {[
          {
            href: "/paem",
            title: "PAEM Rehberi",
            body: "Komiser yardımcılığı yolu: sınav formatı, ders ağırlıkları, konu listesi.",
          },
          {
            href: "/misyon",
            title: "Misyon Rehberi",
            body: "Misyon koruma sınavı: format, ağırlıklar, protokol ve silah bilgisi konuları.",
          },
        ].map((g) => (
          <Link
            key={g.href}
            href={g.href}
            className="tk-interactive rounded-md border border-line bg-surface p-6 hover:border-brand"
          >
            <h3 className="font-heading text-[17px] font-bold text-ink">{g.title}</h3>
            <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{g.body}</p>
          </Link>
        ))}
      </section>

      {/* ── SSS'den üç soru (wireframe 01 kapanışı) ── */}
      <section className="border-t border-line bg-surface-alt px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-ink">Merak edilenler</h2>
            <Link href="/sss" className="text-[13px] font-bold text-brand hover:underline">
              Tüm SSS →
            </Link>
          </div>
          <div className="space-y-2">
            {[
              {
                q: "Sorular gerçekten çıkmış sorular mı?",
                a: "Evet — bankamızın varlık nedeni bu. Sorular resmî geçmiş sınav kitapçıklarından derlenir ve her sorunun üzerinde kaynağı yazar. Yapay zekâya soru ürettirmeyiz; AI yalnızca açıklamada yardımcı olur.",
              },
              {
                q: "Ücretsiz hesapla neler yapabilirim?",
                a: "Günde 15 soru, günün sorusu, canlı denemelere katılım, seri ve rozetler — ücretsiz katman gerçek antrenman verir, vitrin değildir.",
              },
              {
                q: "Premium ne sunar?",
                a: "Koçun tam beynini: sınırsız soru, süresiz tekrar hafızası, sınırsız AI açıklaması ve haftada 3 seri sigortası.",
              },
            ].map((f) => (
              <details key={f.q} className="rounded-md border border-line bg-surface p-4">
                <summary className="cursor-pointer font-heading text-[15px] font-bold text-ink">
                  {f.q}
                </summary>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fiyat özeti (wireframe 01 not 6): ücretsiz katmanın değeri önde ── */}
      <section className="border-t border-line px-4 py-10">
        <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-line bg-surface p-5">
            <p className="tk-caption">Ücretsiz</p>
            <p className="mt-1 font-heading text-[17px] font-bold text-ink">Sonsuza dek 0 ₺</p>
            <ul className="mt-2 space-y-1 text-[13px] text-ink-soft">
              <li>Günde 15 soru + günün sorusu</li>
              <li>Canlı denemeler ve sıralama</li>
              <li>Seri, rozetler, temel koç</li>
            </ul>
          </div>
          <div className="rounded-md border border-brand/40 bg-brand/5 p-5">
            <p className="tk-caption text-brand">Premium</p>
            <p className="mt-1 font-heading text-[17px] font-bold text-ink">Koçun tam beyni</p>
            <ul className="mt-2 space-y-1 text-[13px] text-ink-soft">
              <li>Sınırsız soru + süresiz tekrar hafızası</li>
              <li>Sınırsız AI açıklaması</li>
              <li>Haftada 3 seri sigortası</li>
            </ul>
            <Link href="/premium" className="mt-3 inline-block text-[13px] font-bold text-brand hover:underline">
              Fiyatları gör →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Kapanış: güven + kayıt ── */}
      <section className="border-t border-line px-4 py-10 text-center">
        <p className="text-[14px] text-ink-soft">
          <b className="text-ink">
            {totalLawQuestions > 0 ? `${totalLawQuestions}+ kanun sorusu` : "Büyüyen soru bankası"}
          </b>{" "}
          · kaynaklı çıkmış sorular · mükerrersiz banka · canlı denemeler · iOS uygulaması
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/kayit"
            className="rounded-sm bg-brand px-6 py-3 font-heading text-[15px] font-bold text-surface"
          >
            Ücretsiz başla — günde 15 soru
          </Link>
          <Link href="/premium" className="text-[14px] font-bold text-brand hover:underline">
            Premium&apos;u incele →
          </Link>
        </div>
      </section>
    </div>
  );
}

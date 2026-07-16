import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import { supabaseServer } from "@/lib/supabase/server";
import type { ExamListItem } from "@/lib/types";
import { publicApi, type CoachBrief, type LawSummary, type QuestionOfDay } from "@/lib/public-api";
import { Countdown } from "@/components/countdown";
import { QuestionOfDayCard } from "@/components/question-of-day";
import { CoachDashboard } from "@/components/coach-dashboard";
import { formatDate, formatTime } from "@/lib/format";

export const metadata: Metadata = {
  title: { absolute: "Paemisyon — Polis Sınavlarına Hazırlığın Merkezi | PAEM, Misyon" },
  description:
    "PAEM ve Misyon Koruma sınavlarına kaynaklı çıkmış sorular, canlı denemeler, kanun kanun konu çalışması ve kişisel koçla hazırlan. Günün sorusunu şimdi çöz.",
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

/**
 * Ana sayfa (Doc 23 Konsept C):
 * girişli → KOÇ dashboard'u (mobille aynı beyin: /me/coach)
 * girişsiz → yaşayan vitrin: günün sorusu (sayfada çözülür) + canlı deneme +
 *            kanun kütüphanesi + sınav rehberleri + güven şeridi
 */
export default async function HomePage() {
  const { data: auth } = await (await supabaseServer()).auth.getUser();
  const loggedIn = !!auth.user;

  if (loggedIn) {
    const brief = await api<CoachBrief>("/me/coach").catch(() => null);
    if (brief) return <CoachDashboard brief={brief} />;
  }

  const [exams, qotd, laws] = await Promise.all([
    api<ExamListItem[]>("/exams", { auth: false }).catch(() => [] as ExamListItem[]),
    publicApi<QuestionOfDay>("/public/question-of-day", 600).catch(() => null),
    publicApi<LawSummary[]>("/public/laws", 3600).catch(() => [] as LawSummary[]),
  ]);

  const next = [...exams]
    .filter((e) => e.state === "upcoming")
    .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))[0];
  const active = exams.find((e) => e.state === "active");
  const topLaws = [...laws].sort((a, b) => b.questionCount - a.questionCount).slice(0, 8);
  const totalLawQuestions = laws.reduce((s, l) => s + l.questionCount, 0);

  return (
    <div>
      {/* ── Hero: günün sorusu — ürünü 10 saniyede yaşat ── */}
      <section className="bg-(--color-navy-dark) px-4 py-12 text-center text-white">
        <h1 className="font-heading mb-2 text-3xl font-bold">
          Polis sınavlarına hazırlığın merkezi
        </h1>
        <p className="mb-8 text-white/80">
          PAEM · Misyon — kaynaklı çıkmış sorular, canlı denemeler, kişisel koç.
        </p>
        {qotd ? (
          <QuestionOfDayCard question={qotd} loggedIn={false} />
        ) : (
          <Link href="/denemeler" className="btn-old btn-old-green">
            Denemelere Göz At
          </Link>
        )}
      </section>

      {/* ── Canlı deneme + hesaplayıcı ── */}
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-8 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-heading mb-2 text-lg font-bold text-(--color-navy)">
            📅 Canlı Deneme Sınavları
          </h2>
          {active ? (
            <>
              <p className="mb-3">
                <strong>{active.title}</strong> şu an devam ediyor!
              </p>
              <Link href="/denemeler" className="btn-old btn-old-green">
                Hemen Katıl
              </Link>
            </>
          ) : next ? (
            <>
              <p className="mb-2">
                Sıradaki: <strong>{next.title}</strong> — {formatDate(next.startAt)}{" "}
                {formatTime(next.startAt)}
              </p>
              <Countdown target={next.startAt} />
              <p className="mt-3 text-sm text-gray-500">
                Türkiye genelinde aynı anda yarış, sıralamanı gör.
              </p>
            </>
          ) : (
            <p className="text-gray-500">Yeni deneme takvimi yakında.</p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-heading mb-2 text-lg font-bold text-(--color-navy)">
            🧮 Net &amp; Skor Hesaplayıcı
          </h2>
          <p className="mb-3 text-sm text-gray-600">
            Doğru–yanlış sayını gir; netini ve bölüm ağırlıklarına göre skorunu anında gör.
          </p>
          <Link href="/hesaplayici/paem-puan" className="btn-old btn-old-navy">
            Hesapla
          </Link>
        </div>
      </section>

      {/* ── Kanun kütüphanesi (SEO iç bağlantı kapısı) ── */}
      <section className="bg-(--color-grey-bg) px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-(--color-navy)">
              📚 Kanun Kütüphanesi
            </h2>
            <Link href="/kanunlar" className="text-sm font-bold text-(--color-navy) hover:underline">
              Tümü ({laws.length}) →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {topLaws.map((l) => (
              <Link
                key={l.slug}
                href={`/kanun/${l.slug}`}
                className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-(--color-navy)"
              >
                <p className="mb-1 line-clamp-2 text-sm font-medium">{l.name}</p>
                <p className="text-xs text-gray-500">
                  {l.questionCount > 0 ? `${l.questionCount} soru · ` : ""}
                  {l.exams.map((e) => e.examName).join(" + ")}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sınav rehberleri ── */}
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-8 md:grid-cols-2">
        <Link
          href="/paem"
          className="rounded-xl border-2 border-(--color-navy)/20 bg-white p-6 transition hover:border-(--color-navy)"
        >
          <h3 className="font-heading mb-1 text-lg font-bold text-(--color-navy)">PAEM Rehberi</h3>
          <p className="text-sm text-gray-600">
            Komiser yardımcılığı yolu: sınav formatı, ders ağırlıkları, konu listesi.
          </p>
        </Link>
        <Link
          href="/misyon"
          className="rounded-xl border-2 border-(--color-navy)/20 bg-white p-6 transition hover:border-(--color-navy)"
        >
          <h3 className="font-heading mb-1 text-lg font-bold text-(--color-navy)">Misyon Rehberi</h3>
          <p className="text-sm text-gray-600">
            Misyon koruma sınavı: format, ağırlıklar, protokol/silah bilgisi konuları.
          </p>
        </Link>
      </section>

      {/* ── Güven şeridi ── */}
      <section className="border-t border-gray-200 bg-white px-4 py-8 text-center">
        <p className="text-sm text-gray-600">
          <strong>
            {totalLawQuestions > 0 ? `${totalLawQuestions}+ kanun sorusu` : "Büyüyen soru bankası"}
          </strong>{" "}
          · kaynaklı çıkmış sorular · mükerrersiz banka · canlı denemeler · iOS uygulaması
        </p>
      </section>
    </div>
  );
}

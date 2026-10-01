import Link from "next/link";
import { PremiumBadge } from "@/components/ui/premium-badge";
import type { LawSummary } from "@/lib/public-api";

/**
 * Kanun kartının içeriği — ad, sınav ağırlıkları, rozetler. Yüzeyden ayrı
 * tutulur: kütüphanede bağlantı kartı, seçim modunda seçilebilir kart aynı
 * gövdeyi giyer (tek ekrana özel kopya yok).
 */
export function LawCardBody({ law }: { law: LawSummary }) {
  return (
    <>
      <p className="mb-1 text-sm font-medium">{law.name}</p>
      <p className="text-xs text-ink-soft">
        {law.questionCount > 0 ? `${law.questionCount} çıkmış soru · ` : ""}
        {law.exams.map((e) => `${e.examName} %${e.weightPercent}`).join(" · ") ||
          "müfredat konusu"}
      </p>
      {(law.readable || law.isPremium) && (
        <span className="mt-2 flex flex-wrap gap-1.5">
          {law.readable && (
            <span className="inline-block rounded bg-brand/10 px-1.5 py-0.5 text-[11px] font-medium text-brand">
              📖 Tam metin
            </span>
          )}
          {law.isPremium && <PremiumBadge variant="soft" />}
        </span>
      )}
    </>
  );
}

/** Kütüphane kartı — kanun sayfasına bağlantı (SEO iç bağlantı merkezi, Doc 23). */
export function LawCard({ law }: { law: LawSummary }) {
  return (
    <Link
      href={`/kanun/${law.slug}`}
      className="tk-interactive rounded-md border border-line bg-surface p-4 text-ink hover:border-brand hover:shadow-card"
    >
      <LawCardBody law={law} />
    </Link>
  );
}

/** Soru sayısına göre sıralı kart ızgarası — tüm ders grupları aynı düzeni kullanır. */
export function LawCardGrid({ laws }: { laws: LawSummary[] }) {
  const sirali = [...laws].sort((a, b) => b.questionCount - a.questionCount);
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sirali.map((l) => (
        <LawCard key={l.slug} law={l} />
      ))}
    </div>
  );
}

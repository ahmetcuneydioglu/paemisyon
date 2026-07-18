import Link from "next/link";
import { Card } from "./card";

const typeIcon: Record<string, string> = {
  quick_review: "🔁",
  weak_topic: "📉",
  streak_risk: "⚠️",
  exam_today: "🏆",
  exam_upcoming: "🏆",
  exam_result: "🏆",
  badge_progress: "🎖",
  comeback: "👋",
};

/**
 * Koç destek kartı (Doc 26 #1, support varyantı): tip ikonlu, tek mesaj, tek CTA.
 * Metin SUNUCUDAN gelir (/me/coach) — istemci kural bilmez.
 */
export function CoachCard({
  type,
  title,
  body,
  cta,
  routeMapper,
}: {
  type: string;
  title: string;
  body?: string;
  cta?: { label: string; route: string };
  /** Mobil route'larını web karşılığına eşler. */
  routeMapper: (route: string) => string;
}) {
  const icon = typeIcon[type] ?? (type.startsWith("exam") ? "🏆" : "🎯");
  return (
    <Card className="flex items-start gap-3">
      <span className="mt-0.5 text-xl" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-[15px] font-bold text-ink">{title}</p>
        {body && <p className="mt-0.5 text-[13px] leading-relaxed text-ink-soft">{body}</p>}
        {cta && (
          <Link
            href={routeMapper(cta.route)}
            className="mt-2 inline-block text-[13px] font-bold text-brand hover:underline"
          >
            {cta.label} →
          </Link>
        )}
      </div>
    </Card>
  );
}

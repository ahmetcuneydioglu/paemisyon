import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Flame,
  Hand,
  Medal,
  RotateCcw,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { Card } from "./card";

const typeIcon: Record<string, LucideIcon> = {
  quick_review: RotateCcw,
  weak_topic: BarChart3,
  streak_risk: Flame,
  exam_today: Trophy,
  exam_upcoming: Trophy,
  exam_result: Trophy,
  badge_progress: Medal,
  comeback: Hand,
};

/**
 * Koç destek kartı (Doc 26 #1, support varyantı): tip ikonlu, tek mesaj, tek CTA.
 * Metin SUNUCUDAN gelir (/me/coach) — istemci kural bilmez. Emoji yok; lucide.
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
  routeMapper: (route: string, type?: string) => string;
}) {
  const Icon = typeIcon[type] ?? (type.startsWith("exam") ? Trophy : Target);
  return (
    <Card className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-surface-alt text-ink-soft">
        <Icon size={20} strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="type-subhead text-ink">{title}</p>
        {body ? (
          <p className="type-body-sm mt-0.5 text-ink-soft">{body}</p>
        ) : null}
        {cta ? (
          <Link
            href={routeMapper(cta.route, type)}
            className="type-subhead mt-2 inline-flex items-center gap-1 text-accent-ink hover:underline"
          >
            {cta.label}
            <ArrowRight size={14} aria-hidden />
          </Link>
        ) : null}
      </div>
    </Card>
  );
}

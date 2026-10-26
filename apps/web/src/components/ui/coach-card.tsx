import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Flame,
  Hand,
  Medal,
  Megaphone,
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
  plan_week: CalendarDays,
  plan_offer: CalendarDays,
  announcement: Megaphone,
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
  meta,
  routeMapper,
}: {
  type: string;
  title: string;
  body?: string;
  cta?: { label: string; route: string };
  meta?: Record<string, unknown>;
  routeMapper: (route: string, type?: string, meta?: Record<string, unknown>) => string;
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
            href={routeMapper(cta.route, type, meta)}
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

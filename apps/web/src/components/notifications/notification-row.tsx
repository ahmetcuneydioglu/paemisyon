"use client";

import { useRouter } from "next/navigation";
import {
  Bell, BookOpen, Calendar, ClipboardList, Flag, Flame, Mail, Medal, ShieldCheck, Sun, Trophy, BarChart3,
} from "lucide-react";
import type { ComponentType } from "react";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { relativeTime, safeWebPath, type InboxItem, type NotificationCategory } from "@/lib/notifications";

const ICON: Record<NotificationCategory, ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  daily_question: Sun, study_reminder: Bell, streak: Flame, exam: ClipboardList, exam_countdown: Calendar,
  new_content: BookOpen, achievement: Medal, statistics: BarChart3, leaderboard: Trophy,
  question_report: Flag, marketing: Mail, system: ShieldCheck,
};

/**
 * Kutu satırı (Figma BildirimSatırı; Expo ile aynı anatomi): kategori ikonu,
 * başlık, gövde, göreli zaman, okunmamış noktası. Dokununca `clicked` olayı
 * yazılır ve hedef web yoluna gidilir; kompakt sürüm zil panelinde kullanılır.
 */
export function NotificationRow({
  item,
  compact = false,
  onNavigate,
}: {
  item: InboxItem;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const Icon = ICON[item.category] ?? Bell;
  const unread = !item.readAt;
  const open = () => {
    apiClient(`/me/notifications/${item.id}/events`, {
      method: "POST",
      body: { type: "clicked", source: "web" },
    }).catch(() => undefined);
    onNavigate?.();
    router.push(safeWebPath(item.webPath));
  };
  return (
    <button
      type="button"
      onClick={open}
      aria-label={`${item.title}${unread ? " · okunmamış" : ""}`}
      className={cn(
        "tk-interactive flex w-full cursor-pointer items-start gap-3 rounded-card border text-left",
        compact ? "px-3 py-2.5" : "px-3.5 py-3",
        unread ? "border-accent-soft bg-surface" : "border-line bg-bg hover:bg-surface",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          unread ? "bg-accent-soft text-accent-ink" : "bg-surface-alt text-ink-subtle",
        )}
      >
        <Icon size={20} strokeWidth={1.75} aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-start gap-2">
          <span className={cn("type-subhead flex-1", unread ? "text-ink" : "text-ink-soft")}>{item.title}</span>
          <span className="type-body-sm shrink-0 text-ink-subtle">{relativeTime(item.scheduledAt)}</span>
        </span>
        <span className={cn("type-body-sm text-ink-soft", compact && "line-clamp-2")}>{item.body}</span>
      </span>
      <span className="flex w-2 shrink-0 justify-end pt-1.5" aria-hidden>
        {unread ? <span className="size-2 rounded-full bg-accent" /> : null}
      </span>
    </button>
  );
}

import { BarChart3, Bell, BookOpen, Calendar, ClipboardList, Flag, Flame, Mail, Medal, ShieldCheck, Sun, Trophy } from "lucide-react-native";
import type { ComponentType } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText, Badge } from "@/components/ui";
import type { InboxItem, NotificationCategory } from "@/features/notifications/queries";
import { relativeTime } from "@/features/notifications/queries";
import { useTheme } from "@/theme/ThemeProvider";

type IconProps = { color: string; size?: number; strokeWidth?: number };

const ICON: Record<NotificationCategory, ComponentType<IconProps>> = {
  daily_question: Sun,
  study_reminder: Bell,
  streak: Flame,
  exam: ClipboardList,
  exam_countdown: Calendar,
  new_content: BookOpen,
  achievement: Medal,
  statistics: BarChart3,
  leaderboard: Trophy,
  question_report: Flag,
  marketing: Mail,
  system: ShieldCheck,
};

/**
 * Kutu satırı (Figma BildirimSatırı; web NotificationRow ile aynı anatomi): kategori ikonu,
 * başlık, gövde, göreli zaman, okunmamış noktası. `needsUpdate` sürümü eski cihazda hedefin
 * açılamayacağını söyler: satır yine dokunulur, ekran güncelleme uyarısı verir. Dokunma ≥ 64 pt.
 */
export function NotificationRow({
  item,
  onPress,
  needsUpdate = false,
  compact = false,
}: {
  item: InboxItem;
  onPress: (item: InboxItem) => void;
  needsUpdate?: boolean;
  compact?: boolean;
}) {
  const { colors, radius, space } = useTheme();
  const Icon = ICON[item.category] ?? Bell;
  const unread = !item.readAt;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}${unread ? ", okunmamış" : ""}${needsUpdate ? ", güncelleme gerekli" : ""}`}
      onPress={() => onPress(item)}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "flex-start",
        gap: space.s3,
        minHeight: 64,
        paddingHorizontal: space.s4,
        paddingVertical: compact ? space.s3 : space.s4,
        borderRadius: radius.card,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: unread ? colors.accentSoft : colors.line,
        backgroundColor: unread ? colors.surface : colors.bg,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: unread ? colors.accentSoft : colors.surfaceAlt,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon color={unread ? colors.accentInk : colors.inkSubtle} size={20} strokeWidth={1.75} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space.s2 }}>
          <AppText variant="subhead" tone={unread ? "ink" : "soft"} style={{ flex: 1 }} numberOfLines={2}>
            {item.title}
          </AppText>
          <AppText variant="bodySm" tone="subtle">
            {relativeTime(item.scheduledAt)}
          </AppText>
        </View>
        <AppText variant="bodySm" tone="soft" numberOfLines={compact ? 2 : 4}>
          {item.body}
        </AppText>
        {needsUpdate ? (
          <Badge tone="warning" style={{ marginTop: space.s1 }}>
            Güncelleme gerekli
          </Badge>
        ) : item.ctaLabel ? (
          <AppText variant="subhead" tone="accentInk" style={{ marginTop: space.s1 }}>
            {item.ctaLabel} ›
          </AppText>
        ) : null}
      </View>
      <View style={{ width: 8, paddingTop: 6, alignItems: "flex-end" }} accessibilityElementsHidden>
        {unread ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} /> : null}
      </View>
    </Pressable>
  );
}

import { Check } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { AppText } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";

export interface RouteRow {
  key: string;
  label: string;
  detail: string | null;
  done: boolean;
  /** null: yalnız bilgi (dokunulmaz). */
  onPress: (() => void) | null;
}

/**
 * Bugünün rotası (Bugün v3, Figma 68:474): surface kart, 2–6 satır; 20 pt onay kutusu (dolu:
 * success + beyaz onay), 44 pt satırlar, 1 px çizgi; altta hedef satırı + "Planım ›". Sayı
 * sunucunun; tamamlananlar listenin sonundadır (sunucu sıralar).
 */
export function RouteList({
  rows,
  footer,
  onPlan,
}: {
  rows: RouteRow[];
  /** "Günlük hedef 20 soru · 5" */
  footer: string | null;
  onPlan?: () => void;
}) {
  const { colors, radius, space } = useTheme();
  const done = rows.filter((r) => r.done).length;
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: space.s4, gap: space.s3 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <AppText variant="label" tone="subtle" accessibilityRole="header">
          BUGÜNÜN ROTASI
        </AppText>
        <AppText variant="bodySm" tone="soft" style={{ fontVariant: ["tabular-nums"] }}>
          {done}/{rows.length}
        </AppText>
      </View>
      <View>
        {rows.map((r, i) => (
          <Pressable
            key={r.key}
            accessibilityRole={r.onPress ? "button" : undefined}
            accessibilityState={{ checked: r.done }}
            accessibilityLabel={`${r.label}${r.detail ? `, ${r.detail}` : ""}${r.done ? ", tamamlandı" : ""}`}
            disabled={!r.onPress}
            onPress={r.onPress ?? undefined}
            style={({ pressed }) => ({
              minHeight: 44,
              flexDirection: "row",
              alignItems: "center",
              gap: space.s3,
              borderBottomWidth: i < rows.length - 1 ? 1 : 0,
              borderBottomColor: colors.line,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 5,
                borderWidth: r.done ? 0 : 1.5,
                borderColor: colors.line,
                backgroundColor: r.done ? colors.success : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {r.done ? <Check color={colors.onAccent} size={14} strokeWidth={3} /> : null}
            </View>
            <AppText variant="body" style={{ flex: 1 }} numberOfLines={1} tone={r.done ? "soft" : "ink"}>
              {r.label}
            </AppText>
            {r.detail ? (
              <AppText variant="bodySm" tone="soft" style={{ fontVariant: ["tabular-nums"] }}>
                {r.detail}
              </AppText>
            ) : null}
          </Pressable>
        ))}
      </View>
      {footer || onPlan ? (
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <AppText variant="bodySm" tone="soft" style={{ flex: 1 }}>
            {footer ?? ""}
          </AppText>
          {onPlan ? (
            <Pressable accessibilityRole="button" onPress={onPlan} hitSlop={8} style={{ minHeight: 32, justifyContent: "center" }}>
              <AppText variant="bodySm" tone="accentInk">
                Planım ›
              </AppText>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

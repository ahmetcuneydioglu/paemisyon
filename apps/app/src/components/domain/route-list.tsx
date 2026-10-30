import { Check } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { AppText } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";

export interface RouteRow {
  key: string;
  label: string;
  /** Sağ alt bilgi: "4/10", "kuyruk temiz", "Anayasa". */
  detail: string | null;
  /** "~4 dk" olarak sağ üstte. */
  estimateMin: number | null;
  done: boolean;
  /** null: yalnız bilgi (dokunulmaz). */
  onPress: (() => void) | null;
}

/**
 * Bugünün rotası (Bugün v3; kullanıcı geri bildirimi 30 Eki: GYSROTA'daki gibi SIRA NUMARASI ve
 * tamamlanınca TİK): numaralı daireler dikey çizgiyle bağlı; tamamlanan adım success dolgu +
 * onay işareti ve soluk metin; sağda "~dk" tahmini. Sıra sunucunun; tamamlanma gerçek veriden.
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
  const R = 28; // daire çapı
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: space.s4, gap: space.s3 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <AppText variant="label" tone="subtle" accessibilityRole="header">
          BUGÜNÜN ROTASI
        </AppText>
        <AppText variant="bodySm" tone="soft" style={{ fontVariant: ["tabular-nums"] }}>
          {done}/{rows.length} tamam
        </AppText>
      </View>
      <View>
        {rows.map((r, i) => {
          const last = i === rows.length - 1;
          return (
            <Pressable
              key={r.key}
              accessibilityRole={r.onPress ? "button" : undefined}
              accessibilityState={{ checked: r.done }}
              accessibilityLabel={`${i + 1}. adım, ${r.label}${r.estimateMin != null ? `, yaklaşık ${r.estimateMin} dakika` : ""}${r.done ? ", tamamlandı" : ""}`}
              disabled={!r.onPress}
              onPress={r.onPress ?? undefined}
              style={({ pressed }) => ({ flexDirection: "row", gap: space.s3, opacity: pressed ? 0.7 : 1 })}
            >
              {/* Zaman çizgisi: numaralı daire + alt bağ çizgisi */}
              <View style={{ width: R, alignItems: "center" }}>
                <View
                  style={{
                    width: R,
                    height: R,
                    borderRadius: R / 2,
                    borderWidth: r.done ? 0 : 1.5,
                    borderColor: colors.line,
                    backgroundColor: r.done ? colors.success : colors.surface,
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 10,
                  }}
                >
                  {r.done ? (
                    <Check color={colors.onAccent} size={16} strokeWidth={3} />
                  ) : (
                    <AppText variant="subhead" tone="soft" style={{ fontSize: 13, lineHeight: 16, fontVariant: ["tabular-nums"] }}>
                      {i + 1}
                    </AppText>
                  )}
                </View>
                {!last ? <View style={{ flex: 1, width: 2, backgroundColor: r.done ? colors.success : colors.line, marginVertical: 4, minHeight: 10 }} /> : null}
              </View>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-start", gap: space.s2, paddingVertical: 10, minHeight: 48, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.line }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="body" numberOfLines={2} tone={r.done ? "soft" : "ink"} style={r.done ? { textDecorationLine: "line-through" } : undefined}>
                    {r.label}
                  </AppText>
                  {r.detail ? (
                    <AppText variant="bodySm" tone="subtle" style={{ fontVariant: ["tabular-nums"] }}>
                      {r.detail}
                    </AppText>
                  ) : null}
                </View>
                {r.estimateMin != null && !r.done ? (
                  <AppText variant="bodySm" tone="soft" style={{ fontVariant: ["tabular-nums"], paddingTop: 2 }}>
                    ~{r.estimateMin} dk
                  </AppText>
                ) : null}
              </View>
            </Pressable>
          );
        })}
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

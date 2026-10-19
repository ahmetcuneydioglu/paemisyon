import { CalendarDays } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { AppText, Badge, Button, Card, ProgressBar } from "@/components/ui";
import { formatMinutes, itemTitle, phaseLabel, type PlanBrief } from "@/features/plan/queries";
import { useTheme } from "@/theme/ThemeProvider";

type Item = NonNullable<PlanBrief["items"]>[number];

/**
 * Bugün'deki haftalık plan — "vardiya listesi" (Doc 49/13 §2): sol altın dikey çizgi, her
 * kalemde ad / ders, sağda kalan dakika ya da Tamam rozeti, altında ince ilerleme. Plan
 * yoksa ve sunucu `plan_offer` verdiyse davet. Kalemler ve sıradaki sunucudan.
 */
export function PlanShiftList({
  plan,
  offer,
  onOpen,
  onStart,
}: {
  plan: PlanBrief | null;
  offer: boolean;
  onOpen: () => void;
  onStart: (item: Item) => void;
}) {
  const { colors, space } = useTheme();

  if (!plan) {
    if (!offer) return null;
    return (
      <Card tone="alt" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
          <CalendarDays color={colors.accent} size={20} strokeWidth={1.75} />
          <AppText variant="subhead" style={{ flex: 1 }}>
            Haftalık plan çıkarayım mı?
          </AppText>
        </View>
        <AppText variant="bodySm" tone="soft">
          Ayırabildiğin süreyi söyle; konuları sınava kadar haftalara ben dağıtayım.
        </AppText>
        <Button title="Planı kur" variant="secondary" onPress={onOpen} />
      </Card>
    );
  }

  const items = plan.items ?? [];
  const s = plan.summary;
  return (
    <View style={{ gap: space.s2 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Haftalık planı aç" onPress={onOpen} style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: space.s2, minHeight: 44 }}>
        <AppText variant="label" tone="subtle">
          Haftalık plan · {phaseLabel(plan.phase)}
        </AppText>
        <AppText variant="subhead" tone="accentInk">
          {plan.ended ? "Yenile ›" : `%${s.pct} ›`}
        </AppText>
      </Pressable>
      {items.length === 0 ? (
        <AppText variant="bodySm" tone="soft">
          {plan.ended ? "Plan tamamlandı; yeni dönem için yeniden kurabilirsin." : "Bu haftaya kalem düşmedi."}
        </AppText>
      ) : (
        <View style={{ borderLeftWidth: 2, borderLeftColor: colors.accent, paddingLeft: space.s3, gap: 0 }}>
          {items.map((it, idx) => {
            const done = it.status === "done";
            const pct = it.targetMinutes > 0 ? Math.min(1, it.doneMinutes / it.targetMinutes) : 0;
            const active = !done && it.status !== "skipped";
            return (
              <Pressable
                key={it.id}
                accessibilityRole={active ? "button" : undefined}
                accessibilityLabel={`${itemTitle(it)}${it.courseName ? `, ${it.courseName}` : ""}${done ? ", tamam" : `, ${formatMinutes(it.remainingMinutes)} kaldı`}`}
                disabled={!active}
                onPress={() => onStart(it)}
                style={({ pressed }) => ({ paddingVertical: space.s3, gap: space.s2, borderBottomWidth: idx < items.length - 1 ? 0.5 : 0, borderBottomColor: colors.line, opacity: pressed ? 0.7 : 1 })}
              >
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space.s3 }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText variant="subhead" tone={done ? "soft" : "ink"}>
                      {itemTitle(it)}
                    </AppText>
                    {it.courseName ? (
                      <AppText variant="bodySm" tone="subtle">
                        {it.courseName}
                      </AppText>
                    ) : null}
                  </View>
                  {done ? (
                    <Badge tone="success">Tamam</Badge>
                  ) : it.status === "skipped" ? (
                    <Badge tone="neutral">Geçti</Badge>
                  ) : (
                    <AppText variant="bodySm" tone="soft" style={{ fontVariant: ["tabular-nums"] }}>
                      {formatMinutes(it.remainingMinutes)} kaldı
                    </AppText>
                  )}
                </View>
                <ProgressBar value={done ? 1 : pct} tone={done ? "success" : "accent"} height={3} />
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

import { CalendarDays, ChevronRight } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { AppText, Badge, Button, Card, ProgressBar } from "@/components/ui";
import { formatMinutes, itemTitle, phaseLabel, type PlanBrief } from "@/features/plan/queries";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Bugün'deki haftalık plan kartı (Doc 49/12 F8-A §5). Yüzde, evre ve sıradaki kalem
 * sunucudan; kart yalnız çizer. `plan` yoksa (sunucu `plan_offer` verdiyse) davet hâli.
 */
export function PlanWeekCard({
  plan,
  offer,
  onOpen,
  onStart,
}: {
  plan: PlanBrief | null;
  /** Plan yokken davet gösterilsin mi (sunucunun plan_offer kartı). */
  offer: boolean;
  onOpen: () => void;
  onStart: (item: NonNullable<PlanBrief["nextItem"]>) => void;
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

  const pct = plan.summary.pct;
  const next = plan.nextItem;
  return (
    <Card style={{ gap: space.s3 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Planım" onPress={onOpen} style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
            <AppText variant="label" tone="subtle">
              Haftalık plan
            </AppText>
            <Badge tone={plan.phase === "build" ? "neutral" : "warning"}>{phaseLabel(plan.phase)}</Badge>
          </View>
          <AppText variant="heading">{plan.ended ? "Planın tamamlandı" : `%${pct}`}</AppText>
        </View>
        <ChevronRight color={colors.inkSubtle} size={20} strokeWidth={2} />
      </Pressable>
      {!plan.ended ? (
        <>
          <ProgressBar value={pct / 100} tone={pct >= 100 ? "success" : "accent"} label="Haftalık plan ilerlemesi" />
          <AppText variant="bodySm" tone="soft">
            {formatMinutes(plan.summary.doneMinutes)} / {formatMinutes(plan.summary.targetMinutes)}
            {plan.summary.doneQuestions > 0 ? ` · ${plan.summary.doneQuestions} soru` : ""}
          </AppText>
          {next ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.s3 }}>
              <View style={{ flex: 1 }}>
                <AppText variant="label" tone="subtle">
                  Sıradaki
                </AppText>
                <AppText variant="subhead" numberOfLines={1}>
                  {itemTitle(next)}
                </AppText>
                <AppText variant="bodySm" tone="soft">
                  {formatMinutes(next.remainingMinutes)} kaldı
                </AppText>
              </View>
              <Button title={next.kind === "topic" ? "Başla" : next.kind === "review" ? "Tekrar" : "Deneme"} variant="secondary" onPress={() => onStart(next)} />
            </View>
          ) : (
            <AppText variant="bodySm" tone="success">
              Bu haftanın hedefi tamam. İstersen plan dışı devam et.
            </AppText>
          )}
        </>
      ) : (
        <Button title="Planı yenile" variant="secondary" onPress={onOpen} />
      )}
    </Card>
  );
}

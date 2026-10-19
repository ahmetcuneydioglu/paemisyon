import { View } from "react-native";
import { AppText, Badge, Card, SegmentBar } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";

export type TaskKind = "exam" | "resume" | "first" | "comeback" | "weekly_risk" | "start" | "done";

const KIND_LABEL: Record<TaskKind, string> = {
  exam: "Canlı deneme",
  resume: "Yarım kalan tur",
  first: "İlk devriye",
  comeback: "Dönüş",
  weekly_risk: "Haftalık hedef",
  start: "Bugünün görevi",
  done: "Hedef tamam",
};

/**
 * Görev kartı (Doc 48 A4, D4): tek birincil görev; eylem düğmesi kartta DEĞİL, ActionBar'da.
 * Başlık, bir cümle gerekçe, meta rozeti ve dilimli ilerleme. Bileşik "hazır %" yok.
 */
export function TaskHero({
  kind,
  title,
  body,
  meta,
  progress,
  compact = false,
}: {
  kind: TaskKind;
  title: string;
  body?: string | null;
  /** "12 soru · 9 dk" gibi; sunucudan gelen sayılarla kurulur. */
  meta?: string | null;
  progress?: { done: number; total: number } | null;
  /** v4 "Nöbet defteri" (Doc 49/13): sakin kart — meta rozeti yok, başlık serif, eylem alt çubukta. */
  compact?: boolean;
}) {
  const { space } = useTheme();
  const done = kind === "done";
  return (
    <Card style={{ padding: space.s5, gap: space.s3 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space.s2 }}>
        <AppText variant="label" tone={done ? "success" : "accentInk"}>
          {KIND_LABEL[kind]}
        </AppText>
        {meta && !compact ? <Badge tone="neutral">{meta}</Badge> : null}
      </View>
      <AppText variant="title">{title}</AppText>
      {body ? (
        <AppText variant="bodySm" tone="soft">
          {body}
        </AppText>
      ) : null}
      {progress && progress.total > 0 ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.s3, paddingTop: 2 }}>
          <SegmentBar total={progress.total} done={progress.done} tone={done ? "success" : "accent"} style={{ flex: 1 }} />
          <AppText variant="bodySm" tone="soft" style={{ fontVariant: ["tabular-nums"] }}>
            {progress.done}/{progress.total}
          </AppText>
        </View>
      ) : null}
    </Card>
  );
}

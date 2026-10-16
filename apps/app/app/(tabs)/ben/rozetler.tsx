import { Award, Flame, Target, Trophy } from "lucide-react-native";
import type { ComponentType } from "react";
import { View } from "react-native";
import { AppText, Card, Notice, ProgressBar, Screen, Skeleton } from "@/components/ui";
import { useBadges } from "@/features/me/queries";
import { useTheme } from "@/theme/ThemeProvider";

type IconProps = { color: string; size?: number; strokeWidth?: number };

function iconFor(key: string): ComponentType<IconProps> {
  if (key.startsWith("streak")) return Flame;
  if (key.includes("exam")) return Trophy;
  if (key.startsWith("accuracy")) return Target;
  return Award;
}

/** Rozetler (Doc 25: dönüm noktası koleksiyonu). Kilitliler soluk; kazanılanlar tarihli. */
export default function RozetlerScreen() {
  const { colors, space, radius } = useTheme();
  const q = useBadges();
  const d = q.data;

  return (
    <Screen inset="none">
      {q.isPending ? (
        <Skeleton height={240} radiusKey="card" />
      ) : q.isError ? (
        <Notice tone="error" title="Rozetler yüklenemedi">
          {q.error.message}
        </Notice>
      ) : d ? (
        <>
          <View style={{ gap: space.s2 }}>
            <AppText variant="title">{d.earnedCount === 0 ? "İlk rozetin çok yakın" : `${d.totalCount} rozetin ${d.earnedCount} tanesi sende`}</AppText>
            <ProgressBar value={d.totalCount ? d.earnedCount / d.totalCount : 0} tone="success" height={6} />
            <AppText variant="bodySm" tone="soft">
              Rozetler seri, doğruluk, deneme ve çözülen soruyla gelir; satın alınmaz.
            </AppText>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s3 }}>
            {d.items.map((b) => {
              const Icon = iconFor(b.key);
              return (
                <Card key={b.key} style={{ width: "47%", flexGrow: 1, opacity: b.earned ? 1 : 0.6, gap: space.s2 }} tone={b.earned ? "surface" : "alt"}>
                  <View style={{ width: 44, height: 44, borderRadius: radius.control, backgroundColor: b.earned ? colors.successSoft : colors.surface, alignItems: "center", justifyContent: "center" }}>
                    <Icon color={b.earned ? colors.successInk : colors.inkSubtle} size={22} strokeWidth={1.75} />
                  </View>
                  <AppText variant="subhead">{b.name}</AppText>
                  <AppText variant="bodySm" tone="soft">
                    {b.description}
                  </AppText>
                  <AppText variant="bodySm" tone={b.earned ? "success" : "subtle"}>
                    {b.earned && b.earnedAt ? new Date(b.earnedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : b.earned ? "Kazanıldı" : "Kilitli"}
                  </AppText>
                </Card>
              );
            })}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

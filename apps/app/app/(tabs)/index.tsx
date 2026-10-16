import { View } from "react-native";
import { AppText, Card, Notice, Screen, Skeleton } from "@/components/ui";
import { useCoachBrief, useMe } from "@/features/home/queries";
import { ApiError, NetworkError } from "@/lib/api";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Bugün — F1 iskeleti: gerçek /me/coach verisiyle durum satırı ve görev kartı. Yerleşim B,
 * sekiz durum, odak sheet'i ve sabit eylem çubuğu F3'te tasarım sistemiyle gelir.
 */
export default function BugunScreen() {
  const { space } = useTheme();
  const me = useMe();
  const brief = useCoachBrief();

  const selamlama = (() => {
    const h = new Date().getHours();
    return h < 6 ? "İyi nöbetler" : h < 12 ? "Günaydın" : h < 18 ? "İyi günler" : "İyi akşamlar";
  })();

  return (
    <Screen>
      <View style={{ gap: space.s1 }}>
        <AppText variant="bodySm" tone="soft">
          {selamlama}
          {me.data?.displayName ? `, ${me.data.displayName}` : ""}
        </AppText>
        <AppText variant="title">Bugün</AppText>
      </View>

      {brief.isPending ? (
        <View style={{ gap: space.s3 }}>
          <Skeleton height={76} radiusKey="card" />
          <Skeleton height={160} radiusKey="card" />
        </View>
      ) : brief.isError ? (
        <Notice tone="error" title={brief.error instanceof NetworkError ? "Bağlantı yok" : "Koç yüklenemedi"}>
          {brief.error instanceof ApiError ? `${brief.error.message} (${brief.error.code})` : brief.error.message}
        </Notice>
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: space.s3 }}>
            <Card style={{ flex: 1 }}>
              <AppText variant="label" tone="subtle">
                {brief.data.exam.name ?? "Hedef sınav"}
              </AppText>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                <AppText variant="stat">{brief.data.exam.daysLeft ?? "—"}</AppText>
                <AppText variant="bodySm" tone="soft">
                  gün
                </AppText>
              </View>
            </Card>
            <Card style={{ flex: 1 }}>
              <AppText variant="label" tone="subtle">
                Bu hafta
              </AppText>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                <AppText variant="stat">
                  {brief.data.weeklyPhoto?.activeDays ?? 0}
                  <AppText variant="stat" tone="subtle">
                    /{brief.data.weeklyPhoto?.targetDays ?? 5}
                  </AppText>
                </AppText>
                <AppText variant="bodySm" tone="soft">
                  gün
                </AppText>
              </View>
            </Card>
          </View>

          <Card>
            <AppText variant="label" tone="accentInk">
              Bugünün görevi
            </AppText>
            <AppText variant="heading">{brief.data.todayTask?.title ?? "Görev hazırlanıyor"}</AppText>
            {brief.data.todayTask?.subtitle ? (
              <AppText variant="bodySm" tone="soft">
                {brief.data.todayTask.subtitle}
              </AppText>
            ) : null}
            <AppText variant="bodySm" tone="subtle">
              Tür: {brief.data.todayTask?.kind ?? "yok"} · Çözülmemiş yanlış: {brief.data.readiness.unresolvedWrongCount}
            </AppText>
          </Card>

          <Card tone="alt">
            <AppText variant="label" tone="subtle">
              Hazırlık
            </AppText>
            {brief.data.readiness.courses.slice(0, 4).map((c) => (
              <View key={c.courseId} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <AppText variant="subhead">{c.name}</AppText>
                <AppText variant="subhead" tone={c.state === "weak" ? "danger" : "soft"}>
                  {c.accuracy == null ? "—" : `%${Math.round(c.accuracy * 100)}`}
                </AppText>
              </View>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

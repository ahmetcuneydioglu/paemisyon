import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Lock, Timer } from "lucide-react-native";
import { View } from "react-native";
import { CourseBreakdown, ResultHero, WeakTopicCard } from "@/components/domain";
import { AppText, Badge, Button, Card, IconButton, Notice, Screen, SectionHeader, Skeleton, StatTile } from "@/components/ui";
import { fmtDate, fmtDuration, fmtNet, rankSentence, useAttempt } from "@/features/exams/queries";
import { ApiError } from "@/lib/api";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Deneme sonucu (Doc 50 M4, Figma birebir): "DENEME SONUCU" + büyük net + alt satır; D/Y/B;
 * 8 dersli dağılım; Türkiye kıyası (resmî, Premium); çalışılacak konular; "Cevapları incele"
 * (M5 ayrı ekran). Dört varyant: resmî · tekrar çözüm · bana özel · haftalık bekliyor.
 */
export default function DenemeSonucScreen() {
  const router = useRouter();
  const { colors, space } = useTheme();
  const p = useLocalSearchParams<{ attemptId: string }>();
  const q = useAttempt(p.attemptId ?? null);
  const d = q.data;

  const inProgress = q.isError && q.error instanceof ApiError && q.error.code === "EXAM_IN_PROGRESS";
  const official = d ? d.role === "official" && !d.personal && !d.isArchive : false;
  const practice = d ? d.role === "practice" && !d.personal : false;
  const rank = d?.rank ?? null;
  const rankText = rank?.available && rank.rank != null ? rankSentence(rank.rank, rank.total) : null;
  const weak = (d?.weakTopics ?? []).slice(0, 3);
  const courses = d?.courses ?? [];

  const sub = !d
    ? null
    : official
      ? rankText
        ? `${rankText}${rank?.percentile && rank.percentile <= 50 ? ` · ilk %${rank.percentile}` : ""}`
        : rank && !rank.available
          ? `Sıralama en az 10 resmî çözümle açılır · şu an ${rank.total}`
          : null
      : practice
        ? "Tekrar çözüm · sıralamaya girmedi"
        : d.personal
          ? "Kişisel deneme · sıralamaya girmez"
          : d.isArchive
            ? "Çıkmış sınav · sınav gibi çözüm"
            : null;

  return (
    <>
      {/* İç yığının kökü: sistem oku gelmez; ok dış yığında geri gider, geçmiş yoksa Denemeler'e döner. */}
      <Stack.Screen options={{ title: d ? (d.personal ? "Kişisel deneme" : d.exam.title) : "Deneme sonucu", headerLeft: () => <IconButton icon={ArrowLeft} label="Geri" variant="ghost" onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/denemeler"))} /> }} />
      <Screen inset="none" style={{ paddingBottom: space.s8 }}>
        {q.isPending ? (
          <>
            <Skeleton height={120} radiusKey="card" />
            <Skeleton height={88} radiusKey="card" />
            <Skeleton height={320} radiusKey="card" />
          </>
        ) : inProgress ? (
          <Notice tone="info" title="Sınav devam ediyor">
            Süre dolmadan sonuç açılmaz; cevapların güvende.
          </Notice>
        ) : q.isError ? (
          <Notice tone="error" title="Sonuç yüklenemedi">
            {q.error.message}
          </Notice>
        ) : d?.resultLocked ? (
          /* Haftalık: sonuç bekliyor (Figma M4-d) */
          <>
            <Card style={{ alignItems: "center", gap: space.s2, paddingVertical: space.s6 }}>
              <Timer color={colors.accentInk} size={28} strokeWidth={1.75} />
              <AppText variant="subhead">
                Teslim edildi{d.completedAt ? ` · ${fmtDate(d.completedAt, { hour: "2-digit", minute: "2-digit" })}` : ""}
              </AppText>
              <AppText variant="bodySm" tone="soft" style={{ textAlign: "center" }}>
                Sonuçlar ve sıralama {d.resultAt ? `${fmtDate(d.resultAt, { weekday: "long", hour: "2-digit", minute: "2-digit" })}'da` : "sınav penceresi kapanınca"} açıklanır. Sana bildirim göndereceğiz.
              </AppText>
            </Card>
            <View style={{ flexDirection: "row", gap: space.s2 }}>
              <StatTile label="Cevaplanan" value={d.answeredCount ?? null} style={{ flex: 1 }} />
              <StatTile label="Boş" value={d.blankCount} style={{ flex: 1 }} />
              <StatTile label="Süre" value={fmtDuration(d.durationSeconds)} style={{ flex: 1.2 }} />
            </View>
            <Button title="Denemelere dön" variant="secondary" onPress={() => router.dismissTo("/(tabs)/denemeler")} />
          </>
        ) : d ? (
          <>
            <ResultHero value={d.score == null ? "—" : fmtNet(d.score)} unit={d.isArchive && !practice ? "%" : "net"} sub={sub} subTone={official && rankText ? "ink" : "soft"} />

            {d.scoreUpdate ? (
              <Notice tone="success" title="Netin güncellendi">
                Bir soru iptal edildi; netin {fmtNet(d.scoreUpdate.from)}&apos;ten {fmtNet(d.scoreUpdate.to)}&apos;e çıktı.
              </Notice>
            ) : null}
            {practice ? <Notice tone="info">Bu çözüm sıralamaya girmedi; resmî sonucun sıralamada olduğu gibi duruyor.</Notice> : null}
            {d.closedReason === "timeout" ? <Notice tone="warning">Süre doldu; cevapların otomatik teslim edildi.</Notice> : null}

            <View style={{ flexDirection: "row", gap: space.s2 }}>
              <StatTile label="Doğru" value={d.correctCount} tone="success" style={{ flex: 1 }} />
              <StatTile label="Yanlış" value={d.wrongCount} tone="danger" style={{ flex: 1 }} />
              <StatTile label="Boş" value={d.blankCount} style={{ flex: 1 }} />
            </View>
            <AppText variant="bodySm" tone="subtle">
              {d.totalQuestions} soru · {fmtDuration(d.durationSeconds)}{d.completedAt ? ` · ${fmtDate(d.completedAt, { day: "numeric", month: "long", year: "numeric" })}` : ""}
            </AppText>

            <CourseBreakdown rows={courses} />

            {official && d.turkey ? (
              <Card style={{ gap: space.s2 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <AppText variant="heading">Türkiye kıyası</AppText>
                  <Badge tone="warning">Premium</Badge>
                </View>
                {d.turkey.locked ? (
                  <>
                    <View style={{ flexDirection: "row", gap: space.s2, alignItems: "flex-start" }}>
                      <Lock color={colors.inkSubtle} size={16} strokeWidth={1.75} />
                      <AppText variant="bodySm" tone="soft" style={{ flex: 1 }}>
                        Türkiye ortalaması, medyan ve soru bazlı doğru oranı Premium ile açılır.
                      </AppText>
                    </View>
                    <Button title="Premium ile aç" variant="secondary" onPress={() => router.push("/paywall")} />
                  </>
                ) : d.turkey.sample < d.turkey.minSample ? (
                  <AppText variant="bodySm" tone="soft">
                    En az {d.turkey.minSample} resmî çözümle açılır; şu an {d.turkey.sample} çözüm var.
                  </AppText>
                ) : (
                  <>
                    <Row k="Türkiye ortalaması" v={`${fmtNet(d.turkey.mean)} net`} />
                    <Row k="Medyan" v={`${fmtNet(d.turkey.median)} net`} />
                    <Row k="Sen" v={`${d.turkey.diff != null && d.turkey.diff >= 0 ? "+" : ""}${fmtNet(d.turkey.diff)} net`} accent />
                    <AppText variant="bodySm" tone="subtle">
                      Soru bazlı Türkiye oranı ve süreler cevap incelemesinde.
                    </AppText>
                  </>
                )}
              </Card>
            ) : null}

            {weak.length > 0 ? (
              <View style={{ gap: space.s2 }}>
                <SectionHeader title="Çalışılacak konular" />
                {weak.map((t) => (
                  <WeakTopicCard key={t.topicId} name={t.topicName} wrong={t.wrong} blank={t.blank} total={t.total} onPress={() => router.push({ pathname: "/seans", params: { mode: "practice", count: "10", focusKind: "topic", topicId: t.topicId, courseId: "", recipe: "" } })} />
                ))}
              </View>
            ) : null}

            <View style={{ gap: space.s2, paddingTop: space.s2 }}>
              <Button title="Cevapları incele" onPress={() => router.push({ pathname: "/deneme-sonuc/[attemptId]/inceleme", params: { attemptId: d.attemptId } })} />
              {official ? <Button title="Sıralamayı gör" variant="secondary" onPress={() => router.push({ pathname: "/(tabs)/denemeler/siralama/[examId]", params: { examId: d.exam.id, title: d.exam.title } })} /> : null}
              {practice || d.isArchive ? <Button title="Deneme geçmişi" variant="secondary" onPress={() => router.push("/(tabs)/performans/denemelerim")} /> : null}
              {d.personal ? <Button title="Yeni kişisel deneme" variant="secondary" onPress={() => router.replace("/(tabs)/denemeler/kisisel")} /> : null}
            </View>
            {d.personal ? (
              <AppText variant="bodySm" tone="subtle" style={{ textAlign: "center" }}>
                Kişisel deneme sıralamaya ve net gelişim çizgisine girmez.
              </AppText>
            ) : null}
          </>
        ) : null}
      </Screen>
    </>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
      <AppText variant="bodySm" tone="soft">
        {k}
      </AppText>
      <AppText variant="subhead" tone={accent ? "accentInk" : "ink"} style={{ fontVariant: ["tabular-nums"] }}>
        {v}
      </AppText>
    </View>
  );
}

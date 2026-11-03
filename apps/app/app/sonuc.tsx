import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ResultPanel, SessionTopRow, UpsellStrip } from "@/components/domain";
import { AppText, Badge, Button, Notice, ProgressBar, Skeleton, StatTile } from "@/components/ui";
import { homeKeys } from "@/features/home/queries";
import { quizApi, type SessionResult } from "@/features/quiz/api";
import { setPendingReviewPrompt } from "@/features/review-prompt/api";
import { useTestResult, type TestResultContext } from "@/features/rooms/queries";
import { fontFamily } from "@/theme/tokens";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Tur sonucu (Doc 49/15 S5): "Bir tur daha tamam." + lacivert panelde hero "8/10", konu
 * kırılımı ince çizgilerle, tek koç cümlesi. Rakam konuşur, sıfat susar (Doc 26 §1).
 * "Şimdilik bitir" yolundan gelince sunucu turu kapatır (idempotent complete).
 *
 * Testten gelen tur (Doc 49/18 §8; Figma 113:672, 113:735): "geldiğin yere dön, yolculuğuna
 * devam et" — önceki denemeyle kıyas, D/Y/B, ders yolculuğu, sunucunun seçtiği birincil eylem
 * (sıradaki test / bu testin yanlışları / inceleme), kilitliyse tek premium satırı; kapat ve
 * "Testlere dön" Testler ekranına döner. Yanlış turu her durumda YALNIZ bu turun yanlışlarıdır.
 */
export default function SonucScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const { colors, space } = useTheme();
  const p = useLocalSearchParams<{ sessionId: string; data?: string; title?: string }>();
  const [result, setResult] = useState<SessionResult | null>(p.data ? (JSON.parse(p.data) as SessionResult) : null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (result || !p.sessionId) return;
    quizApi
      .complete(p.sessionId)
      .then((r) => {
        setResult(r);
        void qc.invalidateQueries({ queryKey: homeKeys.brief });
      })
      .catch((e: Error) => setError(e.message));
  }, [p.sessionId, qc, result]);

  // Doc 56: sunucu sorulsun dediyse sekmelere dönünce alt sayfa açılır (bu ekranda değil).
  useEffect(() => {
    if (result?.reviewPrompt) setPendingReviewPrompt(result.reviewPrompt);
  }, [result]);

  const pct = result && result.totalQuestions > 0 ? Math.round((result.correctCount / result.totalQuestions) * 100) : null;
  const sure = result ? sureMetni(result.durationSeconds) : null;
  const home = () => router.replace("/(tabs)");
  const scope = p.title?.trim() || null;
  // Test bağlamı tur bittikten SONRA sorulur (sunucu "completed" görmeli); testten açılmayan turda null.
  const ctxQ = useTestResult(result?.sessionId ?? null, Boolean(result));
  const ctx: TestResultContext | null = ctxQ.data ?? null;
  const testlere = () => (ctx ? router.dismissTo({ pathname: "/(tabs)/kutuphane/testler/[courseId]", params: { courseId: ctx.course.id, name: ctx.course.name } }) : home());
  const yanlislar = () => result && router.replace({ pathname: "/seans", params: { mode: "review", reviewSessionId: result.sessionId, source: ctx ? "course_test" : "" } });
  const incele = () => result && router.push({ pathname: "/inceleme/[sessionId]", params: { sessionId: result.sessionId, title: ctx ? `Test ${ctx.test.number}` : (scope ?? "") } });
  const sonrakiTest = () => ctx?.next && router.replace({ pathname: "/seans", params: { courseTestId: ctx.next.testId, source: "course_test" } });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <SessionTopRow onClose={ctx ? testlere : home} closeLabel={ctx ? "Testlere dön" : "Kapat"} label={ctx ? `Test ${ctx.test.number} · ${ctx.course.name}` : "Tur özeti"} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.screenGutter, paddingBottom: insets.bottom + space.s8, gap: space.s5 }} contentInsetAdjustmentBehavior="never">
        {/* Testte başlık yok: üst satır "Test N · Ders", panel "Test N tamamlandı" der (Figma 113:672). */}
        {ctx ? null : (
          <View style={{ gap: space.s1 }}>
            <AppText variant="title" accessibilityRole="header">
              Bir tur daha tamam.
            </AppText>
            {result ? (
              <AppText variant="bodySm" tone="soft">
                {[scope, `${result.totalQuestions} soru`].filter(Boolean).join(" · ")}
              </AppText>
            ) : null}
          </View>
        )}
        {error ? <Notice tone="error">{error}</Notice> : null}
        {!result || (ctxQ.isPending && ctxQ.fetchStatus !== "idle") ? (
          <Skeleton height={200} radiusKey="card" />
        ) : ctx ? (
          <TestSonucu
            ctx={ctx}
            result={result}
            pct={pct ?? 0}
            sure={sure}
            onNext={sonrakiTest}
            onPaywall={() => router.push("/paywall")}
            onWrongs={yanlislar}
            onReview={incele}
            onTests={testlere}
          />
        ) : (
          <>
            <ResultPanel correct={result.correctCount} total={result.totalQuestions} pct={pct} durationLabel={sure} />

            {result.earnedBadges && result.earnedBadges.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s2, alignItems: "center" }}>
                <AppText variant="label" tone="subtle">
                  Yeni rozet
                </AppText>
                {result.earnedBadges.map((b) => (
                  <Badge key={b.key} tone="accent">
                    {b.name}
                  </Badge>
                ))}
              </View>
            ) : null}

            {result.topicBreakdown && result.topicBreakdown.length > 0 ? (
              <View style={{ gap: space.s3 }}>
                <AppText variant="label" tone="subtle">
                  Konu kırılımı
                </AppText>
                {result.topicBreakdown.map((t) => {
                  const r = t.total > 0 ? t.correct / t.total : 0;
                  return (
                    <View key={t.topicId} style={{ gap: 8, paddingVertical: space.s1 }} accessible accessibilityLabel={`${t.topicName}: ${t.correct} / ${t.total}`}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.s3 }}>
                        <AppText variant="body" style={{ flex: 1 }} numberOfLines={2}>
                          {t.topicName}
                        </AppText>
                        <AppText variant="body" tone="soft" style={{ fontVariant: ["tabular-nums"] }}>
                          {t.correct}/{t.total}
                        </AppText>
                      </View>
                      <ProgressBar value={r} tone={r >= 0.75 ? "success" : r >= 0.5 ? "accent" : "danger"} height={2} />
                    </View>
                  );
                })}
              </View>
            ) : null}

            <AppText variant="body" tone="soft" style={{ fontFamily: fontFamily.display[400] }}>
              {kocCumlesi(result)}
            </AppText>

            <View style={{ gap: space.s3 }}>
              {result.wrongCount > 0 ? <Button title={`${result.wrongCount} yanlışını tekrar çöz`} onPress={yanlislar} /> : null}
              {result.mode !== "deneme" ? <Button title="Cevapları incele" variant="secondary" onPress={incele} /> : null}
              <Button title="Bugün'e dön" variant={result.wrongCount > 0 ? "secondary" : "primary"} onPress={home} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

/**
 * Test sonucu gövdesi: panel + kıyas rozeti, D/Y/B, ders yolculuğu, koç cümlesi, eylemler.
 * Eylem sırası sunucudan (`ctx.primary`); kilitli sıradaki test tek premium satırıdır.
 */
function TestSonucu({
  ctx,
  result,
  pct,
  sure,
  onNext,
  onPaywall,
  onWrongs,
  onReview,
  onTests,
}: {
  ctx: TestResultContext;
  result: SessionResult;
  pct: number;
  sure: string | null;
  onNext: () => void;
  onPaywall: () => void;
  onWrongs: () => void;
  onReview: () => void;
  onTests: () => void;
}) {
  const { space } = useTheme();
  const kiyas =
    ctx.previousPct == null ? (
      <Badge tone="neutral">İlk deneme</Badge>
    ) : (
      <Badge tone={pct > ctx.previousPct ? "success" : "neutral"}>{`Geçen sefer %${ctx.previousPct} → %${pct}`}</Badge>
    );
  const sonraki = ctx.next && !ctx.next.locked ? { title: `${ctx.next.cta} · ${ctx.next.questionCount} soru`, onPress: onNext } : null;
  const yanlis = result.wrongCount > 0 ? { title: `Bu testin ${result.wrongCount} yanlışını çöz`, onPress: onWrongs } : null;
  const incele = { title: "Cevapları incele", onPress: onReview };
  // Birincil önce, kalanlar ikincil — sıra sunucunun önceliğinden.
  const eylemler = (ctx.primary === "next" ? [sonraki, yanlis, incele] : ctx.primary === "wrongs" ? [yanlis, incele, sonraki] : [incele, yanlis, sonraki]).filter(
    (e): e is { title: string; onPress: () => void } => e != null,
  );
  const tamam = ctx.testCount > 0 ? ctx.completedTests / ctx.testCount : 0;
  return (
    <>
      <ResultPanel correct={result.correctCount} total={result.totalQuestions} pct={pct} durationLabel={sure} label={`Test ${ctx.test.number} tamamlandı`} sub={[`%${pct} doğru`, sure].filter(Boolean).join(" · ")} footer={kiyas} />
      <View style={{ flexDirection: "row", gap: space.s3 }}>
        <StatTile label="Doğru" value={result.correctCount} tone="success" style={{ flex: 1 }} />
        <StatTile label="Yanlış" value={result.wrongCount} tone="danger" style={{ flex: 1 }} />
        <StatTile label="Boş" value={result.blankCount} style={{ flex: 1 }} />
      </View>
      <View style={{ gap: space.s2 }} accessible accessibilityLabel={`${ctx.course.name}: ${ctx.testCount} testin ${ctx.completedTests} tanesi tamamlandı`}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: space.s3 }}>
          <AppText variant="subhead" style={{ flexShrink: 1 }}>
            {ctx.course.name}
          </AppText>
          <AppText variant="bodySm" tone="soft" style={{ fontVariant: ["tabular-nums"] }}>
            {ctx.completedTests}/{ctx.testCount} test
          </AppText>
        </View>
        <ProgressBar value={tamam} height={4} />
      </View>
      <AppText variant="body" tone="soft" style={{ fontFamily: fontFamily.display[400] }}>
        {ctx.note}
      </AppText>
      <View style={{ gap: space.s3 }}>
        {eylemler.map((e, i) => (
          <Button key={e.title} title={e.title} variant={i === 0 ? "primary" : "secondary"} onPress={e.onPress} />
        ))}
        {ctx.next?.locked ? <UpsellStrip title={ctx.next.cta} body={`Premium · ${ctx.lockedTests} test daha`} onPress={onPaywall} /> : null}
        <Button title="Testlere dön" variant="ghost" onPress={onTests} />
      </View>
    </>
  );
}

function sureMetni(saniye: number): string {
  const dk = Math.floor(saniye / 60);
  const sn = saniye % 60;
  return dk > 0 ? `${dk} dk ${sn} sn` : `${sn} sn`;
}

/** Tek koç cümlesi: sıfat yok, bir sonraki adım var (Doc 26 §1). */
function kocCumlesi(r: SessionResult): string {
  if (r.totalQuestions === 0) return "Bu turda çözülecek soru yoktu.";
  if (r.wrongCount === 0 && r.blankCount === 0) return "Hepsi doğru; koç bir sonraki turda zorluğu artırır.";
  if (r.wrongCount > 0) return `${r.wrongCount} yanlışını tekrar ederek bilgini pekiştir. Yanlışlar Kütüphane › Yanlışlarım'da.`;
  return `${r.blankCount} soruyu boş bıraktın; bir sonraki turda önce onlar gelir.`;
}

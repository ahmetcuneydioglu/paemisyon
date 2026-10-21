import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ResultPanel, SessionTopRow } from "@/components/domain";
import { AppText, Badge, Button, Notice, ProgressBar, Skeleton } from "@/components/ui";
import { homeKeys } from "@/features/home/queries";
import { quizApi, type SessionResult } from "@/features/quiz/api";
import { fontFamily } from "@/theme/tokens";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Tur sonucu (Doc 49/15 S5): "Bir tur daha tamam." + lacivert panelde hero "8/10", konu
 * kırılımı ince çizgilerle, tek koç cümlesi, "Yanlışları tekrar et" + "Bugün'e dön".
 * Rakam konuşur, sıfat susar (Doc 26 §1). "Şimdilik bitir" yolundan gelince sunucu turu
 * kapatır (idempotent complete). Üstte "…" menüsü yok (kullanıcı kararı).
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

  const pct = result && result.totalQuestions > 0 ? Math.round((result.correctCount / result.totalQuestions) * 100) : null;
  const sure = result ? sureMetni(result.durationSeconds) : null;
  const home = () => router.replace("/(tabs)");
  const scope = p.title?.trim() || null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <SessionTopRow onClose={home} closeLabel="Kapat" label="Tur özeti" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.screenGutter, paddingBottom: insets.bottom + space.s8, gap: space.s5 }} contentInsetAdjustmentBehavior="never">
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
        {error ? <Notice tone="error">{error}</Notice> : null}
        {!result ? (
          <Skeleton height={200} radiusKey="card" />
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
              {result.wrongCount > 0 ? <Button title="Yanlışları tekrar et" onPress={() => router.replace({ pathname: "/seans", params: { mode: "review", count: String(Math.min(20, result.wrongCount)) } })} /> : null}
              <Button title="Bugün'e dön" variant={result.wrongCount > 0 ? "secondary" : "primary"} onPress={home} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
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

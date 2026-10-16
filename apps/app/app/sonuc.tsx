import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { AppText, Badge, Button, Card, ListRow, Notice, Screen, Skeleton, StatTile } from "@/components/ui";
import { homeKeys } from "@/features/home/queries";
import { quizApi, type SessionResult } from "@/features/quiz/api";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Tur sonucu: doğru/yanlış/boş, süre, konu kırılımı, yeni rozet. Rakam konuşur, sıfat susar
 * (Doc 26 §1). "Şimdilik bitir" yolundan gelince sunucu turu kapatır (idempotent complete).
 */
export default function SonucScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { space } = useTheme();
  const p = useLocalSearchParams<{ sessionId: string; data?: string }>();
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
  const dk = result ? Math.max(1, Math.round(result.durationSeconds / 60)) : null;

  return (
    <Screen style={{ paddingBottom: space.s8 }}>
      <AppText variant="label" tone="accentInk">
        Tur bitti
      </AppText>
      {error ? <Notice tone="error">{error}</Notice> : null}
      {!result ? (
        <Skeleton height={160} radiusKey="card" />
      ) : (
        <>
          <AppText variant="title">
            {result.totalQuestions} soruda {result.correctCount} doğru
          </AppText>
          <View style={{ flexDirection: "row", gap: space.s3 }}>
            <StatTile label="Doğru" value={result.correctCount} tone="success" emphasis />
            <StatTile label="Yanlış" value={result.wrongCount} tone="danger" />
            <StatTile label="Boş" value={result.blankCount} />
          </View>
          <View style={{ flexDirection: "row", gap: space.s3 }}>
            <StatTile label="Doğruluk" value={pct == null ? null : `%${pct}`} progress={pct == null ? undefined : pct / 100} />
            <StatTile label="Süre" value={dk} unit="dk" />
          </View>

          {result.earnedBadges && result.earnedBadges.length > 0 ? (
            <Card tone="accent">
              <AppText variant="label" tone="accentInk">
                Yeni rozet
              </AppText>
              {result.earnedBadges.map((b) => (
                <AppText key={b.key} variant="subhead">
                  {b.name}
                </AppText>
              ))}
            </Card>
          ) : null}

          {result.topicBreakdown && result.topicBreakdown.length > 0 ? (
            <Card style={{ paddingVertical: 0 }}>
              <View style={{ paddingTop: space.s3 }}>
                <AppText variant="label" tone="subtle">
                  Konulara göre
                </AppText>
              </View>
              {result.topicBreakdown.map((t, i) => {
                const r = t.total > 0 ? t.correct / t.total : 0;
                return (
                  <ListRow
                    key={t.topicId}
                    title={t.topicName}
                    divider={i < result.topicBreakdown!.length - 1}
                    chevron={false}
                    trailing={<Badge tone={r >= 0.6 ? "success" : r >= 0.4 ? "warning" : "danger"}>{`${t.correct}/${t.total}`}</Badge>}
                  />
                );
              })}
            </Card>
          ) : null}
          {result.wrongCount > 0 ? (
            <AppText variant="bodySm" tone="soft">
              Yanlışların Kütüphane › Yanlışlarım’a eklendi; koç bir sonraki turda karıştırır.
            </AppText>
          ) : null}
        </>
      )}
      <Button title="Bugün'e dön" onPress={() => router.replace("/(tabs)")} />
    </Screen>
  );
}

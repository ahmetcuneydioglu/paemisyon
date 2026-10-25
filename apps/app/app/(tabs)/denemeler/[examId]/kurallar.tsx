import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Bell, Clock, Minus, Trophy } from "lucide-react-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RuleCard } from "@/components/domain";
import { AppText, Badge, Button, Card, Notice, Screen, Skeleton } from "@/components/ui";
import { fmtDate, fmtNet, useExam, useReminder, useSetReminder } from "@/features/exams/queries";
import { useTheme } from "@/theme/ThemeProvider";

const DIFFICULTY = { kolay: "Kolay", orta: "Orta", zor: "Zor" } as const;

/**
 * Başlamadan önce (Doc 50 M2): tam ekran kurallar. Uyarılar belirgin kart; ders dağılımı
 * (GET /exams/:id › distribution); düğme altta. Varyantlar: ilk çözüm · tekrar çözüm ·
 * haftalık beklemede · Premium kilidi. Kapı sunucuda; burada yalnız dürüst gösterim.
 */
export default function KurallarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, space } = useTheme();
  const p = useLocalSearchParams<{ examId: string; role?: string }>();
  const q = useExam(p.examId ?? null);
  const e = q.data;
  const practice = p.role === "practice" || (e?.my.official?.status === "completed" && e.canStartPractice && !e.canStartOfficial);
  const weeklyWaiting = e?.publishMode === "takvimli" && e.availability === "upcoming";
  const rem = useReminder(weeklyWaiting && e ? e.id : null);
  const setRem = useSetReminder(e?.id ?? "");
  const official = e?.my.official ?? null;
  const premiumLocked = e ? e.isPremium && !e.canStartOfficial && !e.canStartPractice && e.myState === "new" : false;

  const play = () => e && router.replace({ pathname: "/seans", params: { exam: e.id, role: practice ? "practice" : "", title: e.title } });

  return (
    <>
      <Stack.Screen options={{ title: "Başlamadan önce" }} />
      <Screen inset="none" style={{ paddingBottom: insets.bottom + space.s8 }}>
        {q.isPending ? (
          <>
            <Skeleton height={60} radiusKey="card" />
            <Skeleton height={240} radiusKey="card" />
          </>
        ) : q.isError || !e ? (
          <Notice tone="error" title="Deneme yüklenemedi">
            {q.error?.message ?? "Deneme bulunamadı."}
          </Notice>
        ) : (
          <>
            <View style={{ gap: space.s2 }}>
              <AppText variant="title">{e.title}</AppText>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                <Badge>{`${e.questionCount} soru`}</Badge>
                <Badge>{`${e.durationMinutes} dk`}</Badge>
                {e.publishMode === "takvimli" ? <Badge tone="accent">{fmtDate(e.startAt)}</Badge> : e.difficulty ? <Badge tone="accent">{DIFFICULTY[e.difficulty]}</Badge> : null}
                {e.isPremium ? <Badge tone="warning">Premium</Badge> : null}
              </View>
              {e.description ? (
                <AppText variant="body" tone="soft">
                  {e.description}
                </AppText>
              ) : null}
            </View>

            <View style={{ gap: space.s2 }}>
              {practice && official ? (
                <RuleCard icon={Trophy} tone="warning" title="Bu denemeyi zaten çözdün" body={`Tekrar çözüm sıralamayı etkilemez; resmî sonucun ${official.resultLocked ? "pencere kapanınca açıklanacak" : `${fmtNet(official.score)} net olarak kalır`}.`} />
              ) : (
                <RuleCard icon={Trophy} tone="warning" title="Sıralamaya yalnız ilk çözümün girer" body={e.publishMode === "takvimli" ? `${fmtDate(e.startAt, { hour: "2-digit", minute: "2-digit" })}'den sınav bitene kadar bir kez girebilirsin. Sonrası pratik sayılır.` : "İkinci kez çözersen pratik sayılır, sıran değişmez. Hazır olduğundan emin ol."} />
              )}
              <RuleCard icon={Clock} tone="warning" title={`${e.durationMinutes} dakika kesintisiz zaman ayır`} body="Süre başlayınca durmaz; uygulamadan çıksan da işler. Dolunca cevapların otomatik teslim edilir." />
              <RuleCard icon={Minus} tone="info" title="4 yanlış 1 doğruyu götürür" body="Puan net ile hesaplanır: doğru − yanlış/4. Boş sorular neti etkilemez." />
              {e.publishMode === "takvimli" ? <RuleCard icon={Bell} tone="accent" title="Sonuçlar pencere kapanınca açıklanır" body={`Sıralama ve Türkiye kıyası ${fmtDate(e.endAt)}'de herkese aynı anda açılır; sana bildirim göndeririz.`} /> : null}
              {e.liveAnswerReveal && !practice ? <Notice tone="info">Bu denemede şıkka basınca doğru/yanlış ve açıklama hemen görünür; cevap değiştirilemez.</Notice> : null}
            </View>

            {e.distribution.length > 0 ? (
              <Card style={{ gap: space.s2 }}>
                <AppText variant="label" tone="subtle">
                  Ders dağılımı · {e.questionCount} soru
                </AppText>
                {e.distribution.map((d, i) => (
                  <View key={d.name} style={{ flexDirection: "row", justifyContent: "space-between", gap: space.s3, paddingVertical: 6, borderBottomWidth: i < e.distribution.length - 1 ? 1 : 0, borderBottomColor: colors.line }}>
                    <AppText variant="bodySm" style={{ flex: 1 }}>
                      {d.name}
                    </AppText>
                    <AppText variant="subhead" style={{ fontVariant: ["tabular-nums"] }}>
                      {d.count}
                    </AppText>
                  </View>
                ))}
              </Card>
            ) : null}

            <View style={{ gap: space.s2 }}>
              {premiumLocked ? (
                <>
                  <Notice tone="warning">Bu deneme Premium üyelere özel.</Notice>
                  <Button title="Premium ile aç" onPress={() => router.push("/paywall")} />
                </>
              ) : weeklyWaiting ? (
                <>
                  <Button title={`${fmtDate(e.startAt)}'de açılır`} disabled />
                  <Button title={rem.data?.reminding ? "Hatırlatma açık" : "Hatırlat"} variant="secondary" loading={setRem.isPending} onPress={() => setRem.mutate(!(rem.data?.reminding ?? false))} />
                </>
              ) : e.myState === "in_progress" ? (
                <Button title="Devam et" onPress={play} />
              ) : practice ? (
                e.canStartPractice ? <Button title="Tekrar çöz" variant="secondary" onPress={play} /> : <Notice tone="info">{e.availability === "closed" ? "Bu deneme tekrar çözüme kapalı." : "Tekrar çözüm, resmî çözüm bittikten sonra açılır."}</Notice>
              ) : e.canStartOfficial ? (
                <Button title="Sınava başla" onPress={play} />
              ) : official?.status === "completed" ? (
                <Button title="Sonucunu gör" variant="secondary" onPress={() => router.replace({ pathname: "/deneme-sonuc/[attemptId]", params: { attemptId: official.attemptId } })} />
              ) : (
                <Notice tone="info">Bu deneme yeni çözüme kapalı.</Notice>
              )}
            </View>
          </>
        )}
      </Screen>
    </>
  );
}

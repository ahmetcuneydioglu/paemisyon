import { Stack, useLocalSearchParams } from "expo-router";
import { ChevronLeft, ChevronRight, Grid3x3, RotateCcw } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { QuestionOption, QuestionStem, type OptionState } from "@/components/domain";
import { AppText, Badge, Card, IconButton, Notice, Sheet, Skeleton } from "@/components/ui";
import { examApi, usePastExam } from "@/features/exams/queries";
import { readLocal, writeLocal } from "@/lib/local-store";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Çıkmış sınav çalışma modu: sunucuda tur açılmaz; cevap anahtarı yükte (dogru) olduğundan
 * istemcide puanlanır. Süre ve net yok. Cevaplar cihazda (`cikmis.calisma.<slug>`); yanlışlar
 * sunucuya bildirilir (calisma-yanlisi; kota ve puan etkilemez). İptal sorular sayıma girmez.
 */
export default function CalismaScreen() {
  const { colors, space, radius } = useTheme();
  const p = useLocalSearchParams<{ slug: string; title?: string }>();
  const q = usePastExam(p.slug ?? null);
  const [answers, setAnswers] = useState<Record<string, string> | null>(null);
  const [indexState, setIndex] = useState<number | null>(null);
  const [gridOpen, setGridOpen] = useState(false);
  const key = `cikmis.calisma.${p.slug}`;

  useEffect(() => {
    if (!p.slug) return;
    void readLocal<Record<string, string>>(key, {}).then(setAnswers);
  }, [key, p.slug]);

  const sorular = q.data?.sorular ?? [];
  const sayilan = sorular.filter((s) => !s.iptal);
  const answered = answers ? sayilan.filter((s) => answers[String(s.sira)]).length : 0;
  const correct = answers ? sayilan.filter((s) => { const h = answers[String(s.sira)]; return h && s.siklar.find((k) => k.harf === h)?.dogru; }).length : 0;

  // Açılışta ilk cevapsız soru; kullanıcı gezmeye başlayınca kendi konumu.
  const firstOpen = answers ? Math.max(0, sorular.findIndex((s) => !answers[String(s.sira)])) : 0;
  const index = indexState ?? firstOpen;

  const soru = sorular[index];
  const chosen = soru && answers ? answers[String(soru.sira)] : undefined;

  const pick = (harf: string) => {
    if (!soru || !answers || chosen) return;
    const next = { ...answers, [String(soru.sira)]: harf };
    setAnswers(next);
    void writeLocal(key, next);
    const dogruMu = soru.siklar.find((k) => k.harf === harf)?.dogru;
    if (!dogruMu && !soru.iptal) examApi.studyWrong(p.slug, { sira: soru.sira, harf }).catch(() => {});
  };

  const state = (harf: string): OptionState => {
    if (!soru || !chosen) return "default";
    const k = soru.siklar.find((x) => x.harf === harf);
    if (k?.dogru) return chosen === harf ? "correct" : "missed";
    if (chosen === harf) return "incorrect";
    return "disabled";
  };

  const restart = () =>
    Alert.alert("Baştan başla?", "Bu dönemdeki çalışma cevapların silinir.", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil ve başla", style: "destructive", onPress: () => { setAnswers({}); void writeLocal(key, {}); setIndex(0); } },
    ]);

  return (
    <>
      <Stack.Screen options={{ title: p.title ?? "Çalışma modu", headerRight: () => <IconButton icon={RotateCcw} label="Baştan başla" variant="ghost" onPress={restart} /> }} />
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {q.isPending || !answers ? (
          <View style={{ padding: space.screenGutter, gap: space.s3 }}>
            <Skeleton height={20} width="40%" />
            <Skeleton height={120} radiusKey="card" />
          </View>
        ) : q.isError ? (
          <View style={{ padding: space.screenGutter }}>
            <Notice tone="error" title="Yüklenemedi">
              {q.error.message}
            </Notice>
          </View>
        ) : !soru ? (
          <View style={{ padding: space.screenGutter }}>
            <Notice tone="info">Bu dönemde soru metni yok.</Notice>
          </View>
        ) : (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.screenGutter, paddingVertical: space.s2 }}>
              <AppText variant="bodySm" tone="soft" style={{ fontVariant: ["tabular-nums"] }}>
                Soru {index + 1}/{sorular.length}
              </AppText>
              <AppText variant="bodySm" tone="soft" style={{ fontVariant: ["tabular-nums"] }}>
                {answered} cevap · {correct} doğru
              </AppText>
            </View>
            <ScrollView contentContainerStyle={{ padding: space.screenGutter, paddingTop: 0, paddingBottom: 120, gap: space.s3 }}>
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                <Badge tone="neutral">{soru.ders}</Badge>
                {soru.iptal ? <Badge tone="warning">İptal edilen soru</Badge> : null}
              </View>
              <QuestionStem index={index + 1} total={sorular.length} stem={soru.kok} />
              {soru.siklar.map((k) => (
                <QuestionOption key={k.harf} label={k.harf} text={k.metin} state={state(k.harf)} onPress={() => pick(k.harf)} />
              ))}
              {chosen ? (
                <Card tone="alt">
                  <AppText variant="label" tone={soru.siklar.find((k) => k.harf === chosen)?.dogru ? "success" : "danger"}>
                    {soru.siklar.find((k) => k.harf === chosen)?.dogru ? "Doğru" : "Yanlış"}
                  </AppText>
                  {soru.aciklama ? <AppText variant="body">{soru.aciklama}</AppText> : <AppText variant="bodySm" tone="soft">Bu soru için açıklama henüz yazılmadı.</AppText>}
                  {soru.dayanak.length > 0 ? (
                    <AppText variant="bodySm" tone="soft">
                      Dayanak: {soru.dayanak.map((x) => x.baslik).join(" · ")}
                    </AppText>
                  ) : null}
                </Card>
              ) : null}
            </ScrollView>
            <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", gap: space.s2, paddingHorizontal: space.screenGutter, paddingVertical: space.s3, backgroundColor: colors.bg, borderTopWidth: 0.5, borderTopColor: colors.line }}>
              <IconButton icon={ChevronLeft} label="Önceki soru" disabled={index === 0} onPress={() => setIndex(Math.max(0, index - 1))} />
              <Pressable accessibilityRole="button" accessibilityLabel="Soruya git" onPress={() => setGridOpen(true)} style={{ flex: 1, minHeight: 44, borderRadius: radius.control, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 }}>
                <Grid3x3 color={colors.ink} size={18} strokeWidth={1.75} />
                <AppText variant="subhead">Soruya git</AppText>
              </Pressable>
              <IconButton icon={ChevronRight} label="Sonraki soru" variant="primary" disabled={index >= sorular.length - 1} onPress={() => setIndex(Math.min(sorular.length - 1, index + 1))} />
            </View>
          </>
        )}
      </View>

      <Sheet visible={gridOpen} onClose={() => setGridOpen(false)} title="Soruya git">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {sorular.map((s, i) => {
            const h = answers?.[String(s.sira)];
            const ok = h ? s.siklar.find((k) => k.harf === h)?.dogru : null;
            const bg = h ? (ok ? colors.successSoft : colors.dangerSoft) : colors.surface;
            const fg = h ? (ok ? colors.successInk : colors.dangerInk) : colors.ink;
            return (
              <Pressable key={s.sira} accessibilityRole="button" accessibilityLabel={`Soru ${s.sira}`} onPress={() => { setIndex(i); setGridOpen(false); }} style={{ width: 48, height: 44, borderRadius: radius.control, backgroundColor: bg, borderWidth: i === index ? 2 : 1, borderColor: i === index ? colors.accent : colors.line, alignItems: "center", justifyContent: "center" }}>
                <AppText variant="subhead" style={{ color: fg }}>
                  {s.sira}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </>
  );
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { AppText, Button, Card, Chip, ListRow, Notice, Screen, SegmentBar, Skeleton, TextField } from "@/components/ui";
import { useModules } from "@/features/catalog/queries";
import { homeKeys } from "@/features/home/queries";
import { api } from "@/lib/api";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Onboarding (Doc 24 ilk gün; Flutter ile aynı üç adım): hedef sınav · sınav tarihi · günlük
 * süre (→ soru hedefi 10/20/40). `POST /me/onboarding` idempotent; ardından İlk Devriye
 * (10 soru, kaynak home_task) ya da Bugün. Onboarding'in kendisi atlanamaz; devriye atlanır.
 */
const TEMPO = [
  { minutes: "~15 dk / gün", label: "Nöbet arası tempo", goal: 10 },
  { minutes: "~30 dk / gün", label: "Dengeli tempo (önerilen)", goal: 20 },
  { minutes: "60+ dk / gün", label: "Yoğun hazırlık", goal: 40 },
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { colors, space, radius } = useTheme();
  const modules = useModules();
  const [step, setStep] = useState(0);
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [noDate, setNoDate] = useState(false);
  const [goal, setGoal] = useState<number>(20);

  const iso = trToIso(date);
  const dateInvalid = date.trim() !== "" && !iso;

  const complete = useMutation({
    mutationFn: (body: { moduleId: string; targetExamDate?: string | null; dailyGoal?: number }) => api<{ onboardingCompleted: true }>("/me/onboarding", { method: "POST", body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: homeKeys.me });
      void qc.invalidateQueries({ queryKey: homeKeys.brief });
    },
  });

  const submit = (patrol: boolean) => {
    if (!moduleId) return;
    complete.mutate(
      { moduleId, targetExamDate: noDate ? null : iso, dailyGoal: goal },
      {
        onSuccess: () => {
          router.replace("/(tabs)");
          if (patrol) router.push({ pathname: "/seans", params: { mode: "practice", count: "10", source: "home_task", focusKind: "coach", courseId: "", topicId: "", recipe: "" } });
        },
      },
    );
  };

  return (
    <Screen style={{ paddingBottom: space.s8 }}>
      <View style={{ gap: space.s2 }}>
        <SegmentBar total={3} done={step + 1} />
        <AppText variant="label" tone="subtle">
          Adım {step + 1}/3
        </AppText>
      </View>

      {step === 0 ? (
        <>
          <View style={{ gap: space.s1 }}>
            <AppText variant="title">Hangi sınava hazırlanıyorsun?</AppText>
            <AppText variant="bodySm" tone="soft">
              Koçun her şeyi bu hedefe göre kurar.
            </AppText>
          </View>
          {modules.isPending ? (
            <Skeleton height={140} radiusKey="card" />
          ) : modules.isError ? (
            <Notice tone="error">Modüller yüklenemedi: {modules.error.message}</Notice>
          ) : (
            <Card style={{ paddingVertical: 0 }}>
              {modules.data.map((m, i) => (
                <ListRow
                  key={m.id}
                  title={m.name}
                  subtitle={m.description ?? `${m.questionCount} soru`}
                  divider={i < modules.data.length - 1}
                  chevron={false}
                  onPress={() => setModuleId(m.id)}
                  trailing={
                    <View accessibilityRole="radio" accessibilityState={{ selected: moduleId === m.id }} style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: moduleId === m.id ? colors.accent : colors.line, alignItems: "center", justifyContent: "center" }}>
                      {moduleId === m.id ? <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: colors.accent }} /> : null}
                    </View>
                  }
                />
              ))}
            </Card>
          )}
          <Button title="Devam et" disabled={!moduleId} onPress={() => setStep(1)} />
        </>
      ) : step === 1 ? (
        <>
          <View style={{ gap: space.s1 }}>
            <AppText variant="title">Sınav tarihin belli mi?</AppText>
            <AppText variant="bodySm" tone="soft">
              Tarihi bilirsek koç son 30 günde sınav moduna, son 3 günde dinlenmeye geçirir.
            </AppText>
          </View>
          <Card>
            <TextField label="Hedef tarih (GG.AA.YYYY)" value={date} onChangeText={(v) => { setDate(v); if (v.trim()) setNoDate(false); }} keyboardType="numbers-and-punctuation" placeholder="ör. 18.04.2027" error={dateInvalid ? "Tarih GG.AA.YYYY biçiminde olmalı" : null} />
            <Pressable accessibilityRole="button" accessibilityState={{ selected: noDate }} onPress={() => { setNoDate((v) => !v); setDate(""); }} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 12, borderRadius: radius.control, borderWidth: 1, borderColor: noDate ? colors.accent : colors.line, backgroundColor: noDate ? colors.accentSoft : "transparent" }}>
              <AppText variant="subhead" tone={noDate ? "accentInk" : "ink"}>
                Henüz belli değil
              </AppText>
            </Pressable>
            <AppText variant="bodySm" tone="subtle">
              Sonradan Ben › Ayarlar’dan değiştirebilirsin. Resmî tarih açıklanınca koç onu kullanır.
            </AppText>
          </Card>
          <Button title="Devam et" disabled={!(iso || noDate)} onPress={() => setStep(2)} />
          <Button title="Geri" variant="ghost" onPress={() => setStep(0)} />
        </>
      ) : (
        <>
          <View style={{ gap: space.s1 }}>
            <AppText variant="title">Günde ne kadar vakit ayırabilirsin?</AppText>
            <AppText variant="bodySm" tone="soft">
              Vardiyalı hayata küçük hedef iyi gelir; istediğin an artırırız.
            </AppText>
          </View>
          <Card style={{ paddingVertical: 0 }}>
            {TEMPO.map((t, i) => (
              <ListRow key={t.goal} title={t.minutes} subtitle={t.label} divider={i < TEMPO.length - 1} chevron={false} onPress={() => setGoal(t.goal)} trailing={<Chip label={`${t.goal} soru`} selected={goal === t.goal} onPress={() => setGoal(t.goal)} />} />
            ))}
          </Card>
          <AppText variant="bodySm" tone="soft">
            Sırada: İlk Devriye, 10 soruluk kısa bir tur. Not için değil, nereden başlayacağımızı görmek için.
          </AppText>
          {complete.isError ? <Notice tone="error">{complete.error.message}</Notice> : null}
          <Button title="İlk Devriye’ye çık · 10 soru" loading={complete.isPending} onPress={() => submit(true)} />
          <Button title="Şimdilik geç" variant="ghost" disabled={complete.isPending} onPress={() => submit(false)} />
          <Button title="Geri" variant="ghost" onPress={() => setStep(1)} />
        </>
      )}
    </Screen>
  );
}

function trToIso(tr: string): string | null {
  const m = tr.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  const d = Number(m[1]), mo = Number(m[2]), y = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

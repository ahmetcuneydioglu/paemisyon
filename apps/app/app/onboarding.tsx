import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { AppText, Button, Card, Chip, ListRow, Notice, Screen, SegmentBar, Skeleton, TextField } from "@/components/ui";
import { useModules } from "@/features/catalog/queries";
import { homeKeys } from "@/features/home/queries";
import { api } from "@/lib/api";
import { useCreatePlan } from "@/features/plan/queries";
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
  // 4. adım (Doc 49/12 F8-A): haftalık plan daveti — atlanabilir.
  const [planIstiyor, setPlanIstiyor] = useState(true);
  const createPlan = useCreatePlan();

  const iso = trToIso(date);
  const dateInvalid = date.trim() !== "" && !iso;

  const complete = useMutation({
    mutationFn: (body: { moduleId: string; targetExamDate?: string | null; dailyGoal?: number; dailyMinutes?: number }) => api<{ onboardingCompleted: true }>("/me/onboarding", { method: "POST", body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: homeKeys.me });
      void qc.invalidateQueries({ queryKey: homeKeys.brief });
    },
  });

  const dailyMinutes = goal >= 40 ? 60 : goal >= 20 ? 30 : 15;
  const submit = (patrol: boolean) => {
    if (!moduleId) return;
    complete.mutate(
      { moduleId, targetExamDate: noDate ? null : iso, dailyGoal: goal, dailyMinutes },
      {
        onSuccess: async () => {
          // Plan istendiyse onboarding'in verdiği süre/tarihle kurulur; hata akışı KESMEZ
          // (Bugün'de koçun daveti yine çıkar).
          if (planIstiyor) await createPlan.mutateAsync({}).catch(() => undefined);
          // Bugün açılmadan brief TAZE olsun: onboarding sırasında başlayan eski bir istek plan
          // kartı olmadan dönebiliyordu (göz testi, 18 Eki 2026). Pasif sorgu da yenilenir.
          await qc.invalidateQueries({ queryKey: homeKeys.brief, refetchType: "all" });
          router.replace("/(tabs)");
          if (patrol) router.push({ pathname: "/seans", params: { mode: "practice", count: "10", source: "home_task", focusKind: "coach", courseId: "", topicId: "", recipe: "" } });
        },
      },
    );
  };

  return (
    <Screen style={{ paddingBottom: space.s8 }}>
      <View style={{ gap: space.s2 }}>
        <SegmentBar total={4} done={step + 1} />
        <AppText variant="label" tone="subtle">
          Adım {step + 1}/4
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
      ) : step === 2 ? (
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
          <Button title="Devam et" onPress={() => setStep(3)} />
          <Button title="Geri" variant="ghost" onPress={() => setStep(1)} />
        </>
      ) : (
        <>
          <View style={{ gap: space.s1 }}>
            <AppText variant="title">Haftalık plan çıkarayım mı?</AppText>
            <AppText variant="bodySm" tone="soft">
              Haftada yaklaşık {dailyMinutes * 5} dakikayı sınav ağırlığına ve zayıf noktalarına göre konulara dağıtırım; her Pazartesi yenilerim.
            </AppText>
          </View>
          <Card style={{ paddingVertical: 0 }}>
            <ListRow title="Evet, planı kur" subtitle={noDate || !iso ? "Tarih yok: 12 haftalık plan; tarihi girince sınava göre ayarlanır." : "Sınav tarihine kadar haftalara dağıtılır."} chevron={false} onPress={() => setPlanIstiyor(true)} trailing={<Chip label="Önerilen" selected={planIstiyor} onPress={() => setPlanIstiyor(true)} />} />
            <ListRow title="Şimdi değil" subtitle="İstediğin zaman Bugün’den ya da Ayarlar’dan kurabilirsin." divider={false} chevron={false} onPress={() => setPlanIstiyor(false)} trailing={<Chip label="Geç" selected={!planIstiyor} onPress={() => setPlanIstiyor(false)} />} />
          </Card>
          <AppText variant="bodySm" tone="soft">
            Sırada: İlk Devriye, 10 soruluk kısa bir tur. Not için değil, nereden başlayacağımızı görmek için.
          </AppText>
          {complete.isError ? <Notice tone="error">{complete.error.message}</Notice> : null}
          <Button title="İlk Devriye’ye çık · 10 soru" loading={complete.isPending || createPlan.isPending} onPress={() => submit(true)} />
          <Button title="Şimdilik geç" variant="ghost" disabled={complete.isPending || createPlan.isPending} onPress={() => submit(false)} />
          <Button title="Geri" variant="ghost" onPress={() => setStep(2)} />
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

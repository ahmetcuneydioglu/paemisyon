import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Linking, View } from "react-native";
import { AppText, Button, Card, Chip, ListRow, Notice, Screen, SectionHeader, Sheet, Skeleton, TextField } from "@/components/ui";
import { useModules } from "@/features/catalog/queries";
import { useDeleteMe, useMeFull, useUpdateMe, type MeFull } from "@/features/me/queries";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { useTheme, type ThemePreference } from "@/theme/ThemeProvider";

const GOALS = [10, 20, 30, 40, 60, 100];

/**
 * Ayarlar (Doc 25 Bölge 5): ad, hedef sınav, sınav tarihi, günlük hedef (PATCH /me); görünüm
 * (cihaz); şifre (Supabase); yasal bağlantılar; çıkış; hesap silme ("SİL" yazarak, KVKK
 * anonimleştirme sunucuda). Bildirim saati ve vardiya düzeni F5/V2.
 */
export default function AyarlarScreen() {
  const me = useMeFull();
  if (me.isPending) {
    return (
      <Screen inset="none">
        <Skeleton height={300} radiusKey="card" />
      </Screen>
    );
  }
  if (me.isError) {
    return (
      <Screen inset="none">
        <Notice tone="error">{me.error.message}</Notice>
      </Screen>
    );
  }
  return <AyarlarForm d={me.data} />;
}

/** Form, sunucu değerleriyle bir kez kurulur (useState başlangıcı); yazarken üzerine yazılmaz. */
function AyarlarForm({ d }: { d: MeFull }) {
  const router = useRouter();
  const auth = useAuth();
  const { preference, setPreference, space } = useTheme();
  const modules = useModules();
  const update = useUpdateMe();
  const del = useDeleteMe();

  const [name, setName] = useState(d.displayName ?? "");
  const [moduleId, setModuleId] = useState<string | null>(d.preferredModule?.id ?? null);
  const [date, setDate] = useState(d.targetExamDate ? isoToTr(d.targetExamDate) : "");
  const [goal, setGoal] = useState(d.dailyGoal);
  const [pwOpen, setPwOpen] = useState(false);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [delOpen, setDelOpen] = useState(false);
  const [delText, setDelText] = useState("");

  const iso = trToIso(date);
  const dateInvalid = date.trim() !== "" && !iso;
  const dirty = name.trim() !== (d.displayName ?? "") || moduleId !== (d.preferredModule?.id ?? null) || (iso ?? null) !== (d.targetExamDate ?? null) || goal !== d.dailyGoal;

  const save = () => {
    if (dateInvalid) return;
    const body: Parameters<typeof update.mutate>[0] = {};
    if (name.trim() !== (d.displayName ?? "") && name.trim().length >= 2) body.displayName = name.trim();
    if (moduleId && moduleId !== d.preferredModule?.id) body.preferredModuleId = moduleId;
    if ((iso ?? null) !== (d.targetExamDate ?? null)) body.targetExamDate = iso ?? null;
    if (goal !== d.dailyGoal) body.dailyGoal = goal;
    update.mutate(body, { onSuccess: () => Alert.alert("Kaydedildi", "Koç yeni hedefe göre plan kurar.") });
  };

  const changePassword = async () => {
    setPwError(null);
    if (pw1.length < 8) return setPwError("Şifre en az 8 karakter olmalı.");
    if (pw1 !== pw2) return setPwError("Şifreler aynı değil.");
    setPwBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setPwBusy(false);
    if (error) return setPwError(error.message);
    setPwOpen(false);
    setPw1("");
    setPw2("");
    Alert.alert("Şifre güncellendi");
  };

  const deleteAccount = () => {
    del.mutate(undefined, {
      onSuccess: () => {
        setDelOpen(false);
        void auth.signOut();
      },
      onError: (e) => Alert.alert("Silinemedi", e.message),
    });
  };

  const themes: { value: ThemePreference; label: string }[] = [
    { value: "system", label: "Sistem" },
    { value: "dark", label: "Koyu" },
    { value: "light", label: "Açık" },
  ];

  return (
    <>
      <Screen inset="none">
        {
          <>
            <View style={{ gap: space.s2 }}>
              <SectionHeader title="Hedef" />
              <Card>
                <TextField label="Görünen ad" value={name} onChangeText={setName} autoCapitalize="words" error={name.trim().length > 0 && name.trim().length < 2 ? "En az 2 karakter" : null} />
                <AppText variant="label" tone="subtle">
                  Hedef sınav
                </AppText>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s2 }}>
                  {(modules.data ?? []).map((m) => (
                    <Chip key={m.id} label={m.name} selected={moduleId === m.id} onPress={() => setModuleId(m.id)} />
                  ))}
                  {modules.isPending ? <Skeleton height={44} width={120} radiusKey="pill" /> : null}
                </View>
                <TextField label="Sınav tarihi (GG.AA.YYYY)" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" placeholder="Belli değilse boş bırak" error={dateInvalid ? "Tarih GG.AA.YYYY biçiminde olmalı" : null} />
                <AppText variant="bodySm" tone="subtle">
                  Resmî tarih açıklanınca koç onu kullanır; buradaki kişisel hedefindir.
                </AppText>
                <AppText variant="label" tone="subtle">
                  Günlük hedef · {goal} soru
                </AppText>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s2 }}>
                  {GOALS.map((g) => (
                    <Chip key={g} label={String(g)} selected={goal === g} onPress={() => setGoal(g)} />
                  ))}
                </View>
                {update.isError ? <Notice tone="error">{update.error.message}</Notice> : null}
                <Button title="Kaydet" disabled={!dirty || dateInvalid} loading={update.isPending} onPress={save} />
              </Card>
            </View>

            <View style={{ gap: space.s2 }}>
              <SectionHeader title="Görünüm" />
              <Card>
                <View style={{ flexDirection: "row", gap: space.s2 }}>
                  {themes.map((t) => (
                    <Chip key={t.value} label={t.label} selected={preference === t.value} onPress={() => setPreference(t.value)} style={{ flex: 1, justifyContent: "center" }} />
                  ))}
                </View>
                <AppText variant="bodySm" tone="subtle">
                  Nöbet koyu temada tasarlandı; açık tema türevidir.
                </AppText>
              </Card>
            </View>

            <View style={{ gap: space.s2 }}>
              <SectionHeader title="Hesap" />
              <Card style={{ paddingVertical: 0 }}>
                <ListRow title="Şifre değiştir" subtitle={d.emailVerified ? "E-posta doğrulandı" : "E-posta doğrulanmadı"} onPress={() => setPwOpen(true)} />
                <ListRow title="Gizlilik" onPress={() => void Linking.openURL("https://www.paemisyon.com/gizlilik")} />
                <ListRow title="Kullanım koşulları" onPress={() => void Linking.openURL("https://www.paemisyon.com/kosullar")} />
                <ListRow title="Sık sorulan sorular" divider={false} onPress={() => void Linking.openURL("https://www.paemisyon.com/sss")} />
              </Card>
              <Button title="Çıkış yap" variant="secondary" onPress={() => void auth.signOut()} />
              <Button title="Hesabımı sil" variant="ghost" onPress={() => setDelOpen(true)} />
            </View>
          </>
        }
      </Screen>

      <Sheet visible={pwOpen} onClose={() => setPwOpen(false)} title="Şifre değiştir" footer={<Button title="Güncelle" loading={pwBusy} onPress={() => void changePassword()} />}>
        <TextField label="Yeni şifre" value={pw1} onChangeText={setPw1} secureTextEntry autoCapitalize="none" />
        <TextField label="Yeni şifre (tekrar)" value={pw2} onChangeText={setPw2} secureTextEntry autoCapitalize="none" error={pwError} />
        <AppText variant="bodySm" tone="subtle">
          En az 8 karakter. Google/Apple ile girdiysen şifre yerine o sağlayıcıyı kullanmaya devam edebilirsin.
        </AppText>
      </Sheet>

      <Sheet visible={delOpen} onClose={() => setDelOpen(false)} title="Hesabımı sil" footer={<Button title="Hesabı kalıcı olarak sil" variant="destructive" disabled={delText.trim().toLocaleUpperCase("tr") !== "SİL"} loading={del.isPending} onPress={deleteAccount} />}>
        <Notice tone="warning" title="Geri alınamaz">
          İlerlemen, yanlışların, notların ve üyelik kaydın anonimleştirilir; giriş bilgilerin silinir. Mağaza aboneliğini ayrıca iptal etmen gerekir.
        </Notice>
        <TextField label="Onaylamak için SİL yaz" value={delText} onChangeText={setDelText} autoCapitalize="characters" />
        <Button title="Vazgeç" variant="secondary" onPress={() => { setDelOpen(false); router.back(); }} />
      </Sheet>
    </>
  );
}

function isoToTr(iso: string): string {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}.${m}.${y}` : "";
}
function trToIso(tr: string): string | null {
  const m = tr.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  const d = Number(m[1]), mo = Number(m[2]), y = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

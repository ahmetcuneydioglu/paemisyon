import { useRouter } from "expo-router";
import { useState } from "react";
import { BookOpen, ChevronRight, Crown, X } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { DuelScopeSheet, MIXED_SCOPE, type PickedScope } from "@/components/domain";
import { AppText, Button, ChoiceTabs, IconButton, Notice, Screen, TextField } from "@/components/ui";
import { useDuelActions, useDuelHub } from "@/features/duel/queries";
import { useStudyHub } from "@/features/rooms/queries";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Salon kur (Doc 59 · Figma 21). Seçenek kümeleri (soru sayısı, süre, oyuncu sınırı) sunucudaki
 * kurallardan (`/me/duel` → rules.room) gelir; istemci sabit liste taşımaz.
 */
export default function SalonKur() {
  const router = useRouter();
  const { colors, radius, space } = useTheme();
  const hub = useDuelHub();
  const study = useStudyHub();
  const act = useDuelActions();
  const r = hub.data?.rules.room;
  const [name, setName] = useState("");
  const [isPublic, setPublic] = useState(true);
  const [scope, setScope] = useState<PickedScope>(MIXED_SCOPE);
  const [count, setCount] = useState<number | null>(null);
  const [secs, setSecs] = useState<number | null>(null);
  const [max, setMax] = useState<number | null>(null);
  const [sheet, setSheet] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const ad = name.replace(/\s+/g, " ").trim();
  const adHata = ad.length > 0 && ad.length < 3 ? "En az 3 karakter." : null;
  const questionCount = count ?? r?.questionCounts[0] ?? 10;
  const secondsPerQuestion = secs ?? r?.secondsOptions[1] ?? r?.secondsOptions[0] ?? 20;
  const maxPlayers = max ?? r?.maxPlayers ?? 8;
  const players = r ? Array.from({ length: r.maxPlayers - r.minPlayers + 1 }, (_, i) => r.minPlayers + i) : [];

  const kur = () => {
    setHata(null);
    act.createRoom.mutate(
      { name: ad, isPublic, scopeKind: scope.kind, ...(scope.id ? { scopeId: scope.id } : {}), questionCount, secondsPerQuestion, maxPlayers },
      { onSuccess: (m) => router.replace({ pathname: "/duello/mac/[id]", params: { id: m.matchId } }), onError: (e) => setHata(e.message) },
    );
  };

  return (
    <>
      <Screen refresh={false}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.s3 }}>
          <IconButton icon={X} label="Kapat" onPress={() => router.back()} />
          <AppText variant="title" accessibilityRole="header" style={{ flex: 1 }}>
            Salon kur
          </AppText>
        </View>
        <TextField label="Salon adı" placeholder="Örn. Gece Nöbeti" value={name} onChangeText={setName} maxLength={24} error={adHata} hint={`${ad.length} / 24`} />
        <Field label="Kimler girebilir">
          <ChoiceTabs variant="segmented" label="Kimler girebilir" value={isPublic ? "acik" : "ozel"} onChange={(v) => setPublic(v === "acik")} options={[{ value: "acik", label: "Herkese açık" }, { value: "ozel", label: "Özel (kodla)" }]} />
          <AppText variant="bodySm" tone="soft">
            {isPublic ? "Sınavının adayları açık salonlar listesinde görür." : "Listede görünmez; yalnız kodu bilen ya da davet edilen girer."}
          </AppText>
        </Field>
        <Field label="Konu">
          <Pressable accessibilityRole="button" accessibilityLabel={`Konu: ${scope.label}. Değiştir`} onPress={() => setSheet(true)} style={({ pressed }) => ({ minHeight: 52, flexDirection: "row", alignItems: "center", gap: space.s3, paddingHorizontal: space.s4, paddingVertical: space.s2, borderRadius: radius.control, borderWidth: 1, borderColor: colors.line, backgroundColor: pressed ? colors.surfaceAlt : colors.surface })}>
            <BookOpen size={20} strokeWidth={1.75} color={colors.inkSoft} />
            <AppText variant="subhead" style={{ flex: 1 }}>
              {scope.label}
            </AppText>
            <AppText variant="bodySm" tone="accent">
              Değiştir
            </AppText>
            <ChevronRight size={18} strokeWidth={1.75} color={colors.inkSoft} />
          </Pressable>
        </Field>
        {r ? (
          <>
            <Field label="Soru sayısı">
              <ChoiceTabs variant="segmented" label="Soru sayısı" value={String(questionCount)} onChange={(v) => setCount(Number(v))} options={r.questionCounts.map((n) => ({ value: String(n), label: String(n) }))} />
            </Field>
            <Field label="Soru başına süre">
              <ChoiceTabs variant="segmented" label="Soru başına süre" value={String(secondsPerQuestion)} onChange={(v) => setSecs(Number(v))} options={r.secondsOptions.map((n) => ({ value: String(n), label: `${n} sn` }))} />
            </Field>
            <Field label="En çok oyuncu">
              <ChoiceTabs variant="segmented" label="En çok oyuncu" value={String(maxPlayers)} onChange={(v) => setMax(Number(v))} options={players.map((n) => ({ value: String(n), label: String(n) }))} />
            </Field>
          </>
        ) : null}
        {hata ? <Notice tone="error">{hata}</Notice> : null}
        <View style={{ gap: space.s2 }}>
          <Button title="Salonu kur" icon={<Crown size={20} color={colors.onAccent} />} disabled={ad.length < 3 || !r} loading={act.createRoom.isPending} onPress={kur} />
          <AppText variant="bodySm" tone="soft" style={{ textAlign: "center" }}>
            Kuran kişi başkan olur. En az {r?.minPlayers ?? 3} kişi hazır olunca oyunu başlatırsın.
          </AppText>
        </View>
      </Screen>
      <DuelScopeSheet visible={sheet} onClose={() => setSheet(false)} moduleId={study.data?.module?.id ?? null} value={scope} onPick={setScope} />
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { space } = useTheme();
  return (
    <View style={{ gap: space.s2 }}>
      <AppText variant="label" tone="subtle">
        {label}
      </AppText>
      {children}
    </View>
  );
}

import { useState } from "react";
import { Pressable, View } from "react-native";
import { AppText, Button, Card, Chip, Notice, Sheet, Skeleton, TextField } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { formatMinutes, useCreatePlan, usePlanDefaults, useRevisePlan, type Plan } from "./queries";

/** Haftalık süre seçenekleri (dakika): 1–14 saat arası, kullanıcıların gerçekçi aralığı. */
const SURELER = [60, 120, 180, 300, 420, 600, 840];

/**
 * Plan kur / yenile sheet'i (Doc 49/12 F8-A §5). Girdiler: haftalık süre (çipler, 30 dk
 * adımı sunucuda yuvarlanır) ve sınav tarihi (GG.AA.YYYY ya da "belli değil"). Tarih
 * sunucuda kullanıcının hedef tarihine de yazılır (tek kaynak). Özet cümle sunucudan gelen
 * kapsam yüzdesiyle sonuç ekranında gösterilir; burada söz vermeyiz.
 */
export function PlanSheet({ visible, onClose, mode, current, onDone }: { visible: boolean; onClose: () => void; mode: "create" | "revise"; current?: Plan | null; onDone?: (plan: Plan) => void }) {
  const { colors, radius, space } = useTheme();
  const defaults = usePlanDefaults(visible);
  const create = useCreatePlan();
  const revise = useRevisePlan();
  const [minutes, setMinutes] = useState<number | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [noDate, setNoDate] = useState<boolean | null>(null);

  const onerilen = current?.weeklyMinutes ?? defaults.data?.suggestedWeeklyMinutes ?? 300;
  const secili = minutes ?? onerilen;
  // Mevcut/önerilen süre listede yoksa (ör. 2 sa 30 dk) çip olarak eklenir; seçili hep görünür.
  const sureler = [...new Set([...SURELER, onerilen, secili])].sort((a, b) => a - b);
  const mevcutTarih = current?.examDate ?? defaults.data?.examDate ?? null;
  const tarihMetni = date ?? (mevcutTarih ? isoToTr(mevcutTarih) : "");
  const tarihYok = noDate ?? (!mevcutTarih && date == null);
  const iso = trToIso(tarihMetni);
  const dateInvalid = !tarihYok && tarihMetni.trim() !== "" && !iso;
  const busy = create.isPending || revise.isPending;
  const err = create.error ?? revise.error;

  const submit = () => {
    const body = {
      weeklyMinutes: secili,
      // Tarih yalnız kullanıcı dokunduysa gönderilir; dokunmadıysa sunucu mevcut hedefi kullanır.
      ...(tarihYok ? { examDate: null } : date != null && iso ? { examDate: iso } : {}),
    };
    const m = mode === "create" ? create : revise;
    m.mutate(body, {
      onSuccess: (r) => {
        onDone?.(r.plan);
        onClose();
      },
    });
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={mode === "create" ? "Haftalık planı kur" : "Planı yenile"}
      footer={<Button title={mode === "create" ? "Planı kur" : "Yeniden kur"} loading={busy} disabled={dateInvalid || defaults.isPending} onPress={submit} />}
    >
      {defaults.isPending ? (
        <Skeleton height={120} radiusKey="card" />
      ) : defaults.isError ? (
        <Notice tone="error">{defaults.error.message}</Notice>
      ) : !defaults.data.examTypeId ? (
        <Notice tone="warning" title="Önce hedef sınavını seç">
          Plan, sınavın müfredatı ve ağırlıklarıyla kurulur. Ben › Ayarlar’dan hedef sınavı seç.
        </Notice>
      ) : (
        <>
          <AppText variant="bodySm" tone="soft">
            {defaults.data.examTypeName} müfredatı, sınav ağırlıkları ve zayıf konularına göre haftalara dağıtılır. Her Pazartesi plan taze verilerle yenilenir.
          </AppText>

          <Card style={{ gap: space.s2 }}>
            <AppText variant="subhead">Haftada ne kadar çalışabilirsin?</AppText>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s2 }}>
              {sureler.map((m) => (
                <Chip key={m} label={formatMinutes(m)} selected={secili === m} onPress={() => setMinutes(m)} />
              ))}
            </View>
            <AppText variant="bodySm" tone="subtle">
              {defaults.data.dailyMinutes ? `Günlük ${defaults.data.dailyMinutes} dk tercihine göre öneri: ${formatMinutes(defaults.data.suggestedWeeklyMinutes)}.` : `Öneri: ${formatMinutes(defaults.data.suggestedWeeklyMinutes)}. İstediğin zaman değiştirebilirsin.`}
            </AppText>
          </Card>

          <Card style={{ gap: space.s2 }}>
            <AppText variant="subhead">Sınav tarihi</AppText>
            {!tarihYok ? (
              <TextField label="Hedef tarih (GG.AA.YYYY)" value={tarihMetni} onChangeText={(v) => { setDate(v); setNoDate(false); }} keyboardType="numbers-and-punctuation" placeholder="ör. 18.04.2027" error={dateInvalid ? "Tarih GG.AA.YYYY biçiminde olmalı" : null} />
            ) : null}
            <Pressable accessibilityRole="button" accessibilityState={{ selected: tarihYok }} onPress={() => { setNoDate(!tarihYok); if (!tarihYok) setDate(""); }} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 12, borderRadius: radius.control, borderWidth: 1, borderColor: tarihYok ? colors.accent : colors.line, backgroundColor: tarihYok ? colors.accentSoft : "transparent" }}>
              <AppText variant="subhead" tone={tarihYok ? "accentInk" : "ink"}>
                Henüz belli değil
              </AppText>
            </Pressable>
            <AppText variant="bodySm" tone="subtle">
              {tarihYok ? "Tarih yoksa plan 12 haftalık kurulur; tarihi girince sınava göre yeniden dağıtırım." : defaults.data.examDateSource === "official" && date == null ? "Resmî sınav tarihi kullanılıyor." : "Tarih geri sayımda ve koçta da kullanılır."}
            </AppText>
          </Card>

          {mode === "revise" ? (
            <AppText variant="bodySm" tone="soft">
              Geçmiş haftalar değişmez; bu hafta ve sonrası yeni süreye göre yeniden kurulur, bu haftanın ilerlemen korunur.
            </AppText>
          ) : current ? (
            <Notice tone="warning">Mevcut planın arşivlenir; yenisi bugünden başlar.</Notice>
          ) : null}
          {err ? <Notice tone="error">{err.message}</Notice> : null}
        </>
      )}
    </Sheet>
  );
}

export function trToIso(tr: string): string | null {
  const m = tr.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  const d = Number(m[1]), mo = Number(m[2]), y = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function isoToTr(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

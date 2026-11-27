import { useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DuelAvatar } from "@/components/domain";
import { AppText, ChoiceTabs, Notice, Screen, Skeleton } from "@/components/ui";
import { points } from "@/features/duel/clock";
import { useDuelLeaderboard } from "@/features/duel/queries";
import type { DuelLeaderboardRow } from "@/features/duel/types";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Düello sıralaması (Doc 59 · Figma 40). Sıra, sütun adı ve "bir üst sıraya …" cümlesi sunucudan;
 * istemci hiçbir sıralama hesabı yapmaz. Kendi satırım listede aşağıda olsa da altta sabit durur.
 */
export default function DuelloSiralama() {
  const { colors, space } = useTheme();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"duel" | "room">("duel");
  const [period, setPeriod] = useState<"week" | "month" | "all">("week");
  const [scope, setScope] = useState<"module" | "all">("module");
  const q = useDuelLeaderboard(mode, period, scope);
  const d = q.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Screen inset="none">
        <View style={{ gap: space.s2 }}>
          <ChoiceTabs variant="segmented" label="Mod" value={mode} onChange={(v) => setMode(v as typeof mode)} options={[{ value: "duel", label: "1'e 1" }, { value: "room", label: "Salon" }]} />
          <ChoiceTabs variant="segmented" label="Dönem" value={period} onChange={(v) => setPeriod(v as typeof period)} options={[{ value: "week", label: "Haftalık" }, { value: "month", label: "Aylık" }, { value: "all", label: "Tüm zamanlar" }]} />
          <ChoiceTabs variant="segmented" label="Kapsam" value={scope} onChange={(v) => setScope(v as typeof scope)} options={[{ value: "module", label: "Kurumum" }, { value: "all", label: "Genel" }]} />
        </View>
        {q.isPending ? (
          <View style={{ gap: space.s2 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} height={60} radiusKey="card" />
            ))}
          </View>
        ) : q.isError ? (
          <Notice tone="error" title="Sıralama yüklenemedi">
            {q.error.message}
          </Notice>
        ) : d && d.top.length === 0 ? (
          <AppText variant="bodySm" tone="soft">
            Bu dönemde henüz tamamlanmış maç yok.
          </AppText>
        ) : (
          <View style={{ gap: space.s2 }}>
            {d?.top.map((r) => <Row key={r.userId} r={r} label={d.pointsLabel} />)}
          </View>
        )}
      </Screen>
      {d ? (
        <View style={{ paddingHorizontal: space.screenGutter, paddingTop: space.s3, paddingBottom: Math.max(insets.bottom, space.s3), gap: space.s2, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg }}>
          {/* Kendi satırım listede zaten görünür yerdeyse (ilk beş) ikinci kez sabitlenmez. */}
          {d.me && d.me.rank > 5 ? <Row r={d.me} label={d.pointsLabel} pinned /> : null}
          <AppText variant="bodySm" tone="soft" style={{ textAlign: "center" }}>
            {d.nextLine.replace(/\.$/, "")}
            {d.total > 0 ? ` · ${d.total} oyuncu` : ""}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

function Row({ r, label, pinned = false }: { r: DuelLeaderboardRow; label: string; pinned?: boolean }) {
  const { colors, radius, space } = useTheme();
  const top3 = r.rank <= 3;
  const mine = r.isMe || pinned;
  return (
    <View
      accessible
      accessibilityLabel={`${r.rank}. ${r.isMe ? "Sen" : r.name}, ${r.wins} galibiyet, ${r.points} ${label}`}
      style={{ minHeight: 60, flexDirection: "row", alignItems: "center", gap: space.s3, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.card, borderWidth: 1, borderColor: mine || r.rank === 1 ? colors.accent : colors.line, backgroundColor: mine ? colors.accentSoft : colors.surface }}
    >
      <View style={{ minWidth: 30, height: 30, borderRadius: 15, paddingHorizontal: 4, alignItems: "center", justifyContent: "center", backgroundColor: r.rank === 1 ? colors.accent : top3 ? colors.accentSoft : "transparent" }}>
        <AppText variant="subhead" maxFontSizeMultiplier={1.2} style={{ color: r.rank === 1 ? colors.onAccent : top3 ? colors.accentInk : colors.inkSoft, fontSize: 14, lineHeight: 18, fontVariant: ["tabular-nums"] }}>
          {r.rank}
        </AppText>
      </View>
      <DuelAvatar name={r.name} avatarUrl={r.avatarUrl} size={40} ring={mine || r.rank === 1 ? "accent" : "none"} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText variant="subhead" numberOfLines={1}>
          {r.isMe ? "Sen" : r.name}
        </AppText>
        <AppText variant="bodySm" tone="soft" numberOfLines={1}>
          {r.wins} galibiyet{r.winRate == null ? "" : ` · %${r.winRate}`}
        </AppText>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <AppText variant="stat" maxFontSizeMultiplier={1.3}>
          {points(r.points)}
        </AppText>
        <AppText variant="bodySm" tone="soft" maxFontSizeMultiplier={1.3}>
          {label}
        </AppText>
      </View>
    </View>
  );
}

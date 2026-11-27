import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Clock, Swords, X } from "lucide-react-native";
import { View } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText, Button, IconButton } from "@/components/ui";
import { mmss } from "@/features/duel/clock";
import { useDuelActions, useDuelQueue } from "@/features/duel/queries";
import { useDuelInbox } from "@/features/duel/use-duel-match";
import { useMyId } from "@/features/duel/use-my-id";
import type { DuelScope, DuelScopeKind } from "@/features/duel/types";
import { useNow } from "@/lib/use-now";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Rakip aranıyor (Doc 59 · Figma 02, 02b). Kuyruk kaydı sunucudadır; bu ekran yoklayarak kaydı
 * canlı tutar. Eşleşince maça geçer, süre dolunca "şu an kimse yok" durumuna döner.
 * Ekrandan çıkmak kuyruktan çıkarır (arka plandaki kayıt 20 sn'de kendiliğinden düşer).
 */
export default function RakipAra() {
  const router = useRouter();
  const { colors, space } = useTheme();
  const insets = useSafeAreaInsets();
  const p = useLocalSearchParams<{ scopeKind?: string; scopeId?: string; label?: string }>();
  const scope: DuelScope = { kind: (p.scopeKind as DuelScopeKind) || "mixed", id: p.scopeId || null };
  const q = useDuelQueue(true);
  const act = useDuelActions();
  const now = useNow(1000);
  const gone = useRef(false);
  const st = q.data;

  const go = (matchId: string) => {
    if (gone.current) return;
    gone.current = true;
    router.replace({ pathname: "/duello/mac/[id]", params: { id: matchId } });
  };
  useDuelInbox(useMyId(), (e) => {
    if (e.event === "matched" && e.matchId) go(e.matchId);
  });
  useEffect(() => {
    if (st?.status === "matched") go(st.matchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st]);

  const cancelQueue = act.cancelQueue.mutate;
  useEffect(
    () => () => {
      if (!gone.current) cancelQueue();
    },
    [cancelQueue],
  );

  const bitti = st?.status === "timeout" || st?.status === "idle";
  const gecen = st?.status === "searching" ? Math.max(0, now - Date.parse(st.since)) : 0;
  const tekrar = () => act.enqueue.mutate(scope, { onSuccess: (r) => (r.status === "matched" ? go(r.matchId) : void q.refetch()) });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + space.s2, paddingBottom: insets.bottom + space.s5, paddingHorizontal: space.screenGutter }}>
      <IconButton icon={X} label="Aramayı bırak" onPress={() => router.back()} />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: space.s6 }}>
        <SearchRings active={!bitti} />
        <View style={{ alignItems: "center", gap: space.s2 }}>
          <AppText variant="title" accessibilityRole="header" accessibilityLiveRegion="polite" style={{ textAlign: "center" }}>
            {bitti ? "Şu an kimse yok" : "Rakip aranıyor"}
          </AppText>
          <AppText variant="bodySm" tone="soft" style={{ textAlign: "center" }}>
            {bitti ? `${p.label ?? "Karışık"} seçiminde rakip çıkmadı.` : `${p.label ?? "Karışık"} · kendi sınavının adayları`}
          </AppText>
        </View>
        {!bitti ? (
          <View style={{ minHeight: 36, flexDirection: "row", alignItems: "center", gap: space.s2, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}>
            <Clock size={16} strokeWidth={1.75} color={colors.inkSoft} />
            <AppText variant="subhead" maxFontSizeMultiplier={1.3} style={{ fontVariant: ["tabular-nums"] }}>
              {mmss(gecen)}
            </AppText>
          </View>
        ) : null}
        {q.isError ? (
          <AppText variant="bodySm" tone="danger" style={{ textAlign: "center" }}>
            Bağlantı kurulamıyor; yeniden deneniyor.
          </AppText>
        ) : null}
      </View>
      <View style={{ gap: space.s3 }}>
        <AppText variant="bodySm" tone="soft" style={{ textAlign: "center" }}>
          {bitti ? "Arkadaşını çağırabilir ya da kodla oynayabilirsin." : "45 saniyede kimse çıkmazsa haber veririz; kuyruktan istediğin an çıkabilirsin."}
        </AppText>
        {bitti ? <Button title="Tekrar ara" loading={act.enqueue.isPending} onPress={tekrar} /> : null}
        <Button title={bitti ? "Düelloya dön" : "Vazgeç"} variant="secondary" onPress={() => router.back()} />
      </View>
    </View>
  );
}

/** Arama halkaları: dıştaki iki halka yavaşça genişleyip söner. Hareket azaltma açıksa sabit durur. */
function SearchRings({ active }: { active: boolean }) {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (!active || reduce) {
      cancelAnimation(t);
      t.value = 0;
      return;
    }
    t.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false);
    return () => cancelAnimation(t);
  }, [active, reduce, t]);
  const outer = useAnimatedStyle(() => ({ opacity: 0.5 - t.value * 0.4, transform: [{ scale: 1 + t.value * 0.08 }] }));
  const mid = useAnimatedStyle(() => ({ opacity: 0.9 - t.value * 0.4, transform: [{ scale: 1 + t.value * 0.05 }] }));
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 232, height: 232, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={[{ position: "absolute", width: 232, height: 232, borderRadius: 116, borderWidth: 1, borderColor: colors.line }, outer]} />
      <Animated.View style={[{ position: "absolute", width: 168, height: 168, borderRadius: 84, borderWidth: 1, borderColor: active ? colors.accent : colors.line }, mid]} />
      <View style={{ width: 104, height: 104, borderRadius: 52, borderWidth: 2, alignItems: "center", justifyContent: "center", borderColor: active ? colors.accent : colors.line, backgroundColor: active ? colors.accentSoft : colors.surface }}>
        <Swords size={40} strokeWidth={1.75} color={active ? colors.accentInk : colors.inkSoft} />
      </View>
    </View>
  );
}

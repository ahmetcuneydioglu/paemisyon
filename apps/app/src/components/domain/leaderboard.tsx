import { Crown } from "lucide-react-native";
import { useEffect, useId, useState, type ReactNode } from "react";
import { Animated, Easing, Image, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { AppText, Card } from "@/components/ui";
import { fmtInt, initials, motivationLine } from "@/features/progress/leaderboard-text";
import type { Leaderboard, LeaderboardRow } from "@/features/progress/queries";
import { useReduceMotion } from "@/lib/use-reduce-motion";
import { useTheme } from "@/theme/ThemeProvider";
import { CHAMPION_HALO, rankTier, withAlpha, xpProgress } from "@/theme/rank-tier";
import { motion } from "@/theme/tokens";

/**
 * Liderlik parçaları (Doc 24 §5 gamification; web `components/leaderboard/*` ile aynı tasarım
 * dili, 5 Kas 2026): lig renkli rütbe rozeti, lig halkalı avatar, seviye ilerleme çubuğu, kürsü
 * (2·1·3 — 1. taçlı + nefes alan altın halo), tablo satırı ve "senin sıran" kartı. Hiçbiri ekrana
 * bağlı değil: liderlik ekranı, galeri ve ileride profil aynı parçaları kullanır. Lig renkleri
 * `theme/rank-tier.ts`'ten (madalya rengi — tema token'ı değil). Süs animasyonları "hareketi
 * azalt" açıkken kapanır.
 */

/* ---------------------------------------------------------------- Degrade zemin */

/** Mutlak konumlu SVG degrade — kap `overflow: hidden` + köşe yarıçapıyla keser. */
function GradientFill({ colors, shape }: { colors: readonly [string, string]; shape: "pill" | "circle" }) {
  const id = `lg${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors[0]} />
          <Stop offset="1" stopColor={colors[1]} />
        </LinearGradient>
      </Defs>
      {shape === "circle" ? <Circle cx="50%" cy="50%" r="50%" fill={`url(#${id})`} /> : <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />}
    </Svg>
  );
}

/* ---------------------------------------------------------------- Rütbe rozeti */

/** Rütbe + lig rozeti: polis rütbe adı, lig degradesi üstünde; `showLeague` "· Altın" ekini açar. */
export function RankTierBadge({ level, rankName, showLeague = true, size = "md", style }: { level: number; rankName: string; showLeague?: boolean; size?: "sm" | "md"; style?: StyleProp<ViewStyle> }) {
  const { radius } = useTheme();
  const tier = rankTier(level);
  const sm = size === "sm";
  const text = { color: tier.ink, textTransform: "none" as const, letterSpacing: 0.2, fontSize: sm ? 11 : 12, lineHeight: sm ? 14 : 16 };
  return (
    <View
      accessible
      accessibilityLabel={`${rankName} rütbesi, ${tier.league} lig`}
      style={[{ alignSelf: "flex-start", maxWidth: "100%", flexDirection: "row", alignItems: "center", gap: 5, borderRadius: radius.pill, overflow: "hidden", paddingHorizontal: sm ? 8 : 10, paddingVertical: sm ? 3 : 4 }, style]}
    >
      <GradientFill colors={tier.grad} shape="pill" />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tier.ink, opacity: 0.85 }} />
      <AppText variant="label" numberOfLines={1} style={[text, { flexShrink: 1 }]}>
        {rankName}
      </AppText>
      {showLeague ? (
        <AppText variant="label" style={[text, { opacity: 0.8 }]}>
          · {tier.league}
        </AppText>
      ) : null}
    </View>
  );
}

/* ---------------------------------------------------------------- Avatar */

const AVATAR = {
  sm: { box: 36, ring: 2, font: 13 },
  md: { box: 48, ring: 2, font: 16 },
  lg: { box: 64, ring: 3, font: 20 },
  xl: { box: 80, ring: 4, font: 26 },
} as const;

/** Lig rengiyle çerçevelenmiş dairesel avatar; görsel yoksa (ya da yüklenemezse) baş harfler lig degradesi üstünde. */
export function LeaderboardAvatar({ name, avatarUrl, level, size = "md" }: { name: string; avatarUrl: string | null; level: number; size?: keyof typeof AVATAR }) {
  const tier = rankTier(level);
  const s = AVATAR[size];
  const inner = s.box - s.ring * 2;
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(avatarUrl) && !failed;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: s.box, height: s.box, borderRadius: s.box / 2, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
      <GradientFill colors={tier.grad} shape="circle" />
      {showImage ? (
        <Image source={{ uri: avatarUrl ?? undefined }} onError={() => setFailed(true)} style={{ width: inner, height: inner, borderRadius: inner / 2 }} />
      ) : (
        <AppText variant="heading" style={{ color: tier.ink, fontSize: s.font, lineHeight: Math.round(s.font * 1.25) }}>
          {initials(name)}
        </AppText>
      )}
    </View>
  );
}

/* ---------------------------------------------------------------- Seviye ilerlemesi */

/** XP'nin bir sonraki rütbeye yaklaşması; dolum açılışta 0'dan hedefe akar (web `lb-xp-fill`). */
export function XpProgress({ xp, level }: { xp: number; level: number }) {
  const { colors } = useTheme();
  const reduce = useReduceMotion();
  const tier = rankTier(level);
  const { pct, toNext, nextMin } = xpProgress(xp, level);
  const caption = nextMin == null ? "En yüksek rütbe" : `Bir üst rütbeye ${fmtInt(toNext)} XP`;
  // Animated değerleri `useState` tembel kurucusuyla (projedeki desen; `useRef.current` render'da okunamaz — react-hooks/refs).
  const [fill] = useState(() => new Animated.Value(reduce ? 1 : 0));
  useEffect(() => {
    if (reduce) {
      fill.setValue(1);
      return;
    }
    fill.setValue(0);
    const a = Animated.timing(fill, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [fill, reduce, xp, level]);
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={`Rütbe ilerlemesi yüzde ${pct}. ${caption}`} accessibilityValue={{ min: 0, max: 100, now: pct }} style={{ gap: 4 }}>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: "hidden" }}>
        <Animated.View style={{ width: `${pct}%`, height: "100%", borderRadius: 4, overflow: "hidden", transformOrigin: "left", transform: [{ scaleX: fill }] }}>
          <GradientFill colors={tier.grad} shape="pill" />
        </Animated.View>
      </View>
      <AppText variant="bodySm" tone="subtle">
        {caption}
      </AppText>
    </View>
  );
}

/* ---------------------------------------------------------------- Hareket yardımcıları */

/** 0→1→0 nefes (2,6 s döngü); "hareketi azalt" açıkken orta değerde sabit. */
function useBreath(reduce: boolean) {
  const [v] = useState(() => new Animated.Value(reduce ? 0.5 : 0));
  useEffect(() => {
    if (reduce) {
      v.stopAnimation();
      v.setValue(0.5);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, reduce]);
  return v;
}

/** Kademeli giriş: sırasına göre gecikmeli belirme + 6 pt yukarı kayma (web `lb-row-in`). */
function EnterRow({ index, children }: { index: number; children: ReactNode }) {
  const reduce = useReduceMotion();
  const [v] = useState(() => new Animated.Value(reduce ? 1 : 0));
  useEffect(() => {
    if (reduce) {
      v.setValue(1);
      return;
    }
    const a = Animated.timing(v, { toValue: 1, duration: motion.enter.ms + 140, delay: Math.min(index, 12) * motion.stagger.ms, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [v, reduce, index]);
  return <Animated.View style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] }}>{children}</Animated.View>;
}

/* ---------------------------------------------------------------- Kürsü */

/** Sıra numarası rozeti — avatarın sağ altında. */
function PlaceBadge({ place }: { place: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ position: "absolute", right: -4, bottom: -4, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, alignItems: "center", justifyContent: "center" }}>
      <AppText variant="label" style={{ textTransform: "none", fontSize: 12, lineHeight: 14 }}>
        {place}
      </AppText>
    </View>
  );
}

/** 1. sıra: süzülen taç + avatarın arkasında nefes alan altın halo (tek Animated değer ikisini sürer). */
function ChampionAvatar({ row }: { row: LeaderboardRow }) {
  const { colors } = useTheme();
  const reduce = useReduceMotion();
  const breath = useBreath(reduce);
  const box = AVATAR.xl.box;
  const halo = box + 24;
  return (
    <View style={{ width: box, height: box, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: halo,
          height: halo,
          borderRadius: halo / 2,
          backgroundColor: CHAMPION_HALO,
          opacity: breath.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.34] }),
          transform: [{ scale: breath.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.12] }) }],
        }}
      />
      <Animated.View pointerEvents="none" style={{ position: "absolute", top: -30, transform: [{ translateY: breath.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }] }}>
        <Crown size={24} color={colors.accent} strokeWidth={2} />
      </Animated.View>
      <LeaderboardAvatar name={row.displayName} avatarUrl={row.avatarUrl} level={row.level} size="xl" />
      <PlaceBadge place={1} />
    </View>
  );
}

function PodiumSlot({ row, place }: { row: LeaderboardRow; place: 1 | 2 | 3 }) {
  const { colors, radius, space } = useTheme();
  const first = place === 1;
  const tier = rankTier(row.level);
  const box = first ? AVATAR.xl.box : AVATAR.lg.box;
  return (
    <View
      accessible
      accessibilityLabel={`${place}. sıra: ${row.displayName}${row.isMe ? " (sen)" : ""}, ${row.rankName}, ${fmtInt(row.points)} puan`}
      style={{
        alignItems: "center",
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        borderWidth: first ? 1 : StyleSheet.hairlineWidth,
        borderColor: row.isMe ? colors.accent : first ? withAlpha(tier.glow, 0.45) : colors.line,
        paddingTop: first ? space.s8 : space.s5,
        paddingBottom: space.s4,
        paddingHorizontal: space.s3,
        gap: 6,
      }}
    >
      {first ? (
        <ChampionAvatar row={row} />
      ) : (
        <View style={{ width: box, height: box }}>
          <LeaderboardAvatar name={row.displayName} avatarUrl={row.avatarUrl} level={row.level} size="lg" />
          <PlaceBadge place={place} />
        </View>
      )}
      <AppText variant={first ? "heading" : "subhead"} tone={row.isMe ? "accentInk" : "ink"} numberOfLines={1} style={{ textAlign: "center", maxWidth: "100%", marginTop: space.s2 }}>
        {row.displayName}
      </AppText>
      <RankTierBadge level={row.level} rankName={row.rankName} size="sm" showLeague={false} style={{ alignSelf: "center" }} />
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: 2 }}>
        <AppText variant="stat">{fmtInt(row.points)}</AppText>
        <AppText variant="bodySm" tone="soft">
          puan
        </AppText>
      </View>
    </View>
  );
}

/** İlk 3 — kürsü düzeni (2 · 1 · 3), 1. büyük + taç + halo + lig rengi ince çerçeve. */
export function LeaderboardPodium({ rows }: { rows: LeaderboardRow[] }) {
  const { space } = useTheme();
  const [first, second, third] = rows;
  if (!first) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: space.s2 }}>
      <View style={{ flex: 1 }}>{second ? <PodiumSlot row={second} place={2} /> : null}</View>
      <View style={{ flex: 1 }}>
        <PodiumSlot row={first} place={1} />
      </View>
      <View style={{ flex: 1 }}>{third ? <PodiumSlot row={third} place={3} /> : null}</View>
    </View>
  );
}

/* ---------------------------------------------------------------- Tablo */

const COL = { rank: 28, stat: 56, points: 64 } as const;

function StatCell({ children }: { children: string }) {
  return (
    <AppText variant="bodySm" tone="soft" style={{ width: COL.stat, textAlign: "right", fontVariant: ["tabular-nums"] }}>
      {children}
    </AppText>
  );
}

/**
 * Tablo satırı: sıra · lig halkalı avatar · ad (+ "sen") ve rütbe · lig rozeti · puan.
 * `wide` (≥ 600 pt): XP / Doğru / Başarı / Quiz sütunları açılır (web md–lg kırılımı); dar
 * ekranda XP ve başarı puanın altında tek satırda.
 */
export function LeaderboardListRow({ row, wide = false, divider = true }: { row: LeaderboardRow; wide?: boolean; divider?: boolean }) {
  const { colors, space } = useTheme();
  const accuracy = Math.round(row.accuracy);
  return (
    <View
      accessible
      accessibilityLabel={`${row.rank}. sıra: ${row.displayName}${row.isMe ? " (sen)" : ""}, ${row.rankName}, ${fmtInt(row.points)} puan, ${fmtInt(row.xp)} XP, yüzde ${accuracy} başarı`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.s3,
        paddingVertical: space.s3,
        paddingHorizontal: space.s4,
        minHeight: 56,
        backgroundColor: row.isMe ? colors.accentSoft : "transparent",
        borderBottomWidth: divider ? StyleSheet.hairlineWidth : 0,
        borderBottomColor: colors.line,
      }}
    >
      <AppText variant="subhead" tone="soft" style={{ width: COL.rank, textAlign: "center", fontVariant: ["tabular-nums"] }}>
        {row.rank}
      </AppText>
      <LeaderboardAvatar name={row.displayName} avatarUrl={row.avatarUrl} level={row.level} size="sm" />
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
          <AppText variant="subhead" tone={row.isMe ? "accentInk" : "ink"} numberOfLines={1} style={{ flexShrink: 1 }}>
            {row.displayName}
          </AppText>
          {row.isMe ? (
            <AppText variant="label" tone="accentInk" style={{ textTransform: "none" }}>
              sen
            </AppText>
          ) : null}
        </View>
        <RankTierBadge level={row.level} rankName={row.rankName} size="sm" />
      </View>
      {wide ? (
        <>
          <StatCell>{fmtInt(row.xp)}</StatCell>
          <StatCell>{fmtInt(row.correct)}</StatCell>
          <StatCell>{`%${accuracy}`}</StatCell>
          <StatCell>{fmtInt(row.sessions)}</StatCell>
        </>
      ) : null}
      <View style={{ alignItems: "flex-end", minWidth: COL.points }}>
        <AppText variant="subhead" tone={row.isMe ? "accentInk" : "ink"} style={{ fontVariant: ["tabular-nums"] }}>
          {fmtInt(row.points)}
        </AppText>
        {!wide ? (
          <AppText variant="bodySm" tone="subtle" style={{ fontSize: 12, lineHeight: 16, fontVariant: ["tabular-nums"] }}>
            {fmtInt(row.xp)} XP · %{accuracy}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

function HeaderCell({ children, width, align = "right" }: { children: string; width?: number; align?: "left" | "right" | "center" }) {
  return (
    <AppText variant="label" tone="subtle" style={width ? { width, textAlign: align } : { flex: 1, textAlign: align }}>
      {children}
    </AppText>
  );
}

/** Kürsü sonrası kalan sıralar: başlık şeridi + kademeli giren satırlar; boşsa davet cümlesi. */
export function LeaderboardTable({ rows, wide = false }: { rows: LeaderboardRow[]; wide?: boolean }) {
  const { colors, radius, space } = useTheme();
  if (rows.length === 0) {
    return (
      <Card>
        <AppText variant="bodySm" tone="soft" style={{ textAlign: "center" }}>
          Bu dönemde başka katılımcı yok. İlk sıralar seni bekliyor.
        </AppText>
      </Card>
    );
  }
  return (
    <Card style={{ paddingVertical: 0, paddingHorizontal: 0, gap: 0, overflow: "hidden" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.s3, paddingVertical: space.s2, paddingHorizontal: space.s4, backgroundColor: colors.surfaceAlt, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card }}>
        <HeaderCell width={COL.rank} align="center">
          #
        </HeaderCell>
        <View style={{ width: AVATAR.sm.box }} />
        <HeaderCell align="left">Kullanıcı</HeaderCell>
        {wide ? (
          <>
            <HeaderCell width={COL.stat}>XP</HeaderCell>
            <HeaderCell width={COL.stat}>Doğru</HeaderCell>
            <HeaderCell width={COL.stat}>Başarı</HeaderCell>
            <HeaderCell width={COL.stat}>Quiz</HeaderCell>
          </>
        ) : null}
        <HeaderCell width={COL.points}>Puan</HeaderCell>
      </View>
      {rows.map((r, i) => (
        <EnterRow key={`${r.rank}-${r.displayName}`} index={i}>
          <LeaderboardListRow row={r} wide={wide} divider={i < rows.length - 1} />
        </EnterRow>
      ))}
    </Card>
  );
}

/* ---------------------------------------------------------------- Senin sıran */

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
      <AppText variant="stat" style={{ fontSize: 18, lineHeight: 22 }}>
        {value}
      </AppText>
      <AppText variant="label" tone="subtle" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
        {label}
      </AppText>
    </View>
  );
}

/**
 * "Senin sıran" — ekranın altında sabit duran kişisel kart (web `LeaderboardMyRank`): sıra,
 * lig halkalı avatar, ad ve rütbe, dönem puanı; Toplam XP / Doğru / Başarı; motivasyon
 * cümlesi + bir üst rütbeye ilerleme. Listede görünmesen de durumun hep ekranda.
 */
export function LeaderboardMyRank({ me }: { me: Leaderboard["me"] }) {
  const { colors, radius, space } = useTheme();
  const hasRank = me.rank > 0;
  const line = motivationLine(me.rank, me.pointsToNext, me.nextName);
  return (
    <View
      accessible
      accessibilityLabel={`Senin sıran ${hasRank ? `#${fmtInt(me.rank)}` : "henüz yok"}, ${me.rankName}, ${fmtInt(me.points)} puan, ${fmtInt(me.xp)} XP. ${line}`}
      style={{ backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: withAlpha(colors.accent, 0.4), padding: space.s3, gap: space.s3 }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.s3 }}>
        <View style={{ minWidth: 44 }}>
          <AppText variant="label" tone="subtle">
            Sıran
          </AppText>
          <AppText variant="stat" tone="accent">
            {hasRank ? `#${fmtInt(me.rank)}` : "—"}
          </AppText>
        </View>
        <LeaderboardAvatar name={me.displayName} avatarUrl={me.avatarUrl} level={me.level} size="md" />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <AppText variant="subhead" numberOfLines={1}>
            {me.displayName}
          </AppText>
          <AppText variant="bodySm" tone="soft" numberOfLines={1}>
            {me.rankName}
          </AppText>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <AppText variant="stat" style={{ fontVariant: ["tabular-nums"] }}>
            {fmtInt(me.points)}
          </AppText>
          <AppText variant="bodySm" tone="soft">
            puan
          </AppText>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: space.s2 }}>
        <MiniStat label="Toplam XP" value={fmtInt(me.xp)} />
        <MiniStat label="Doğru" value={fmtInt(me.correct)} />
        <MiniStat label="Başarı" value={`%${Math.round(me.accuracy)}`} />
      </View>
      <View style={{ gap: 6 }}>
        <AppText variant="bodySm">{line}</AppText>
        <XpProgress xp={me.xp} level={me.level} />
      </View>
    </View>
  );
}

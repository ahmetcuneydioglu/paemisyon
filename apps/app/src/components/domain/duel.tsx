import { useEffect, useState, type ReactNode } from "react";
import { Image, Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { ArrowDown, ArrowUp, Check, Copy, Crown, Share2, WifiOff } from "lucide-react-native";
import { AppText, Button, ProgressBar } from "@/components/ui";
import { points, seconds1, signed } from "@/features/duel/clock";
import type { DuelConnection } from "@/features/duel/use-duel-match";
import { COMPACT_TEXT_SCALE } from "@/theme/text-scale";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Düello bileşenleri (Doc 59 · Figma PaemisyonNew "Düello" sayfası 283:1735).
 * Hepsi token'lardan beslenir ve 1'e 1 ile salon arasında ortaktır; ekrana özel bileşen yok.
 * Rakam yazıları büyük yazı ayarında 1,3× ile sınırlıdır: sayaç ve skor şeridi sabit yükseklikte
 * kalır, soru metni ise tam büyür (küçük ekran + AX3, Figma çerçeve 50).
 */

const NUM_SCALE = COMPACT_TEXT_SCALE;

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  const a = p[0]![0] ?? "";
  const b = p.length > 1 ? (p[p.length - 1]![0] ?? "") : "";
  return (a + b).toLocaleUpperCase("tr-TR");
}

/* ---------------------------------------------------------------- Avatar */

export type DuelRing = "none" | "line" | "accent" | "success" | "danger";

export function DuelAvatar({ name, avatarUrl, size = 40, ring = "none", dim = false }: { name: string; avatarUrl?: string | null; size?: number; ring?: DuelRing; dim?: boolean }) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const border = ring === "accent" ? colors.accent : ring === "success" ? colors.success : ring === "danger" ? colors.danger : colors.line;
  const font = Math.max(11, Math.round(size * 0.36));
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, borderRadius: size / 2, borderWidth: ring === "none" ? 0 : 2, borderColor: border, backgroundColor: colors.surfaceAlt, overflow: "hidden", alignItems: "center", justifyContent: "center", opacity: dim ? 0.45 : 1 }}
    >
      {avatarUrl && !failed ? (
        <Image source={{ uri: avatarUrl }} onError={() => setFailed(true)} style={{ width: size, height: size }} />
      ) : (
        <AppText variant="subhead" maxFontSizeMultiplier={1} style={{ fontSize: font, lineHeight: Math.round(font * 1.3) }}>
          {initials(name)}
        </AppText>
      )}
    </View>
  );
}

/* ---------------------------------------------------------------- Sayaç */

export type CountdownState = "run" | "urgent" | "done";

/**
 * Sayaç halkası: kalan saniye büyük ve ortada. Son 5 saniyede halka ve rakam hata tonuna geçer,
 * her saniye hafifçe nabız atar (hareket azaltma açıksa nabız yok — renk ve rakam yeter).
 * Ekran okuyucu yalnız 10, 5, 3, 2, 1'i duyurur; her saniye konuşmaz.
 */
export function CountdownRing({ seconds, state, size = 60 }: { seconds: number; state: CountdownState; size?: number }) {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const scale = useSharedValue(1);
  useEffect(() => {
    if (state !== "urgent" || reduce) return;
    scale.value = withSequence(withTiming(1.08, { duration: 120 }), withTiming(1, { duration: 220 }));
  }, [seconds, state, reduce, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const urgent = state === "urgent";
  const announce = state !== "done" && [10, 5, 3, 2, 1].includes(seconds);
  return (
    <Animated.View
      accessible
      accessibilityRole="timer"
      accessibilityLabel={state === "done" ? "Süre doldu" : `${seconds} saniye kaldı`}
      accessibilityLiveRegion={announce ? "polite" : "none"}
      style={[
        { width: size, height: size, borderRadius: size / 2, borderWidth: 3, alignItems: "center", justifyContent: "center", backgroundColor: urgent ? colors.dangerSoft : colors.surface, borderColor: urgent ? colors.danger : state === "done" ? colors.line : colors.accent },
        style,
      ]}
    >
      <AppText variant="stat" maxFontSizeMultiplier={1.15} style={{ color: urgent ? colors.dangerInk : state === "done" ? colors.inkSubtle : colors.ink }}>
        {seconds}
      </AppText>
    </Animated.View>
  );
}

/** Süre çubuğu: sayaç halkasıyla aynı durumu taşır (renk tek başına anlam taşımaz; rakam halkada). */
export function DuelTimerBar({ fraction, state }: { fraction: number; state: CountdownState }) {
  const { colors } = useTheme();
  return <ProgressBar value={state === "done" ? 0 : fraction} color={state === "urgent" ? colors.danger : colors.accent} track={colors.surfaceAlt} height={6} />;
}

/* ---------------------------------------------------------------- Skor şeridi */

function ScoreSide({ label, score, align, labelTone = "soft" }: { label: string; score: number; align: "left" | "right"; labelTone?: "soft" | "success" }) {
  return (
    <View style={{ flexShrink: 1, alignItems: align === "left" ? "flex-start" : "flex-end" }}>
      <AppText variant="bodySm" tone={labelTone} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} maxFontSizeMultiplier={NUM_SCALE}>
        {label}
      </AppText>
      <AppText variant="stat" numberOfLines={1} maxFontSizeMultiplier={NUM_SCALE}>
        {points(score)}
      </AppText>
    </View>
  );
}

/**
 * 1'e 1 skor şeridi: sol ben, orta sayaç + soru sırası, sağ rakip. Rakibin durumu metinle
 * ("düşünüyor" / "cevapladı" / "ayrıldı"); hangi şıkkı seçtiği soru kapanana kadar gelmez.
 */
export function DuelScoreboard({
  me,
  opponent,
  seconds,
  clock,
  index,
  total,
}: {
  me: { name: string; avatarUrl?: string | null; score: number };
  opponent: { name: string; avatarUrl?: string | null; score: number; status: "thinking" | "answered" | "left" | "idle" };
  seconds: number;
  clock: CountdownState;
  index: number;
  total: number;
}) {
  const { space } = useTheme();
  const status = opponent.status === "answered" ? "cevapladı" : opponent.status === "left" ? "ayrıldı" : opponent.status === "thinking" ? "düşünüyor" : opponent.name;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.s3 }}>
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: space.s2 }}>
        <DuelAvatar name={me.name} avatarUrl={me.avatarUrl} size={40} ring="accent" />
        <ScoreSide label="Sen" score={me.score} align="left" />
      </View>
      <View style={{ alignItems: "center", gap: 4 }}>
        <CountdownRing seconds={seconds} state={clock} />
        <AppText variant="label" tone="subtle" maxFontSizeMultiplier={NUM_SCALE}>
          Soru {index + 1} / {total}
        </AppText>
      </View>
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: space.s2 }}>
        <ScoreSide label={status} score={opponent.score} align="right" labelTone={opponent.status === "answered" ? "success" : "soft"} />
        <DuelAvatar name={opponent.name} avatarUrl={opponent.avatarUrl} size={40} ring="line" dim={opponent.status === "left"} />
      </View>
    </View>
  );
}

/** Salon skor şeridi: sol sıram, orta sayaç, sağ puanım. */
export function RoomScoreboard({ rank, playerCount, score, seconds, clock, index, total }: { rank: number; playerCount: number; score: number; seconds: number; clock: CountdownState; index: number; total: number }) {
  const { space } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.s3 }}>
      <View style={{ flex: 1 }}>
        <AppText variant="bodySm" tone="soft" maxFontSizeMultiplier={NUM_SCALE}>
          Sıran
        </AppText>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
          <AppText variant="title" tone="accent" maxFontSizeMultiplier={NUM_SCALE}>
            {rank}.
          </AppText>
          <AppText variant="bodySm" tone="soft" maxFontSizeMultiplier={NUM_SCALE}>
            / {playerCount}
          </AppText>
        </View>
      </View>
      <View style={{ alignItems: "center", gap: 4 }}>
        <CountdownRing seconds={seconds} state={clock} />
        <AppText variant="label" tone="subtle" maxFontSizeMultiplier={NUM_SCALE}>
          Soru {index + 1} / {total}
        </AppText>
      </View>
      <View style={{ flex: 1, alignItems: "flex-end" }}>
        <ScoreSide label="Puanın" score={score} align="right" />
      </View>
    </View>
  );
}

/** Salon: kim cevapladı şeridi (şık gizli; yalnız "cevapladı" halkası). */
export function AnswerStrip({ players, showCount = true }: { players: { userId: string; name: string; avatarUrl?: string | null; answered: boolean; left?: boolean }[]; showCount?: boolean }) {
  const { space } = useTheme();
  const active = players.filter((p) => !p.left);
  const done = active.filter((p) => p.answered).length;
  return (
    <View accessible accessibilityLabel={`${active.length} oyuncudan ${done} tanesi cevapladı`} style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
      <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {players.map((p) => (
          <DuelAvatar key={p.userId} name={p.name} avatarUrl={p.avatarUrl} size={32} ring={p.answered ? "success" : "line"} dim={p.left} />
        ))}
      </View>
      {showCount ? (
        <AppText variant="bodySm" tone="soft" maxFontSizeMultiplier={NUM_SCALE}>
          {done} / {active.length} cevapladı
        </AppText>
      ) : null}
    </View>
  );
}

/* ---------------------------------------------------------------- Soru kapanışı */

export type RevealResult = "correct" | "wrong" | "blank";
const RESULT_TEXT: Record<RevealResult, string> = { correct: "Doğru", wrong: "Yanlış", blank: "Boş" };

/** Tek oyuncunun bu sorudaki sonucu: ad, kazanılan puan (büyük), sonuç + ayrıntı. `mine` kart tonu taşır. */
export function RevealCard({ who, gained, result, detail, mine = false }: { who: string; gained: number; result: RevealResult; detail?: string; mine?: boolean }) {
  const { colors, radius, space } = useTheme();
  const good = result === "correct";
  const bg = !mine ? colors.surface : good ? colors.successSoft : colors.dangerSoft;
  const border = !mine ? colors.line : good ? colors.success : colors.danger;
  const fg = !mine ? colors.inkSoft : good ? colors.successInk : colors.dangerInk;
  const num = good ? colors.successInk : mine ? colors.dangerInk : colors.inkSubtle;
  return (
    <View accessible accessibilityLabel={`${who}: ${RESULT_TEXT[result]}, ${gained} puan`} style={{ flex: 1, minWidth: 0, padding: space.s3, gap: 2, borderRadius: radius.control, borderWidth: 1, backgroundColor: bg, borderColor: border }}>
      <AppText variant="label" numberOfLines={1} style={{ color: fg }} maxFontSizeMultiplier={NUM_SCALE}>
        {who}
      </AppText>
      <AppText variant="stat" style={{ color: num, fontSize: 26, lineHeight: 30 }} maxFontSizeMultiplier={NUM_SCALE}>
        +{gained}
      </AppText>
      <AppText variant="bodySm" numberOfLines={2} style={{ color: fg }}>
        {RESULT_TEXT[result]}
        {detail ? ` · ${detail}` : ""}
      </AppText>
    </View>
  );
}

/** 1'e 1 kapanış: benim puanım ve rakibin puanı yan yana, ayrı kartlarda. */
export function RevealPair({ me, opponent }: { me: { gained: number; result: RevealResult; detail?: string }; opponent: { name: string; gained: number; result: RevealResult; detail?: string } }) {
  const { space } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: space.s2 }}>
      <RevealCard who="Sen" mine {...me} />
      <RevealCard who={opponent.name} gained={opponent.gained} result={opponent.result} detail={opponent.detail} />
    </View>
  );
}

/* ---------------------------------------------------------------- Sıralama satırı */

export interface StandingRow {
  userId: string;
  rank: number;
  name: string;
  avatarUrl?: string | null;
  isMe: boolean;
  score: number;
  /** Bu soruda kazanılan; null = boş geçti. Verilmezse sütun çizilmez (son tablo). */
  gained?: number | null;
  move?: "up" | "down" | null;
  note?: string;
  left?: boolean;
}

/** Anlık / son sıralama listesi (salon). İlk üç sıra vurgu tonunda, "sen" satırı accentSoft. */
export function StandingList({ rows }: { rows: StandingRow[] }) {
  const { colors, radius, space } = useTheme();
  return (
    <View style={{ borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, overflow: "hidden" }}>
      {rows.map((r, i) => (
        <View
          key={r.userId}
          accessible
          accessibilityLabel={`${r.rank}. ${r.isMe ? "Sen" : r.name}, ${r.score} puan${r.gained != null ? `, bu soruda ${r.gained}` : ""}`}
          style={{ minHeight: 52, flexDirection: "row", alignItems: "center", gap: space.s2, paddingHorizontal: space.s3, paddingVertical: space.s2, backgroundColor: r.isMe ? colors.accentSoft : "transparent", borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}
        >
          <AppText variant="subhead" tone={r.rank <= 3 ? "accent" : "soft"} maxFontSizeMultiplier={NUM_SCALE} style={{ minWidth: 20, fontVariant: ["tabular-nums"] }}>
            {r.rank}
          </AppText>
          <DuelAvatar name={r.name} avatarUrl={r.avatarUrl} size={32} ring={r.isMe ? "accent" : "none"} dim={r.left} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText variant="subhead" numberOfLines={1} tone={r.left ? "subtle" : "ink"}>
              {r.isMe ? "Sen" : r.name}
            </AppText>
            {r.note ? (
              <AppText variant="bodySm" tone="soft" numberOfLines={1}>
                {r.note}
              </AppText>
            ) : null}
          </View>
          {r.move === "up" ? <ArrowUp size={14} strokeWidth={2.5} color={colors.successInk} /> : r.move === "down" ? <ArrowDown size={14} strokeWidth={2.5} color={colors.dangerInk} /> : null}
          {r.gained !== undefined ? (
            <AppText variant="bodySm" maxFontSizeMultiplier={NUM_SCALE} style={{ color: r.gained ? colors.successInk : colors.inkSubtle, fontVariant: ["tabular-nums"] }}>
              {r.gained == null ? "—" : `+${r.gained}`}
            </AppText>
          ) : null}
          <AppText variant="subhead" maxFontSizeMultiplier={NUM_SCALE} style={{ minWidth: 44, textAlign: "right", fontVariant: ["tabular-nums"] }}>
            {points(r.score)}
          </AppText>
        </View>
      ))}
    </View>
  );
}

/* ---------------------------------------------------------------- Kürsü */

/** Salon sonu kürsüsü: 2 · 1 · 3. Sıra rakamı basamakta yazılı (yalnız yükseklik/renk değil). */
export function DuelPodium({ rows }: { rows: { userId: string; placement: number; name: string; avatarUrl?: string | null; score: number; isMe: boolean }[] }) {
  const { colors, space } = useTheme();
  const at = (p: number) => rows.find((r) => r.placement === p) ?? null;
  const order = [at(2), at(1), at(3)];
  const height = { 1: 108, 2: 76, 3: 56 } as Record<number, number>;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: space.s2 }}>
      {order.map((r, i) => {
        const place = [2, 1, 3][i]!;
        if (!r) return <View key={`bos-${place}`} style={{ flex: 1 }} />;
        const first = place === 1;
        return (
          <View key={r.userId} accessible accessibilityLabel={`${place}. ${r.isMe ? "Sen" : r.name}, ${r.score} puan`} style={{ flex: 1, alignItems: "center", gap: 6, minWidth: 0 }}>
            {first ? <Crown size={22} strokeWidth={1.75} color={colors.accent} /> : null}
            <DuelAvatar name={r.name} avatarUrl={r.avatarUrl} size={first ? 64 : 52} ring={first || r.isMe ? "accent" : "line"} />
            <AppText variant="subhead" numberOfLines={1} maxFontSizeMultiplier={NUM_SCALE}>
              {r.isMe ? "Sen" : r.name}
            </AppText>
            <AppText variant="bodySm" tone="soft" maxFontSizeMultiplier={NUM_SCALE} style={{ fontVariant: ["tabular-nums"] }}>
              {points(r.score)}
            </AppText>
            <View style={{ alignSelf: "stretch", height: height[place], alignItems: "center", justifyContent: "center", borderTopLeftRadius: 12, borderTopRightRadius: 12, borderWidth: 1, borderBottomWidth: 0, backgroundColor: first ? colors.accentSoft : colors.surface, borderColor: first || r.isMe ? colors.accent : colors.line }}>
              <AppText variant={first ? "title" : "heading"} tone={first ? "accent" : "soft"} maxFontSizeMultiplier={1}>
                {place}
              </AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/* ---------------------------------------------------------------- Oyuncu satırı, koltuk */

/** Liste satırı: avatar (çevrimiçiyse yeşil halka), ad, alt satır, sağda eylem. */
export function DuelPlayerRow({ name, avatarUrl, online, note, noteTone = "soft", action, divider = false }: { name: string; avatarUrl?: string | null; online?: boolean; note: string; noteTone?: "soft" | "accent"; action?: ReactNode; divider?: boolean }) {
  const { colors, space } = useTheme();
  return (
    <View style={{ minHeight: 64, flexDirection: "row", alignItems: "center", gap: space.s3, paddingHorizontal: space.s4, paddingVertical: space.s3, borderTopWidth: divider ? 1 : 0, borderTopColor: colors.line }}>
      <DuelAvatar name={name} avatarUrl={avatarUrl} size={40} ring={online ? "success" : "none"} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText variant="subhead" numberOfLines={1}>
          {name}
        </AppText>
        <AppText variant="bodySm" tone={noteTone} numberOfLines={2}>
          {note}
        </AppText>
      </View>
      {action}
    </View>
  );
}

/** Bekleme odası koltuğu. Boş koltuk kesik çizgili; başkan taçla, hazır olan yeşil halkayla. */
export function LobbySeat({ player, onLongPress }: { player: { name: string; avatarUrl?: string | null; isHost: boolean; isReady: boolean; isMe: boolean } | null; onLongPress?: () => void }) {
  const { colors, radius, space } = useTheme();
  if (!player)
    return (
      <View accessibilityLabel="Boş yer" style={{ flex: 1, minHeight: 64, flexDirection: "row", alignItems: "center", gap: space.s2, paddingHorizontal: space.s3, borderRadius: radius.control, borderWidth: 1, borderStyle: "dashed", borderColor: colors.line }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderStyle: "dashed", borderColor: colors.line }} />
        <AppText variant="bodySm" tone="subtle">
          Boş
        </AppText>
      </View>
    );
  const status = player.isHost ? "Başkan" : player.isReady ? "Hazır" : "Hazır değil";
  return (
    <Pressable
      accessibilityLabel={`${player.isMe ? "Sen" : player.name}, ${status}`}
      accessibilityHint={onLongPress ? "Salondan çıkarmak için basılı tut" : undefined}
      onLongPress={onLongPress}
      disabled={!onLongPress}
      style={{ flex: 1, minWidth: 0, minHeight: 64, flexDirection: "row", alignItems: "center", gap: space.s2, paddingHorizontal: space.s3, paddingVertical: space.s2, borderRadius: radius.control, borderWidth: 1, backgroundColor: player.isMe ? colors.accentSoft : colors.surface, borderColor: player.isMe ? colors.accent : colors.line }}
    >
      <DuelAvatar name={player.name} avatarUrl={player.avatarUrl} size={40} ring={player.isHost || player.isReady ? "success" : "line"} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText variant="subhead" numberOfLines={1} style={{ fontSize: 14, lineHeight: 18 }}>
          {player.isMe ? "Sen" : player.name}
        </AppText>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          {player.isHost ? <Crown size={12} strokeWidth={2} color={colors.accentInk} /> : null}
          <AppText variant="bodySm" numberOfLines={1} style={{ color: player.isHost ? colors.accentInk : player.isReady ? colors.successInk : colors.inkSoft, fontSize: 12, lineHeight: 16 }}>
            {status}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

/* ---------------------------------------------------------------- Kod, ödül, bağlantı */

/** Davet kodu: üçerli gruplanmış, büyük; kopyala ve paylaş 44 pt. `compact`: bekleme odası satırı. */
export function DuelCodeBox({ code, hint, onCopy, onShare, compact = false }: { code: string; hint?: string; onCopy?: () => void; onShare?: () => void; compact?: boolean }) {
  const { colors, radius, space } = useTheme();
  const shown = code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code;
  const actions = (
    <View style={{ flexDirection: "row", gap: space.s2 }}>
      {[
        { Icon: Copy, label: "Kodu kopyala", fn: onCopy },
        { Icon: Share2, label: "Kodu paylaş", fn: onShare },
      ].map(({ Icon, label, fn }) => (
        <Pressable key={label} accessibilityRole="button" accessibilityLabel={label} onPress={fn} style={({ pressed }) => ({ width: 44, height: 44, borderRadius: radius.control, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceAlt, opacity: pressed ? 0.7 : 1 })}>
          <Icon size={20} strokeWidth={1.75} color={colors.ink} />
        </Pressable>
      ))}
    </View>
  );
  return (
    <View style={{ flexDirection: compact ? "row" : "column", alignItems: "center", gap: compact ? space.s3 : space.s2, padding: space.s4, borderRadius: radius.card, borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.surface }}>
      <View style={{ flex: compact ? 1 : undefined, alignItems: compact ? "flex-start" : "center", gap: 2 }}>
        <AppText variant="label" tone="subtle">
          {compact ? "Salon kodu" : "Senin kodun"}
        </AppText>
        <AppText accessibilityLabel={`Kod ${code.split("").join(" ")}`} variant={compact ? "title" : "display"} tone="accent" maxFontSizeMultiplier={1.15} style={compact ? { letterSpacing: 2 } : { fontSize: 40, lineHeight: 48, letterSpacing: 4 }}>
          {shown}
        </AppText>
        {hint ? (
          <AppText variant="bodySm" tone="soft">
            {hint}
          </AppText>
        ) : null}
      </View>
      {actions}
    </View>
  );
}

/** Maç sonu ödül kutuları (XP, lig/salon puanı, seri). `muted`: mağlubiyet ve beraberlikte sönük. */
export function RewardTiles({ items, muted = false }: { items: { icon: ReactNode; value: string; label: string }[]; muted?: boolean }) {
  const { colors, radius, space } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: space.s2 }}>
      {items.map((it) => (
        <View key={it.label} accessible accessibilityLabel={`${it.label}: ${it.value}`} style={{ flex: 1, minWidth: 0, padding: space.s3, gap: 4, borderRadius: radius.control, backgroundColor: muted ? colors.surfaceAlt : colors.accentSoft }}>
          {it.icon}
          <AppText variant="stat" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} maxFontSizeMultiplier={NUM_SCALE}>
            {it.value}
          </AppText>
          <AppText variant="bodySm" tone="soft" numberOfLines={2}>
            {it.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

/** İki oyunculu karşılaştırma tablosu (1'e 1 sonuç): benim değerim · etiket · rakibin değeri. */
export function CompareTable({ rows }: { rows: { label: string; mine: string; theirs: string }[] }) {
  const { colors, radius, space } = useTheme();
  return (
    <View style={{ borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, overflow: "hidden" }}>
      {rows.map((r, i) => (
        <View key={r.label} accessible accessibilityLabel={`${r.label}: sen ${r.mine}, rakip ${r.theirs}`} style={{ minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.s2, paddingHorizontal: space.s4, paddingVertical: space.s2, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
          <AppText variant="subhead" maxFontSizeMultiplier={NUM_SCALE} style={{ minWidth: 56, fontVariant: ["tabular-nums"] }}>
            {r.mine}
          </AppText>
          <AppText variant="bodySm" tone="soft" style={{ flex: 1, textAlign: "center" }}>
            {r.label}
          </AppText>
          <AppText variant="subhead" tone="soft" maxFontSizeMultiplier={NUM_SCALE} style={{ minWidth: 56, textAlign: "right", fontVariant: ["tabular-nums"] }}>
            {r.theirs}
          </AppText>
        </View>
      ))}
    </View>
  );
}

/**
 * Bağlantı uyarısı (oyun ekranının altında). `polling` kullanıcıya gösterilmez: oyun aynen işler,
 * yalnız yayın yerine yoklamayla. Yalnız gerçekten ulaşılamıyorsa (`offline`) çizilir.
 */
export function ConnectionNotice({ connection, onRetry, style }: { connection: DuelConnection; onRetry?: () => void; style?: StyleProp<ViewStyle> }) {
  const { colors, radius, space } = useTheme();
  if (connection !== "offline") return null;
  return (
    <View accessibilityRole="alert" style={[{ flexDirection: "row", alignItems: "center", gap: space.s3, padding: space.s3, borderRadius: radius.control, borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.accentSoft }, style]}>
      <WifiOff size={22} strokeWidth={1.75} color={colors.accentInk} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <AppText variant="subhead">Bağlantı koptu, yeniden bağlanılıyor</AppText>
        <AppText variant="bodySm" tone="soft">
          Süre sunucuda işliyor. Verdiğin cevaplar kayıtlı; bağlanınca kaldığın sorudan devam edersin.
        </AppText>
      </View>
      {onRetry ? <Button title="Dene" variant="secondary" size="sm" onPress={onRetry} /> : null}
    </View>
  );
}

/** Kilitli cevap / bekleme satırı. */
export function DuelStatusLine({ text, tone = "soft", check = false }: { text: string; tone?: "soft" | "danger"; check?: boolean }) {
  const { colors, space } = useTheme();
  return (
    <View accessibilityLiveRegion="polite" style={{ minHeight: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.s2 }}>
      {check ? <Check size={18} strokeWidth={2} color={colors.accentInk} /> : null}
      {/* Sabit alt satır: büyük yazıda 1,3× ile sınırlı ki soru alanına yer kalsın. */}
      <AppText variant="bodySm" maxFontSizeMultiplier={NUM_SCALE} style={{ color: tone === "danger" ? colors.dangerInk : colors.inkSoft, textAlign: "center", flexShrink: 1 }}>
        {text}
      </AppText>
    </View>
  );
}

export const duelFormat = { points, signed, seconds1 };

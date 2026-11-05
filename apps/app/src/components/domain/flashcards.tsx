import { AlertTriangle, Bookmark, Check, ChevronRight, Clock, Hash, Layers, Lightbulb, Lock, RotateCcw, Shuffle, Sparkles, Undo2, type LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Extrapolation, interpolate, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useReducedMotion, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { AppText, Badge, Button, ListRow, ProgressBar, Sheet, StatTile, type BadgeTone } from "@/components/ui";
import { countsNote, FLASHCARD_KIND_LABEL, FLASHCARD_MODE, modeCount, relativeDay, type DailyGoal, type Flashcard, type FlashcardMode, type FlashcardOverview, type FlashcardRating, type FlashcardSessionSummary, type ModeCounts } from "@/features/flashcards/queries";
import { motion, size as tokenSize } from "@/theme/tokens";
import { useTheme } from "@/theme/ThemeProvider";
import { ArticlePeek, SummaryBody } from "./summary";

/**
 * Bilgi kartları alan bileşenleri (Doc 56 aşama 4; Figma 158:672). Hepsi token'dan beslenir,
 * varyant parametrelidir, ekrana bağlı değildir. Kural sunucuda: sayılar, kilit, kuyruk, vade.
 * Damga yok: geri bildirim kenar tonu + köşe rozeti + haptic; reduce-motion'da yalnız opaklık.
 */

/* ---------------------------------------------------------------- Tür rozeti */

const KIND_TONE: Record<Flashcard["kind"], BadgeTone> = { qa: "accent", cloze: "accent", numeric: "neutral", trap: "warning" };
const KIND_ICON: Record<Flashcard["kind"], LucideIcon> = { qa: Lightbulb, cloze: Lightbulb, numeric: Hash, trap: AlertTriangle };

export function FlashcardKindBadge({ kind }: { kind: Flashcard["kind"] }) {
  return <Badge tone={KIND_TONE[kind]}>{FLASHCARD_KIND_LABEL[kind]}</Badge>;
}

/* ---------------------------------------------------------------- Durum çubuğu */

/** Üç dilim: öğrenildi (success) · öğreniliyor (accent) · yeni (surfaceAlt). 4 pt; sayılar sunucudan. */
export function FlashcardStateBar({ counts, height = 4, style }: { counts: Pick<ModeCounts, "total" | "learned" | "learning" | "new">; height?: number; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const total = Math.max(1, counts.total);
  const seg = (n: number, bg: string, key: string) => (n > 0 ? <View key={key} style={{ flex: n / total, height, borderRadius: height / 2, backgroundColor: bg }} /> : null);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${counts.learned} öğrenildi, ${counts.learning} öğreniliyor, ${counts.new} yeni`}
      accessibilityValue={{ min: 0, max: counts.total, now: counts.learned }}
      style={[{ flexDirection: "row", gap: 2, height }, style]}
    >
      {seg(counts.learned, colors.success, "learned")}
      {seg(counts.learning, colors.accent, "learning")}
      {seg(Math.max(counts.new, counts.total - counts.learned - counts.learning), colors.surfaceAlt, "new")}
    </View>
  );
}

/* ---------------------------------------------------------------- Giriş satırı */

/**
 * Ders odası "Konu oku" sayfası, konu eylem sayfası ve konu odasındaki giriş (FlashcardEntry).
 * Kart yoksa çağıran satırı hiç çizmez; kilitliyse rozet "Premium" ve dokunuş paywall'a gider.
 */
export function FlashcardEntry({ counts, locked = false, onPress, divider = false, title = "Bilgi kartları" }: { counts: ModeCounts; locked?: boolean; onPress?: () => void; divider?: boolean; title?: string }) {
  const { colors, space } = useTheme();
  const rozet = locked ? <Badge tone="warning">Premium</Badge> : counts.due > 0 ? <Badge tone="warning">{`${counts.due} tekrar`}</Badge> : counts.total > 0 && counts.new === counts.total ? <Badge tone="accent">Yeni</Badge> : null;
  return (
    <ListRow
      title={title}
      leading={<Layers color={locked ? colors.inkSubtle : colors.ink} size={22} strokeWidth={1.75} />}
      subtitle={locked ? `${counts.locked} kart · Premium ile açılır` : countsNote(counts)}
      trailing={rozet}
      onPress={onPress}
      divider={divider}
      style={!onPress ? { opacity: 0.55 } : undefined}
    >
      {!locked && counts.total > 0 ? <FlashcardStateBar counts={counts} style={{ marginTop: space.s1 }} /> : null}
    </ListRow>
  );
}

/* ---------------------------------------------------------------- Mod seçimi sayfası */

const MODE_ICON: Record<FlashcardMode, LucideIcon> = { due: Clock, new: Sparkles, hard: AlertTriangle, favorites: Bookmark, all: Layers, mixed: Shuffle };
const MODE_ORDER: FlashcardMode[] = ["new", "hard", "favorites", "all", "mixed"];

/**
 * "Nasıl çalışmak istersin?" (Figma 159:913): durum çubuğu + açıklama, sunucunun önerdiği mod
 * birincil düğme, beş mod satırı; sayısı sıfır olan satır sönük ve devre dışı.
 */
export function FlashcardModeSheet({ visible, onClose, onDismissed, overview, onPick, onPremium }: { visible: boolean; onClose: () => void; onDismissed: () => void; overview: FlashcardOverview | null; onPick: (mode: FlashcardMode) => void; onPremium: () => void }) {
  const { colors, space } = useTheme();
  const o = overview;
  const c = o?.counts;
  const oneri = o?.suggestedMode ?? "all";
  const oneriSayi = c ? modeCount(c, oneri) : 0;
  return (
    <Sheet visible={visible} onClose={onClose} onDismissed={onDismissed} title="Bilgi kartları">
      {!o || !c ? (
        <AppText variant="bodySm" tone="soft">
          Yükleniyor…
        </AppText>
      ) : o.locked ? (
        <View style={{ gap: space.s3 }}>
          <AppText variant="bodySm" tone="soft">
            {o.scope.label} · {c.locked} kart
          </AppText>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
            <Lock color={colors.ink} size={18} strokeWidth={1.75} />
            <AppText variant="subhead">Bu kapsamın kartları Premium ile açılır</AppText>
          </View>
          <Button title="Premium'u gör" onPress={onPremium} />
        </View>
      ) : (
        <View style={{ gap: space.s4 }}>
          <View style={{ gap: space.s2 }}>
            <AppText variant="bodySm" tone="soft">
              {o.scope.label} · {c.total} kart
            </AppText>
            <FlashcardStateBar counts={c} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s3 }}>
              <Legend color={colors.success} label={`${c.learned} öğrenildi`} />
              <Legend color={colors.accent} label={`${c.learning} öğreniliyor`} />
              <Legend color={colors.surfaceAlt} label={`${c.new} yeni`} />
            </View>
          </View>
          {oneriSayi > 0 ? <Button title={oneri === "due" ? `Tekrara başla · ${oneriSayi} kart` : `${FLASHCARD_MODE[oneri].title} · ${oneriSayi} kart`} onPress={() => onPick(oneri)} /> : null}
          <View>
            {MODE_ORDER.filter((m) => m !== oneri).map((m, i, arr) => {
              const n = modeCount(c, m);
              const Icon = MODE_ICON[m];
              const aktif = n > 0;
              return (
                <ListRow
                  key={m}
                  title={FLASHCARD_MODE[m].title}
                  subtitle={FLASHCARD_MODE[m].subtitle}
                  leading={<Icon color={aktif ? colors.ink : colors.inkSubtle} size={22} strokeWidth={1.75} />}
                  trailing={
                    <AppText variant="subhead" tone="soft" style={{ fontVariant: ["tabular-nums"] }}>
                      {m === "mixed" ? "" : String(n)}
                    </AppText>
                  }
                  onPress={aktif ? () => onPick(m) : undefined}
                  divider={i < arr.length - 1}
                  style={aktif ? undefined : { opacity: 0.45 }}
                />
              );
            })}
          </View>
          {o.dailyGoal.target > 0 ? (
            <AppText variant="bodySm" tone="subtle">
              Bugün {o.dailyGoal.done} / {o.dailyGoal.target} kart
            </AppText>
          ) : null}
        </View>
      )}
    </Sheet>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <AppText variant="bodySm" tone="soft">
        {label}
      </AppText>
    </View>
  );
}

/* ---------------------------------------------------------------- Kart */

export type CardFace = "front" | "back";

/** Soru boyu: kısa metin Lora 24/30, uzun metin 20/27 (SE'de kompakt tip zaten %6 küçültür). */
function stemSize(text: string): { fontSize: number; lineHeight: number } {
  return text.length > 140 ? { fontSize: 20, lineHeight: 27 } : { fontSize: 24, lineHeight: 30 };
}

/**
 * Tek bilgi kartı (Figma 158:782 / 158:793). İki yüz üst üste; `flipped` değişince 3D çevirme
 * (rotateY, 180 ms giriş eğrisi); reduce-motion'da yalnız opaklık geçişi. Dokunuş çevirir; sağ
 * üstte favori (44 pt). Kaynak etiketi yoktur. Gölge yok; derinlik arkadaki kartın tonuyla.
 */
export function FlashCard({
  card,
  flipped,
  onFlip,
  onBookmark,
  onArticle,
  onSolve,
  height,
  style,
}: {
  card: Flashcard;
  flipped: boolean;
  onFlip: () => void;
  onBookmark?: () => void;
  onArticle?: (no: string, legislationSlug: string | null) => void;
  /** "Bu konudan soru çöz" köprüsü (arka yüz). */
  onSolve?: () => void;
  height: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, radius, space } = useTheme();
  const reduce = useReducedMotion();
  // Çevirme değeri prop'tan türetilir (effect yok): reduce-motion'da anlık, değilse 360 ms.
  const flip = useDerivedValue(() => (reduce ? (flipped ? 1 : 0) : withTiming(flipped ? 1 : 0, { duration: motion.enter.ms * 2 })), [flipped, reduce]);

  const frontStyle = useAnimatedStyle(() =>
    reduce
      ? { opacity: 1 - flip.value }
      : { transform: [{ perspective: 1200 }, { rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg` }], opacity: flip.value < 0.5 ? 1 : 0 },
  );
  const backStyle = useAnimatedStyle(() =>
    reduce
      ? { opacity: flip.value }
      : { transform: [{ perspective: 1200 }, { rotateY: `${interpolate(flip.value, [0, 1], [180, 360])}deg` }], opacity: flip.value >= 0.5 ? 1 : 0 },
  );

  const face: ViewStyle = { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, padding: space.s5, backfaceVisibility: "hidden" };
  const kapsam = [card.topic.name, card.unit?.title].filter(Boolean).join(" · ");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={flipped ? `Cevap: ${card.back}. Soruya dönmek için dokun` : `Soru: ${card.front}. Cevabı görmek için dokun`}
      onPress={onFlip}
      style={[{ height }, style]}
    >
      {/* Ön yüz */}
      <Animated.View style={[face, { justifyContent: "space-between" }, frontStyle]} pointerEvents={flipped ? "none" : "auto"}>
        <KartBaslik badge={<FlashcardKindBadge kind={card.kind} />} kapsam={kapsam} bookmarked={card.bookmarked} onBookmark={onBookmark} />
        <View style={{ paddingVertical: space.s3 }}>
          <AppText variant="title" style={{ textAlign: "center", ...stemSize(card.front) }}>
            {card.front}
          </AppText>
        </View>
        <AppText variant="bodySm" tone="subtle" style={{ textAlign: "center" }}>
          Cevabı görmek için dokun
        </AppText>
      </Animated.View>

      {/* Arka yüz */}
      <Animated.View style={[face, backStyle]} pointerEvents={flipped ? "auto" : "none"}>
        <KartBaslik badge={<Badge tone="success">Cevap</Badge>} kapsam={kapsam} bookmarked={card.bookmarked} onBookmark={onBookmark} />
        <ScrollView style={{ flex: 1, marginTop: space.s3 }} contentContainerStyle={{ gap: space.s3, paddingBottom: space.s2 }} showsVerticalScrollIndicator={false}>
          <AppText variant="heading" style={{ fontSize: 20, lineHeight: 27 }}>
            {card.back}
          </AppText>
          {card.explanation ? (
            <>
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line }} />
              <SummaryBody text={card.explanation} />
            </>
          ) : null}
          {card.articles.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s2 }}>
              {card.articles.map((a) => (
                <ArticlePeek key={`${a.legislationSlug ?? ""}-${a.no}`} lawSlug={a.legislationSlug ?? ""} no={a.no} title={a.title} onOpen={(no) => onArticle?.(no, a.legislationSlug)} />
              ))}
            </View>
          ) : null}
        </ScrollView>
        {onSolve ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Bu konudan soru çöz" onPress={onSolve} hitSlop={6} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: space.s2, minHeight: 44, paddingTop: space.s2, opacity: pressed ? 0.6 : 1 })}>
            <AppText variant="subhead" tone="accentInk" style={{ flex: 1 }}>
              Bu konudan soru çöz
            </AppText>
            <ChevronRight color={colors.accentInk} size={18} strokeWidth={1.75} />
          </Pressable>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

/** Kart üst satırı: tür/cevap rozeti + kapsam etiketi solda, favori (44 pt) sağda. */
function KartBaslik({ badge, kapsam, bookmarked, onBookmark }: { badge: ReactNode; kapsam: string; bookmarked: boolean; onBookmark?: () => void }) {
  const { colors, space } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: space.s2 }}>
      <View style={{ gap: space.s2, flex: 1 }}>
        {badge}
        <AppText variant="label" tone="subtle" numberOfLines={1}>
          {kapsam}
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={bookmarked ? "Favorilerden çıkar" : "Favorilere ekle"}
        accessibilityState={{ selected: bookmarked }}
        onPress={onBookmark}
        hitSlop={6}
        style={({ pressed }) => ({ width: tokenSize.touchTarget, height: tokenSize.touchTarget, alignItems: "center", justifyContent: "center", marginTop: -10, marginRight: -10, opacity: pressed ? 0.6 : 1 })}
      >
        <Bookmark color={bookmarked ? colors.accentInk : colors.inkSoft} size={22} strokeWidth={1.75} {...(bookmarked ? { fill: colors.accentInk } : {})} />
      </Pressable>
    </View>
  );
}

/* ---------------------------------------------------------------- Deste (jest) */

/** Kaydırma eşiği: genişliğin üçte biri ya da hızlı fırlatma. */
const HIZ_ESIGI = 900;
/** Kart düştükten sonra üst kart değişir; aynı kartın animasyonu sıfırdan başlasın diye `key={card.id}`. */
export function FlashcardDeck({
  card,
  next,
  flipped,
  onFlip,
  onRate,
  pending,
  height,
  onBookmark,
  onArticle,
  onSolve,
}: {
  card: Flashcard;
  next: Flashcard | null;
  flipped: boolean;
  onFlip: () => void;
  /** Kart ekrandan çıktıktan sonra çağrılır (jest ya da düğme). */
  onRate: (rating: FlashcardRating) => void;
  /** Düğmeyle verilen puan: deste kartı aynı yönde uçurur, sonra `onRate`. */
  pending: FlashcardRating | null;
  height: number;
  onBookmark?: () => void;
  onArticle?: (no: string, legislationSlug: string | null) => void;
  onSolve?: () => void;
}) {
  const { colors, radius, space } = useTheme();
  const { width } = useWindowDimensions();
  const reduce = useReducedMotion();
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const esik = Math.max(96, width * 0.32);
  const cikis = width * 1.25;
  const sure = motion.exit.ms;

  const bitir = (rating: FlashcardRating) => onRate(rating);

  const pan = Gesture.Pan()
    .enabled(pending == null)
    .activeOffsetX([-14, 14])
    .failOffsetY([-28, 28])
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY * 0.2;
    })
    .onEnd((e) => {
      const dir = tx.value > esik || e.velocityX > HIZ_ESIGI ? 1 : tx.value < -esik || e.velocityX < -HIZ_ESIGI ? -1 : 0;
      if (dir === 0) {
        tx.value = withSpring(0, { damping: 18, stiffness: 180 });
        ty.value = withSpring(0, { damping: 18, stiffness: 180 });
        return;
      }
      const rating: FlashcardRating = dir === 1 ? "known" : "again";
      tx.value = withTiming(dir * cikis, { duration: sure }, (done) => {
        if (done) scheduleOnRN(bitir, rating);
      });
    });

  // Düğmeyle puan: prop → paylaşılan değer (effect yok); UI iş parçacığında kartı aynı yönde uçur.
  const beklenen = useDerivedValue(() => pending, [pending]);
  useAnimatedReaction(
    () => beklenen.value,
    (cur, prev) => {
      if (cur == null || cur === prev) return;
      const dir = cur === "again" ? -1 : 1;
      if (reduce) {
        scheduleOnRN(bitir, cur);
        return;
      }
      tx.value = withTiming(dir * cikis, { duration: sure }, (done) => {
        if (done) scheduleOnRN(bitir, cur);
      });
      ty.value = withTiming(-24, { duration: sure });
    },
    [reduce, cikis, sure, bitir],
  );

  const kartStili = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { rotateZ: `${interpolate(tx.value, [-width, 0, width], [-8, 0, 8])}deg` }],
  }));
  const bilinenTon = useAnimatedStyle(() => ({ opacity: interpolate(tx.value, [0, esik], [0, 0.18], Extrapolation.CLAMP) }));
  const tekrarTon = useAnimatedStyle(() => ({ opacity: interpolate(tx.value, [-esik, 0], [0.18, 0], Extrapolation.CLAMP) }));
  const bilinenRozet = useAnimatedStyle(() => ({ opacity: interpolate(tx.value, [esik * 0.25, esik], [0, 1], Extrapolation.CLAMP) }));
  const tekrarRozet = useAnimatedStyle(() => ({ opacity: interpolate(tx.value, [-esik, -esik * 0.25], [1, 0], Extrapolation.CLAMP) }));
  const kenar = useAnimatedStyle(() => ({
    borderColor: tx.value > 8 ? colors.success : tx.value < -8 ? colors.danger : "transparent",
    opacity: interpolate(Math.abs(tx.value), [0, esik], [0, 1], Extrapolation.CLAMP),
  }));
  const arkaStili = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(Math.abs(tx.value), [0, esik], [0.96, 1], Extrapolation.CLAMP) }],
    opacity: interpolate(Math.abs(tx.value), [0, esik], [0.85, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={{ height: height + 16 }}>
      {/* Arkadaki kart: ton farkı ile derinlik (gölge yok). */}
      <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 6, right: 6, top: 0, height, borderRadius: radius.card, backgroundColor: colors.surfaceAlt, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line }, arkaStili]}>
        {next ? (
          <View style={{ padding: space.s5, gap: space.s2, opacity: 0.6 }}>
            <FlashcardKindBadge kind={next.kind} />
          </View>
        ) : null}
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ position: "absolute", left: 0, right: 0, top: 16, height }, kartStili]}>
          <FlashCard key={card.id} card={card} flipped={flipped} onFlip={onFlip} onBookmark={onBookmark} onArticle={onArticle} onSolve={onSolve} height={height} />
          {/* Kenar tonu ve köşe rozeti: kaydırma mesafesiyle orantılı; metin eşlik eder. */}
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius.card, backgroundColor: colors.successSoft }, bilinenTon]} />
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius.card, backgroundColor: colors.dangerSoft }, tekrarTon]} />
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius.card, borderWidth: 1.5 }, kenar]} />
          <Animated.View pointerEvents="none" style={[{ position: "absolute", top: 14, left: 18 }, bilinenRozet]}>
            <KoseRozeti tone="success" icon={Check} label="Biliyorum" />
          </Animated.View>
          <Animated.View pointerEvents="none" style={[{ position: "absolute", top: 14, right: 18 }, tekrarRozet]}>
            <KoseRozeti tone="danger" icon={RotateCcw} label="Tekrar" />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function KoseRozeti({ tone, icon: Icon, label }: { tone: "success" | "danger"; icon: LucideIcon; label: string }) {
  const { colors, radius } = useTheme();
  const bg = tone === "success" ? colors.successSoft : colors.dangerSoft;
  const fg = tone === "success" ? colors.successInk : colors.dangerInk;
  const line = tone === "success" ? colors.success : colors.danger;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6, paddingLeft: 10, paddingRight: 12, borderRadius: radius.pill, backgroundColor: bg, borderWidth: 1, borderColor: line }}>
      <Icon color={fg} size={16} strokeWidth={2.25} />
      <AppText variant="subhead" style={{ color: fg, fontSize: 13, lineHeight: 16 }}>
        {label}
      </AppText>
    </View>
  );
}

/* ---------------------------------------------------------------- Puan çubuğu */

/** İki düğme (karar 4): Tekrar (dangerSoft/dangerInk) · Biliyorum (accent/onAccent). 54 pt. Jestle birebir. */
export function RatingBar({ onAgain, onKnown, disabled }: { onAgain: () => void; onKnown: () => void; disabled?: boolean }) {
  const { colors, radius, space } = useTheme();
  const btn = (bg: string, fg: string, Icon: LucideIcon, label: string, onPress: () => void, sw = 1.75) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({ flex: 1, minHeight: 54, borderRadius: radius.card, backgroundColor: bg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.s2, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 })}
    >
      <Icon color={fg} size={20} strokeWidth={sw} />
      <AppText variant="subhead" style={{ color: fg, fontSize: 16, lineHeight: 22 }}>
        {label}
      </AppText>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: "row", gap: space.s3 }}>
      {btn(colors.dangerSoft, colors.dangerInk, RotateCcw, "Tekrar", onAgain)}
      {btn(colors.accent, colors.onAccent, Check, "Biliyorum", onKnown, 2)}
    </View>
  );
}

/* ---------------------------------------------------------------- Geri al şeridi */

/** Kart çıkınca 5 sn: sonuç metni + "Geri al" (44 pt). Dokununca kart geri gelir, olay sunucuda geri alınır. */
export function UndoStrip({ rating, onUndo }: { rating: FlashcardRating; onUndo: () => void }) {
  const { colors, radius, space } = useTheme();
  const bilinen = rating !== "again";
  const Icon = bilinen ? Check : RotateCcw;
  return (
    <View accessibilityRole="alert" style={{ flexDirection: "row", alignItems: "center", gap: space.s3, paddingVertical: space.s2, paddingHorizontal: space.s4, borderRadius: radius.card, backgroundColor: colors.surfaceAlt }}>
      <Icon color={bilinen ? colors.successInk : colors.dangerInk} size={18} strokeWidth={2} />
      <AppText variant="bodySm" tone="ink" style={{ flex: 1 }}>
        {bilinen ? "Biliyorum işaretlendi" : "Tekrar işaretlendi"}
      </AppText>
      <Pressable accessibilityRole="button" accessibilityLabel="Geri al" onPress={onUndo} hitSlop={8} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, paddingHorizontal: space.s1, opacity: pressed ? 0.6 : 1 })}>
        <Undo2 color={colors.accentInk} size={16} strokeWidth={2} />
        <AppText variant="subhead" tone="accentInk">
          Geri al
        </AppText>
      </Pressable>
    </View>
  );
}

/* ---------------------------------------------------------------- Oturum sonu */

/**
 * Oturum sonu paneli (Figma 161:1019): "BU TUR" · Lora 64 "16 / 20 biliyorum" · koç cümlesi · üç
 * istatistik kutusu · günlük kart hedefi. Eylemler çağıranın (geldiğin yere dön · tekrarı sür · soru çöz).
 */
export function FlashcardResultPanel({ result, line, learnedDelta }: { result: FlashcardSessionSummary; line: string; learnedDelta: number }) {
  const { colors, space } = useTheme();
  const s = result.summary;
  const goal: DailyGoal = result.dailyGoal;
  const kalan = Math.max(0, goal.target - goal.done);
  return (
    <View style={{ gap: space.s5 }}>
      <View style={{ alignItems: "center", gap: space.s1, paddingTop: space.s4 }}>
        <AppText variant="label" tone="subtle">
          Bu tur
        </AppText>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.s2 }}>
          <AppText variant="display" tone="gold" style={{ fontSize: 64, lineHeight: 74 }}>
            {String(s.known)}
          </AppText>
          <AppText variant="heading" tone="soft" style={{ fontSize: 22, lineHeight: 28 }}>
            / {s.reviewed} biliyorum
          </AppText>
        </View>
        <AppText variant="bodySm" tone="soft" style={{ textAlign: "center" }}>
          {line}
        </AppText>
      </View>
      <View style={{ flexDirection: "row", gap: space.s3 }}>
        <StatTile label="Öğrenildi" value={learnedDelta > 0 ? `+${learnedDelta}` : "0"} tone="success" hint={learnedDelta > 0 ? "bu tur" : "henüz değil"} />
        <StatTile label="Tekrar" value={s.again} tone={s.again > 0 ? "danger" : "accent"} hint="bu tur" />
        <StatTile label="Sıradaki" value={result.due.count > 0 ? result.due.count : result.due.nextAt ? relativeDay(result.due.nextAt) : "—"} hint={result.due.count > 0 ? "kart bekliyor" : "kart"} />
      </View>
      <View style={{ gap: space.s2, padding: space.s4, borderRadius: 10, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <AppText variant="subhead">Günlük kart hedefi</AppText>
          <AppText variant="stat" tone="accent">
            {goal.done} / {goal.target}
          </AppText>
        </View>
        <ProgressBar value={goal.target > 0 ? goal.done / goal.target : 0} height={6} label="Günlük kart hedefi" />
        <AppText variant="bodySm" tone="soft">
          {kalan === 0 ? "Bugünkü hedef tamam." : `${kalan} kart daha`}
        </AppText>
      </View>
    </View>
  );
}

export { KIND_ICON as FLASHCARD_KIND_ICON };

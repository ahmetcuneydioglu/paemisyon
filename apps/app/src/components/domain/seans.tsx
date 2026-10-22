import { ChevronLeft, ChevronRight, Flag, Grid3x3, MessageCircle, Scale, Star, X } from "lucide-react-native";
import type { ComponentType, ReactNode } from "react";
import { Animated, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { AppText, Button, IconButton } from "@/components/ui";
import type { QuizDifficulty } from "@/features/quiz/api";
import { COMPACT_WIDTH, fontFamily, palette } from "@/theme/tokens";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Seans oynatıcı bileşenleri (Doc 49/15, Figma "Seans" 38:13277). Hepsi token'dan beslenir,
 * ekrana özel değildir: deneme sonucu ve çalışma modu da aynı parçaları kullanabilir.
 * Panel (lacivert blok) iki temada da koyudur; üstündeki durum renkleri bu yüzden
 * koyu şema değerlerinden okunur (Figma kusuru 1: açık tema yeşili panelde 3,7:1 kalıyordu).
 */

type IconProps = { color: string; size?: number; strokeWidth?: number };

/* ---------------------------------------------------------------- Üst satır */

/**
 * Sabit üst satır: sol ghost ikon (çıkış), ortada etiket, sağda isteğe bağlı eylem.
 * `scrollY` verilirse etiket kaydırmayla ince başlığa ("3 / 10 · Anayasa Hukuku") geçer.
 */
export function SessionTopRow({
  onClose,
  closeLabel,
  label,
  collapsedLabel,
  scrollY,
  right,
  center,
}: {
  onClose: () => void;
  closeLabel: string;
  label: string;
  collapsedLabel?: string;
  scrollY?: Animated.Value;
  right?: ReactNode;
  /** Etiket yerine özel orta içerik (deneme sayacı). */
  center?: ReactNode;
}) {
  const { space } = useTheme();
  const collapse = scrollY && collapsedLabel ? scrollY.interpolate({ inputRange: [48, 112], outputRange: [0, 1], extrapolate: "clamp" }) : null;
  return (
    <View style={{ height: 44, flexDirection: "row", alignItems: "center", paddingHorizontal: space.s3 }}>
      <IconButton icon={X} label={closeLabel} variant="ghost" onPress={onClose} />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", minHeight: 44 }}>
        {center ?? (
          <>
            <Animated.View style={{ position: "absolute", opacity: collapse ? Animated.subtract(1, collapse) : 1 }}>
              <AppText variant="bodySm" tone="soft" numberOfLines={1}>
                {label}
              </AppText>
            </Animated.View>
            {collapse ? (
              <Animated.View style={{ position: "absolute", opacity: collapse }}>
                <AppText variant="subhead" numberOfLines={1} style={{ fontVariant: ["tabular-nums"] }}>
                  {collapsedLabel}
                </AppText>
              </Animated.View>
            ) : null}
          </>
        )}
      </View>
      <View style={{ width: 44, alignItems: "flex-end" }}>{right}</View>
    </View>
  );
}

/* ---------------------------------------------------------------- Başlık bloğu */

/** Kapsam adı (Lora), "Soru 3 / 10 · ✓2 ✗0" satırı ve dilimli ilerleme. */
export function SessionTitleBlock({
  title,
  index,
  total,
  correct,
  wrong,
  sub,
  slices,
}: {
  title: string;
  index: number;
  total: number;
  /** Alıştırmada ✓/✗ sayaçları; denemede verilmez. */
  correct?: number;
  wrong?: number;
  /** Sayaç yerine ek metin ("Deneme modu"). */
  sub?: string;
  slices: SliceState[];
}) {
  const { colors, space } = useTheme();
  // Açık temada success/danger 14 px metinde 4,5:1'i geçmez → *Ink tonları (Figma kusuru 2).
  const okColor = correct && correct > 0 ? colors.successInk : colors.inkSubtle;
  const koColor = wrong && wrong > 0 ? colors.dangerInk : colors.inkSubtle;
  return (
    <View style={{ gap: space.s2 }}>
      <AppText variant="title" numberOfLines={2} accessibilityRole="header">
        {title}
      </AppText>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }} accessible accessibilityLabel={`Soru ${index} / ${total}${correct != null ? `, ${correct} doğru, ${wrong ?? 0} yanlış` : sub ? `, ${sub}` : ""}`}>
        <AppText variant="bodySm" tone="soft" style={{ fontVariant: ["tabular-nums"] }}>
          Soru {index} / {total}
        </AppText>
        {correct != null ? (
          <>
            <AppText variant="bodySm" tone="subtle">
              ·
            </AppText>
            <AppText variant="bodySm" style={{ color: okColor, fontVariant: ["tabular-nums"] }}>
              ✓{correct}
            </AppText>
            <AppText variant="bodySm" style={{ color: koColor, fontVariant: ["tabular-nums"] }}>
              ✗{wrong ?? 0}
            </AppText>
          </>
        ) : sub ? (
          <AppText variant="bodySm" tone="soft">
            · {sub}
          </AppText>
        ) : null}
      </View>
      <SessionProgress slices={slices} />
    </View>
  );
}

/* ---------------------------------------------------------------- İlerleme dilimleri */

export type SliceState = "correct" | "wrong" | "current" | "answered" | "flagged" | "future";

const SLICE_PRIORITY: SliceState[] = ["current", "wrong", "correct", "flagged", "answered", "future"];

/**
 * Nöbet çizelgesi tarzı 2 pt dilimler (Figma İlerlemeDilimleri): doğru adaçayı, yanlış kırmızı,
 * mevcut altın, kalan çizgi. 20'den fazla soruda dilimler gruplanır (SegmentBar sınırı);
 * grupta en "önemli" durum görünür. Denemede yalnız cevaplandı/bayraklı — doğruluk sızmaz.
 */
export function SessionProgress({ slices }: { slices: SliceState[] }) {
  const { colors } = useTheme();
  const n = Math.min(20, Math.max(1, slices.length));
  const per = Math.ceil(slices.length / n);
  const groups: SliceState[] = Array.from({ length: n }, (_, i) => {
    const part = slices.slice(i * per, (i + 1) * per);
    return SLICE_PRIORITY.find((s) => part.includes(s)) ?? "future";
  });
  const color = (s: SliceState) => (s === "correct" ? colors.success : s === "wrong" ? colors.danger : s === "current" || s === "answered" ? colors.accent : s === "flagged" ? colors.warning : colors.line);
  const done = slices.filter((s) => s !== "future" && s !== "current").length;
  return (
    <View accessible accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: slices.length, now: done }} style={{ flexDirection: "row", gap: 3 }}>
      {groups.map((s, i) => (
        <View key={i} style={{ flex: 1, height: 2, borderRadius: 1, backgroundColor: color(s) }} />
      ))}
    </View>
  );
}

/* ---------------------------------------------------------------- Meta satırı */

const DIFFICULTY_LABEL: Record<QuizDifficulty, string> = { easy: "Kolay", medium: "Orta", hard: "Zor" };

/** "ZOR · PVSK md. 4/A ›" — zorluk etiketi + dokunulur madde bağı (denemede bağ yok). */
export function QuestionMetaRow({ difficulty, article }: { difficulty?: QuizDifficulty; article?: { label: string; onPress?: () => void } | null }) {
  const { space } = useTheme();
  if (!difficulty && !article) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, minHeight: 24 }}>
      {difficulty ? (
        <AppText variant="label" tone="subtle">
          {DIFFICULTY_LABEL[difficulty]}
        </AppText>
      ) : null}
      {difficulty && article ? (
        <AppText variant="label" tone="subtle">
          ·
        </AppText>
      ) : null}
      {article ? (
        <Pressable accessibilityRole={article.onPress ? "link" : "text"} disabled={!article.onPress} onPress={article.onPress} hitSlop={{ top: 10, bottom: 10, left: 4, right: 8 }} style={{ paddingVertical: space.s1, flexDirection: "row", alignItems: "center", gap: 2 }}>
          <AppText variant="label" tone="accentInk">
            {article.label}
          </AppText>
          {article.onPress ? (
            <AppText variant="label" tone="accentInk">
              ›
            </AppText>
          ) : null}
        </Pressable>
      ) : null}
    </View>
  );
}

/* ---------------------------------------------------------------- Araç satırı */

export interface ToolAction {
  key: "favorite" | "coach" | "report";
  label: string;
  icon?: ComponentType<IconProps>;
  active?: boolean;
  busy?: boolean;
  onPress: () => void;
}

const TOOL_ICON: Record<ToolAction["key"], ComponentType<IconProps>> = { favorite: Star, coach: MessageCircle, report: Flag };

/** Panel üstü ghost ikon düğmeleri (Favori · Koça sor · Hata bildir — soru notu yok: not okuma eylemidir, yeri mevzuat okuyucusu), her biri ≥44 pt. */
export function ToolRow({ actions, onPanel = true }: { actions: ToolAction[]; onPanel?: boolean }) {
  const { colors } = useTheme();
  const fg = onPanel ? colors.panelSoft : colors.inkSoft;
  const activeFg = onPanel ? palette.dark.accent : colors.accentInk;
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      {actions.map((a) => {
        const Icon = a.icon ?? TOOL_ICON[a.key];
        const color = a.active ? activeFg : fg;
        return (
          <Pressable key={a.key} accessibilityRole="button" accessibilityLabel={a.label} accessibilityState={{ selected: a.active, busy: a.busy }} onPress={a.onPress} disabled={a.busy} style={({ pressed }) => ({ minWidth: 64, minHeight: 48, alignItems: "center", justifyContent: "center", gap: 4, opacity: pressed || a.busy ? 0.6 : 1 })}>
            <Icon color={color} size={22} strokeWidth={1.75} {...(a.active && a.key === "favorite" ? { fill: color } : {})} />
            <AppText variant="bodySm" style={{ color, fontSize: 13, lineHeight: 16 }}>
              {a.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------------------------------------------------------------- Geri bildirim paneli */

export interface CoachState {
  status: "idle" | "busy" | "done" | "error";
  text?: string;
  remainingToday?: number | null;
  message?: string;
}

/**
 * Cevap sonrası panel (Figma GeriBildirimPaneli): sonuç satırı + süre rozeti, açıklama,
 * dayanak satırı, "Maddeyi oku →", koç cevabı (istenirse), araç satırı. Açıklama yoksa
 * "açıklamasız" varyantı: yalnız sonuç satırı ve araçlar.
 */
export function FeedbackPanel({
  isCorrect,
  correctLabel,
  seconds,
  explanation,
  legalReference,
  articleLabel,
  onReadArticle,
  coach,
  tools,
  scale = 1,
}: {
  isCorrect: boolean;
  /** Yanlışta doğru şıkkın harfi ("C"); bilinmiyorsa (devam edilen tur) verilmez. */
  correctLabel?: string | null;
  seconds?: number | null;
  explanation?: string | null;
  legalReference?: string | null;
  /** "Maddeyi oku" bağlantısı etiketi; metin yoksa verilmez. */
  articleLabel?: string | null;
  onReadArticle?: () => void;
  coach?: CoachState;
  tools: ToolAction[];
  scale?: number;
}) {
  const { colors, radius, space } = useTheme();
  const headColor = isCorrect ? palette.dark.success : palette.dark.danger;
  const title = isCorrect ? "Doğru" : correctLabel ? `Yanlış · doğru cevap ${correctLabel}` : "Yanlış";
  const bodyStyle = { fontSize: Math.round(15 * scale), lineHeight: Math.round(22 * scale) };
  return (
    <View accessible={false} style={{ backgroundColor: colors.panel, borderRadius: radius.panel, padding: space.s4, gap: space.s3 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.s3 }}>
        <AppText variant="heading" accessibilityRole="header" style={{ color: isCorrect ? headColor : colors.panelInk, fontSize: 18, lineHeight: 24, flex: 1 }}>
          {!isCorrect ? (
            <AppText variant="heading" style={{ color: headColor, fontSize: 18, lineHeight: 24 }}>
              Yanlış
            </AppText>
          ) : null}
          {!isCorrect ? title.slice("Yanlış".length) : title}
        </AppText>
        {seconds != null ? (
          <View style={{ borderRadius: radius.pill, borderWidth: 1, borderColor: colors.panelSoft, paddingHorizontal: 8, paddingVertical: 2 }}>
            <AppText variant="bodySm" tone="panelSoft" style={{ fontSize: 12, lineHeight: 16, fontVariant: ["tabular-nums"] }}>
              +{seconds} sn
            </AppText>
          </View>
        ) : null}
      </View>
      {explanation ? (
        <AppText variant="body" tone="panelInk" style={bodyStyle}>
          {explanation}
        </AppText>
      ) : explanation === null ? (
        <AppText variant="bodySm" tone="panelSoft">
          Bu soru için açıklama henüz yazılmadı.
        </AppText>
      ) : null}
      {legalReference ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Scale color={colors.panelSoft} size={16} strokeWidth={1.75} />
          <AppText variant="bodySm" tone="panelSoft" style={{ flex: 1 }}>
            {legalReference}
          </AppText>
        </View>
      ) : null}
      {articleLabel && onReadArticle ? (
        <Pressable accessibilityRole="button" onPress={onReadArticle} hitSlop={8} style={{ alignSelf: "flex-start", minHeight: 32, justifyContent: "center" }}>
          <AppText variant="subhead" tone="gold">
            {articleLabel} →
          </AppText>
        </Pressable>
      ) : null}
      {coach && coach.status !== "idle" ? (
        <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.panelSoft, paddingTop: space.s3, gap: space.s1 }}>
          <AppText variant="label" tone="panelSoft">
            Koç
          </AppText>
          {coach.status === "busy" ? (
            <AppText variant="bodySm" tone="panelSoft">
              Koç bakıyor…
            </AppText>
          ) : coach.status === "error" ? (
            <AppText variant="bodySm" tone="panelSoft">
              {coach.message ?? "Koça şu an ulaşılamadı."}
            </AppText>
          ) : (
            <>
              <AppText variant="body" tone="panelInk" style={bodyStyle}>
                {coach.text}
              </AppText>
              {coach.remainingToday != null ? (
                <AppText variant="bodySm" tone="panelSoft">
                  Bugün {coach.remainingToday} soru hakkın kaldı.
                </AppText>
              ) : null}
            </>
          )}
        </View>
      ) : null}
      <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, paddingTop: space.s2, marginTop: space.s1 }}>
        <ToolRow actions={tools} />
      </View>
    </View>
  );
}

/* ---------------------------------------------------------------- Alt çubuk */

type BarBase = { onPrev?: () => void; prevDisabled?: boolean };
export type SessionBarProps =
  | ({ variant: "before" } & BarBase)
  | ({ variant: "after"; primaryTitle: string; onPrimary: () => void; loading?: boolean } & BarBase)
  | ({
      variant: "exam";
      flagged: boolean;
      onFlag: () => void;
      gridLabel: string;
      onGrid: () => void;
      onNext: () => void;
      nextDisabled?: boolean;
    } & BarBase);

/**
 * Yapışkan alt çubuk (Figma AltÇubuk): cevap öncesi yalnız "Önceki"; cevap sonrası küçük
 * "Önceki" + altın birincil; denemede Önceki · Bayrak · optik form · Sonraki.
 * Atla yok — alıştırmada her soru cevaplanır (kullanıcı kararı).
 */
export function SessionBar(props: SessionBarProps & { bottomInset: number }) {
  const { colors, space, radius } = useTheme();
  const prev = (
    <Pressable accessibilityRole="button" accessibilityLabel="Önceki soru" accessibilityState={{ disabled: props.prevDisabled }} disabled={props.prevDisabled} onPress={props.onPrev} hitSlop={6} style={({ pressed }) => ({ minHeight: 44, minWidth: 44, flexDirection: "row", alignItems: "center", gap: 2, paddingRight: 8, opacity: props.prevDisabled ? 0.4 : pressed ? 0.6 : 1 })}>
      <ChevronLeft color={colors.inkSoft} size={18} strokeWidth={1.75} />
      <AppText variant="subhead" tone="soft">
        Önceki
      </AppText>
    </Pressable>
  );
  return (
    <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: space.screenGutter, paddingTop: space.s3, paddingBottom: props.bottomInset + space.s3, backgroundColor: colors.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, flexDirection: "row", alignItems: "center", gap: space.s3 }}>
      {prev}
      {props.variant === "after" ? <Button title={props.primaryTitle} onPress={props.onPrimary} loading={props.loading} style={{ flex: 1, minHeight: 52 }} /> : null}
      {props.variant === "exam" ? (
        <>
          <Pressable accessibilityRole="button" accessibilityLabel={props.flagged ? "Bayrağı kaldır" : "Emin değilim, bayrakla"} accessibilityState={{ selected: props.flagged }} onPress={props.onFlag} style={{ minWidth: 56, minHeight: 44, alignItems: "center", justifyContent: "center", gap: 2 }}>
            <Flag color={props.flagged ? colors.accentInk : colors.inkSoft} size={18} strokeWidth={1.75} {...(props.flagged ? { fill: colors.accentInk } : {})} />
            <AppText variant="bodySm" style={{ color: props.flagged ? colors.accentInk : colors.inkSoft, fontSize: 12, lineHeight: 14 }}>
              Bayrak
            </AppText>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Optik form, ${props.gridLabel}`} onPress={props.onGrid} style={{ flex: 1, minHeight: 44, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Grid3x3 color={colors.ink} size={16} strokeWidth={1.75} />
            <AppText variant="subhead" style={{ fontVariant: ["tabular-nums"] }}>
              {props.gridLabel}
            </AppText>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Sonraki soru" accessibilityState={{ disabled: props.nextDisabled }} disabled={props.nextDisabled} onPress={props.onNext} hitSlop={6} style={({ pressed }) => ({ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 2, paddingLeft: 8, opacity: props.nextDisabled ? 0.4 : pressed ? 0.6 : 1 })}>
            <AppText variant="subhead" tone="accentInk">
              Sonraki
            </AppText>
            <ChevronRight color={colors.accentInk} size={18} strokeWidth={1.75} />
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

/* ---------------------------------------------------------------- Sonuç paneli */

/** Tur sonu paneli (Figma SonuçPaneli): etiket, Lora hero "8/10", "Doğruluk %80 · 4 dk 12 sn". */
export function ResultPanel({ correct, total, pct, durationLabel, label = "Tur tamamlandı" }: { correct: number; total: number; pct: number | null; durationLabel: string | null; label?: string }) {
  const { colors, radius, space, type } = useTheme();
  const { width } = useWindowDimensions();
  const heroSize = width < COMPACT_WIDTH ? 80 : 96;
  // Lora'nın eğik çizgisi alt satıra taşmasın: satır 1,04 × boy (CountdownHero kuralı; Figma kusuru 3).
  const heroLine = Math.round(heroSize * 1.04);
  const sub = [pct == null ? null : `Doğruluk %${pct}`, durationLabel].filter(Boolean).join(" · ");
  return (
    <View accessible accessibilityLabel={`${label}: ${total} soruda ${correct} doğru${sub ? `, ${sub}` : ""}`} style={{ backgroundColor: colors.panel, borderRadius: radius.panel, paddingHorizontal: space.s4, paddingTop: space.s3, paddingBottom: space.s4, gap: space.s1 }}>
      <AppText variant="label" tone="panelSoft">
        {label}
      </AppText>
      <AppText variant="hero" tone="panelInk" maxFontSizeMultiplier={1} style={{ fontFamily: fontFamily.display[500], fontSize: heroSize, lineHeight: heroLine }}>
        {correct}/{total}
      </AppText>
      {sub ? (
        <AppText variant="subhead" tone="panelSoft" style={[type.subhead, { fontSize: 15 }]}>
          {sub}
        </AppText>
      ) : null}
    </View>
  );
}

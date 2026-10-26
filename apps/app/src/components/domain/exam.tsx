import { CalendarClock, Check, ChevronRight, Flag, LayoutGrid, Lock, Minus, Timer, Users, X, type LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";
import { AppText, Badge, Button, Card, Chip, IconButton, Notice, ProgressBar, Sheet } from "@/components/ui";
import { countdown, examCardModel, fmtDate, fmtNet, mmss, useReminder, useSetReminder, type CourseBreakdownRow, type ExamCardAction, type ExamHistory, type ExamListItem } from "@/features/exams/queries";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Deneme alanı bileşenleri (Doc 50, Figma "Denemeler V2"): ExamCard (5 durum), RuleCard,
 * CourseBreakdown (8 ders), TrendChart (net gelişimi), RankRow. Web `components/exam/*`
 * ile aynı adlar; kurallar sunucuda, bileşenler yalnız çizer.
 */

const DIFFICULTY: Record<"kolay" | "orta" | "zor", { label: string; tone: "success" | "accent" | "danger" }> = {
  kolay: { label: "Kolay", tone: "success" },
  orta: { label: "Orta", tone: "accent" },
  zor: { label: "Zor", tone: "danger" },
};

export function ExamCard({ exam, onAction }: { exam: ExamListItem; onAction: (a: ExamCardAction) => void }) {
  const { colors, space } = useTheme();
  const m = examCardModel(exam);
  const done = m.kind === "done";
  const closed = m.kind === "weekly_missed" || m.kind === "closed";
  const Icon: LucideIcon = done ? Check : closed ? Lock : Users;
  const iconColor = done ? colors.successInk : colors.inkSubtle;
  return (
    <Card style={{ gap: space.s3 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: space.s3 }}>
        <View style={{ flex: 1, gap: 6 }}>
          {exam.publishMode === "takvimli" ? (
            <View style={{ alignSelf: "flex-start" }}>
              <Badge>{fmtDate(exam.startAt, { day: "numeric", month: "short" })}</Badge>
            </View>
          ) : null}
          <AppText variant="heading">{exam.title}</AppText>
          <AppText variant="bodySm" tone="soft">
            {exam.questionCount} soru · {exam.durationMinutes} dk
          </AppText>
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          {exam.isPremium ? <Badge tone="warning">Premium</Badge> : null}
          {exam.difficulty ? <Badge tone={DIFFICULTY[exam.difficulty].tone}>{DIFFICULTY[exam.difficulty].label}</Badge> : null}
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Icon color={iconColor} size={16} strokeWidth={1.75} />
        <AppText variant={done ? "subhead" : "bodySm"} tone={done ? "ink" : "subtle"} style={{ fontVariant: ["tabular-nums"] }}>
          {m.status}
        </AppText>
      </View>
      {m.primary || m.secondary ? (
        <View style={{ flexDirection: "row", gap: space.s2 }}>
          {m.primary ? <Button title={m.primary.label} variant={m.primary.variant} style={{ flex: 1 }} onPress={() => onAction(m.primary!)} /> : null}
          {m.secondary ? <Button title={m.secondary.label} variant={m.secondary.variant} style={{ flex: 1 }} onPress={() => onAction(m.secondary!)} /> : null}
        </View>
      ) : null}
    </Card>
  );
}

/** Kurallar kartı (Doc 50 M2): ikon rozeti + başlık + gövde; ton warning/info/accent. */
export function RuleCard({ icon: Icon, tone = "info", title, body }: { icon: LucideIcon; tone?: "warning" | "info" | "accent"; title: string; body: string }) {
  const { colors, radius, space } = useTheme();
  const bg = tone === "warning" ? colors.warningSoft : tone === "accent" ? colors.accentSoft : colors.surfaceAlt;
  const fg = tone === "warning" ? colors.warningInk : tone === "accent" ? colors.accentInk : colors.ink;
  return (
    <View accessible accessibilityLabel={`${title}. ${body}`} style={{ flexDirection: "row", gap: space.s3, alignItems: "flex-start", backgroundColor: bg, borderRadius: radius.card, padding: space.s4 }}>
      <View style={{ width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
        <Icon color={fg} size={18} strokeWidth={1.75} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="subhead" style={{ color: fg }}>
          {title}
        </AppText>
        <AppText variant="bodySm" tone="soft">
          {body}
        </AppText>
      </View>
    </View>
  );
}

/** Ders dağılımı (Doc 50 M4): resmî tablo sırası; %60 altı amber + "zayıf" metni. */
export function CourseBreakdown({ rows }: { rows: CourseBreakdownRow[] }) {
  const { space } = useTheme();
  if (rows.length === 0) return null;
  return (
    <Card style={{ gap: space.s3 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <AppText variant="heading">Ders dağılımı</AppText>
        <AppText variant="bodySm" tone="subtle">
          doğru / soru
        </AppText>
      </View>
      {rows.map((r) => {
        const pct = r.total > 0 ? r.correct / r.total : 0;
        const weak = r.total > 0 && pct < 0.6;
        return (
          <View key={r.sectionId ?? r.name} style={{ gap: 5 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.s3 }}>
              <AppText variant="bodySm" style={{ flex: 1 }}>
                {r.name}
              </AppText>
              <AppText variant="subhead" tone={weak ? "danger" : "ink"} style={{ fontVariant: ["tabular-nums"] }}>
                {r.correct}/{r.total}
                {weak ? "  zayıf" : ""}
              </AppText>
            </View>
            <ProgressBar value={pct} tone={weak ? "warning" : "accent"} height={5} label={r.name} />
          </View>
        );
      })}
    </Card>
  );
}

/** Net gelişim grafiği (Doc 50 M8): son 6 resmî çözüm; SVG çizgi, etiketler metin. Kilitli: silik. */
export function TrendChart({ trend, onUnlock }: { trend: ExamHistory["trend"]; onUnlock?: () => void }) {
  const { colors, space } = useTheme();
  const pts = trend.points;
  const W = 320, H = 120;
  const min = Math.min(0, ...pts.map((p) => p.score)) - 5;
  const max = Math.max(100, ...pts.map((p) => p.score));
  const x = (i: number) => (pts.length <= 1 ? W / 2 : 12 + (i * (W - 24)) / (pts.length - 1));
  const y = (v: number) => H - 10 - ((v - min) / (max - min)) * (H - 20);
  return (
    <Card style={{ gap: space.s3 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <AppText variant="label" tone="subtle">
          Net gelişimi · son 6 resmî çözüm
        </AppText>
        {trend.locked ? <Lock color={colors.inkSubtle} size={16} strokeWidth={1.75} /> : trend.delta != null ? (
          <AppText variant="subhead" tone={trend.delta >= 0 ? "accentInk" : "danger"}>
            {trend.delta >= 0 ? "+" : ""}
            {fmtNet(trend.delta)}
          </AppText>
        ) : null}
      </View>
      {trend.locked ? (
        <>
          <Svg width="100%" height={88} viewBox={`0 0 ${W} 88`} opacity={0.35}>
            <Polyline points={`12,70 ${W / 4},52 ${W / 2},58 ${(3 * W) / 4},34 ${W - 12},20`} fill="none" stroke={colors.line} strokeWidth={2.5} />
          </Svg>
          <AppText variant="bodySm" tone="soft">
            Net gelişim grafiği ve ortalama Premium ile açılır.
          </AppText>
          {onUnlock ? <Button title="Premium'u gör" variant="secondary" onPress={onUnlock} /> : null}
        </>
      ) : pts.length < 2 ? (
        <AppText variant="bodySm" tone="soft">
          İki resmî çözümden sonra gelişim çizgin burada başlar.
        </AppText>
      ) : (
        <>
          <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} accessibilityLabel={`Net gelişimi: ${pts.map((p) => fmtNet(p.score)).join(", ")}`}>
            {[0.25, 0.5, 0.75].map((f) => (
              <Line key={f} x1={0} x2={W} y1={10 + f * (H - 20)} y2={10 + f * (H - 20)} stroke={colors.line} strokeWidth={1} />
            ))}
            <Polyline points={pts.map((p, i) => `${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(" ")} fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            {pts.map((p, i) => (
              <Circle key={p.attemptId} cx={x(i)} cy={y(p.score)} r={4.5} fill={colors.accent} />
            ))}
          </Svg>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            {pts.map((p) => (
              <AppText key={p.attemptId} variant="bodySm" tone="subtle" style={{ fontVariant: ["tabular-nums"] }}>
                {fmtNet(p.score)}
              </AppText>
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: space.s5 }}>
            <View>
              <AppText variant="label" tone="subtle">
                Ortalama
              </AppText>
              <AppText variant="subhead" style={{ fontVariant: ["tabular-nums"] }}>
                {fmtNet(trend.mean)}
              </AppText>
            </View>
            <View>
              <AppText variant="label" tone="subtle">
                En iyi
              </AppText>
              <AppText variant="subhead" style={{ fontVariant: ["tabular-nums"] }}>
                {fmtNet(trend.best)}
              </AppText>
            </View>
          </View>
        </>
      )}
    </Card>
  );
}

/** Sıralama satırı (Doc 50 M6): sıra, ad (kısaltılmış), net, yanlış, süre; ilk üç altın tonda. */
export function RankRow({ rank, name, score, wrong, duration, me, highlight, onPress }: { rank: number; name: string; score: string; wrong: number; duration: string; me?: boolean; highlight?: boolean; onPress?: () => void }) {
  const { colors, space } = useTheme();
  const inner = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.s3, paddingVertical: space.s3, paddingHorizontal: space.s4, minHeight: 52, backgroundColor: highlight ? colors.accentSoft : "transparent" }}>
      <AppText variant="subhead" tone={rank <= 3 ? "accentInk" : "ink"} style={{ width: 40, fontVariant: ["tabular-nums"] }}>
        {rank}.
      </AppText>
      <AppText variant="bodySm" style={{ flex: 1 }} numberOfLines={1}>
        {name}
        {me ? " · sen" : ""}
      </AppText>
      <AppText variant="subhead" style={{ width: 56, textAlign: "right", fontVariant: ["tabular-nums"] }}>
        {score}
      </AppText>
      <AppText variant="bodySm" tone="soft" style={{ width: 28, textAlign: "right", fontVariant: ["tabular-nums"] }}>
        {wrong}
      </AppText>
      <AppText variant="bodySm" tone="soft" style={{ width: 64, textAlign: "right", fontVariant: ["tabular-nums"] }}>
        {duration}
      </AppText>
    </View>
  );
  return onPress ? <Pressable accessibilityRole="button" onPress={onPress}>{inner}</Pressable> : inner;
}

/* ---------------------------------------------------------------- Oynatıcı (Figma M3) */

/**
 * Deneme üst çubuğu: ✕ · ad + "34 / 100" (dokununca soru haritası) · ⏱ süre; altında 3 pt
 * ilerleme. Son 5 dakikada süre uyarı tonuna döner.
 */
export function ExamTopBar({ title, index, total, timeLabel, warning, onClose, onPressCenter }: { title: string; index: number; total: number; timeLabel: string; warning?: boolean; onClose: () => void; onPressCenter?: () => void }) {
  const { colors, space } = useTheme();
  const pct = total > 0 ? Math.max(0, Math.min(1, index / total)) : 0;
  return (
    <View>
      <View style={{ height: 56, flexDirection: "row", alignItems: "center", paddingHorizontal: space.s3 }}>
        <IconButton icon={X} label="Sınavdan çık" variant="ghost" onPress={onClose} />
        <Pressable accessibilityRole="button" accessibilityLabel={`${title}, soru ${index} / ${total}. Soru haritasını aç`} onPress={onPressCenter} style={{ flex: 1, alignItems: "center", justifyContent: "center", minHeight: 44 }}>
          <AppText variant="bodySm" tone="soft" numberOfLines={1}>
            {title}
          </AppText>
          <AppText variant="subhead" style={{ fontVariant: ["tabular-nums"] }}>
            {index} / {total}
          </AppText>
        </Pressable>
        <View style={{ minWidth: 92, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4 }} accessible accessibilityLabel={`Kalan süre ${timeLabel}`}>
          <Timer color={warning ? colors.warningInk : colors.accentInk} size={16} strokeWidth={1.75} />
          <AppText variant="subhead" style={{ color: warning ? colors.warningInk : colors.accentInk, fontVariant: ["tabular-nums"] }}>
            {timeLabel}
          </AppText>
        </View>
      </View>
      <View style={{ height: 3, backgroundColor: colors.surfaceAlt }}>
        <View style={{ height: 3, width: `${pct * 100}%`, backgroundColor: colors.accent }} />
      </View>
    </View>
  );
}

/**
 * Deneme alt çubuğu: bayrak · soru haritası (1–100) · Önceki · Sonraki. Son soruda "Sonraki"
 * teslim sayfasını açar. Harita düğmesi kullanıcı isteğiyle eklendi (26 Eki): üst sayaca dokunma
 * yeterince keşfedilebilir değildi.
 */
export function ExamActionBar({ flagged, onFlag, onGrid, onPrev, prevDisabled, onNext, nextTitle = "Sonraki", bottomInset }: { flagged: boolean; onFlag: () => void; onGrid: () => void; onPrev: () => void; prevDisabled?: boolean; onNext: () => void; nextTitle?: string; bottomInset: number }) {
  const { colors, radius, space } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2, paddingHorizontal: space.screenGutter, paddingTop: space.s3, paddingBottom: bottomInset + space.s3, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, backgroundColor: colors.bg }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Soru haritası"
        onPress={onGrid}
        style={({ pressed }) => ({ width: 52, height: 52, borderRadius: radius.control, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}
      >
        <LayoutGrid color={colors.ink} size={20} strokeWidth={1.75} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={flagged ? "Bayrağı kaldır" : "Soruyu işaretle"}
        accessibilityState={{ selected: flagged }}
        onPress={onFlag}
        style={({ pressed }) => ({ width: 52, height: 52, borderRadius: radius.control, borderWidth: 1, borderColor: flagged ? colors.accent : colors.line, backgroundColor: flagged ? colors.accentSoft : colors.surface, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}
      >
        <Flag color={flagged ? colors.accentInk : colors.ink} size={20} strokeWidth={1.75} fill={flagged ? colors.accent : "transparent"} />
      </Pressable>
      <Button title="Önceki" variant="ghost" onPress={onPrev} disabled={prevDisabled} style={{ flex: 1, minWidth: 0 }} />
      <Button title={nextTitle} onPress={onNext} style={{ flex: 1.3, minWidth: 0 }} />
    </View>
  );
}

/** Anlık geri bildirim kutusu (Figma M3-b): "✓ Doğru cevap C" + açıklama; cevap kilitlidir. */
export function ExamFeedbackBox({ correctLabel, explanation }: { correctLabel: string | null; explanation: string | null }) {
  const { colors, space } = useTheme();
  return (
    <Card tone="alt" style={{ gap: space.s2 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Check color={colors.successInk} size={18} strokeWidth={2} />
        <AppText variant="subhead" tone="success">
          {correctLabel ? `Doğru cevap ${correctLabel}` : "Cevap kaydedildi"}
        </AppText>
      </View>
      <AppText variant="bodySm" tone="soft">
        {explanation ? `${explanation.trim()} ` : ""}Cevap kilitlendi, değiştirilemez.
      </AppText>
    </Card>
  );
}

export type ExamMapCell = "current" | "answered" | "flagged" | "blank";
type MapFilter = "answered" | "blank" | "flagged" | null;

/**
 * Soru haritası (Figma M3-d): sayım satırı, süzgeç çipleri, 10 sütunlu numara ızgarası.
 * Hücre 30 pt; dokunma hedefi hitSlop ile 44 pt'ye tamamlanır.
 */
export function ExamMapSheet({ visible, onClose, cells, onSelect, onSubmit }: { visible: boolean; onClose: () => void; cells: ExamMapCell[]; onSelect: (index: number) => void; onSubmit: () => void }) {
  const { colors, radius, space } = useTheme();
  const [filter, setFilter] = useState<MapFilter>(null);
  const [width, setWidth] = useState(0);
  const answered = cells.filter((c) => c === "answered").length;
  const flagged = cells.filter((c) => c === "flagged").length;
  const blank = cells.length - answered - flagged;
  const gap = 6;
  const cell = width > 0 ? Math.floor((width - gap * 9) / 10) : 30;
  const matches = (c: ExamMapCell) => (filter == null ? true : filter === "answered" ? c === "answered" : filter === "flagged" ? c === "flagged" : c === "blank" || c === "current");
  return (
    <Sheet visible={visible} onClose={onClose} title="Soru haritası" footer={<View style={{ gap: space.s2 }}><Button title="Sınava dön" variant="secondary" onPress={onClose} /><Button title="Teslim et" variant="ghost" onPress={onSubmit} /></View>}>
      <AppText variant="bodySm" tone="soft" style={{ fontVariant: ["tabular-nums"] }}>
        {answered} cevaplandı · {blank} boş · {flagged} işaretli
      </AppText>
      <View style={{ flexDirection: "row", gap: space.s2 }}>
        <Chip label="Cevaplandı" selected={filter === "answered"} onPress={() => setFilter(filter === "answered" ? null : "answered")} />
        <Chip label="Boş" selected={filter === "blank"} onPress={() => setFilter(filter === "blank" ? null : "blank")} />
        <Chip label="İşaretli" icon={Flag} selected={filter === "flagged"} onPress={() => setFilter(filter === "flagged" ? null : "flagged")} />
      </View>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ flexDirection: "row", flexWrap: "wrap", gap }}>
        {cells.map((c, i) => {
          const dim = !matches(c);
          const bg = c === "answered" ? colors.surfaceAlt : colors.surface;
          const border = c === "current" || c === "flagged" ? colors.accent : colors.line;
          const fg = c === "answered" || c === "flagged" || c === "current" ? colors.accentInk : colors.inkSoft;
          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={`Soru ${i + 1}${c === "answered" ? ", cevaplı" : c === "flagged" ? ", işaretli" : ", boş"}${c === "current" ? ", şu an" : ""}`}
              hitSlop={7}
              onPress={() => onSelect(i)}
              style={({ pressed }) => ({ width: cell, height: cell, borderRadius: radius.control, backgroundColor: bg, borderWidth: c === "current" ? 2 : 1, borderColor: border, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.6 : dim ? 0.3 : 1 })}
            >
              <AppText variant="label" style={{ color: fg, fontVariant: ["tabular-nums"] }}>
                {i + 1}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

/** Teslim onayı (Figma M3-e): sayım satırı + bilgi notu; "Teslim et" / "Sınava dön". */
export function ExamSubmitSheet({ visible, onClose, onSubmit, answered, blank, flagged, remainingLabel, busy }: { visible: boolean; onClose: () => void; onSubmit: () => void; answered: number; blank: number; flagged: number; remainingLabel: string | null; busy?: boolean }) {
  const { space } = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose} title="Teslim edeyim mi?" footer={<View style={{ gap: space.s2 }}><Button title="Teslim et" onPress={onSubmit} loading={busy} /><Button title="Sınava dön" variant="ghost" onPress={onClose} disabled={busy} /></View>}>
      <AppText variant="bodySm" tone="soft" style={{ fontVariant: ["tabular-nums"] }}>
        {answered} cevaplandı · {blank} boş · {flagged} işaretli{remainingLabel ? ` · ${remainingLabel} kaldı` : ""}
      </AppText>
      <Notice tone="info">Teslimden sonra cevaplar değiştirilemez. Boş sorular net&apos;e etki etmez.</Notice>
    </Sheet>
  );
}

/* ---------------------------------------------------------------- Sonuç (Figma M4) */

/** "DENEME SONUCU" etiketi, büyük net ve alt satır (sıra / rol / kişisel karşılaştırma). */
export function ResultHero({ label = "Deneme sonucu", value, unit = "net", sub, subTone = "soft" }: { label?: string; value: string; unit?: string | null; sub?: string | null; subTone?: "soft" | "ink" | "accentInk" }) {
  const { space } = useTheme();
  return (
    <View style={{ gap: 2 }} accessible accessibilityRole="header" accessibilityLabel={`${label}: ${value} ${unit ?? ""}${sub ? `. ${sub}` : ""}`}>
      <AppText variant="label" tone="subtle">
        {label.toLocaleUpperCase("tr-TR")}
      </AppText>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.s2 }}>
        <AppText variant="display" style={{ fontVariant: ["tabular-nums"] }}>
          {value}
        </AppText>
        {unit ? (
          <AppText variant="title" tone="accentInk">
            {unit}
          </AppText>
        ) : null}
      </View>
      {sub ? (
        <AppText variant={subTone === "soft" ? "bodySm" : "subhead"} tone={subTone}>
          {sub}
        </AppText>
      ) : null}
    </View>
  );
}

/** Çalışılacak konu kartı (Figma M4): ad, Y/B/soru satırı, "Çalış ›". */
export function WeakTopicCard({ name, wrong, blank, total, onPress }: { name: string; wrong: number; blank: number; total: number; onPress: () => void }) {
  const { colors, radius, space } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${name}: ${wrong} yanlış, ${blank} boş, ${total} soru. Çalış`} onPress={onPress} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: space.s3, padding: space.s4, minHeight: 64, backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, opacity: pressed ? 0.8 : 1 })}>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="subhead" numberOfLines={2}>
          {name}
        </AppText>
        <AppText variant="bodySm" tone="soft" style={{ fontVariant: ["tabular-nums"] }}>
          Y {wrong} · B {blank} · {total} soru
        </AppText>
      </View>
      <AppText variant="subhead" tone="accentInk">
        Çalış
      </AppText>
      <ChevronRight color={colors.inkSubtle} size={18} strokeWidth={1.75} />
    </Pressable>
  );
}

/* ---------------------------------------------------------------- İnceleme (Figma M5) */

/** İnceleme liste kartı: durum simgesi · "Soru N" + ders · konu · sağda Türkiye % ve süre. */
export function ReviewRow({ no, status, course, topic, turkeyLabel, timeLabel, onPress }: { no: number; status: "correct" | "wrong" | "blank"; course: string | null; topic: string | null; turkeyLabel: string | null; timeLabel: string; onPress: () => void }) {
  const { colors, radius, space } = useTheme();
  const Icon = status === "correct" ? Check : status === "wrong" ? X : Minus;
  const iconColor = status === "correct" ? colors.successInk : status === "wrong" ? colors.dangerInk : colors.inkSubtle;
  const sub = [course, topic].filter(Boolean).join(" · ");
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Soru ${no}, ${status === "correct" ? "doğru" : status === "wrong" ? "yanlış" : "boş"}${sub ? `, ${sub}` : ""}${turkeyLabel ? `, ${turkeyLabel}` : ""}, ${timeLabel}`} onPress={onPress} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: space.s3, paddingVertical: space.s3, paddingHorizontal: space.s4, minHeight: 64, backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, opacity: pressed ? 0.8 : 1 })}>
      <Icon color={iconColor} size={18} strokeWidth={2} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="subhead">Soru {no}</AppText>
        <AppText variant="bodySm" tone="soft" numberOfLines={1}>
          {sub || "—"}
        </AppText>
      </View>
      <View style={{ alignItems: "flex-end", gap: 2 }}>
        {turkeyLabel ? (
          <AppText variant="bodySm" tone="ink">
            {turkeyLabel}
          </AppText>
        ) : null}
        <AppText variant="bodySm" tone="subtle" style={{ fontVariant: ["tabular-nums"] }}>
          {timeLabel}
        </AppText>
      </View>
      <ChevronRight color={colors.inkSubtle} size={18} strokeWidth={1.75} />
    </Pressable>
  );
}

/* ---------------------------------------------------------------- Haftalık (26 Eki 2026, Figma 58:1318) */

/** ms → gün/saat/dk/sn parçaları (negatifte sıfır). */
export function splitCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** Dört birimli sayaç: GÜN : SAAT : DK : SN. Bordo/lacivert panel üstünde (panelInk/panelSoft). */
export function WeeklyCountdown({ msLeft, size = 44 }: { msLeft: number; size?: number }) {
  const { colors, space } = useTheme();
  const c = splitCountdown(msLeft);
  const units: [string, string][] = [[String(c.d), "GÜN"], [String(c.h).padStart(2, "0"), "SAAT"], [String(c.m).padStart(2, "0"), "DK"], [String(c.s).padStart(2, "0"), "SN"]];
  return (
    <View accessible accessibilityLabel={`${c.d} gün ${c.h} saat ${c.m} dakika ${c.s} saniye kaldı`} style={{ flexDirection: "row", alignItems: "flex-start", gap: space.s2 }}>
      {units.map(([n, u], i) => (
        <View key={u} style={{ flexDirection: "row", alignItems: "flex-start", gap: space.s2 }}>
          <View style={{ alignItems: "center", minWidth: size * 1.15 }}>
            <AppText variant="display" tone="panelInk" maxFontSizeMultiplier={1.2} style={{ fontSize: size, lineHeight: Math.round(size * 1.1), fontVariant: ["tabular-nums"] }}>
              {n}
            </AppText>
            <AppText variant="label" tone="panelSoft" style={{ letterSpacing: 1 }}>
              {u}
            </AppText>
          </View>
          {i < units.length - 1 ? (
            <AppText variant="display" style={{ color: colors.panelSoft, fontSize: Math.round(size * 0.8), lineHeight: Math.round(size * 1.1) }}>
              :
            </AppText>
          ) : null}
        </View>
      ))}
    </View>
  );
}

/** "Pazar 19 Eki · 21:00" — haftalık kart ve hero tarih satırı. */
export function weeklyWhen(iso: string): string {
  return `${fmtDate(iso, { weekday: "long" })} ${fmtDate(iso, { day: "numeric", month: "short" })} · ${fmtDate(iso, { hour: "2-digit", minute: "2-digit" })}`;
}

/** Hatırlat düğmesi: durumu sunucudan okur, tek dokunuşla açar/kapatır. */
export function RemindButton({ examId, variant = "secondary", style }: { examId: string; variant?: "primary" | "secondary" | "ghost"; style?: StyleProp<ViewStyle> }) {
  const rem = useReminder(examId);
  const set = useSetReminder(examId);
  const on = rem.data?.reminding ?? false;
  return <Button title={on ? "Hatırlatma açık" : "Hatırlat"} variant={variant} loading={set.isPending} style={style} onPress={() => set.mutate(!on)} />;
}

/**
 * Haftalık deneme kartı (Figma 58:1318 "KART"): bordo tonlu zemin + ince bordo çerçeve, üstte
 * HAFTALIK rozeti ve tarih satırı, sağda mini sayaç (beklemede "2g 14s", açıkken kalan süre),
 * durum satırı, duruma göre düğmeler. `now` sayaç için (saniyede bir).
 */
export function WeeklyExamCard({ exam, now, onAction }: { exam: ExamListItem; now: number; onAction: (a: ExamCardAction) => void }) {
  const { colors, radius, space } = useTheme();
  const m = examCardModel(exam);
  const start = Date.parse(exam.startAt), end = Date.parse(exam.endAt);
  const upcoming = exam.availability === "upcoming";
  const open = exam.availability === "open";
  const c = splitCountdown(start - now);
  const counter = upcoming ? [c.d > 0 ? `${c.d}g ${c.h}s` : c.h > 0 ? `${c.h}s ${c.m}d` : `${c.m}:${String(c.s).padStart(2, "0")}`, "KALDI"] : open ? [mmss((end - now) / 1000), "KALDI"] : null;
  const status = upcoming
    ? `${countdown(start - now)} kaldı · ${exam.participantCount.toLocaleString("tr-TR")} kişi katılacak`
    : open && m.kind !== "done"
      ? `Pencere açık · ${mmss((end - now) / 1000)} kaldı · ${exam.participantCount.toLocaleString("tr-TR")} kişi girdi`
      : m.status;
  const done = m.kind === "done";
  const Icon: LucideIcon = done ? Check : m.kind === "weekly_missed" ? Lock : open ? Users : CalendarClock;
  return (
    <View accessible={false} style={{ backgroundColor: colors.liveSoft, borderRadius: radius.card, borderWidth: 1, borderColor: colors.liveInk, padding: space.s4, gap: space.s3 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: space.s3 }}>
        <View style={{ flex: 1, gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2, flexWrap: "wrap" }}>
            <View style={{ backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 }}>
              <AppText variant="label" style={{ color: colors.liveInk }}>
                HAFTALIK
              </AppText>
            </View>
            <AppText variant="subhead" style={{ color: colors.liveInk }}>
              {weeklyWhen(exam.startAt)}
            </AppText>
          </View>
          <AppText variant="heading">{exam.title}</AppText>
          <AppText variant="bodySm" tone="soft">
            {exam.questionCount} soru · {exam.durationMinutes} dk{exam.isPremium ? " · Premium" : ""}
          </AppText>
        </View>
        {counter ? (
          <View style={{ alignItems: "flex-end" }} accessible accessibilityLabel={`${counter[0]} kaldı`}>
            <AppText variant="stat" style={{ color: colors.liveInk, fontSize: 26, lineHeight: 30, fontVariant: ["tabular-nums"] }}>
              {counter[0]}
            </AppText>
            <AppText variant="label" style={{ color: colors.liveInk, letterSpacing: 1 }}>
              {counter[1]}
            </AppText>
          </View>
        ) : null}
      </View>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 6 }}>
        <Icon color={done ? colors.successInk : colors.inkSoft} size={16} strokeWidth={1.75} style={{ marginTop: 2 }} />
        <AppText variant={done || open ? "subhead" : "bodySm"} tone={done || open ? "ink" : "soft"} style={{ flex: 1, fontVariant: ["tabular-nums"] }}>
          {status}
        </AppText>
      </View>
      <View style={{ flexDirection: "row", gap: space.s2 }}>
        {upcoming ? (
          <>
            <RemindButton examId={exam.id} style={{ flex: 1 }} />
            <Button title="Kuralları gör" variant="ghost" style={{ flex: 1 }} onPress={() => onAction({ label: "Kuralları gör", go: { kind: "rules" }, variant: "ghost" })} />
          </>
        ) : (
          <>
            {m.primary ? <Button title={open && m.kind === "new" ? "Katıl" : m.primary.label} variant={m.primary.variant} style={{ flex: 1 }} onPress={() => onAction(m.primary!)} /> : null}
            {m.secondary ? <Button title={m.secondary.label} variant={m.secondary.variant} style={{ flex: 1 }} onPress={() => onAction(m.secondary!)} /> : open && m.kind === "new" ? <Button title="Kurallar" variant="ghost" style={{ flex: 1 }} onPress={() => onAction({ label: "Kurallar", go: { kind: "rules" }, variant: "ghost" })} /> : null}
          </>
        )}
      </View>
    </View>
  );
}

/**
 * Bugün — canlı haftalık deneme paneli (Figma 58:1428): pencere açıkken PAEM sayacının yerine
 * geçer. CANLI etiketi, ad, kalan süre büyük, pencere saatleri, Katıl/Kurallar (teslim ettiysen
 * Sonucunu gör / Sıralama), altta tek satır PAEM geri sayımı.
 */
export function LiveExamPanel({ exam, now, paemLine, onJoin, onRules, onResult }: { exam: ExamListItem; now: number; paemLine: string | null; onJoin: () => void; onRules: () => void; onResult: () => void }) {
  const { colors, radius, space } = useTheme();
  const end = Date.parse(exam.endAt);
  const submitted = exam.my?.official?.status === "completed";
  const active = exam.myState === "in_progress";
  const left = mmss((end - now) / 1000);
  const window = `${fmtDate(exam.startAt, { hour: "2-digit", minute: "2-digit" })}–${fmtDate(exam.endAt, { hour: "2-digit", minute: "2-digit" })}`;
  return (
    <View accessible accessibilityLabel={`Canlı haftalık deneme ${exam.title}, ${left} kaldı`} style={{ backgroundColor: colors.live, borderRadius: radius.panel, paddingHorizontal: space.s4, paddingTop: space.s3, paddingBottom: space.s4, gap: space.s2 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} />
        <AppText variant="label" tone="panelSoft" style={{ letterSpacing: 1.2, flex: 1 }}>
          CANLI · HAFTALIK DENEME
        </AppText>
        <AppText variant="bodySm" tone="panelSoft">
          {exam.participantCount.toLocaleString("tr-TR")} kişi içeride
        </AppText>
      </View>
      <AppText variant="title" tone="panelInk" numberOfLines={2}>
        {exam.title}
      </AppText>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.s2, flexWrap: "wrap" }}>
        <AppText variant="display" tone="panelInk" maxFontSizeMultiplier={1.2} style={{ fontSize: 48, lineHeight: 52, fontVariant: ["tabular-nums"] }}>
          {left}
        </AppText>
        <AppText variant="bodySm" tone="panelSoft">
          kalan süre · {window}
        </AppText>
      </View>
      <View style={{ flexDirection: "row", gap: space.s2 }}>
        {submitted ? (
          <Button title="Sonucunu gör" variant="secondary" style={{ flex: 1 }} onPress={onResult} />
        ) : (
          <Button title={active ? "Devam et" : "Katıl"} style={{ flex: 1 }} onPress={onJoin} />
        )}
        <Pressable accessibilityRole="button" onPress={onRules} style={{ minHeight: 52, justifyContent: "center", paddingHorizontal: space.s4 }}>
          <AppText variant="subhead" tone="panelInk">
            Kurallar
          </AppText>
        </Pressable>
      </View>
      <AppText variant="bodySm" tone="panelSoft">
        {submitted ? "Teslim ettin; sonuçlar pencere kapanınca açıklanır." : `${fmtDate(exam.endAt, { hour: "2-digit", minute: "2-digit" })}'a kadar girebilirsin.`}{paemLine ? ` ${paemLine}` : ""}
      </AppText>
    </View>
  );
}

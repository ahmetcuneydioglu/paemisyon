import { Check, Lock, Users, type LucideIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";
import { AppText, Badge, Button, Card, ProgressBar } from "@/components/ui";
import { examCardModel, fmtDate, fmtNet, type CourseBreakdownRow, type ExamCardAction, type ExamHistory, type ExamListItem } from "@/features/exams/queries";
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

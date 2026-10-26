import { AlertTriangle, BarChart3, BookOpenText, CheckCircle2, Lightbulb, Lock, Scale, Table2 } from "lucide-react-native";
import { useMemo, useState, type ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { AppText, Badge, Button, Card, ListRow, ProgressBar, Sheet, Skeleton, type BadgeTone } from "@/components/ui";
import { useLawRead } from "@/features/mevzuat/queries";
import { masteryLabel, parseBody, SUMMARY_BLOCK_LABEL, shortTitle, unitProgressPct, type InlineRun, type SummaryBlock, type SummaryUnitListItem } from "@/features/summaries/queries";
import { useTheme } from "@/theme/ThemeProvider";

/* ---------------------------------------------------------------- Ünite satırı */

/** Konu odasının "Konu özetleri" satırı: ikon (bitti / kilitli / oku), md aralığı, süre, ilerleme. */
export function SummaryUnitRow({ unit, onPress }: { unit: SummaryUnitListItem; onPress: () => void }) {
  const { colors, radius, space } = useTheme();
  const done = Boolean(unit.progress?.completedAt);
  const pct = unitProgressPct(unit);
  const Icon = done ? CheckCircle2 : unit.locked ? Lock : BookOpenText;
  return (
    <ListRow
      title={shortTitle(unit.title)}
      subtitle={`md ${unit.articleFrom}–${unit.articleTo} · ${unit.readingMinutes} dk · ${unit.blockCount} kart${unit.progress && !done ? " · kaldığın yerden" : ""}`}
      leading={
        <View style={{ width: 40, height: 40, borderRadius: radius.pill, backgroundColor: done ? colors.successSoft : colors.accentSoft, alignItems: "center", justifyContent: "center" }}>
          <Icon color={done ? colors.success : colors.accentInk} size={20} strokeWidth={1.75} />
        </View>
      }
      trailing={
        masteryLabel(unit.mastery) ? (
          <Badge tone={unit.mastery!.band === "weak" ? "warning" : unit.mastery!.band === "strong" ? "success" : "neutral"}>{masteryLabel(unit.mastery)!}</Badge>
        ) : unit.isPremium ? (
          <Badge tone={unit.locked ? "warning" : "neutral"}>Premium</Badge>
        ) : unit.progress ? (
          <View style={{ width: 56, gap: space.s1 }}>
            <ProgressBar value={pct / 100} tone={done ? "success" : "accent"} height={4} />
          </View>
        ) : undefined
      }
      onPress={onPress}
    />
  );
}

/* ---------------------------------------------------------------- Gövde */

function Runs({ runs, tone = "soft" }: { runs: InlineRun[]; tone?: "ink" | "soft" }) {
  return (
    <AppText variant="body" tone={tone}>
      {runs.map((r, i) =>
        r.bold ? (
          <AppText key={i} variant="subhead" tone="ink">
            {r.text}
          </AppText>
        ) : (
          r.text
        ),
      )}
    </AppText>
  );
}

/** Kart gövdesi: kalın ve liste dışında markdown yok (Doc 53 §3). */
export function SummaryBody({ text }: { text: string }) {
  const { space } = useTheme();
  const paras = useMemo(() => parseBody(text), [text]);
  return (
    <View style={{ gap: space.s2 }}>
      {paras.map((p, i) =>
        p.kind === "p" ? (
          <Runs key={i} runs={p.runs} />
        ) : (
          <View key={i} style={{ gap: space.s1, paddingLeft: space.s1 }}>
            {p.items.map((runs, j) => (
              <View key={j} style={{ flexDirection: "row", gap: space.s2 }}>
                <AppText variant="body" tone="subtle" style={{ minWidth: p.ordered ? 20 : 10 }}>
                  {p.ordered ? `${j + 1}.` : "•"}
                </AppText>
                <View style={{ flex: 1 }}>
                  <Runs runs={runs} />
                </View>
              </View>
            ))}
          </View>
        ),
      )}
    </View>
  );
}

/* ---------------------------------------------------------------- Madde rozeti + sheet */

/** "md 84" rozeti: dokununca resmî madde metni alt sayfada (Mevzuat Merkezi okuma yanıtı; Doc 29). */
export function ArticlePeek({ lawSlug, no, title, onOpen }: { lawSlug: string; no: string; title: string | null; onOpen: (no: string, title: string | null) => void }) {
  const { colors, radius, space } = useTheme();
  return (
    <Pressable
      onPress={() => onOpen(no, title)}
      accessibilityRole="button"
      accessibilityLabel={`Madde ${no}${title ? `, ${title}` : ""}`}
      hitSlop={8}
      style={({ pressed }) => ({
        height: 28,
        paddingHorizontal: space.s2,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: pressed ? colors.accent : colors.line,
        backgroundColor: colors.surfaceAlt,
        justifyContent: "center",
      })}
    >
      <AppText variant="label" tone="soft">
        md {no}
      </AppText>
    </Pressable>
  );
}

export function ArticlePeekSheet({ lawSlug, no, title, onClose, onReadFull }: { lawSlug: string; no: string | null; title: string | null; onClose: () => void; onReadFull: (no: string) => void }) {
  const { space } = useTheme();
  const q = useLawRead(no ? lawSlug : null);
  const a = no ? q.data?.articles.find((x) => x.no === no) : undefined;
  const baslik = title?.replace(/^\d+\.\s*|^[A-Z]\.\s*/, "") ?? a?.title ?? null;
  return (
    <Sheet visible={no != null} onClose={onClose} title={no ? `Madde ${no}${baslik ? ` — ${baslik}` : ""}` : ""} footer={no ? <Button title="Madde sayfası" variant="secondary" onPress={() => onReadFull(no)} /> : undefined}>
      {q.isPending ? (
        <View style={{ gap: space.s2 }}>
          <Skeleton height={16} />
          <Skeleton height={16} width="90%" />
          <Skeleton height={16} width="70%" />
        </View>
      ) : !a ? (
        <AppText variant="bodySm" tone="subtle">
          Madde metni şu an gösterilemiyor.
        </AppText>
      ) : (
        <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: space.s3 }}>
          <AppText variant="body" tone="ink">
            {a.text}
          </AppText>
          <AppText variant="label" tone="subtle">
            {q.data!.source}
            {q.data!.verifiedAt ? ` · ${new Date(q.data!.verifiedAt).toLocaleDateString("tr-TR", { dateStyle: "medium" })} itibarıyla` : ""}
            {a.questionCount > 0 ? ` · ${a.questionCount} çıkmış soru` : ""}
          </AppText>
        </ScrollView>
      )}
    </Sheet>
  );
}

/* ---------------------------------------------------------------- Kart */

type IconProps = { color?: string; size?: number; strokeWidth?: number };
const META: Record<SummaryBlock["type"], { tone: BadgeTone; icon: React.ComponentType<IconProps> | null; card: "surface" | "alt" | "accent" }> = {
  concept: { tone: "accent", icon: Lightbulb, card: "accent" },
  rule: { tone: "neutral", icon: Scale, card: "surface" },
  numbers: { tone: "neutral", icon: Table2, card: "alt" },
  compare: { tone: "neutral", icon: Table2, card: "alt" },
  trap: { tone: "warning", icon: AlertTriangle, card: "surface" },
  exam_stats: { tone: "success", icon: BarChart3, card: "alt" },
  bridge: { tone: "accent", icon: null, card: "accent" },
};

function compareHeads(title: string | null): [string, string] {
  const parts = (title ?? "").split(/\s+(?:ve|ile|vs\.?|–|-)\s+/i);
  return parts.length >= 2 ? [parts[0]!.trim(), parts.slice(1).join(" ").trim()] : ["Birincisi", "İkincisi"];
}

function Refs({ refs, lawSlug, onOpen }: { refs: string[] | undefined; lawSlug: string; onOpen: (no: string, title: string | null) => void }) {
  const { space } = useTheme();
  if (!refs?.length) return null;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s1, marginTop: space.s1 }}>
      {refs.map((no) => (
        <ArticlePeek key={no} lawSlug={lawSlug} no={no} title={null} onOpen={onOpen} />
      ))}
    </View>
  );
}

/** Sayı tablosu: satır = konu · değer · md rozetleri. Dar ekranda tablo yerine satır yığını (okunur, kaydırma yok). */
function NumbersRows({ rows, lawSlug, onOpen }: { rows: SummaryBlock["rows"]; lawSlug: string; onOpen: (no: string, title: string | null) => void }) {
  const { colors, space } = useTheme();
  return (
    <View>
      {(rows ?? []).map((r, i) => (
        <View key={i} style={{ paddingVertical: space.s2, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.line, gap: 2 }}>
          <AppText variant="bodySm" tone="soft">
            {String(r.label ?? "")}
          </AppText>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.s2 }}>
            <AppText variant="subhead" tone="ink" style={{ flex: 1 }}>
              {String(r.value ?? "")}
            </AppText>
            <View style={{ flexDirection: "row", gap: space.s1 }}>
              {(r.refs ?? []).map((no) => (
                <ArticlePeek key={no} lawSlug={lawSlug} no={no} title={null} onOpen={onOpen} />
              ))}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

/** Karşılaştırma: her yön bir blok; sol/sağ başlıklar kart başlığından ("X ve Y"). */
function CompareRows({ rows, title, lawSlug, onOpen }: { rows: SummaryBlock["rows"]; title: string | null; lawSlug: string; onOpen: (no: string, title: string | null) => void }) {
  const { colors, space } = useTheme();
  const [sol, sag] = compareHeads(title);
  return (
    <View>
      {(rows ?? []).map((r, i) => (
        <View key={i} style={{ paddingVertical: space.s2, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.line, gap: space.s1 }}>
          <AppText variant="label" tone="subtle">
            {String(r.aspect ?? "")}
          </AppText>
          <View style={{ flexDirection: "row", gap: space.s3 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="label" tone="accent">
                {sol}
              </AppText>
              <AppText variant="bodySm" tone="ink">
                {String(r.left ?? "—")}
              </AppText>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="label" tone="accent">
                {sag}
              </AppText>
              <AppText variant="bodySm" tone="ink">
                {String(r.right ?? "—")}
              </AppText>
            </View>
          </View>
          <Refs refs={r.refs} lawSlug={lawSlug} onOpen={onOpen} />
        </View>
      ))}
    </View>
  );
}

function StatRows({ rows }: { rows: SummaryBlock["rows"] }) {
  const { colors, space } = useTheme();
  return (
    <View>
      {(rows ?? []).map((r, i) => (
        <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: space.s3, paddingVertical: space.s2, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.line }}>
          <AppText variant="bodySm" tone="soft" style={{ flex: 1 }}>
            {String(r.label ?? "")}
          </AppText>
          <AppText variant="subhead" tone="ink" style={{ textAlign: "right", maxWidth: "45%" }}>
            {String(r.value ?? "")}
          </AppText>
        </View>
      ))}
    </View>
  );
}

/** Tek kart (Doc 53 §3): tür rozeti + madde rozetleri + gövde ya da satırlar. bridge burada çizilmez. */
export function SummaryBlockCard({ block, lawSlug, onOpenArticle, children }: { block: SummaryBlock; lawSlug: string; onOpenArticle: (no: string, title: string | null) => void; children?: ReactNode }) {
  const { colors, space } = useTheme();
  const meta = META[block.type];
  const Icon = meta.icon;
  return (
    <Card tone={meta.card}>
      <View style={{ gap: space.s3 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.s1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            {Icon ? <Icon color={meta.tone === "warning" ? colors.warning : meta.tone === "success" ? colors.success : meta.tone === "accent" ? colors.accentInk : colors.inkSoft} size={14} strokeWidth={2} /> : null}
            <Badge tone={meta.tone}>{SUMMARY_BLOCK_LABEL[block.type]}</Badge>
          </View>
          {block.articles.map((a) => (
            <ArticlePeek key={a.no} lawSlug={lawSlug} no={a.no} title={a.title} onOpen={onOpenArticle} />
          ))}
        </View>
        {block.title ? (
          <AppText variant="heading" tone="ink">
            {block.title}
          </AppText>
        ) : null}
        {block.body ? <SummaryBody text={block.body} /> : null}
        {block.rows && block.rows.length > 0 ? (
          block.type === "exam_stats" ? (
            <StatRows rows={block.rows} />
          ) : block.type === "compare" ? (
            <CompareRows rows={block.rows} title={block.title} lawSlug={lawSlug} onOpen={onOpenArticle} />
          ) : (
            <NumbersRows rows={block.rows} lawSlug={lawSlug} onOpen={onOpenArticle} />
          )
        ) : null}
        {children}
      </View>
    </Card>
  );
}

/** Kilit kartı: açık kartlardan sonra, kalan kart sayısı ve Premium çağrısı. */
export function SummaryLockCard({ remaining, onPremium }: { remaining: number; onPremium: () => void }) {
  const { colors, space } = useTheme();
  return (
    <Card tone="alt">
      <View style={{ gap: space.s3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
          <Lock color={colors.ink} size={18} strokeWidth={1.75} />
          <AppText variant="heading" tone="ink">
            Kalan {remaining} kart Premium
          </AppText>
        </View>
        <AppText variant="body" tone="soft">
          {"Sayı tabloları, tuzak kartları ve “Sınav der ki” bölümü dâhil ünitenin tamamı Premium’da açılır."}
        </AppText>
        <Button title="Premium'u gör" onPress={onPremium} />
      </View>
    </Card>
  );
}

/** Sheet durumunu yöneten küçük yardımcı: ekran tek bir ArticlePeekSheet tutar. */
export function useArticlePeek() {
  const [peek, setPeek] = useState<{ no: string; title: string | null } | null>(null);
  return { peek, open: (no: string, title: string | null) => setPeek({ no, title }), close: () => setPeek(null) };
}

import { ChevronRight, Clock } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { AppText, Badge, Card, ProgressBar } from "@/components/ui";
import { TYPE_LABEL, type MerkezLaw } from "@/features/mevzuat/queries";
import { useTheme } from "@/theme/ThemeProvider";

/* ---------------------------------------------------------------- Adlandırma (saf) */

/** Kart rozeti: "2559", "CBK 1", "Yön."; numara yoksa türün kısaltması. */
export function lawBadge(law: Pick<MerkezLaw, "number" | "type">): string {
  if (law.number && law.type === "cbk") return `CBK ${law.number}`;
  if (law.number && law.number.length <= 5) return law.number;
  return TYPE_LABEL[law.type].slice(0, 4) + (TYPE_LABEL[law.type].length > 4 ? "." : "");
}

/** Kart başlığı: numara rozette durduğu için baştaki "2559 sayılı " atılır. */
export function lawDisplayName(law: Pick<MerkezLaw, "number" | "name">): string {
  const prefix = law.number ? `${law.number} sayılı ` : null;
  return prefix && law.name.toLocaleLowerCase("tr-TR").startsWith(prefix.toLocaleLowerCase("tr-TR")) ? law.name.slice(prefix.length) : law.name;
}

/** Kısa ad: "PVSK", yoksa numara, o da yoksa ad. */
export function lawShort(law: Pick<MerkezLaw, "number" | "name" | "shortName">): string {
  return law.shortName?.trim() || law.number || law.name;
}

/** İlerleme satırı: "%12 · md 16'dasın", "Başlanmadı", "Tamamlandı". */
export function progressLabel(law: Pick<MerkezLaw, "percent" | "lastRead">): string {
  if (!law.lastRead) return "Başlanmadı";
  if (law.percent >= 100) return "Sonuna geldin";
  return `%${law.percent} · md ${law.lastRead.no}'dasın`;
}

/* ---------------------------------------------------------------- Kanun kartı */

/** Mevzuat sekmesi kanun kartı: rozet + ad, madde/soru sayıları, ilerleme çubuğu. Dokunma hedefi tüm kart. */
export function LawCard({ law, onPress }: { law: MerkezLaw; onPress: () => void }) {
  const { colors, space, radius } = useTheme();
  const meta = [`${law.articleCount} madde`, law.questionCount > 0 ? `${law.questionCount} soru çıkmış` : null].filter(Boolean).join(" · ");
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${lawShort(law)}: ${lawDisplayName(law)}. ${meta}. ${progressLabel(law)}`}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colors.line,
        padding: space.s4,
        gap: space.s2,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
        <Badge tone="accent">{lawBadge(law)}</Badge>
        <AppText variant="subhead" tone="ink" numberOfLines={2} style={{ flex: 1 }}>
          {lawDisplayName(law)}
        </AppText>
        <ChevronRight size={18} color={colors.inkSubtle} />
      </View>
      <AppText variant="bodySm" tone="soft">
        {meta}
      </AppText>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.s3 }}>
        <ProgressBar value={law.percent / 100} height={4} style={{ flex: 1 }} label={`${lawShort(law)} okuma ilerlemesi`} tone={law.percent >= 100 ? "success" : "accent"} />
        <AppText variant="label" tone={law.lastRead ? "accentInk" : "subtle"}>
          {progressLabel(law)}
        </AppText>
      </View>
    </Pressable>
  );
}

/* ---------------------------------------------------------------- Devam et kartı */

/** "Kaldığın yerden devam" (son okunan kanun) ya da "Okumaya başla" (sınavın ilk kanunu). */
export function ContinueCard({
  resume,
  first,
  onOpen,
}: {
  resume: { slug: string; lawShort: string; no: string; title: string | null; percent: number; articleCount: number; index: number } | null;
  first: MerkezLaw | null;
  onOpen: (slug: string, no: string | null) => void;
}) {
  const { colors, space, radius } = useTheme();
  if (!resume && !first) return null;
  const eyebrow = resume ? "KALDIĞIN YERDEN DEVAM ET" : "OKUMAYA BAŞLA";
  const heading = resume ? `${resume.lawShort} · Madde ${resume.no}` : `${lawShort(first!)} · Madde 1`;
  const sub = resume ? resume.title : `Sınavının ilk mevzuatı: ${lawDisplayName(first!)}.`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${eyebrow.toLocaleLowerCase("tr-TR")}: ${heading}`}
      onPress={() => (resume ? onOpen(resume.slug, resume.no) : onOpen(first!.slug, null))}
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.surfaceAlt : colors.accentSoft,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colors.accent,
        borderLeftWidth: 4,
        padding: space.s4,
        gap: space.s1,
      })}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <AppText variant="label" tone="accentInk">
          {eyebrow}
        </AppText>
        {resume ? (
          <AppText variant="label" tone="accentInk">
            {`%${resume.percent}`}
          </AppText>
        ) : null}
      </View>
      <AppText variant="heading" tone="ink" numberOfLines={1}>
        {heading}
      </AppText>
      {sub ? (
        <AppText variant="bodySm" tone="soft" numberOfLines={1}>
          {sub}
        </AppText>
      ) : null}
      {resume ? <ProgressBar value={resume.percent / 100} height={4} style={{ marginTop: space.s1 }} label="Okuma ilerlemesi" /> : null}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: space.s1 }}>
        <AppText variant="label" tone="subtle">
          {resume ? `${resume.index + 1} / ${resume.articleCount} madde` : "Kaldığın yer burada görünür"}
        </AppText>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
          <AppText variant="subhead" tone="accentInk">
            {resume ? "Devam et" : "Başla"}
          </AppText>
          <ChevronRight size={16} color={colors.accentInk} />
        </View>
      </View>
    </Pressable>
  );
}

/* ---------------------------------------------------------------- Son okunanlar */

export function RecentReads({ laws, onOpen }: { laws: MerkezLaw[]; onOpen: (slug: string, no: string) => void }) {
  const { colors, space } = useTheme();
  const recent = laws
    .filter((l): l is MerkezLaw & { lastRead: NonNullable<MerkezLaw["lastRead"]> } => Boolean(l.lastRead))
    .sort((a, b) => b.lastRead.updatedAt.localeCompare(a.lastRead.updatedAt))
    .slice(0, 3);
  if (recent.length === 0) return null;
  return (
    <Card style={{ paddingVertical: 0 }}>
      {recent.map((l, i) => (
        <Pressable
          key={l.slug}
          accessibilityRole="button"
          onPress={() => onOpen(l.slug, l.lastRead.no)}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: space.s3,
            minHeight: 56,
            paddingVertical: space.s3,
            borderTopWidth: i === 0 ? 0 : 1,
            borderTopColor: colors.line,
            backgroundColor: pressed ? colors.surfaceAlt : "transparent",
          })}
        >
          <Clock size={18} color={colors.inkSubtle} />
          <View style={{ flex: 1 }}>
            <AppText variant="subhead" tone="ink" numberOfLines={1}>{`${lawShort(l)} · Madde ${l.lastRead.no}`}</AppText>
            <AppText variant="bodySm" tone="subtle" numberOfLines={1}>
              {[l.lastRead.title, relativeDay(l.lastRead.updatedAt)].filter(Boolean).join(" · ")}
            </AppText>
          </View>
          <ChevronRight size={18} color={colors.inkSubtle} />
        </Pressable>
      ))}
    </Card>
  );
}

/** "bugün", "dün", "3 gün önce", "12 Eki". */
export function relativeDay(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const days = Math.floor((now.setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days <= 0) return "bugün";
  if (days === 1) return "dün";
  if (days < 7) return `${days} gün önce`;
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

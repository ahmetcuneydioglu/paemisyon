import { useRouter } from "expo-router";
import { Archive, Lock } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { AppText, Badge, Card, EmptyState, Notice, Screen, Skeleton } from "@/components/ui";
import { pastExamShortName, usePastExams, type PastExamSummary } from "@/features/exams/queries";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Çıkmış sınavlar (Doc 36 ürünü; mobilde vitrin değil tam sınav). Resmî sınavın adı burada
 * GÖSTERİLİR (Doc 36 istisnası). "resmi" + examId → çözülebilir; "analiz" yalnız dağılım.
 */
export default function CikmisListScreen() {
  const router = useRouter();
  const { colors, space } = useTheme();
  const q = usePastExams();

  return (
    <Screen inset="none">
      <AppText variant="bodySm" tone="soft">
        Resmî yayımlanmış kitapçıklar sınav gibi çözülür; analiz dönemlerinde yalnız ders dağılımı vardır.
      </AppText>
      {q.isPending ? (
        <Skeleton height={300} radiusKey="card" />
      ) : q.isError ? (
        <Notice tone="error" title="Liste yüklenemedi">
          {q.error.message}
        </Notice>
      ) : q.data.length === 0 ? (
        <EmptyState icon={Archive} title="Henüz yayımlanmış çıkmış sınav yok" />
      ) : (
        q.data.map((p) => <PeriodCard key={p.slug} p={p} onPress={() => router.push({ pathname: "/(tabs)/denemeler/cikmis/[slug]", params: { slug: p.slug, title: pastExamShortName(p) } })} colors={colors} space={space} />)
      )}
    </Screen>
  );
}

function PeriodCard({ p, onPress, colors, space }: { p: PastExamSummary; onPress: () => void; colors: ReturnType<typeof useTheme>["colors"]; space: ReturnType<typeof useTheme>["space"] }) {
  const solvable = p.tur === "resmi" && p.examId;
  const top = [...p.dersDagilimi].sort((a, b) => b.adet - a.adet);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <Card>
        <View style={{ flexDirection: "row", gap: space.s2, flexWrap: "wrap", alignItems: "center" }}>
          <Badge tone={p.tur === "resmi" ? "success" : "neutral"}>{p.tur === "resmi" ? "Çıkmış sınav" : "Konu analizi"}</Badge>
          {p.isPremium ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Lock color={colors.inkSubtle} size={14} strokeWidth={1.75} />
              <AppText variant="bodySm" tone="subtle">
                Premium
              </AppText>
            </View>
          ) : null}
        </View>
        <AppText variant="heading">{pastExamShortName(p)}</AppText>
        <AppText variant="bodySm" tone="soft">
          {p.kurum}
          {p.tarih ? ` · ${new Date(p.tarih).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}` : ""}
          {p.soruSayisi ? ` · ${p.soruSayisi} soru` : ""}
        </AppText>
        {top.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {top.slice(0, 3).map((d) => (
              <Badge key={d.ders} tone="neutral">{`${d.ders} · ${d.adet}`}</Badge>
            ))}
            {top.length > 3 ? <Badge tone="neutral">{`+${top.length - 3} ders`}</Badge> : null}
          </View>
        ) : null}
        <AppText variant="subhead" tone="accentInk">
          {solvable ? "Çöz ve çalış ›" : "Dağılımı gör ›"}
        </AppText>
      </Card>
    </Pressable>
  );
}

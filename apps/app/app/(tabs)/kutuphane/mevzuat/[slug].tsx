import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ExternalLink } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Linking, TextInput, View } from "react-native";
import { AppText, Badge, Button, Card, ListRow, Notice, Screen, Sheet, Skeleton } from "@/components/ui";
import { TYPE_LABEL, useLegislation } from "@/features/mevzuat/queries";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Kanun detay (Doc 25: Kanun detay — kimlik, içindekiler, kanundan seans). Resmî kaynak ve
 * doğrulama tarihi görünür; metin yoksa okuma düğmesi pasif ve nedeni yazılı.
 */
export default function KanunScreen() {
  const router = useRouter();
  const { colors, space, type: t, radius } = useTheme();
  const p = useLocalSearchParams<{ slug: string; name?: string }>();
  const q = useLegislation(p.slug ?? null);
  const [tocOpen, setTocOpen] = useState(false);
  const [filter, setFilter] = useState("");

  const d = q.data;
  const sections = useMemo(() => new Map((d?.sections ?? []).map((s) => [s.id, s])), [d]);
  const f = filter.trim().toLocaleLowerCase("tr");
  const toc = (d?.toc ?? []).filter((a) => !f || a.no.toLocaleLowerCase("tr").includes(f) || (a.title ?? "").toLocaleLowerCase("tr").includes(f));

  const openReader = (no?: string) => {
    setTocOpen(false);
    router.push({ pathname: "/oku/[slug]", params: no ? { slug: p.slug, madde: no } : { slug: p.slug } });
  };

  return (
    <>
      <Stack.Screen options={{ title: p.name ?? d?.shortName ?? "Kanun" }} />
      <Screen inset="none">
        {q.isPending ? (
          <Skeleton height={220} radiusKey="card" />
        ) : q.isError ? (
          <Notice tone="error" title="Kanun yüklenemedi">
            {q.error.message}
          </Notice>
        ) : d ? (
          <>
            <Card>
              <View style={{ flexDirection: "row", gap: space.s2, flexWrap: "wrap" }}>
                {d.number ? <Badge tone="accent">{`${d.number} sayılı`}</Badge> : null}
                <Badge tone="neutral">{TYPE_LABEL[d.type]}</Badge>
              </View>
              <AppText variant="title">{d.name}</AppText>
              <AppText variant="bodySm" tone="soft">
                {d.articleCount > 0 ? `${d.articleCount} madde` : "Metin henüz yok"} · {d.questionCount} soru çıkmış
              </AppText>
              {d.lastVerifiedAt ? (
                <AppText variant="bodySm" tone="subtle">
                  Son doğrulama: {new Date(d.lastVerifiedAt).toLocaleDateString("tr-TR")}
                </AppText>
              ) : (
                <AppText variant="bodySm" tone="subtle">
                  Metin doğrulama tarihi kayıtlı değil.
                </AppText>
              )}
              {d.effectiveInfo ? (
                <AppText variant="bodySm" tone="soft">
                  {d.effectiveInfo}
                </AppText>
              ) : null}
            </Card>

            <View style={{ gap: space.s2 }}>
              <Button title={d.articleCount > 0 ? "Okumaya başla" : "Metin yakında"} disabled={d.articleCount === 0} onPress={() => openReader()} />
              {d.articleCount > 0 ? <Button title={`İçindekiler · ${d.articleCount} madde`} variant="secondary" onPress={() => setTocOpen(true)} /> : null}
              {d.questionCount > 0 && d.topicId ? (
                <Button title="Bu kanundan 10 soru" variant="secondary" onPress={() => router.push({ pathname: "/seans", params: { mode: "practice", count: "10", focusKind: "topic", topicId: d.topicId!, courseId: "", recipe: "" } })} />
              ) : null}
              {d.officialSourceUrl ? (
                <Button title="Resmî kaynak" variant="ghost" onPress={() => void Linking.openURL(d.officialSourceUrl!)} />
              ) : null}
            </View>
            {d.officialSourceUrl ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <ExternalLink color={colors.inkSubtle} size={14} strokeWidth={1.75} />
                <AppText variant="bodySm" tone="subtle" numberOfLines={1} style={{ flex: 1 }}>
                  {d.officialSourceUrl}
                </AppText>
              </View>
            ) : null}
          </>
        ) : null}
      </Screen>

      <Sheet visible={tocOpen} onClose={() => setTocOpen(false)} title="İçindekiler">
        <TextInput value={filter} onChangeText={setFilter} placeholder="Madde no ya da başlık" placeholderTextColor={colors.inkSubtle} accessibilityLabel="İçindekilerde ara" style={[t.body, { color: colors.ink, backgroundColor: colors.bg, borderRadius: radius.control, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, minHeight: 48 }]} />
        {toc.map((a, i) => {
          const prev = toc[i - 1];
          const sec = a.sectionId && (!prev || prev.sectionId !== a.sectionId) && !f ? sections.get(a.sectionId) : null;
          return (
            <View key={a.slug}>
              {sec ? (
                <AppText variant="label" tone="subtle" style={{ paddingTop: i === 0 ? 0 : 12, paddingBottom: 4 }}>
                  {sec.heading}
                </AppText>
              ) : null}
              <ListRow title={`Madde ${a.no}${a.title ? ` · ${a.title}` : ""}`} subtitle={a.questionCount > 0 ? `${a.questionCount} soru` : null} divider={i < toc.length - 1} onPress={() => openReader(a.no)} />
            </View>
          );
        })}
        {toc.length === 0 ? (
          <AppText variant="bodySm" tone="soft">
            Eşleşen madde yok.
          </AppText>
        ) : null}
      </Sheet>
    </>
  );
}

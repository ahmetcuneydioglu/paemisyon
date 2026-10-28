import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Bookmark, ExternalLink, NotebookPen, Search } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FlatList, Linking, Pressable, TextInput, View } from "react-native";
import { lawDisplayName } from "@/components/domain";
import { AppText, Badge, Button, Chip, Notice, ProgressBar, Skeleton } from "@/components/ui";
import { TYPE_LABEL, useArticleAnnotations, useArticleBookmarks, useLegislation, useMevzuatMerkezi } from "@/features/mevzuat/queries";
import { useTheme } from "@/theme/ThemeProvider";

type Filter = "all" | "saved" | "noted";

/**
 * Kanun detayı ve içindekiler (28 Eki 2026, gysrota düzeni): üstte kimlik + ilerleme + "Buradan devam",
 * madde listesi süzülür (Tümü / Kaydedilen / Notlu, madde no ya da başlık). Her satır okuyucuyu o maddede açar.
 * Resmî kaynak ve doğrulama tarihi görünür.
 */
export default function MevzuatKanunScreen() {
  const router = useRouter();
  const { colors, space, radius, type: t } = useTheme();
  const p = useLocalSearchParams<{ slug: string; name?: string }>();
  const slug = p.slug ?? null;
  const detail = useLegislation(slug);
  const merkez = useMevzuatMerkezi();
  const bookmarks = useArticleBookmarks();
  const annotations = useArticleAnnotations(slug);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const d = detail.data;
  const law = merkez.data?.all.find((l) => l.slug === slug) ?? null;
  const saved = useMemo(() => new Set((bookmarks.data ?? []).filter((b) => b.lawSlug === slug).map((b) => b.no)), [bookmarks.data, slug]);
  const noted = useMemo(() => new Set((annotations.data?.notes ?? []).map((n) => n.no)), [annotations.data]);
  const sections = useMemo(() => new Map((d?.sections ?? []).map((s) => [s.id, s.heading])), [d]);
  const f = q.trim().toLocaleLowerCase("tr-TR");
  const toc = useMemo(
    () =>
      (d?.toc ?? []).filter((a) => {
        if (filter === "saved" && !saved.has(a.no)) return false;
        if (filter === "noted" && !noted.has(a.no)) return false;
        return !f || a.no.toLocaleLowerCase("tr-TR").includes(f) || (a.title ?? "").toLocaleLowerCase("tr-TR").includes(f);
      }),
    [d, filter, saved, noted, f],
  );
  const title = p.name ?? (d ? (d.shortName ?? d.name) : "Kanun");
  const resumeNo = law?.lastRead?.no ?? null;
  const openReader = (no?: string | null) => router.push({ pathname: "/oku/[slug]", params: no ? { slug: slug!, madde: no } : { slug: slug! } });

  return (
    <>
      <Stack.Screen options={{ title }} />
      {detail.isPending ? (
        <View style={{ padding: space.screenGutter, gap: space.s3 }}>
          <Skeleton height={180} radiusKey="card" />
          <Skeleton height={48} />
          <Skeleton height={48} />
        </View>
      ) : detail.isError ? (
        <View style={{ padding: space.screenGutter, gap: space.s3 }}>
          <Notice tone="error" title="Kanun yüklenemedi">
            {detail.error.message}
          </Notice>
          <Button title="Tekrar dene" variant="secondary" onPress={() => void detail.refetch()} />
        </View>
      ) : d ? (
        <FlatList
          data={toc}
          keyExtractor={(a) => a.slug}
          initialNumToRender={24}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: space.screenGutter, paddingTop: space.s4, paddingBottom: space.s8, gap: 0 }}
          ListHeaderComponent={
            <View style={{ gap: space.s4, marginBottom: space.s3 }}>
              <View style={{ backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: space.s4, gap: space.s3 }}>
                <View style={{ flexDirection: "row", gap: space.s2, flexWrap: "wrap" }}>
                  {d.number ? <Badge tone="accent">{`${d.number} sayılı`}</Badge> : null}
                  <Badge tone="neutral">{TYPE_LABEL[d.type]}</Badge>
                </View>
                <AppText variant="heading" tone="ink">
                  {lawDisplayName({ number: d.number, name: d.name })}
                </AppText>
                <View style={{ flexDirection: "row", alignItems: "flex-end", gap: space.s4 }}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="title" tone="ink">
                      {law?.lastRead ? `${law.lastRead.index + 1}` : "0"}
                      <AppText variant="body" tone="subtle">{` / ${d.articleCount}`}</AppText>
                    </AppText>
                    <AppText variant="label" tone="subtle">
                      {law?.lastRead ? "maddeye geldin" : "madde · başlanmadı"}
                    </AppText>
                  </View>
                  {[
                    { value: d.questionCount, label: "soru" },
                    { value: saved.size, label: "kayıt" },
                    { value: noted.size, label: "not" },
                  ].map((s) => (
                    <View key={s.label} style={{ alignItems: "center", minWidth: 44 }}>
                      <AppText variant="heading" tone="ink">
                        {String(s.value)}
                      </AppText>
                      <AppText variant="label" tone="subtle">
                        {s.label}
                      </AppText>
                    </View>
                  ))}
                </View>
                <ProgressBar value={(law?.percent ?? 0) / 100} height={5} label="Okuma ilerlemesi" tone={(law?.percent ?? 0) >= 100 ? "success" : "accent"} />
                <AppText variant="bodySm" tone="subtle">
                  {d.lastVerifiedAt ? `Resmî kaynaktan ${new Date(d.lastVerifiedAt).toLocaleDateString("tr-TR")} itibarıyla doğrulandı.` : "Doğrulama tarihi kayıtlı değil."}
                  {d.effectiveInfo ? ` ${d.effectiveInfo}` : ""}
                </AppText>
                <Button title={resumeNo ? `Buradan devam: md ${resumeNo}` : "Okumaya başla"} onPress={() => openReader(resumeNo)} />
                <View style={{ flexDirection: "row", gap: space.s2 }}>
                  {d.questionCount > 0 && d.topicId ? (
                    <View style={{ flex: 1 }}>
                      <Button title="Bu kanundan 10 soru" variant="secondary" size="sm" onPress={() => router.push({ pathname: "/seans", params: { mode: "practice", count: "10", focusKind: "topic", topicId: d.topicId!, courseId: "", recipe: "" } })} />
                    </View>
                  ) : null}
                  {d.officialSourceUrl ? (
                    <View style={{ flex: 1 }}>
                      <Button title="Resmî kaynak" variant="ghost" size="sm" onPress={() => void Linking.openURL(d.officialSourceUrl!)} />
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2, backgroundColor: colors.surface, borderRadius: radius.control, borderWidth: 1, borderColor: colors.line, paddingHorizontal: space.s3, minHeight: 48 }}>
                <Search color={colors.inkSoft} size={18} strokeWidth={1.75} />
                <TextInput value={q} onChangeText={setQ} placeholder="Madde no ya da başlık" placeholderTextColor={colors.inkSubtle} autoCorrect={false} accessibilityLabel="İçindekilerde ara" style={[t.body, { flex: 1, color: colors.ink, paddingVertical: 8 }]} />
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s2 }}>
                <Chip label={`Tümü · ${d.articleCount}`} selected={filter === "all"} onPress={() => setFilter("all")} />
                {saved.size > 0 ? <Chip label={`Kaydedilen · ${saved.size}`} icon={Bookmark} selected={filter === "saved"} onPress={() => setFilter("saved")} /> : null}
                {noted.size > 0 ? <Chip label={`Notlu · ${noted.size}`} icon={NotebookPen} selected={filter === "noted"} onPress={() => setFilter("noted")} /> : null}
              </View>
            </View>
          }
          ListEmptyComponent={
            <AppText variant="bodySm" tone="subtle" style={{ paddingVertical: space.s3 }}>
              {d.articleCount === 0 ? "Bu mevzuatın okunabilir metni henüz yok." : "Bu süzgeçte madde yok."}
            </AppText>
          }
          renderItem={({ item: a, index }) => {
            const prev = toc[index - 1];
            const heading = a.sectionId && (!prev || prev.sectionId !== a.sectionId) && !f && filter === "all" ? sections.get(a.sectionId) : null;
            const current = a.no === resumeNo;
            return (
              <View>
                {heading ? (
                  <AppText variant="label" tone="accentInk" style={{ paddingTop: index === 0 ? 0 : space.s3, paddingBottom: space.s1 }}>
                    {heading}
                  </AppText>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Madde ${a.no}${a.title ? `, ${a.title}` : ""}${current ? ", kaldığın yer" : ""}`}
                  onPress={() => openReader(a.no)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space.s3,
                    minHeight: 52,
                    paddingVertical: space.s2,
                    paddingHorizontal: current ? space.s3 : 0,
                    marginHorizontal: current ? -space.s3 : 0,
                    borderRadius: radius.control,
                    backgroundColor: pressed ? colors.surfaceAlt : current ? colors.accentSoft : "transparent",
                    borderBottomWidth: current ? 0 : 1,
                    borderBottomColor: colors.line,
                  })}
                >
                  <AppText variant="label" tone={current ? "accentInk" : "subtle"} style={{ minWidth: 52 }}>
                    {`md ${a.no}`}
                  </AppText>
                  <AppText variant="body" tone="ink" numberOfLines={2} style={{ flex: 1 }}>
                    {a.title ?? "(başlıksız)"}
                  </AppText>
                  {saved.has(a.no) ? <Bookmark size={14} color={colors.accent} /> : null}
                  {noted.has(a.no) ? <NotebookPen size={14} color={colors.inkSubtle} /> : null}
                  {a.questionCount > 0 ? (
                    <AppText variant="label" tone="subtle">
                      {`${a.questionCount} soru`}
                    </AppText>
                  ) : null}
                </Pressable>
              </View>
            );
          }}
          ListFooterComponent={
            d.officialSourceUrl ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingTop: space.s4 }}>
                <ExternalLink color={colors.inkSubtle} size={14} strokeWidth={1.75} />
                <AppText variant="bodySm" tone="subtle" numberOfLines={1} style={{ flex: 1 }}>
                  {d.officialSourceUrl}
                </AppText>
              </View>
            ) : undefined
          }
        />
      ) : null}
    </>
  );
}

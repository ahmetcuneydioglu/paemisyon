import { useLocalSearchParams, useRouter } from "expo-router";
import { BookOpen, Search } from "lucide-react-native";
import { useEffect, useState } from "react";
import { TextInput, View } from "react-native";
import { LegislationRow } from "@/components/domain";
import { AppText, Badge, Card, Chip, EmptyState, ListRow, Notice, Screen, SectionHeader, Skeleton } from "@/components/ui";
import { TYPE_LABEL, useArticleBookmarks, useMevzuatList, useMevzuatSearch, useReadingProgress, type LegislationType } from "@/features/mevzuat/queries";
import { useTheme } from "@/theme/ThemeProvider";

const HINTS = ["PVSK", "cmk 90", "zor kullanma", "kimlik sorma", "gözaltı", "yakalama"];

/**
 * Mevzuat ana (Doc 25: Madde Atlası girişi — kanun rafı). Arama üstte (350 ms, ≥2 harf),
 * kaydedilen maddeler, son okunanlar, sınavda öne çıkanlar, tür filtresi. Metni olmayan
 * mevzuat "metin yakında" der; sayılar sunucudan.
 */
export default function MevzuatScreen() {
  const router = useRouter();
  const { colors, space, radius, type: t } = useTheme();
  const p = useLocalSearchParams<{ ara?: string }>();
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<LegislationType | "all">("all");
  const list = useMevzuatList();
  const progress = useReadingProgress();
  const bookmarks = useArticleBookmarks();
  const search = useMevzuatSearch(q);

  useEffect(() => {
    const h = setTimeout(() => setQ(text), 350);
    return () => clearTimeout(h);
  }, [text]);

  const searching = text.trim().length >= 2;
  const openReader = (slug: string, no?: string) => router.push({ pathname: "/oku/[slug]", params: no ? { slug, madde: no } : { slug } });

  const items = list.data ?? [];
  const featured = [...items].sort((a, b) => b.questionCount - a.questionCount).slice(0, 6);
  const filtered = kind === "all" ? items : items.filter((i) => i.type === kind);
  const kinds = (["kanun", "yonetmelik", "cbk", "genelge", "yonerge"] as LegislationType[]).filter((k) => items.some((i) => i.type === k));

  return (
    <Screen inset="none">
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2, backgroundColor: colors.surface, borderRadius: radius.control, borderWidth: 1, borderColor: colors.line, paddingHorizontal: space.s3, minHeight: 52 }}>
        <Search color={colors.inkSoft} size={20} strokeWidth={1.75} />
        <TextInput
          autoFocus={p.ara === "1"}
          value={text}
          onChangeText={setText}
          placeholder="Madde, başlık ya da metin ara"
          placeholderTextColor={colors.inkSubtle}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Mevzuatta ara"
          style={[t.body, { flex: 1, color: colors.ink, paddingVertical: 10 }]}
        />
      </View>

      {searching ? (
        search.isPending ? (
          <Skeleton height={160} radiusKey="card" />
        ) : search.isError ? (
          <Notice tone="error">{search.error.message}</Notice>
        ) : search.data.legislation.length === 0 && search.data.articles.length === 0 ? (
          <EmptyState icon={Search} title="Sonuç yok" body={`“${text.trim()}” için eşleşme bulunamadı. Kısaltma (PVSK) ya da madde numarası dene.`} />
        ) : (
          <>
            {search.data.legislation.length > 0 ? (
              <View style={{ gap: space.s2 }}>
                <SectionHeader title="Mevzuat" />
                <Card style={{ paddingVertical: 0 }}>
                  {search.data.legislation.map((l, i) => (
                    <ListRow key={l.slug} title={l.shortName ? `${l.shortName} · ${l.name}` : l.name} subtitle={`${TYPE_LABEL[l.type]}${l.number ? ` · ${l.number} sayılı` : ""}${l.readable ? "" : " · metin yakında"}`} divider={i < search.data.legislation.length - 1} onPress={() => router.push({ pathname: "/(tabs)/kutuphane/mevzuat/[slug]", params: { slug: l.slug, name: l.shortName ?? l.name } })} />
                  ))}
                </Card>
              </View>
            ) : null}
            {search.data.articles.length > 0 ? (
              <View style={{ gap: space.s2 }}>
                <SectionHeader title="Maddeler" />
                <Card style={{ paddingVertical: 0 }}>
                  {search.data.articles.map((a, i) => (
                    <ListRow key={`${a.lawSlug}-${a.no}`} title={`${a.lawShort ?? a.lawSlug} md. ${a.no}${a.title ? ` · ${a.title}` : ""}`} subtitle={<Headline text={a.headline} /> as unknown as string} divider={i < search.data.articles.length - 1} onPress={() => openReader(a.lawSlug, a.no)} />
                  ))}
                </Card>
              </View>
            ) : null}
          </>
        )
      ) : (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s2 }}>
            {HINTS.map((h) => (
              <Chip key={h} label={h} onPress={() => setText(h)} />
            ))}
          </View>

          {progress.data && progress.data.length > 0 ? (
            <View style={{ gap: space.s2 }}>
              <SectionHeader title="Kaldığın yer" />
              <Card style={{ paddingVertical: 0 }}>
                {progress.data.slice(0, 3).map((r, i) => (
                  <LegislationRow key={`${r.lawSlug}-${r.no}`} law={r.lawShort} article={r.no} meta={`${i === 0 ? "Son okunan · " : ""}${r.lawName}`} onPress={() => openReader(r.lawSlug, r.no)} />
                ))}
              </Card>
            </View>
          ) : null}

          {bookmarks.data && bookmarks.data.length > 0 ? (
            <View style={{ gap: space.s2 }}>
              <SectionHeader title="Kaydedilen maddeler" />
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s2 }}>
                {bookmarks.data.slice(0, 8).map((b) => (
                  <Chip key={b.articleId} label={`${b.lawShort} m.${b.no}`} onPress={() => openReader(b.lawSlug, b.no)} />
                ))}
              </View>
            </View>
          ) : null}

          <View style={{ gap: space.s2 }}>
            <SectionHeader title="Sınavlarda öne çıkanlar" />
            {list.isPending ? (
              <Skeleton height={200} radiusKey="card" />
            ) : list.isError ? (
              <Notice tone="error" title="Mevzuat yüklenemedi">
                {list.error.message}
              </Notice>
            ) : (
              <Card style={{ paddingVertical: 0 }}>
                {featured.map((l, i) => (
                  <ListRow
                    key={l.slug}
                    title={l.shortName ?? l.name}
                    subtitle={`${l.readable ? `${l.articleCount} madde` : "metin yakında"} · ${l.questionCount} soru çıkmış`}
                    leading={<AppText variant="label" tone="accentInk">{l.number ?? TYPE_LABEL[l.type].slice(0, 3)}</AppText>}
                    divider={i < featured.length - 1}
                    onPress={() => router.push({ pathname: "/(tabs)/kutuphane/mevzuat/[slug]", params: { slug: l.slug, name: l.shortName ?? l.name } })}
                  />
                ))}
              </Card>
            )}
          </View>

          {items.length > 0 ? (
            <View style={{ gap: space.s2 }}>
              <SectionHeader title="Tüm mevzuat" />
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s2 }}>
                <Chip label={`Tümü · ${items.length}`} selected={kind === "all"} onPress={() => setKind("all")} />
                {kinds.map((k) => (
                  <Chip key={k} label={`${TYPE_LABEL[k]} · ${items.filter((i) => i.type === k).length}`} selected={kind === k} onPress={() => setKind(k)} />
                ))}
              </View>
              <Card style={{ paddingVertical: 0 }}>
                {filtered.map((l, i) => (
                  <ListRow
                    key={l.slug}
                    title={l.shortName ? `${l.shortName} · ${l.name}` : l.name}
                    subtitle={`${l.number ? `${l.number} sayılı · ` : ""}${l.readable ? `${l.articleCount} madde` : "metin yakında"}${l.questionCount ? ` · ${l.questionCount} soru` : ""}`}
                    leading={<BookOpen color={l.readable ? colors.accent : colors.inkSubtle} size={20} strokeWidth={1.75} />}
                    trailing={l.lastVerifiedAt ? undefined : <Badge tone="warning">Doğrulanmadı</Badge>}
                    divider={i < filtered.length - 1}
                    onPress={() => router.push({ pathname: "/(tabs)/kutuphane/mevzuat/[slug]", params: { slug: l.slug, name: l.shortName ?? l.name } })}
                  />
                ))}
              </Card>
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

/** Arama vurgusu: ⟪…⟫ arasını kalın ve vurgu renginde çizer. */
function Headline({ text }: { text: string }) {
  const parts = text.split(/(⟪[^⟫]*⟫)/g).filter(Boolean);
  return (
    <AppText variant="bodySm" tone="soft" numberOfLines={2}>
      {parts.map((part, i) =>
        part.startsWith("⟪") ? (
          <AppText key={i} variant="bodySm" tone="accentInk" style={{ fontFamily: "InstrumentSans_600SemiBold" }}>
            {part.slice(1, -1)}
          </AppText>
        ) : (
          part
        ),
      )}
    </AppText>
  );
}

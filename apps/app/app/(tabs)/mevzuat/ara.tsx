import { useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import { useEffect, useState } from "react";
import { TextInput, View } from "react-native";
import { lawShort } from "@/components/domain";
import { AppText, Card, Chip, EmptyState, ListRow, Notice, Screen, SectionHeader, Skeleton } from "@/components/ui";
import { TYPE_LABEL, useMevzuatSearch } from "@/features/mevzuat/queries";
import { useTheme } from "@/theme/ThemeProvider";
import { fontFamily } from "@/theme/tokens";

const HINTS = ["PVSK", "cmk 90", "zor kullanma", "kimlik sorma", "gözaltı", "yakalama"];

/** Mevzuat araması (Doc 29 §7): kanun kısaltması, "cmk 90", madde başlığı ya da metin; 350 ms, ≥2 harf. */
export default function MevzuatAraScreen() {
  const router = useRouter();
  const { colors, space, radius, type: t } = useTheme();
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const search = useMevzuatSearch(q);

  useEffect(() => {
    const h = setTimeout(() => setQ(text), 350);
    return () => clearTimeout(h);
  }, [text]);

  const searching = text.trim().length >= 2;
  const openReader = (slug: string, no?: string) => router.push({ pathname: "/oku/[slug]", params: no ? { slug, madde: no } : { slug } });

  return (
    <Screen inset="none">
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2, backgroundColor: colors.surface, borderRadius: radius.control, borderWidth: 1, borderColor: colors.line, paddingHorizontal: space.s3, minHeight: 52 }}>
        <Search color={colors.inkSoft} size={20} strokeWidth={1.75} />
        <TextInput autoFocus value={text} onChangeText={setText} placeholder="Kanun, madde ya da kelime" placeholderTextColor={colors.inkSubtle} returnKeyType="search" autoCorrect={false} accessibilityLabel="Mevzuatta ara" style={[t.body, { flex: 1, color: colors.ink, paddingVertical: 10 }]} />
      </View>

      {!searching ? (
        <View style={{ gap: space.s2 }}>
          <AppText variant="bodySm" tone="soft">
            Örnekler
          </AppText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s2 }}>
            {HINTS.map((h) => (
              <Chip key={h} label={h} onPress={() => setText(h)} />
            ))}
          </View>
        </View>
      ) : search.isPending ? (
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
                  <ListRow
                    key={l.slug}
                    title={l.shortName ? `${l.shortName} · ${l.name}` : l.name}
                    subtitle={`${TYPE_LABEL[l.type]}${l.number ? ` · ${l.number} sayılı` : ""}${l.readable ? "" : " · metin yakında"}`}
                    divider={i < search.data.legislation.length - 1}
                    onPress={() => router.push({ pathname: "/(tabs)/mevzuat/[slug]", params: { slug: l.slug, name: lawShort(l) } })}
                  />
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
          <AppText key={i} variant="bodySm" tone="accentInk" style={{ fontFamily: fontFamily.body[600] }}>
            {part.slice(1, -1)}
          </AppText>
        ) : (
          part
        ),
      )}
    </AppText>
  );
}

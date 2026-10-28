import { useRouter } from "expo-router";
import { Bookmark, Search } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { ContinueCard, LawCard, RecentReads, lawShort } from "@/components/domain";
import { AppText, Chip, EmptyState, Notice, Screen, SectionHeader, Skeleton } from "@/components/ui";
import { TYPE_LABEL, useArticleBookmarks, useMevzuatMerkezi, type LegislationType, type MerkezLaw } from "@/features/mevzuat/queries";
import { useTheme } from "@/theme/ThemeProvider";

type Pool = "exam" | "all";
/** Grupta ilk açılışta görünen kanun sayısı; gerisi "N mevzuat daha" ile açılır. */
const GROUP_PREVIEW = 5;

/**
 * Mevzuat ana (28 Eki 2026, gysrota düzeni): üç niyet en çok iki dokunuş — kaldığı yerden devam (kart),
 * belirli maddeye gitme (arama), "sınavımda ne var" (Sınavım grupları). Tüm mevzuat türe göre;
 * kaydedilenler ve son okunanlar altta, ikincil. Metin resmî; madde altı özet okuyucuda.
 */
export default function MevzuatHome() {
  const router = useRouter();
  const { colors, space, radius } = useTheme();
  const merkez = useMevzuatMerkezi();
  const bookmarks = useArticleBookmarks();
  const [pool, setPool] = useState<Pool>("exam");

  const d = merkez.data;
  const examLawCount = d?.groups.reduce((s, g) => s + g.laws.length, 0) ?? 0;
  const openReader = (slug: string, no: string | null) => router.push({ pathname: "/oku/[slug]", params: no ? { slug, madde: no } : { slug } });
  const openLaw = (law: MerkezLaw) => router.push({ pathname: "/(tabs)/mevzuat/[slug]", params: { slug: law.slug, name: lawShort(law) } });
  const effectivePool: Pool = examLawCount === 0 ? "all" : pool;

  return (
    <Screen>
      <View style={{ gap: space.s1 }}>
        <AppText variant="bodySm" tone="soft">
          {d?.exam ? `${d.exam.name} · ${examLawCount} mevzuat` : "Güncel, doğrulanmış metinler"}
        </AppText>
        <AppText variant="title">Mevzuat</AppText>
      </View>

      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Mevzuat ara: kanun, madde ya da kelime"
        onPress={() => router.push("/(tabs)/mevzuat/ara")}
        style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: space.s2, minHeight: 52, paddingHorizontal: space.s3, borderRadius: radius.control, borderWidth: 1, borderColor: colors.line, backgroundColor: pressed ? colors.surfaceAlt : colors.surface })}
      >
        <Search color={colors.inkSoft} size={20} strokeWidth={1.75} />
        <AppText variant="body" tone="subtle" style={{ flex: 1 }} numberOfLines={1}>
          Kanun, madde ya da kelime ara
        </AppText>
        <AppText variant="label" tone="subtle">
          PVSK 16
        </AppText>
      </Pressable>

      {merkez.isPending ? (
        <View style={{ gap: space.s3 }}>
          <Skeleton height={120} radiusKey="card" />
          <Skeleton height={96} radiusKey="card" />
          <Skeleton height={96} radiusKey="card" />
        </View>
      ) : merkez.isError ? (
        <Notice tone="error" title="Mevzuat yüklenemedi">
          {merkez.error.message}
        </Notice>
      ) : d ? (
        <>
          <ContinueCard resume={d.continue} first={d.groups[0]?.laws[0] ?? d.all[0] ?? null} onOpen={openReader} />

          {examLawCount > 0 ? (
            <View style={{ flexDirection: "row", gap: space.s2 }}>
              <Chip label="Sınavım" selected={effectivePool === "exam"} onPress={() => setPool("exam")} />
              <Chip label={`Tüm mevzuat · ${d.all.length}`} selected={effectivePool === "all"} onPress={() => setPool("all")} />
            </View>
          ) : null}

          {effectivePool === "exam" ? (
            d.groups.map((g) => <LawGroup key={g.name} name={g.name} laws={g.laws} onOpen={openLaw} />)
          ) : d.all.length === 0 ? (
            <EmptyState icon={Search} title="Okunabilir mevzuat yok" body="Yayımlanmış ve doğrulanmış metin henüz bulunmuyor." />
          ) : (
            <AllLegislation laws={d.all} onOpen={openLaw} />
          )}

          {bookmarks.data && bookmarks.data.length > 0 ? (
            <View style={{ gap: space.s2 }}>
              <SectionHeader title={`Kaydedilen maddeler · ${bookmarks.data.length}`} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.s2, paddingHorizontal: space.screenGutter }} style={{ marginHorizontal: -space.screenGutter }}>
                {bookmarks.data.slice(0, 12).map((b) => (
                  <Chip key={b.articleId} icon={Bookmark} label={`${b.lawShort} m.${b.no}`} onPress={() => openReader(b.lawSlug, b.no)} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={{ gap: space.s2 }}>
            <SectionHeader title="Son okunanlar" />
            <RecentReads laws={d.all} onOpen={openReader} />
            {!d.all.some((l) => l.lastRead) ? (
              <AppText variant="bodySm" tone="subtle">
                Okuduğun kanunlar burada sıralanır.
              </AppText>
            ) : null}
          </View>

          <AppText variant="label" tone="subtle">
            {"Metinler mevzuat.gov.tr'den alınır; her kanunda doğrulama tarihi görünür. Madde altındaki özetler resmî metin değildir."}
          </AppText>
        </>
      ) : null}
    </Screen>
  );
}

/* ------------------------------------------------------------ Sınavım grubu */

function LawGroup({ name, laws, onOpen }: { name: string; laws: MerkezLaw[]; onOpen: (law: MerkezLaw) => void }) {
  const { space } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? laws : laws.slice(0, GROUP_PREVIEW);
  const hidden = laws.length - shown.length;
  return (
    <View style={{ gap: space.s2 }}>
      <SectionHeader title={name} action={`${laws.length} mevzuat`} onAction={undefined} />
      <View style={{ gap: space.s3 }}>
        {shown.map((law) => (
          <LawCard key={law.slug} law={law} onPress={() => onOpen(law)} />
        ))}
      </View>
      {hidden > 0 ? (
        <Pressable accessibilityRole="button" onPress={() => setExpanded(true)} hitSlop={8} style={{ alignSelf: "center", paddingVertical: space.s2 }}>
          <AppText variant="subhead" tone="accentInk">{`${hidden} mevzuat daha`}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------ Tüm mevzuat (türe göre) */

function AllLegislation({ laws, onOpen }: { laws: MerkezLaw[]; onOpen: (law: MerkezLaw) => void }) {
  const { space } = useTheme();
  const [kind, setKind] = useState<LegislationType | "all">("all");
  const kinds = useMemo(() => (["kanun", "cbk", "yonetmelik", "genelge", "yonerge"] as LegislationType[]).filter((k) => laws.some((l) => l.type === k)), [laws]);
  const filtered = kind === "all" ? laws : laws.filter((l) => l.type === kind);
  return (
    <View style={{ gap: space.s3 }}>
      {kinds.length > 1 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s2 }}>
          <Chip label={`Tümü · ${laws.length}`} selected={kind === "all"} onPress={() => setKind("all")} />
          {kinds.map((k) => (
            <Chip key={k} label={`${TYPE_LABEL[k]} · ${laws.filter((l) => l.type === k).length}`} selected={kind === k} onPress={() => setKind(k)} />
          ))}
        </View>
      ) : null}
      {filtered.map((law) => (
        <LawCard key={law.slug} law={law} onPress={() => onOpen(law)} />
      ))}
    </View>
  );
}

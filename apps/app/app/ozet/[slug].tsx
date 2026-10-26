import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle2 } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, View, type FlatListProps } from "react-native";
import { ArticlePeekSheet, SummaryBlockCard, SummaryLockCard, useArticlePeek } from "@/components/domain/summary";
import { ActionBar, AppText, Badge, Notice, ProgressBar, Skeleton } from "@/components/ui";
import { masteryLabel, shortTitle, useSaveUnitProgress, useUnit, type SummaryBlock } from "@/features/summaries/queries";
import { useTheme } from "@/theme/ThemeProvider";

const KAYIT_ARALIGI_MS = 2500;
/** FlatList bu nesnenin kimliğini sabit ister; modül düzeyinde tek örnek. */
const VIEWABILITY = { itemVisiblePercentThreshold: 50 };

/**
 * Ünite okuyucu (Doc 53 §6, F3): kök Stack, tam ekran. Dikey kart akışı; görünen en ileri kart
 * ilerleme olarak 2,5 sn sonra sunucuya yazılır, son kart görülünce ünite "bitti". Kilitliyse açık
 * kartlardan sonra Premium kapısı. Altta "Bu üniteden 10 soru" köprüsü (madde kapsamlı seans).
 * Kaynak etiketi yanıtta yoktur, ekranda da yoktur.
 */
export default function OzetScreen() {
  const router = useRouter();
  const { colors, space } = useTheme();
  const p = useLocalSearchParams<{ slug: string; title?: string }>();
  const q = useUnit(p.slug ?? null);
  const save = useSaveUnitProgress();
  const u = q.data;
  const peek = useArticlePeek();

  const cards = useMemo(() => (u?.blocks ?? []).filter((b) => b.type !== "bridge"), [u?.blocks]);
  const bridge = u?.blocks.find((b) => b.type === "bridge");
  const [seenLocal, setSeenLocal] = useState(-1);
  // Sunucudaki ilerleme (kaldığın yer) ile bu oturumda görülenin büyüğü; effect'siz türetilir.
  const serverIdx = u?.progress?.lastBlockIndex ?? -1;
  const maxSeen = Math.max(seenLocal, serverIdx, 0);
  const lastSent = useRef<{ idx: number; done: boolean } | null>(null);

  const done = Boolean(u?.progress?.completedAt) || (u != null && !u.locked && cards.length > 0 && maxSeen >= cards.length - 1);

  // FlatList bu geri çağrının kimliğini sabit ister.
  type Viewable = Parameters<NonNullable<FlatListProps<SummaryBlock>["onViewableItemsChanged"]>>[0];
  const onViewable = useCallback(({ viewableItems }: Viewable) => {
    const idx = viewableItems.filter((v) => v.isViewable && v.index != null).reduce((m, v) => Math.max(m, v.index ?? -1), -1);
    if (idx >= 0) setSeenLocal((m) => (idx > m ? idx : m));
  }, []);

  // İlerleme kaydı: seyrek ve sessiz.
  useEffect(() => {
    if (!u) return;
    const sent = lastSent.current ?? { idx: serverIdx, done: Boolean(u.progress?.completedAt) };
    if (sent.idx === maxSeen && sent.done === done) return;
    const h = setTimeout(() => {
      lastSent.current = { idx: maxSeen, done };
      save.mutate({ slug: u.slug, lastBlockIndex: maxSeen, completed: done || undefined });
    }, KAYIT_ARALIGI_MS);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxSeen, done, u?.slug, serverIdx]);

  const pct = u ? (done ? 1 : cards.length ? (maxSeen + 1) / u.totalBlocks : 0) : 0;
  const title = u ? shortTitle(u.title) : (p.title ?? "Konu özeti");

  const startBridge = () => {
    if (!u || !bridge?.session) return;
    router.push({
      pathname: "/seans",
      params: { source: "topic_room", count: "10", focusKind: "topic", topicId: bridge.session.topicId, articleNos: bridge.session.articleNos.join(","), courseId: "", recipe: "", title: `${u.topic.name} · ${shortTitle(u.title)}` },
    });
  };
  const openArticlePage = (no: string) => {
    peek.close();
    if (u) router.push({ pathname: "/oku/[slug]", params: { slug: u.legislation.slug, madde: no } });
  };

  const header = !u ? undefined : (
    <View style={{ gap: space.s2, paddingBottom: space.s3 }}>
      <AppText variant="title" tone="ink">
        {u.title}
      </AppText>
      {u.subtitle ? (
        <AppText variant="body" tone="soft">
          {u.subtitle}
        </AppText>
      ) : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.s2 }}>
        <AppText variant="bodySm" tone="subtle">
          {u.legislation.shortName ?? u.legislation.name} md {u.articleFrom}–{u.articleTo} · {u.readingMinutes} dk · {u.totalBlocks} kart
        </AppText>
        {u.isPremium ? <Badge tone={u.locked ? "warning" : "neutral"}>Premium</Badge> : null}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
        <View style={{ flex: 1 }}>
          <ProgressBar value={pct} tone={done ? "success" : "accent"} height={4} label="Okuma ilerlemesi" />
        </View>
        <AppText variant="label" tone={done ? "success" : "subtle"}>
          {done ? "Bitti" : `%${Math.round(pct * 100)}`}
        </AppText>
      </View>
      {u.mastery && u.mastery.band !== "new" ? (
        <AppText variant="bodySm" tone={u.mastery.band === "weak" ? "accentInk" : "subtle"}>
          Bu üniteden {u.mastery.solved} soru çözdün: {masteryLabel(u.mastery)}
        </AppText>
      ) : null}
    </View>
  );

  const footer = !u ? undefined : (
    <View style={{ gap: space.s3, paddingTop: space.s3, paddingBottom: 120 }}>
      {u.locked ? <SummaryLockCard remaining={u.totalBlocks - u.blocks.length} onPremium={() => router.push("/paywall")} /> : null}
      {!u.locked && bridge ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
          {done ? <CheckCircle2 color={colors.success} size={18} strokeWidth={1.75} /> : null}
          <AppText variant="body" tone="soft" style={{ flex: 1 }}>
            {done ? "Ünite bitti. Şimdi soruya: " : "Okuduğunu soruyla sına: "}
            {bridge.rows?.[0]?.value ? String(bridge.rows[0].value) : `md ${u.articleFrom}–${u.articleTo}`}
            {u.mastery?.band === "weak" ? ` · şu an %${u.mastery.accuracyPct ?? 0}, 10 soruyla yükselt` : ""}
          </AppText>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title, headerBackTitle: "Geri" }} />
      {q.isPending ? (
        <View style={{ padding: space.screenGutter, gap: space.s3 }}>
          <Skeleton height={28} width="80%" />
          <Skeleton height={140} radiusKey="card" />
          <Skeleton height={200} radiusKey="card" />
        </View>
      ) : q.isError || !u ? (
        <View style={{ padding: space.screenGutter }}>
          <Notice tone="error" title="Özet yüklenemedi">
            {q.error?.message ?? "Bu ünite yayında değil."}
          </Notice>
        </View>
      ) : (
        <FlatList<SummaryBlock>
          data={cards}
          keyExtractor={(b) => b.id}
          renderItem={({ item }) => <SummaryBlockCard block={item} lawSlug={u.legislation.slug} onOpenArticle={peek.open} />}
          ItemSeparatorComponent={() => <View style={{ height: space.s3 }} />}
          ListHeaderComponent={header}
          ListFooterComponent={footer}
          contentContainerStyle={{ paddingHorizontal: space.screenGutter, paddingTop: space.s3 }}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={VIEWABILITY}
          initialNumToRender={6}
        />
      )}
      {u && !u.locked && bridge?.session ? (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
          <ActionBar title="Bu üniteden 10 soru" onPress={startBridge} />
        </View>
      ) : null}
      {u ? <ArticlePeekSheet lawSlug={u.legislation.slug} no={peek.peek?.no ?? null} title={peek.peek?.title ?? null} onClose={peek.close} onReadFull={openArticlePage} /> : null}
    </View>
  );
}

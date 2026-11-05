import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArticlePeekSheet, SummaryBlockCard, SummaryBody, SummaryLockCard, useArticlePeek } from "@/components/domain/summary";
import { AppText, Button, ChoiceTabs, ListRow, Notice, Sheet, Skeleton } from "@/components/ui";
import { useUnit, useSaveUnitProgress, shortTitle, type SummaryUnit, type SummaryBlock } from "@/features/summaries/queries";
import { READING_OPTIONS, type ReadingMode } from "@/features/summaries/reading-mode";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTheme } from "@/theme/ThemeProvider";

export default function OzetScreen() {
  const p = useLocalSearchParams<{ slug: string; mode?: string }>();
  const q = useUnit(p.slug ?? null);
  const router = useRouter();
  const { colors, space } = useTheme();
  const [mode, setMode] = useState<ReadingMode>(p.mode === "quick" ? "quick" : "lesson");
  return <View style={{ flex: 1, backgroundColor: colors.bg }}><Stack.Screen options={{ title: q.data ? shortTitle(q.data.title) : "Konu oku", headerBackTitle: "Geri", headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink, headerLeft: !router.canGoBack() ? () => <Button title="Çalış" size="sm" variant="ghost" onPress={() => router.replace("/(tabs)/kutuphane")} /> : undefined }} />
    {q.isPending ? <View style={{ padding: space.screenGutter }}><Skeleton height={220} /></View> : q.isError || !q.data ? <Notice title="İçerik yüklenemedi" tone="error"><Button title="Tekrar dene" onPress={() => void q.refetch()} /></Notice> : <UnitReader key={`${q.data.slug}-${mode}`} unit={q.data} mode={mode === "quick" && q.data.quickReview ? "quick" : "lesson"} onMode={m => { setMode(m); }} />}
  </View>;
}

function UnitReader({ unit: u, mode, onMode }: { unit: SummaryUnit; mode: ReadingMode; onMode: (mode: ReadingMode) => void }) {
  const router = useRouter();
  const { colors, space } = useTheme();
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const save = useSaveUnitProgress();
  const peek = useArticlePeek();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [toc, setToc] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [read, setRead] = useState(mode === "lesson" && Boolean(u.progress?.completedAt));
  const cards = (mode === "quick" ? u.quickReview ?? [] : u.blocks).filter(b => b.type !== "bridge" && b.type !== "exam_stats");
  const positions = useRef<number[]>([]);
  const index = useRef(0);
  const restored = useRef(false);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const key = `reading.${auth.session?.user.id ?? "guest"}.${u.slug}.${mode}`;
  const initialIndex = useRef(mode === "lesson" ? Math.min(Math.max(0, cards.length - 1), u.progress?.lastBlockIndex ?? 0) : 0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    SecureStore.getItemAsync(key).then(value => {
      if (!active) return;
      if (value) { const p: { index?: number; read?: boolean } = JSON.parse(value); initialIndex.current = Math.max(0, Math.min(cards.length - 1, p.index ?? 0)); if (p.read) setRead(true); }
    }).catch(() => { if (active) setStorageError(true); }).finally(() => { if (active) setReady(true); });
    return () => { active = false; if (pending.current) clearTimeout(pending.current); };
  }, [key, cards.length]);
  const persist = (done = read) => {
    const i = index.current;
    void SecureStore.setItemAsync(key, JSON.stringify({ index: i, read: done })).catch(() => setStorageError(true));
    if (mode === "lesson" && auth.status === "signedIn" && cards[i]) {
      // Server indexes refer to original blocks, not the filtered reader.
      save.mutate({ slug: u.slug, lastBlockIndex: u.blocks.findIndex(b => b.id === cards[i]!.id), completed: done || undefined });
    }
  };
  const restore = () => {
    if (!ready || restored.current || positions.current[initialIndex.current] == null) return;
    restored.current = true;
    index.current = initialIndex.current;
    if (index.current > 0) scroll.current?.scrollTo({ y: positions.current[index.current] ?? 0, animated: false });
  };
  useEffect(() => { restore(); });
  const bridge = u.blocks.find(b => b.type === "bridge");
  const openQuestion = () => {
    if (!bridge?.session) return;
    router.push({ pathname: "/seans", params: { source: "topic_room", count: "10", focusKind: "topic", topicId: bridge.session.topicId, articleNos: bridge.session.articleNos.join(","), title: shortTitle(u.title) } });
  };
  const jump = (i: number) => { setToc(false); index.current = i; scroll.current?.scrollTo({ y: positions.current[i] ?? 0, animated: true }); persist(); };
  return <>
    <View style={{ paddingHorizontal: space.screenGutter, paddingVertical: space.s2, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}><AppText variant="label" tone="subtle">{mode === "quick" ? "Hızlı tekrar" : "Konu anlatımı"}</AppText><Button size="sm" title="İçindekiler" variant="secondary" onPress={() => setToc(true)} /></View>
    <ScrollView ref={scroll} onContentSizeChange={restore} scrollEventThrottle={200} onScroll={e => {
      if (!restored.current) return;
      const y = e.nativeEvent.contentOffset.y + space.s5;
      const next = positions.current.reduce((last, pos, i) => pos <= y ? i : last, 0);
      if (next !== index.current) { index.current = next; if (pending.current) clearTimeout(pending.current); pending.current = setTimeout(() => persist(), 500); }
    }} contentContainerStyle={{ padding: space.screenGutter, gap: space.s5, paddingBottom: space.s8 }}>
      <View style={{ gap: space.s2 }}><AppText variant="label" tone="accentInk">{u.legislation.shortName ?? u.legislation.name} · md {u.articleLabel ?? `${u.articleFrom}–${u.articleTo}`}</AppText><AppText variant="title">{shortTitle(u.title)}</AppText>{u.subtitle ? <AppText tone="soft">{u.subtitle}</AppText> : null}</View>
      {u.quickReview ? <ChoiceTabs value={mode} onChange={m => { persist(); onMode(m as ReadingMode); }} options={READING_OPTIONS} label="Okuma biçimi" /> : null}
      {storageError || save.isError ? <Notice tone="warning" title="Okuma konumu kaydedilemedi">Okumaya devam edebilirsin; konumun bir sonraki açılışta korunmayabilir.</Notice> : null}
      {cards.map((b, i) => <View key={b.id} onLayout={e => { positions.current[i] = e.nativeEvent.layout.y; restore(); }}>
        {mode === "quick" || b.rows?.length ? <SummaryBlockCard block={b} lawSlug={u.legislation.slug} onOpenArticle={peek.open} /> : <LessonSection block={b} onArticle={peek.open} />}
      </View>)}
      {u.locked ? <SummaryLockCard remaining={u.totalBlocks - u.blocks.length} onPremium={() => router.push("/paywall")} /> : <Button title={read ? "Okundu" : "Okudum olarak işaretle"} variant="secondary" onPress={() => { setRead(true); persist(true); }} />}
    </ScrollView>
    {!u.locked && bridge?.session ? <View style={{ paddingHorizontal: space.screenGutter, paddingTop: space.s3, paddingBottom: Math.max(insets.bottom, space.s3), backgroundColor: colors.bg }}><Button title="Bu üniteden soru çöz" onPress={openQuestion} /></View> : null}
    <Sheet title="İçindekiler" visible={toc} onClose={() => setToc(false)}>{cards.map((b, i) => <ListRow key={b.id} title={b.title ?? `Bölüm ${i + 1}`} onPress={() => jump(i)} />)}</Sheet>
    <ArticlePeekSheet lawSlug={u.legislation.slug} no={peek.peek?.no ?? null} title={peek.peek?.title ?? null} onClose={peek.close} onReadFull={no => { peek.close(); router.push({ pathname: "/oku/[slug]", params: { slug: u.legislation.slug, madde: no } }); }} />
  </>;
}

function LessonSection({ block, onArticle }: { block: SummaryBlock; onArticle: (no: string, title: string | null) => void }) {
  const { space } = useTheme();
  return <View style={{ gap: space.s3 }}><AppText variant="heading" accessibilityRole="header">{block.title}</AppText>{block.body ? <SummaryBody text={block.body} /> : null}<View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s2 }}>{block.articles.map(a => <Button key={a.no} title={`Madde ${a.no}`} size="sm" variant="secondary" onPress={() => onArticle(a.no, a.title)} />)}</View></View>;
}

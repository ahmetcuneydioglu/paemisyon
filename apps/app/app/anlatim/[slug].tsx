import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { Linking, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText, Button, Card, ListRow, Notice, Sheet, Skeleton } from "@/components/ui";
import { LessonContent } from "@/components/domain/lesson-content";
import { INTRODUCTION } from "@/features/lessons/content";
import { useLessonProgress } from "@/features/lessons/progress";
import { useTheme } from "@/theme/ThemeProvider";

export default function LessonScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const lesson = INTRODUCTION.lessons.find(l => l.slug === slug);
  const router = useRouter();
  const { colors } = useTheme();
  return <><Stack.Screen options={{ title: "Konu anlatımı", headerShown: true, headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink, headerBackTitle: "Geri", headerLeft: !router.canGoBack() ? () => <Button title="Çalış" size="sm" variant="ghost" onPress={() => router.replace("/(tabs)/kutuphane")} /> : undefined }} />{lesson ? <Reader key={lesson.slug} lesson={lesson} /> : <Notice title="Ders bulunamadı"><Button title="Çalışa dön" onPress={() => router.replace("/(tabs)/kutuphane")} /></Notice>}</>;
}

function Reader({ lesson }: { lesson: (typeof INTRODUCTION.lessons)[number] }) {
  const { colors, space } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const progress = useLessonProgress(lesson.slug, INTRODUCTION.version);
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const positions = useRef<number[]>([]);
  const offset = useRef(0);
  const restored = useRef(false);
  const [toc, setToc] = useState(false);
  const [sources, setSources] = useState(false);
  const [linkError, setLinkError] = useState(false);
  const order = INTRODUCTION.lessons.findIndex(l => l.slug === lesson.slug);
  const next = INTRODUCTION.lessons[order + 1];
  const saveRef = useRef(progress.save.mutate);
  useEffect(() => { saveRef.current = progress.save.mutate; }, [progress.save.mutate]);
  const readRef = useRef(false);
  useEffect(() => { readRef.current = progress.data?.read ?? false; }, [progress.data?.read]);
  useEffect(() => () => { if (restored.current) saveRef.current({ offset: offset.current, read: readRef.current }); }, []);
  const persist = (read = readRef.current) => { readRef.current = read; progress.save.mutate({ offset: offset.current, read }); };
  return <View style={{ flex: 1, backgroundColor: colors.bg }}>
    <View style={{ paddingHorizontal: space.screenGutter, paddingVertical: space.s2, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}><AppText variant="label" tone="accentInk">Ders {order + 1} / {INTRODUCTION.lessons.length}</AppText><Button size="sm" title="İçindekiler" variant="secondary" onPress={() => setToc(true)} /></View>
    {progress.isPending ? <Skeleton height={200} /> : <ScrollView ref={scroller} scrollEventThrottle={200} onScroll={e => { if (restored.current) offset.current = Math.max(0, e.nativeEvent.contentOffset.y); }} onMomentumScrollEnd={() => persist()} onScrollEndDrag={() => persist()} onContentSizeChange={() => { if (!restored.current) { const y = progress.data?.offset ?? 0; offset.current = y; scroller.current?.scrollTo({ y, animated: false }); restored.current = true; } }} contentContainerStyle={{ padding: space.screenGutter, paddingBottom: space.s8, gap: space.s5 }}>
      <View style={{ gap: space.s2 }}><AppText variant="label" tone="subtle">{INTRODUCTION.title}</AppText><AppText variant="title">{lesson.title}</AppText><AppText tone="soft">{lesson.goal}</AppText></View>
      <AppText variant="bodySm" tone="subtle">İnceleme sürümü · Okuma konumu bu cihazda saklanır</AppText>
      {progress.isError || progress.save.isError ? <Notice tone="warning" title="Okuma konumu kaydedilemiyor">Dersi okuyabilirsin; kaldığın yer korunmayabilir.</Notice> : null}
      {lesson.sections.map((section, i) => <View key={section.title} onLayout={e => { positions.current[i] = e.nativeEvent.layout.y; }} style={{ gap: space.s3 }}><AppText variant="heading" accessibilityRole="header">{section.title}</AppText><LessonContent blocks={section.blocks} /></View>)}
      <Button title="Kaynakları incele" variant="secondary" onPress={() => setSources(true)} />
      <Card><AppText variant="subhead">{progress.data?.read ? "Bu dersi okudun" : "Dersin sonuna geldin"}</AppText><AppText variant="bodySm" tone="soft">Okundu bilgisi, konuya hâkimiyet ölçümü değildir.</AppText><Button title={progress.data?.read ? "Okundu" : "Okudum olarak işaretle"} variant="secondary" onPress={() => persist(true)} /></Card>
    </ScrollView>}
    {next ? <View style={{ paddingHorizontal: space.screenGutter, paddingTop: space.s3, paddingBottom: Math.max(insets.bottom, space.s3), backgroundColor: colors.bg }}><Button title="Sonraki ders" onPress={() => { persist(); router.replace({ pathname: "/anlatim/[slug]", params: { slug: next.slug } }); }} /></View> : <View style={{ paddingHorizontal: space.screenGutter, paddingBottom: Math.max(insets.bottom, space.s3) }}><Button title="Bölüm listesine dön" onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/kutuphane")} /></View>}
    <Sheet title="İçindekiler" visible={toc} onClose={() => setToc(false)}>{lesson.sections.map((s, i) => <ListRow key={s.title} title={s.title} onPress={() => { setToc(false); scroller.current?.scrollTo({ y: positions.current[i] ?? 0, animated: true }); }} />)}</Sheet>
    <Sheet title="Kaynaklar" visible={sources} onClose={() => setSources(false)}>{lesson.sources.map((s, i) => <ListRow key={i} title={s.label} subtitle={s.url ? "Kaynağı aç" : "Kaynak eserden özgün anlatım"} onPress={s.url ? () => { void Linking.openURL(s.url).catch(() => setLinkError(true)); } : undefined} />)}{linkError ? <Notice tone="error" title="Kaynak bağlantısı açılamadı" /> : null}</Sheet>
  </View>;
}

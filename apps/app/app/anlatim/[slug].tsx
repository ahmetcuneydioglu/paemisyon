import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { Linking, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText, Button, Card, ListRow, Notice, Sheet, Skeleton } from "@/components/ui";
import { LessonContent } from "@/components/domain/lesson-content";
import { useLesson, useSaveLessonProgress, type LessonDetail } from "@/features/lessons/queries";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Ders okuyucu (Doc 57): yayındaki sürüm sunucudan; okuma konumu ve "okudum" girişli kullanıcıda sunucuda
 * (cihazlar arası), misafirde yalnız oturum süresince. Kaynakça yalnız kamuya açık kaynaklar.
 */
export default function LessonScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const q = useLesson(slug ?? null);
  const router = useRouter();
  const { colors, space } = useTheme();
  const geri = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)/kutuphane"));
  return (
    <>
      <Stack.Screen options={{ title: "Konu anlatımı", headerShown: true, headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink, headerBackTitle: "Geri", headerLeft: !router.canGoBack() ? () => <Button title="Çalış" size="sm" variant="ghost" onPress={() => router.replace("/(tabs)/kutuphane")} /> : undefined }} />
      {q.isPending ? (
        <View style={{ padding: space.screenGutter, gap: space.s3 }}>
          <Skeleton height={28} width="60%" />
          <Skeleton height={200} radiusKey="card" />
        </View>
      ) : q.isError ? (
        <View style={{ padding: space.screenGutter, gap: space.s3 }}>
          <Notice tone="error" title="Ders yüklenemedi">{q.error.message}</Notice>
          <Button title="Tekrar dene" variant="secondary" onPress={() => void q.refetch()} />
          <Button title="Çalışa dön" variant="ghost" onPress={geri} />
        </View>
      ) : q.data.locked || q.data.body == null ? (
        <View style={{ padding: space.screenGutter, gap: space.s3 }}>
          <AppText variant="title">{q.data.title}</AppText>
          <Notice tone="info" title="Premium içerik">Bu bölüm Premium üyelere açık. Dersin hedefi: {q.data.goal}</Notice>
          <Button title="Premium'u incele" onPress={() => router.push("/paywall")} />
          <Button title="Geri" variant="ghost" onPress={geri} />
        </View>
      ) : (
        <Reader key={`${q.data.slug}-${q.data.version}`} lesson={{ ...q.data, body: q.data.body }} />
      )}
    </>
  );
}

function Reader({ lesson }: { lesson: LessonDetail & { body: NonNullable<LessonDetail["body"]> } }) {
  const { colors, space } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
  const save = useSaveLessonProgress(lesson.slug);
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const positions = useRef<number[]>([]);
  const offset = useRef(lesson.progress?.offset ?? 0);
  const restored = useRef(false);
  const [toc, setToc] = useState(false);
  const [sources, setSources] = useState(false);
  const [linkError, setLinkError] = useState(false);
  const [read, setRead] = useState(Boolean(lesson.progress?.readAt));
  const saveRef = useRef(save.mutate);
  useEffect(() => {
    saveRef.current = save.mutate;
  }, [save.mutate]);
  const readRef = useRef(read);
  useEffect(() => {
    readRef.current = read;
  }, [read]);
  // Ekrandan çıkarken son konum yazılır (girişliyse).
  useEffect(() => () => {
    if (session && restored.current) saveRef.current({ offset: offset.current, read: readRef.current });
  }, [session]);
  const persist = (markRead = readRef.current) => {
    setRead(markRead);
    if (session) save.mutate({ offset: offset.current, read: markRead });
  };
  const openSource = (url: string) => void Linking.openURL(url).catch(() => setLinkError(true));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: space.screenGutter, paddingVertical: space.s2, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <AppText variant="label" tone="accentInk">{`Ders ${lesson.order} / ${lesson.section.lessonCount} · ${lesson.readingMinutes} dk`}</AppText>
        <Button size="sm" title="İçindekiler" variant="secondary" onPress={() => setToc(true)} />
      </View>
      <ScrollView
        ref={scroller}
        scrollEventThrottle={200}
        onScroll={(e) => {
          if (restored.current) offset.current = Math.max(0, e.nativeEvent.contentOffset.y);
        }}
        onMomentumScrollEnd={() => persist()}
        onScrollEndDrag={() => persist()}
        onContentSizeChange={() => {
          if (!restored.current) {
            scroller.current?.scrollTo({ y: offset.current, animated: false });
            restored.current = true;
          }
        }}
        contentContainerStyle={{ padding: space.screenGutter, paddingBottom: space.s8, gap: space.s5 }}
      >
        <View style={{ gap: space.s2 }}>
          <AppText variant="label" tone="subtle">{lesson.section.title}</AppText>
          <AppText variant="title">{lesson.title}</AppText>
          <AppText tone="soft">{lesson.goal}</AppText>
        </View>
        <AppText variant="bodySm" tone="subtle">{session ? "Okuma konumu hesabında saklanır" : "Giriş yaparsan kaldığın yer hesabında saklanır"}</AppText>
        {save.isError ? <Notice tone="warning" title="Okuma konumu kaydedilemiyor">Dersi okuyabilirsin; kaldığın yer korunmayabilir.</Notice> : null}
        {lesson.body.sections.map((section, i) => (
          <View key={section.title} onLayout={(e) => { positions.current[i] = e.nativeEvent.layout.y; }} style={{ gap: space.s3 }}>
            <AppText variant="heading" accessibilityRole="header">{section.title}</AppText>
            <LessonContent blocks={section.blocks} />
          </View>
        ))}
        {lesson.sources.length > 0 ? <Button title="Kaynakları incele" variant="secondary" onPress={() => setSources(true)} /> : null}
        <Card>
          <AppText variant="subhead">{read ? "Bu dersi okudun" : "Dersin sonuna geldin"}</AppText>
          <AppText variant="bodySm" tone="soft">Okundu bilgisi, konuya hâkimiyet ölçümü değildir.</AppText>
          <Button title={read ? "Okundu" : "Okudum olarak işaretle"} variant="secondary" onPress={() => persist(true)} />
        </Card>
      </ScrollView>
      {lesson.next ? (
        <View style={{ paddingHorizontal: space.screenGutter, paddingTop: space.s3, paddingBottom: Math.max(insets.bottom, space.s3), backgroundColor: colors.bg }}>
          <Button title={`Sonraki ders · ${lesson.next.title}`} onPress={() => { persist(); router.replace({ pathname: "/anlatim/[slug]", params: { slug: lesson.next!.slug } }); }} />
        </View>
      ) : (
        <View style={{ paddingHorizontal: space.screenGutter, paddingBottom: Math.max(insets.bottom, space.s3) }}>
          <Button title="Bölüm listesine dön" onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/kutuphane"))} />
        </View>
      )}
      <Sheet title="İçindekiler" visible={toc} onClose={() => setToc(false)}>
        {lesson.body.sections.map((s, i) => (
          <ListRow key={s.title} title={s.title} onPress={() => { setToc(false); scroller.current?.scrollTo({ y: positions.current[i] ?? 0, animated: true }); }} />
        ))}
      </Sheet>
      <Sheet title="Kaynaklar" visible={sources} onClose={() => setSources(false)}>
        {lesson.sources.map((s, i) => (
          <ListRow key={i} title={s.label} subtitle={s.kind === "url" ? "Kaynağı aç" : s.kind === "article" ? "Resmî madde metni" : s.page ?? null} onPress={s.url ? () => openSource(s.url!) : undefined} />
        ))}
        {linkError ? <Notice tone="error" title="Kaynak bağlantısı açılamadı" /> : null}
      </Sheet>
    </View>
  );
}

import { useLocalSearchParams, useRouter } from "expo-router";
import { ALargeSmall, Bookmark, BookmarkCheck, List, NotebookPen, Share2, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, Share, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText, Button, IconButton, ListRow, Notice, Sheet, Skeleton } from "@/components/ui";
import { ArticleSummaryDisclosure } from "@/components/domain/article-summary";
import { useArticleAnnotations, useArticleBookmarks, useLawRead, useSaveArticleNote, useSaveReadingProgress, useToggleArticleBookmark, type LawRead } from "@/features/mevzuat/queries";
import { readLocal, writeLocal } from "@/lib/local-store";
import { useTheme } from "@/theme/ThemeProvider";

type Article = LawRead["articles"][number];
const SCALES = [0.9, 1, 1.15] as const;

/**
 * Mevzuat okuyucu (Doc 25 "Madde detay"in mobil hali; kök Stack, tam ekran). Resmî metin,
 * kaynak ve doğrulama tarihi; madde kaydet, not, paylaş, "N soru" → seans. Okuma ilerlemesi
 * 20 sn'de bir ve çıkışta (görünür madde değiştiyse) sunucuya yazılır. Yazı boyu cihazda kalır.
 * Vurgulama (highlight) F5'e ertelendi (07 §6).
 */
export default function OkuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, space, type: t, radius } = useTheme();
  const p = useLocalSearchParams<{ slug: string; madde?: string }>();
  const slug = p.slug ?? null;
  const q = useLawRead(slug);
  const bookmarks = useArticleBookmarks();
  const annotations = useArticleAnnotations(slug);
  const toggleBookmark = useToggleArticleBookmark();
  const saveNote = useSaveArticleNote();
  const saveProgress = useSaveReadingProgress();

  const [scaleIdx, setScaleIdx] = useState(1);
  const [tocOpen, setTocOpen] = useState(false);
  const [noteFor, setNoteFor] = useState<Article | null>(null);
  const [noteText, setNoteText] = useState("");
  const listRef = useRef<FlatList<Article>>(null);
  const visibleNo = useRef<string | null>(null);
  const savedNo = useRef<string | null>(null);
  const jumped = useRef(false);

  useEffect(() => {
    void readLocal<number>("reader.scale", 1).then((v) => setScaleIdx(SCALES.includes(v as (typeof SCALES)[number]) ? SCALES.indexOf(v as (typeof SCALES)[number]) : 1));
  }, []);

  const flush = useCallback(() => {
    const no = visibleNo.current;
    if (!slug || !no || no === savedNo.current) return;
    savedNo.current = no;
    saveProgress.mutate({ lawSlug: slug, no });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    const h = setInterval(flush, 20_000);
    return () => {
      clearInterval(h);
      flush();
    };
  }, [flush]);

  const d = q.data;
  const myBookmarks = useMemo(() => new Set((bookmarks.data ?? []).filter((b) => b.lawSlug === slug).map((b) => b.no)), [bookmarks.data, slug]);
  const notes = useMemo(() => new Map((annotations.data?.notes ?? []).map((n) => [n.no, n.text])), [annotations.data]);
  const sections = useMemo(() => new Map((d?.sections ?? []).map((s) => [s.id, s.heading])), [d]);

  // FlatList bu geri çağrının kimliğini sabit ister; useCallback ve ref'e yazım olay anında.
  const onViewable = useCallback(({ viewableItems }: { viewableItems: { item: Article; isViewable: boolean }[] }) => {
    const first = viewableItems.find((v) => v.isViewable);
    if (first?.item) visibleNo.current = first.item.no;
  }, []);

  const scrollTo = (no: string) => {
    const idx = d?.articles.findIndex((a) => a.no === no) ?? -1;
    if (idx >= 0) listRef.current?.scrollToIndex({ index: idx, animated: false, viewPosition: 0 });
  };

  const cycleScale = () => {
    const next = (scaleIdx + 1) % SCALES.length;
    setScaleIdx(next);
    void writeLocal("reader.scale", SCALES[next]);
  };

  const share = (a: Article) => {
    void Share.share({ message: `${d?.shortName ?? d?.name} md. ${a.no} — https://www.paemisyon.com/kanun/${slug}/oku#m-${a.slug}` });
  };

  const openNote = (a: Article) => {
    setNoteFor(a);
    setNoteText(notes.get(a.no) ?? "");
  };

  const scale = SCALES[scaleIdx] ?? 1;
  const bodyStyle = { ...t.body, fontSize: Math.round(t.body.fontSize * scale), lineHeight: Math.round(t.body.lineHeight * scale) };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2, paddingHorizontal: space.s3, paddingVertical: space.s2, borderBottomWidth: 0.5, borderBottomColor: colors.line }}>
        <IconButton icon={X} label="Okuyucuyu kapat" variant="ghost" onPress={() => router.back()} />
        <View style={{ flex: 1 }}>
          <AppText variant="subhead" numberOfLines={1}>
            {d?.shortName ?? d?.name ?? "Mevzuat"}
          </AppText>
          {d ? (
            <AppText variant="bodySm" tone="subtle" numberOfLines={1}>
              {d.source}
              {d.verifiedAt ? ` · Doğrulandı ${new Date(d.verifiedAt).toLocaleDateString("tr-TR")}` : ""}
            </AppText>
          ) : null}
        </View>
        <IconButton icon={ALargeSmall} label="Yazı boyu" variant="ghost" onPress={cycleScale} />
        <IconButton icon={List} label="İçindekiler" variant="ghost" onPress={() => setTocOpen(true)} />
      </View>

      {q.isPending ? (
        <View style={{ padding: space.screenGutter, gap: space.s3 }}>
          <Skeleton height={24} width="40%" />
          <Skeleton height={160} radiusKey="card" />
          <Skeleton height={160} radiusKey="card" />
        </View>
      ) : q.isError ? (
        <View style={{ padding: space.screenGutter }}>
          <Notice tone="error" title="Metin yüklenemedi">
            {q.error.message}
          </Notice>
        </View>
      ) : d ? (
        <FlatList
          ref={listRef}
          data={d.articles}
          keyExtractor={(a) => a.slug}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={{ itemVisiblePercentThreshold: 30 }}
          contentContainerStyle={{ paddingHorizontal: space.screenGutter, paddingBottom: insets.bottom + space.s8 }}
          initialNumToRender={8}
          onScrollToIndexFailed={(e) => setTimeout(() => listRef.current?.scrollToIndex({ index: e.index, animated: false }), 200)}
          onLayout={() => {
            if (!jumped.current && p.madde) {
              jumped.current = true;
              setTimeout(() => scrollTo(p.madde!), 50);
            }
          }}
          ListHeaderComponent={
            <View style={{ paddingVertical: space.s4, gap: 4 }}>
              <AppText variant="title">{d.name}</AppText>
              {d.effectiveInfo ? (
                <AppText variant="bodySm" tone="soft">
                  {d.effectiveInfo}
                </AppText>
              ) : null}
            </View>
          }
          renderItem={({ item: a, index }) => {
            const prev = d.articles[index - 1];
            const heading = a.sectionId && (!prev || prev.sectionId !== a.sectionId) ? sections.get(a.sectionId) : null;
            const saved = myBookmarks.has(a.no);
            const note = notes.get(a.no);
            return (
              <View style={{ paddingVertical: space.s3, gap: space.s2, borderBottomWidth: 0.5, borderBottomColor: colors.line }}>
                {heading ? (
                  <AppText variant="label" tone="accentInk" style={{ paddingTop: space.s2 }}>
                    {heading}
                  </AppText>
                ) : null}
                <AppText variant="label" tone="subtle">
                  Madde {a.no}
                </AppText>
                {a.title ? <AppText variant="subhead">{a.title}</AppText> : null}
                <AppText variant="body" selectable style={bodyStyle}>
                  {a.text}
                </AppText>
                {a.summary ? <ArticleSummaryDisclosure summary={a.summary} /> : null}
                {note ? (
                  <Pressable accessibilityRole="button" onPress={() => openNote(a)} style={{ backgroundColor: colors.accentSoft, borderRadius: radius.control, padding: space.s3, gap: 2 }}>
                    <AppText variant="label" tone="accentInk">
                      Notum
                    </AppText>
                    <AppText variant="bodySm" tone="ink">
                      {note}
                    </AppText>
                  </Pressable>
                ) : null}
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.s1, flexWrap: "wrap" }}>
                  <IconButton icon={saved ? BookmarkCheck : Bookmark} label={saved ? "Kaydı kaldır" : "Maddeyi kaydet"} variant={saved ? "primary" : "ghost"} onPress={() => toggleBookmark.mutate({ lawSlug: slug!, no: a.no, on: !saved })} />
                  <IconButton icon={NotebookPen} label={note ? "Notu düzenle" : "Not ekle"} variant="ghost" onPress={() => openNote(a)} />
                  <IconButton icon={Share2} label="Paylaş" variant="ghost" onPress={() => share(a)} />
                  <View style={{ flex: 1 }} />
                  {a.questionCount > 0 && d.topicId ? (
                    <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/seans", params: { mode: "practice", count: String(Math.min(10, a.questionCount)), focusKind: "topic", topicId: d.topicId!, articleNo: a.no, courseId: "", recipe: "" } })} hitSlop={8}>
                      <AppText variant="subhead" tone="accentInk">
                        {a.questionCount} soru ›
                      </AppText>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      ) : null}

      <Sheet visible={tocOpen} onClose={() => setTocOpen(false)} title="İçindekiler">
        {(d?.articles ?? []).map((a, i) => (
          <ListRow
            key={a.slug}
            title={`Madde ${a.no}${a.title ? ` · ${a.title}` : ""}`}
            subtitle={a.questionCount > 0 ? `${a.questionCount} soru` : null}
            divider={i < (d?.articles.length ?? 0) - 1}
            onPress={() => {
              setTocOpen(false);
              setTimeout(() => scrollTo(a.no), 150);
            }}
          />
        ))}
      </Sheet>

      <Sheet visible={noteFor != null} onClose={() => setNoteFor(null)} title={noteFor ? `Madde ${noteFor.no} · Notum` : "Not"} footer={<Button title="Kaydet" loading={saveNote.isPending} onPress={() => noteFor && saveNote.mutate({ lawSlug: slug!, no: noteFor.no, text: noteText.trim() }, { onSuccess: () => setNoteFor(null) })} />}>
        <TextInput
          value={noteText}
          onChangeText={(v) => setNoteText(v.slice(0, 2000))}
          multiline
          placeholder="Kendi cümlenle: bu madde ne diyor, sınavda nasıl soruluyor?"
          placeholderTextColor={colors.inkSubtle}
          accessibilityLabel="Not metni"
          style={[t.body, { color: colors.ink, minHeight: 140, textAlignVertical: "top", backgroundColor: colors.bg, borderRadius: radius.control, borderWidth: 1, borderColor: colors.line, padding: 12 }]}
        />
        <AppText variant="bodySm" tone="subtle">
          {noteText.length}/2000 · Boş kaydedersen not silinir.
        </AppText>
        {saveNote.isError ? <Notice tone="error">{saveNote.error.message}</Notice> : null}
      </Sheet>
    </View>
  );
}

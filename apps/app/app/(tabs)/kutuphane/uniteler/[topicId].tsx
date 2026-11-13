import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2 } from "lucide-react-native";
import { View } from "react-native";
import { AppText, Badge, Button, Card, ChoiceTabs, EmptyState, ListRow, Notice, Screen, Skeleton } from "@/components/ui";
import { shortTitle, useTopicUnits, type SummaryUnitListItem } from "@/features/summaries/queries";
import { READING_OPTIONS } from "@/features/summaries/reading-mode";
import { useAuth } from "@/lib/auth/AuthProvider";
import { lessonReadState, useLessonSections } from "@/features/lessons/queries";
import { useTheme } from "@/theme/ThemeProvider";

export default function UnitListScreen() {
  const p = useLocalSearchParams<{ topicId: string; name?: string }>();
  const q = useTopicUnits(p.topicId ?? null);
  const router = useRouter();
  const { colors, space } = useTheme();
  const [mode, setMode] = useState("lesson");
  const auth = useAuth();
  const preferenceKey = `reading-mode.${auth.session?.user.id ?? "guest"}`;
  useEffect(() => { let active = true; void SecureStore.getItemAsync(preferenceKey).then(m => { if (active && (m === "lesson" || m === "quick")) setMode(m); }).catch(() => {}); return () => { active = false; }; }, [preferenceKey]);
  const changeMode = (m: string) => { setMode(m); void SecureStore.setItemAsync(preferenceKey, m).catch(() => {}); };
  const units = (q.data ?? []).filter(u => mode !== "quick" || u.hasQuickReview);
  // Konu anlatımı dersleri (Doc 57): bölüm → ders, sunucudan; yalnız yayındakiler.
  const sections = useLessonSections(mode === "lesson" ? (p.topicId ?? null) : null);
  const dersSayisi = (sections.data ?? []).reduce((n, sec) => n + sec.lessons.length, 0);
  const resume = units.find(u => u.progress && !u.progress.completedAt);
  const open = (u: SummaryUnitListItem) => router.push({ pathname: "/ozet/[slug]", params: { slug: u.slug, mode } });
  return <><Stack.Screen options={{ title: "Konu oku", headerBackTitle: "Geri" }} /><Screen inset="none"><AppText variant="title">{p.name ?? "Ünite içerikleri"}</AppText><AppText variant="bodySm" tone="soft">{[dersSayisi > 0 ? `${dersSayisi} ders` : null, units.length > 0 ? `${units.length} ünite` : null, "Kendi sıranla ilerle"].filter(Boolean).join(" · ")}</AppText><ChoiceTabs value={mode} onChange={changeMode} options={READING_OPTIONS} label="Okuma biçimi" />
    {resume && mode === "lesson" ? <Card tone="accent"><AppText variant="subhead">Kaldığın yer</AppText><AppText>{shortTitle(resume.title)}</AppText><Button title="Okumaya devam et" onPress={() => open(resume)} /></Card> : null}
    {mode === "lesson" && sections.data?.length ? sections.data.map(sec => <View key={sec.slug} style={{ gap: space.s3 }}><AppText variant="heading">{sec.title}</AppText><AppText variant="bodySm" tone="soft">{`${sec.lessons.length} ders${sec.subtitle ? ` · ${sec.subtitle}` : ""}${sec.locked ? " · Premium" : ""}`}</AppText>{sec.lessons.map((lesson, i) => {
      const state = sec.locked ? null : lessonReadState(lesson.progress);
      const title = `${i + 1}. ${lesson.title}`;
      const subtitle = `${lesson.goal} · ${lesson.readingMinutes} dk`;
      // Okunan derste yeşil onay simgesi yeter; ayrıca "Okundu" rozeti başlığı kesiyordu (13 Kas 2026).
      const status = sec.locked ? "Premium" : state === "read" ? "Okundu" : state === "resume" ? "Devam ediyor" : null;
      return <Card key={lesson.slug} style={{ paddingVertical: 0 }}><ListRow title={title} subtitle={subtitle} accessibilityLabel={[title, status, subtitle].filter(Boolean).join(", ")} leadingTone={state === "read" ? "success" : "neutral"} leading={state === "read" ? <CheckCircle2 color={colors.successInk} size={20} strokeWidth={2} /> : <BookOpen color={colors.ink} size={20} strokeWidth={1.75} />} trailing={sec.locked ? <AppText variant="label">Premium</AppText> : state === "resume" ? <Badge tone="accent" style={{ alignSelf: "center" }}>Devam</Badge> : undefined} divider={false} onPress={() => router.push({ pathname: "/anlatim/[slug]", params: { slug: lesson.slug } })} /></Card>;
    })}</View>) : null}
    {q.isPending ? <Skeleton height={180} /> : q.isError ? <Notice tone="error" title="Üniteler yüklenemedi"><Button title="Tekrar dene" onPress={() => void q.refetch()} /></Notice> : <>
      {units.length ? <AppText variant="heading">{mode === "lesson" ? "Madde özetleri" : "Üniteler"}</AppText> : null}<View style={{ gap: space.s2 }}>{units.map(u => <Card key={u.slug} style={{ paddingVertical: 0 }}><ListRow title={shortTitle(u.title)} leadingTone={mode === "lesson" && u.progress?.completedAt && !u.locked ? "success" : "neutral"} leading={mode === "lesson" && u.progress?.completedAt && !u.locked ? <CheckCircle2 color={colors.successInk} size={20} strokeWidth={2} /> : <BookOpen color={colors.ink} size={20} strokeWidth={1.75} />} subtitle={`${mode === "quick" ? "Hızlı tekrar" : `${u.readingMinutes} dk · Konu anlatımı`}${mode === "lesson" ? u.progress?.completedAt ? " · Okundu" : u.progress ? " · Devam ediyor" : " · Başlamadın" : ""}`} trailing={u.locked ? <AppText variant="label">Premium</AppText> : undefined} onPress={() => open(u)} divider={false} /></Card>)}</View>
      {!units.length && !(mode === "lesson" && dersSayisi > 0) ? <EmptyState title={mode === "quick" ? "Bu konuda hızlı tekrar henüz yayınlanmadı" : "Henüz ünite yayınlanmadı"} body="Konu anlatımı ve mevzuat metninden çalışmaya devam edebilirsin." /> : null}
    </>}<AppText variant="bodySm" tone="soft">Okuma durumu, soru başarısından ayrı tutulur.</AppText></Screen></>;
}

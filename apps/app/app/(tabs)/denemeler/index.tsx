import { useRouter } from "expo-router";
import { Archive, CalendarClock, ClipboardList, Sparkles } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { RemindButton, WeeklyCountdown, examMeta } from "@/components/domain";
import { ActionTile, AppText, BigNumber, Button, Card, ListRow, Notice, ProgressBar, Screen, Skeleton } from "@/components/ui";
import { countdown, fmtDate, fmtNet, heroFor, mmss, pastExamShortName, useDashboard, useExamHistory, useExams, usePastExams, type ExamListItem } from "@/features/exams/queries";
import { useNow } from "@/lib/use-now";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Deneme merkezi — IA "A: ızgaralı hub" (Figma 100:1329, 3 Kas 2026). Adayın tek sorusu
 * "Şimdi ne çözeyim?": en üstte TEK cevap ("Şimdi" bloğu: canlı/devam eden > sıradaki haftalık
 * > serbest öner), altında dört giriş kutusu (Haftalık · Serbest · Kişisel · Çıkmış), en altta
 * son sonuç. Listeler tür ekranlarında; bir deneme bu ekranda yalnız bir kez görünür.
 * Kurallar sunucuda; istemci yalnız durumu çizer.
 */
export default function DenemelerScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const exams = useExams();
  const dash = useDashboard();
  const past = usePastExams();
  const history = useExamHistory();
  const list = exams.data ?? [];
  const now = useNow(1000, list.length > 0);
  const hero = heroFor(list, now);

  const serbest = list.filter((e) => e.publishMode === "serbest");
  const haftalik = list.filter((e) => e.publishMode === "takvimli");
  const nextWeekly = haftalik.filter((e) => e.availability !== "closed").sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))[0] ?? null;
  const serbestDone = serbest.filter((e) => e.my?.official?.status === "completed").length;
  const solvablePast = (past.data ?? []).filter((p) => p.tur === "resmi" && p.examId);
  const pe = dash.data?.personalExam;
  const peLeft = pe ? (pe.dailyAllowance == null ? null : Math.max(0, pe.dailyAllowance - pe.usedToday)) : null;
  const h = history.data;
  const last = h ? [...h.denemeler, ...h.haftalik, ...h.kisisel].filter((x) => x.completedAt).sort((a, b) => Date.parse(b.completedAt!) - Date.parse(a.completedAt!))[0] ?? null : null;

  const rules = (e: ExamListItem, role = "") => router.push({ pathname: "/(tabs)/denemeler/[examId]/kurallar", params: { examId: e.id, role } });
  const play = (e: ExamListItem) => router.push({ pathname: "/seans", params: { exam: e.id, role: e.my?.active?.role ?? "", title: e.title } });

  return (
    <Screen>
      <View style={{ gap: space.s1 }}>
        <AppText variant="bodySm" tone="soft">
          PAEM hazırlığı
        </AppText>
        <AppText variant="title" accessibilityRole="header">
          Denemeler
        </AppText>
      </View>

      {exams.isPending ? (
        <Skeleton height={200} radiusKey="card" />
      ) : exams.isError ? (
        <Notice tone="error" title="Denemeler yüklenemedi">
          {exams.error.message}
        </Notice>
      ) : hero.kind === "active" ? (
        <ActiveHero exam={hero.exam} now={now} onPress={() => play(hero.exam)} />
      ) : hero.kind === "weekly" ? (
        <WeeklyHero exam={hero.exam} now={now} onPrimary={() => (hero.exam.myState === "completed" && hero.exam.my?.official ? router.push({ pathname: "/deneme-sonuc/[attemptId]", params: { attemptId: hero.exam.my.official.attemptId } }) : hero.exam.myState === "in_progress" ? play(hero.exam) : rules(hero.exam))} onRules={() => rules(hero.exam)} />
      ) : hero.kind === "serbest" ? (
        <SuggestHero exam={hero.exam} weeklyHint={nextWeekly} onStart={() => rules(hero.exam)} onPersonal={() => router.push("/(tabs)/denemeler/kisisel")} />
      ) : (
        <SuggestHero exam={null} weeklyHint={null} onStart={() => undefined} onPersonal={() => router.push("/(tabs)/denemeler/kisisel")} />
      )}

      {/* Dört giriş kutusu (2×2) */}
      <View style={{ gap: space.s2 }}>
        <View style={{ flexDirection: "row", gap: space.s2 }}>
          <ActionTile icon={CalendarClock} title="Haftalık" subtitle={nextWeekly ? `${fmtDate(nextWeekly.startAt, { weekday: "long", hour: "2-digit", minute: "2-digit" })} · ${countdown(Date.parse(nextWeekly.startAt) - now)}` : haftalik.length ? `${haftalik.length} geçmiş deneme` : "Yakında"} onPress={() => router.push("/(tabs)/denemeler/haftalik")} />
          <ActionTile icon={ClipboardList} title="Serbest" subtitle={serbest.length ? `${serbest.length} deneme · ${serbestDone} çözüldü` : "Henüz yok"} onPress={() => router.push("/(tabs)/denemeler/serbest")} />
        </View>
        <View style={{ flexDirection: "row", gap: space.s2 }}>
          <ActionTile icon={Sparkles} title="Kişisel" subtitle={peLeft == null ? "Sana özel · sınırsız" : peLeft === 0 ? "Bugünkü hak doldu" : `Bugün ${peLeft} hak`} onPress={() => router.push("/(tabs)/denemeler/kisisel")} />
          <ActionTile icon={Archive} title="Çıkmış sınavlar" subtitle={solvablePast.length ? solvablePast.slice(0, 3).map(pastExamShortName).map((n) => n.replace(/ · \d{4}$/, "")).join(" · ") : "Resmî sınavlar"} onPress={() => router.push("/(tabs)/denemeler/cikmis")} />
        </View>
      </View>

      {/* Son sonuç */}
      <Card style={{ paddingVertical: 0 }}>
        {history.isPending ? (
          <Skeleton height={56} />
        ) : last ? (
          <ListRow
            title="Son sonucun"
            subtitle={`${last.title} · ${last.resultLocked ? "sonuç bekliyor" : `${fmtNet(last.score)} net`}${last.rank != null ? ` · ${last.rank}.` : ""}`}
            trailing={<Pressable accessibilityRole="button" accessibilityLabel="Deneme geçmişi" onPress={() => router.push("/(tabs)/ben/denemelerim")} hitSlop={8}><AppText variant="subhead" tone="accentInk">Geçmiş</AppText></Pressable>}
            chevron={false}
            divider={false}
            onPress={() => router.push({ pathname: "/deneme-sonuc/[attemptId]", params: { attemptId: last.attemptId } })}
          />
        ) : (
          <ListRow title="Henüz çözüm yok" subtitle="İlk denemeni çöz; sonuçların ve gelişimin burada görünür." chevron={false} divider={false} />
        )}
      </Card>
    </Screen>
  );
}

/** Devam eden çözüm: lacivert panel, kalan süre, ilerleme, tek düğme. */
function ActiveHero({ exam, now, onPress }: { exam: ExamListItem; now: number; onPress: () => void }) {
  const { colors, radius, space } = useTheme();
  const a = exam.my.active!;
  const left = a.deadlineAt ? Math.max(0, Math.round((Date.parse(a.deadlineAt) - now) / 1000)) : null;
  return (
    <View accessible accessibilityLabel={`Devam eden deneme ${exam.title}, ${a.answered} / ${exam.questionCount} cevaplandı${left != null ? `, kalan süre ${mmss(left)}` : ""}`} style={{ backgroundColor: colors.panel, borderRadius: radius.panel, padding: space.s4, gap: space.s2 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} />
        <AppText variant="label" tone="gold" style={{ letterSpacing: 1 }}>
          ŞİMDİ · DEVAM EDİYOR{a.role === "practice" ? " · TEKRAR ÇÖZÜM" : ""}
        </AppText>
      </View>
      <AppText variant="heading" tone="panelInk">
        {exam.title}
      </AppText>
      {left != null ? <BigNumber value={mmss(left)} suffix="kalan süre" /> : null}
      <AppText variant="bodySm" tone="panelSoft" style={{ fontVariant: ["tabular-nums"] }}>
        {a.answered} / {exam.questionCount} cevaplandı
      </AppText>
      <ProgressBar value={a.answered / Math.max(1, exam.questionCount)} tone="accent" height={6} label="Cevaplanan" />
      <Button title="Devam et" onPress={onPress} />
    </View>
  );
}

/** Sıradaki/canlı haftalık: bordo panel, sayaç, tek birincil düğme + "Kuralları gör" bağlantısı. */
function WeeklyHero({ exam, now, onPrimary, onRules }: { exam: ExamListItem; now: number; onPrimary: () => void; onRules: () => void }) {
  const { colors, radius, space } = useTheme();
  const open = exam.availability === "open";
  const left = open ? Date.parse(exam.endAt) - now : Date.parse(exam.startAt) - now;
  const primary = open ? (exam.myState === "completed" ? "Sonucunu gör" : exam.myState === "in_progress" ? "Devam et" : "Katıl") : null;
  return (
    <View accessible accessibilityLabel={`Şimdi: haftalık deneme ${exam.title}, ${fmtDate(exam.startAt)}${open ? `, pencere açık, ${countdown(left)} kaldı` : `, ${countdown(left)} kaldı`}`} style={{ backgroundColor: colors.live, borderRadius: radius.panel, padding: space.s4, gap: space.s2 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
        {open ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} /> : null}
        <AppText variant="label" tone={open ? "gold" : "panelSoft"} style={{ letterSpacing: 1, flex: 1 }}>
          {open ? "ŞİMDİ · CANLI" : "ŞİMDİ · HAFTALIK DENEME"}
        </AppText>
        <AppText variant="bodySm" tone="panelSoft">
          {open ? `${exam.participantCount.toLocaleString("tr-TR")} kişi içeride` : fmtDate(exam.startAt, { weekday: "long", hour: "2-digit", minute: "2-digit" })}
        </AppText>
      </View>
      <AppText variant="heading" tone="panelInk">
        {exam.title}
      </AppText>
      {open ? <BigNumber value={mmss(left / 1000)} suffix={`kalan · ${fmtDate(exam.endAt, { hour: "2-digit", minute: "2-digit" })}'a kadar`} /> : <WeeklyCountdown msLeft={left} />}
      <AppText variant="bodySm" tone="panelSoft">
        {open ? "Bir resmî çözüm hakkın var; süre teslimde durmaz." : `${examMeta(exam) ? `${examMeta(exam)} · ` : ""}${exam.participantCount.toLocaleString("tr-TR")} kişi katılacak · bitene kadar giriş açık`}
      </AppText>
      <View style={{ flexDirection: "row", gap: space.s2, alignItems: "center" }}>
        {primary ? <Button title={primary} style={{ flex: 1 }} onPress={onPrimary} /> : <RemindButton examId={exam.id} style={{ flex: 1 }} />}
        <Pressable accessibilityRole="button" onPress={onRules} style={{ minHeight: 52, paddingHorizontal: space.s4, alignItems: "center", justifyContent: "center" }}>
          <AppText variant="subhead" tone="panelInk">
            Kuralları gör
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

/** Haftalık 3 günden uzakken ya da yokken: çözülmemiş bir serbest deneme öner; o da yoksa kişisel deneme. */
function SuggestHero({ exam, weeklyHint, onStart, onPersonal }: { exam: ExamListItem | null; weeklyHint: ExamListItem | null; onStart: () => void; onPersonal: () => void }) {
  const { colors, radius, space } = useTheme();
  return (
    <View accessible accessibilityLabel={exam ? `Şimdi: ${exam.title} denemesine başla` : "Şimdi: kişisel deneme oluştur"} style={{ backgroundColor: colors.panel, borderRadius: radius.panel, padding: space.s4, gap: space.s2 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
        <AppText variant="label" tone="panelSoft" style={{ letterSpacing: 1, flex: 1 }}>
          {exam ? "ŞİMDİ · SERBEST DENEME" : "ŞİMDİ · KİŞİSEL DENEME"}
        </AppText>
        {weeklyHint ? (
          <AppText variant="bodySm" tone="panelSoft">
            Haftalık {fmtDate(weeklyHint.startAt, { weekday: "long", hour: "2-digit", minute: "2-digit" })}
          </AppText>
        ) : null}
      </View>
      <AppText variant="heading" tone="panelInk">
        {exam ? exam.title : "Sana özel bir deneme"}
      </AppText>
      {exam ? <BigNumber value={String(exam.questionCount)} suffix={`soru · ${exam.durationMinutes} dk · ${exam.participantCount.toLocaleString("tr-TR")} kişi çözdü`} /> : null}
      <AppText variant="bodySm" tone="panelSoft">
        {exam
          ? `${weeklyHint ? `${fmtDate(weeklyHint.startAt, { weekday: "long" })}'a kadar serbest denemeyle ölç.` : "Bu hafta haftalık deneme yok; serbest denemeyle ölç."} İlk çözüm resmîdir ve sıralamaya girer.`
          : "Bu hafta haftalık deneme yok; yanlışlarından ve zayıf konularından kurulan bir deneme çöz."}
      </AppText>
      <Button title={exam ? "Başla" : "Kişisel deneme oluştur"} onPress={exam ? onStart : onPersonal} />
    </View>
  );
}

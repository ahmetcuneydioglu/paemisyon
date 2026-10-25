import { useRouter } from "expo-router";
import { Archive, CalendarClock, Sparkles } from "lucide-react-native";
import { View } from "react-native";
import { ExamCard } from "@/components/domain";
import { AppText, Badge, Button, Card, EmptyState, ListRow, Notice, ProgressBar, Screen, SectionHeader, Skeleton } from "@/components/ui";
import { countdown, examKeys, fmtDate, fmtNet, heroFor, mmss, pastExamShortName, useDashboard, useExamHistory, useExams, usePastExams, useReminder, useSetReminder, type ExamCardAction, type ExamListItem } from "@/features/exams/queries";
import { useNow } from "@/lib/use-now";
import { useTheme } from "@/theme/ThemeProvider";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Deneme merkezi (Doc 50 M1, Figma "Denemeler V2"): "şu an" hero'su (devam eden > sıradaki
 * haftalık > sakin boşluk) + dört grup: Denemeler (serbest) · Haftalık deneme · Bana özel ·
 * Çıkmış sınavlar. Kurallar sunucuda; kart modeli `examCardModel` yalnız düğmeyi seçer.
 */
export default function DenemelerScreen() {
  const router = useRouter();
  const { colors, space } = useTheme();
  const exams = useExams();
  const dash = useDashboard();
  const past = usePastExams();
  const history = useExamHistory();
  const list = exams.data ?? [];
  const hero = heroFor(list);
  const now = useNow(1000, hero.kind !== "calm");

  const serbest = list.filter((e) => e.publishMode === "serbest");
  const haftalik = list.filter((e) => e.publishMode === "takvimli");
  const solvablePast = (past.data ?? []).filter((p) => p.tur === "resmi" && p.examId);
  const pe = dash.data?.personalExam;
  const peLeft = pe ? (pe.dailyAllowance == null ? null : Math.max(0, pe.dailyAllowance - pe.usedToday)) : null;
  const lastPersonal = history.data?.kisisel[0] ?? null;

  const act = (e: ExamListItem, a: ExamCardAction) => {
    switch (a.go.kind) {
      case "rules": return router.push({ pathname: "/(tabs)/denemeler/[examId]/kurallar", params: { examId: e.id, role: a.go.role ?? "" } });
      case "play": return router.push({ pathname: "/seans", params: { exam: e.id, role: a.go.role ?? "", title: e.title } });
      case "result": return router.push({ pathname: "/deneme-sonuc/[attemptId]", params: { attemptId: a.go.attemptId } });
      case "ranking": return router.push({ pathname: "/(tabs)/denemeler/siralama/[examId]", params: { examId: e.id, title: e.title } });
      case "paywall": return router.push("/paywall");
    }
  };

  return (
    <Screen>
      <View style={{ gap: space.s1 }}>
        <AppText variant="bodySm" tone="soft">
          PAEM hazırlığı
        </AppText>
        <AppText variant="title">Denemeler</AppText>
      </View>

      {exams.isPending ? (
        <Skeleton height={180} radiusKey="card" />
      ) : exams.isError ? (
        <Notice tone="error" title="Denemeler yüklenemedi">
          {exams.error.message}
        </Notice>
      ) : (
        <>
          {hero.kind === "active" ? <ActiveHero exam={hero.exam} now={now} onPress={() => act(hero.exam, { label: "", variant: "primary", go: { kind: "play", role: hero.exam.my.active?.role ?? undefined } })} /> : null}
          {hero.kind === "weekly" ? <WeeklyHero exam={hero.exam} now={now} onRules={() => act(hero.exam, { label: "", variant: "ghost", go: { kind: "rules" } })} /> : null}
          {hero.kind === "calm" ? (
            <Card tone="alt" style={{ gap: 4 }}>
              <AppText variant="subhead">Bu hafta deneme yok</AppText>
              <AppText variant="bodySm" tone="soft">
                Serbest denemelerden birini çöz; sıradaki haftalık deneme açıklanınca burada görünür.
              </AppText>
            </Card>
          ) : null}

          {list.length === 0 ? <EmptyState icon={CalendarClock} title="Henüz deneme yok" body="İlk deneme yayınlanınca burada görünür. Bu arada kişisel deneme oluşturabilirsin." action={<Button title="Kişisel deneme oluştur" variant="secondary" onPress={() => router.push("/(tabs)/denemeler/kisisel")} />} /> : null}

          {serbest.length > 0 ? (
            <View style={{ gap: space.s2 }}>
              <SectionHeader title="Denemeler" />
              {serbest.map((e) => (
                <ExamCard key={e.id} exam={e} onAction={(a) => act(e, a)} />
              ))}
            </View>
          ) : null}

          {haftalik.length > 0 ? (
            <View style={{ gap: space.s2 }}>
              <SectionHeader title="Haftalık deneme" action="Geçmiş" onAction={() => router.push("/(tabs)/performans/denemelerim")} />
              {haftalik.map((e) => (
                <ExamCard key={e.id} exam={e} onAction={(a) => act(e, a)} />
              ))}
            </View>
          ) : null}
        </>
      )}

      <View style={{ gap: space.s2 }}>
        <SectionHeader title="Bana özel" />
        <Card style={{ gap: space.s3 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
            <Sparkles color={colors.accentInk} size={18} strokeWidth={1.75} />
            <AppText variant="heading">Kişisel deneme</AppText>
          </View>
          <AppText variant="bodySm" tone="soft">
            Yanlışlarından ve zayıf konularından seçilen sorular; resmî PAEM dağılımıyla. Sıralamaya girmez, sana ölçüm.
          </AppText>
          {pe && peLeft != null ? (
            <AppText variant="bodySm" tone="soft">
              {peLeft === 0 ? "Bugünkü hakkını kullandın — yarın yenileniyor. Premium'da sınırsız." : `Bugün ${peLeft} hakkın var · ${pe.maxQuestions} soruya kadar`}
            </AppText>
          ) : null}
          <Button title={peLeft === 0 ? "Premium ile aç" : "Oluştur"} variant={peLeft === 0 ? "secondary" : "primary"} onPress={() => (peLeft === 0 ? router.push("/paywall") : router.push("/(tabs)/denemeler/kisisel"))} />
          {lastPersonal ? (
            <ListRow title={`Son: ${lastPersonal.completedAt ? fmtDate(lastPersonal.completedAt, { day: "numeric", month: "short" }) : "—"} · ${fmtNet(lastPersonal.score)} net`} subtitle="Sonucu gör" divider={false} onPress={() => router.push({ pathname: "/deneme-sonuc/[attemptId]", params: { attemptId: lastPersonal.attemptId } })} />
          ) : null}
        </Card>
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionHeader title="Çıkmış sınavlar" action={solvablePast.length > 0 ? "Tümü" : undefined} onAction={() => router.push("/(tabs)/denemeler/cikmis")} />
        <Card style={{ paddingVertical: 0 }}>
          {solvablePast.length === 0 ? (
            <ListRow title="PAEM çıkmış sorular" subtitle="Resmî sınavları sınav gibi çöz" leading={<Archive color={colors.accent} size={20} strokeWidth={1.75} />} divider={false} onPress={() => router.push("/(tabs)/denemeler/cikmis")} />
          ) : (
            solvablePast.slice(0, 3).map((p, i, arr) => (
              <ListRow key={p.slug} title={pastExamShortName(p)} subtitle={`${p.soruSayisi ?? 100} gerçek soru · sınav gibi çöz`} leading={<Archive color={colors.accent} size={20} strokeWidth={1.75} />} divider={i < arr.length - 1} onPress={() => router.push({ pathname: "/(tabs)/denemeler/cikmis/[slug]", params: { slug: p.slug } })} />
            ))
          )}
        </Card>
      </View>

      <Button title="Deneme geçmişin ›" variant="ghost" onPress={() => router.push("/(tabs)/performans/denemelerim")} />
    </Screen>
  );
}

/** Devam eden çözüm hero'su: lacivert panel, kalan süre, ilerleme, Devam et. */
function ActiveHero({ exam, now, onPress }: { exam: ExamListItem; now: number; onPress: () => void }) {
  const { colors, radius, space } = useTheme();
  const a = exam.my.active!;
  const left = a.deadlineAt ? Math.max(0, Math.round((Date.parse(a.deadlineAt) - now) / 1000)) : null;
  return (
    <View accessible accessibilityLabel={`Devam eden deneme ${exam.title}, ${a.answered} / ${exam.questionCount} cevaplandı${left != null ? `, kalan süre ${mmss(left)}` : ""}`} style={{ backgroundColor: colors.panel, borderRadius: radius.panel, padding: space.s4, gap: space.s2 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} />
        <AppText variant="label" tone="gold">
          Devam ediyor{a.role === "practice" ? " · tekrar çözüm" : ""}
        </AppText>
      </View>
      <AppText variant="heading" tone="panelInk">
        {exam.title}
      </AppText>
      {left != null ? (
        <AppText variant="display" tone="panelInk" style={{ fontVariant: ["tabular-nums"] }}>
          {mmss(left)}
        </AppText>
      ) : null}
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <AppText variant="bodySm" tone="panelSoft" style={{ fontVariant: ["tabular-nums"] }}>
          {a.answered} / {exam.questionCount} cevaplandı
        </AppText>
        <AppText variant="bodySm" tone="panelSoft">
          kalan süre
        </AppText>
      </View>
      <ProgressBar value={a.answered / Math.max(1, exam.questionCount)} tone="accent" height={6} label="Cevaplanan" />
      <Button title="Devam et" onPress={onPress} />
    </View>
  );
}

/** Sıradaki haftalık deneme hero'su: tarih rozeti, geri sayım, Hatırlat / Kuralları gör. */
function WeeklyHero({ exam, now, onRules }: { exam: ExamListItem; now: number; onRules: () => void }) {
  const qc = useQueryClient();
  const { colors, radius, space } = useTheme();
  const open = exam.availability === "open";
  const rem = useReminder(open ? null : exam.id);
  const setRem = useSetReminder(exam.id);
  const reminding = rem.data?.reminding ?? false;
  const left = Date.parse(exam.startAt) - now;
  const d = Math.floor(Math.max(0, left) / 86_400_000), h = Math.floor((Math.max(0, left) % 86_400_000) / 3_600_000);
  return (
    <View accessible accessibilityLabel={`Haftalık deneme ${exam.title}, ${fmtDate(exam.startAt)}${open ? ", pencere açık" : `, ${countdown(left)} kaldı`}`} style={{ backgroundColor: colors.panel, borderRadius: radius.panel, padding: space.s4, gap: space.s2 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
        <Badge tone="accent">{fmtDate(exam.startAt, { weekday: "long", hour: "2-digit", minute: "2-digit" })}</Badge>
        <AppText variant="label" tone="panelSoft">
          Haftalık deneme
        </AppText>
      </View>
      <AppText variant="heading" tone="panelInk">
        {exam.title}
      </AppText>
      {!open ? (
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
          <AppText variant="display" tone="panelInk" style={{ fontVariant: ["tabular-nums"] }}>
            {d}
          </AppText>
          <AppText variant="subhead" tone="panelSoft">
            gün
          </AppText>
          <AppText variant="display" tone="panelInk" style={{ fontVariant: ["tabular-nums"] }}>
            {h}
          </AppText>
          <AppText variant="subhead" tone="panelSoft">
            saat
          </AppText>
        </View>
      ) : null}
      <AppText variant="bodySm" tone="panelSoft">
        {exam.questionCount} soru · {exam.durationMinutes} dk · {exam.participantCount.toLocaleString("tr-TR")} {open ? "kişi katıldı" : "kişi katılacak"} · sınav bitene kadar giriş açık
      </AppText>
      <View style={{ flexDirection: "row", gap: space.s2 }}>
        {open ? (
          <Button title={exam.myState === "completed" ? "Sonucunu gör" : "Sınava katıl"} style={{ flex: 1 }} onPress={onRules} />
        ) : (
          <Button
            title={reminding ? "Hatırlatma açık" : "Hatırlat"}
            variant="secondary"
            style={{ flex: 1 }}
            loading={setRem.isPending}
            onPress={() => setRem.mutate(!reminding, { onSettled: () => void qc.invalidateQueries({ queryKey: examKeys.reminder(exam.id) }) })}
          />
        )}
        <Button title="Kurallar" variant="ghost" style={{ flex: 1 }} onPress={onRules} />
      </View>
      {setRem.isError ? (
        <AppText variant="bodySm" tone="danger">
          Hatırlatma ayarlanamadı.
        </AppText>
      ) : null}
    </View>
  );
}

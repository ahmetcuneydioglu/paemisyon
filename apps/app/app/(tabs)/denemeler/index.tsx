import { useRouter } from "expo-router";
import { Archive, CalendarClock, ClipboardList, Lock, Trophy } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { AppText, Badge, Button, Card, EmptyState, ListRow, Notice, ProgressBar, Screen, SectionHeader, Sheet, Skeleton } from "@/components/ui";
import { countdown, fmtDate, pastExamShortName, useDashboard, useExams, useMyAttempts, usePastExams, type ExamListItem } from "@/features/exams/queries";
import { useNow } from "@/lib/use-now";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Denemeler ana (Doc 25 Bölge 3): canlı takvim + prova arşivi + geçmişim. Kişisel deneme kartı
 * (hak sunucudan), çıkmış sınavlar girişi, CANLI (geri sayım), SIRADAKİ, YAKLAŞAN, GEÇMİŞ.
 * Durum `state` alanından; pencere ve premium kuralı sunucuda, hata kodları oynatıcıda okunur.
 */
export default function DenemelerScreen() {
  const router = useRouter();
  const { colors, space } = useTheme();
  const exams = useExams();
  const mine = useMyAttempts();
  const dash = useDashboard();
  const past = usePastExams();
  const now = useNow(1000, Boolean(exams.data?.some((e) => e.state !== "ended")));
  const [personalOpen, setPersonalOpen] = useState(false);
  const [pastPick, setPastPick] = useState<ExamListItem | null>(null);

  const list = exams.data ?? [];
  const live = list.filter((e) => e.state === "active");
  const upcoming = list.filter((e) => e.state === "upcoming").sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
  const next = upcoming[0] ?? null;
  const ended = list.filter((e) => e.state === "ended");
  const attempts = new Map((mine.data ?? []).filter((a) => a.exam).map((a) => [a.exam!.id, a]));
  const solvablePast = (past.data ?? []).filter((p) => p.tur === "resmi" && p.examId);
  const pe = dash.data?.personalExam;
  const peLeft = pe ? (pe.dailyAllowance == null ? null : Math.max(0, pe.dailyAllowance - pe.usedToday)) : null;

  const open = (e: ExamListItem) => {
    if (e.myAttempt?.status === "completed") router.push({ pathname: "/deneme-sonuc/[attemptId]", params: { attemptId: e.myAttempt.id } });
    else router.push({ pathname: "/seans", params: { exam: e.id } });
  };

  return (
    <>
      <Screen>
        <View style={{ gap: space.s1 }}>
          <AppText variant="bodySm" tone="soft">
            Prova, canlı sınav, çıkmış sorular
          </AppText>
          <AppText variant="title">Denemeler</AppText>
        </View>

        {/* Kişisel deneme: hak ve üst sınır sunucudan (me/dashboard.personalExam). */}
        <Card tone="accent">
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
            <ClipboardList color={colors.accentInk} size={20} strokeWidth={1.75} />
            <AppText variant="label" tone="accentInk">
              Bana özel deneme
            </AppText>
          </View>
          <AppText variant="subhead">Hedef sınavının dağılımıyla, süreli, sana özel karışım</AppText>
          <AppText variant="bodySm" tone="soft">
            {dash.isPending ? "Hak kontrol ediliyor…" : peLeft == null ? "Sınırsız · 120 soruya kadar" : peLeft === 0 ? "Bugünkü hakkın doldu; yarın yenilenir. Premium'da sınırsız." : `Bugün ${peLeft} hakkın var · ${pe?.maxQuestions ?? 25} soruya kadar`}
          </AppText>
          <Button title={peLeft === 0 ? "Premium'da sınırsız" : "Deneme kur"} onPress={() => (peLeft === 0 ? router.push("/paywall") : setPersonalOpen(true))} />
        </Card>

        {solvablePast.length > 0 ? (
          <Card style={{ paddingVertical: 0 }}>
            <ListRow
              title="Çıkmış sınav soruları"
              subtitle={`${solvablePast.slice(0, 2).map(pastExamShortName).join(" ve ")} · ${solvablePast.reduce((s, p) => s + (p.soruSayisi ?? 0), 0)} gerçek soru`}
              leading={<Archive color={colors.accent} size={20} strokeWidth={1.75} />}
              divider={false}
              onPress={() => router.push("/(tabs)/denemeler/cikmis")}
            />
          </Card>
        ) : null}

        {exams.isPending ? (
          <Skeleton height={200} radiusKey="card" />
        ) : exams.isError ? (
          <Notice tone="error" title="Denemeler yüklenemedi">
            {exams.error.message}
          </Notice>
        ) : (
          <>
            {live.map((e) => {
              const total = Date.parse(e.endAt) - Date.parse(e.startAt);
              const left = Date.parse(e.endAt) - now;
              const att = e.myAttempt;
              return (
                <Card key={e.id} style={{ borderColor: colors.accent, borderWidth: 1 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Badge tone="accent">Canlı</Badge>
                    {e.isPremium ? <Badge tone="warning">Premium</Badge> : null}
                  </View>
                  <AppText variant="heading">{e.title}</AppText>
                  <AppText variant="bodySm" tone="soft">
                    {e.questionCount} soru · {e.durationMinutes} dk · {e.participantCount} katılımcı
                  </AppText>
                  <ProgressBar value={total > 0 ? Math.max(0, Math.min(1, left / total)) : 0} tone="accent" height={5} />
                  <AppText variant="bodySm" tone="soft">
                    Pencere kapanmasına {countdown(left)}
                  </AppText>
                  <Button title={att?.status === "completed" ? "Sonucum" : att ? "Devam et" : "Sınavı başlat"} onPress={() => open(e)} />
                </Card>
              );
            })}

            {next ? (
              <View style={{ gap: space.s2 }}>
                <SectionHeader title="Sıradaki deneme" />
                <Card>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
                    <CalendarClock color={colors.accentInk} size={18} strokeWidth={1.75} />
                    <AppText variant="label" tone="accentInk">
                      {fmtDate(next.startAt)}
                    </AppText>
                  </View>
                  <AppText variant="heading">{next.title}</AppText>
                  {next.description ? (
                    <AppText variant="bodySm" tone="soft">
                      {next.description}
                    </AppText>
                  ) : null}
                  <AppText variant="stat" tone="accent">
                    {countdown(Date.parse(next.startAt) - now)}
                  </AppText>
                  <AppText variant="bodySm" tone="soft">
                    {next.questionCount} soru · {next.durationMinutes} dk{next.isPremium ? " · Premium" : ""}
                  </AppText>
                </Card>
              </View>
            ) : null}

            {upcoming.length > 1 ? (
              <View style={{ gap: space.s2 }}>
                <SectionHeader title="Yaklaşan" />
                <Card style={{ paddingVertical: 0 }}>
                  {upcoming.slice(1).map((e, i) => (
                    <ListRow key={e.id} title={e.title} subtitle={`${fmtDate(e.startAt)} · ${e.questionCount} soru`} chevron={false} divider={i < upcoming.length - 2} trailing={<Badge tone="neutral">Yakında</Badge>} />
                  ))}
                </Card>
              </View>
            ) : null}

            {live.length === 0 && upcoming.length === 0 ? <EmptyState icon={CalendarClock} title="Şu an yayında canlı deneme yok" body="Yeni deneme açılınca burada ve bildirimde görürsün. Bu arada kişisel deneme ya da çıkmış sorular." /> : null}

            {ended.length > 0 ? (
              <View style={{ gap: space.s2 }}>
                <SectionHeader title="Geçmiş" />
                <Card style={{ paddingVertical: 0 }}>
                  {ended.map((e, i) => {
                    const a = attempts.get(e.id);
                    const joined = a && a.status === "completed";
                    return (
                      <ListRow
                        key={e.id}
                        title={e.title}
                        subtitle={joined ? `Net ${a.score?.toFixed(2) ?? "—"} · D ${a.correctCount} · Y ${a.wrongCount} · B ${a.blankCount}` : `${fmtDate(e.startAt, { day: "numeric", month: "short" })} · ${e.participantCount} katılımcı${e.avgScore != null ? ` · ort. ${e.avgScore.toFixed(1)} net` : ""}`}
                        trailing={<Badge tone={joined ? "success" : "neutral"}>{joined ? "Katıldın" : "Sona erdi"}</Badge>}
                        divider={i < ended.length - 1}
                        onPress={() => setPastPick(e)}
                      />
                    );
                  })}
                </Card>
              </View>
            ) : null}
          </>
        )}
      </Screen>

      {/* Kişisel deneme kurulumu: sayı seçimi; üst sınırın üstü sunucu reddeder, burada kilit. */}
      <Sheet visible={personalOpen} onClose={() => setPersonalOpen(false)} title="Bana özel deneme">
        <AppText variant="bodySm" tone="soft">
          Süreli, cevap anahtarı sonunda. Konu dağılımı hedef sınavınla aynı.
        </AppText>
        {[25, 50, 100].map((n) => {
          const locked = pe != null && n > pe.maxQuestions;
          return (
            <ListRow
              key={n}
              title={`${n} soru`}
              subtitle={locked ? "Premium'da açılır" : `Yaklaşık ${Math.round((n * 75) / 60)} dk`}
              trailing={locked ? <Lock color={colors.inkSubtle} size={18} strokeWidth={1.75} /> : undefined}
              divider={n !== 100}
              onPress={
                locked
                  ? () => {
                      setPersonalOpen(false);
                      router.push("/paywall");
                    }
                  : () => {
                      setPersonalOpen(false);
                      router.push({ pathname: "/seans", params: { personalExam: "1", mode: "exam", count: String(n) } });
                    }
              }
            />
          );
        })}
      </Sheet>

      <Sheet visible={pastPick != null} onClose={() => setPastPick(null)} title={pastPick?.title ?? ""}>
        {pastPick ? (
          <>
            <AppText variant="bodySm" tone="soft">
              {fmtDate(pastPick.startAt)} · {pastPick.questionCount} soru · {pastPick.participantCount} katılımcı
            </AppText>
            {pastPick.archiveOpenAfterEnd ? (
              <Button
                title={pastPick.myArchiveAttempt ? "Arşivde tekrar çöz" : "Arşivde çöz"}
                onPress={() => {
                  const id = pastPick.id;
                  setPastPick(null);
                  router.push({ pathname: "/seans", params: { archiveExamId: id, mode: "exam", title: pastPick.title } });
                }}
              />
            ) : null}
            {attempts.get(pastPick.id)?.status === "completed" ? (
              <Button
                title="Sonucum"
                variant="secondary"
                onPress={() => {
                  const id = attempts.get(pastPick.id)!.attemptId;
                  setPastPick(null);
                  router.push({ pathname: "/deneme-sonuc/[attemptId]", params: { attemptId: id } });
                }}
              />
            ) : null}
            {pastPick.myArchiveAttempt ? (
              <Button
                title={`Arşiv sonucum · D ${pastPick.myArchiveAttempt.correctCount} Y ${pastPick.myArchiveAttempt.wrongCount}`}
                variant="secondary"
                onPress={() => {
                  const id = pastPick.myArchiveAttempt!.id;
                  setPastPick(null);
                  router.push({ pathname: "/deneme-sonuc/[attemptId]", params: { attemptId: id } });
                }}
              />
            ) : null}
            <Button
              title="Sıralama"
              variant="ghost"
              onPress={() => {
                const id = pastPick.id;
                setPastPick(null);
                router.push({ pathname: "/(tabs)/denemeler/siralama/[examId]", params: { examId: id, title: pastPick.title } });
              }}
            />
            {!pastPick.archiveOpenAfterEnd && !attempts.get(pastPick.id) ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Trophy color={colors.inkSubtle} size={16} strokeWidth={1.75} />
                <AppText variant="bodySm" tone="subtle">
                  Bu deneme arşive açılmadı; yalnız sıralama görülebilir.
                </AppText>
              </View>
            ) : null}
          </>
        ) : null}
      </Sheet>
    </>
  );
}

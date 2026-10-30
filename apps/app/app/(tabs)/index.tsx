import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Bell } from "lucide-react-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ExamContextLine, ForYouList, LiveExamPanel, NextStepCard, RouteList, WeekSummaryLine } from "@/components/domain";
import { AppText, Button, Card, IconBadgeButton, Notice, Screen, Skeleton } from "@/components/ui";
import { homeKeys, todayIndexTr, useCoachBrief, useMe, type TodayTaskAction, type WeekDayState } from "@/features/home/queries";
import { useExams } from "@/features/exams/queries";
import { recordNotificationEvent, useUnreadCount } from "@/features/notifications/queries";
import { routeToHref } from "@/lib/deep-links";
import { ApiError, NetworkError } from "@/lib/api";
import { useNow } from "@/lib/use-now";
import { flushQueue, usePendingAnswers } from "@/lib/offline-queue";
import { useTheme } from "@/theme/ThemeProvider";

/** Eski sunucu `days` vermezse: aktif gün sayısından türetilmiş yedek çizelge. */
function yedekGunler(activeDays: number, todayIndex: number): WeekDayState[] {
  return Array.from({ length: 7 }, (_, i) => (i === todayIndex ? "today" : i < todayIndex ? (i < activeDays ? "done" : "missed") : "future"));
}

function selam(hour: number): string {
  if (hour < 6) return "İyi geceler";
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

/**
 * Bugün v3 (Doc 49/16): tek adım ana sayfa. Beş sabit blok — bağlam satırı, Sıradaki (tek birincil
 * düğme), Bugünün rotası (2–6), Senin için (≤3), Bu hafta. Karar SUNUCUDA (`homeV3`); eski
 * sunucuda `todayTask`'a düşer. Kapı yok; gezinme sekmelerde ve Çalış'ta.
 */
export default function BugunScreen() {
  const router = useRouter();
  const examsQ = useExams();
  const unread = useUnreadCount();
  const liveExam = (examsQ.data ?? []).find((e) => e.publishMode === "takvimli" && e.availability === "open") ?? null;
  const liveNow = useNow(1000, Boolean(liveExam));
  const qc = useQueryClient();
  const { space } = useTheme();
  const insets = useSafeAreaInsets();
  const me = useMe();
  const brief = useCoachBrief();
  const pending = usePendingAnswers();

  const offline = brief.isError && brief.error instanceof NetworkError;
  const data = brief.data;
  const announcement = data?.cards?.find((c) => c.type === "announcement") ?? null;
  const task = data?.todayTask ?? null;
  const v3 = data?.homeV3 ?? null;
  const weekly = data?.gamification?.weekly;
  const days = weekly?.days ?? yedekGunler(weekly?.activeDays ?? 0, todayIndexTr());
  const goal = data?.today?.goal ?? null;
  const answered = data?.today?.answered ?? 0;
  const trHour = Number(new Date().toLocaleString("tr-TR", { hour: "2-digit", hour12: false, timeZone: "Europe/Istanbul" }).slice(0, 2));

  /** Sunucunun verdiği eylemi çalıştırır — tek yer (Doc 48: istemci kural bilmez). */
  function run(action: TodayTaskAction) {
    if (action.type === "open_summary") {
      const slug = action.route?.replace(/^\/ozet\//, "") ?? "";
      if (slug) router.push({ pathname: "/ozet/[slug]", params: { slug } });
      return;
    }
    if (action.type === "open_exams") {
      const m = action.route?.match(/^\/denemeler\/([0-9a-fA-F-]{36})$/);
      if (m) router.push({ pathname: "/(tabs)/denemeler/[examId]/kurallar", params: { examId: m[1]!, role: "" } });
      else router.push("/(tabs)/denemeler");
      return;
    }
    if (action.type === "resume_session" && action.sessionId) {
      router.push({ pathname: "/seans", params: { resume: action.sessionId, source: action.source } });
      return;
    }
    router.push({
      pathname: "/seans",
      params: {
        source: action.source,
        count: String(action.count ?? 10),
        recipe: action.recipe ?? "",
        focusKind: action.focus?.kind ?? "coach",
        courseId: action.focus?.courseId ?? "",
        topicId: action.focus?.topicId ?? "",
        ...(action.focus?.kind === "wrongs" ? { mode: "review" } : {}),
        ...(action.fromBookmarks ? { fromBookmarks: "1", title: "Favoriler" } : {}),
        ...(action.articleNos && action.articleNos.length > 0 ? { articleNos: action.articleNos.join(","), title: action.focus?.label ?? "" } : {}),
      },
    });
  }

  // Sıradaki: v3 varsa sunucunun adımı; yoksa Doc 48 görev kartından türet (eski sunucu).
  const next = v3?.nextStep ?? (task ? { kind: task.kind === "resume" ? ("resume" as const) : ("questions" as const), eyebrow: "SIRADAKİ", title: task.title, reason: task.reason, badge: null, estimateMin: null, action: task.action } : null);
  const rotaSatirlari = (v3?.route ?? []).map((r) => ({ key: r.key, label: r.label, detail: r.detail, estimateMin: r.estimateMin ?? null, done: r.done, onPress: r.action ? () => run(r.action!) : null }));
  const seninIcin = (v3?.forYou ?? []).map((f, i) => ({ key: `${f.kind}:${i}`, label: f.label, ctaLabel: f.ctaLabel, onPress: () => run(f.action) }));

  return (
    <Screen inset="none" style={{ paddingTop: insets.top + space.s2, paddingBottom: 120, gap: space.s5 }}>
      {/* Üst satır: selam + zil (Doc 52 §9; rozet okunmamış sayısı). */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.s3, minHeight: 44 }}>
        <AppText variant="bodySm" tone="soft" accessibilityRole="header" style={{ flex: 1 }} numberOfLines={1}>
          {me.data?.displayName ? `${selam(trHour)}, ${me.data.displayName}` : selam(trHour)}
        </AppText>
        <IconBadgeButton icon={Bell} label="Bildirimler" count={unread.data ?? 0} onPress={() => router.push("/bildirimler")} style={{ marginRight: -10 }} />
      </View>

      {/* Tek şerit: kuyruk > duyuru > çevrimdışı/hata (yalnız gerekince). */}
      {pending > 0 ? (
        <Card tone="alt" style={{ gap: space.s2 }}>
          <AppText variant="subhead">{pending} cevap gönderilmeyi bekliyor</AppText>
          <AppText variant="bodySm" tone="soft">
            Çevrimdışı çözdüklerin cihazda; bağlantı gelince kendiliğinden gider.
          </AppText>
          <Button title="Şimdi gönder" variant="secondary" onPress={() => void flushQueue().then(() => qc.invalidateQueries({ queryKey: homeKeys.brief }))} />
        </Card>
      ) : announcement ? (
        <Card tone="accent" style={{ gap: space.s2 }}>
          <AppText variant="label" tone="accentInk">
            DUYURU
          </AppText>
          <AppText variant="subhead">{announcement.title}</AppText>
          {announcement.body ? (
            <AppText variant="bodySm" tone="soft">
              {announcement.body}
            </AppText>
          ) : null}
          {announcement.cta ? (
            <Button
              title={announcement.cta.label}
              variant="secondary"
              onPress={() => {
                const id = announcement.meta?.notificationId;
                if (typeof id === "string") void recordNotificationEvent(id, "clicked", "inbox");
                router.push(routeToHref(announcement.cta?.route) as never);
              }}
            />
          ) : null}
        </Card>
      ) : offline ? (
        <Notice tone="warning" title="Çevrimdışısın">
          {data ? "Son bilinen durum gösteriliyor; yeni tur için bağlantı gerekiyor." : "Bağlantı gelince Bugün yüklenecek."}
        </Notice>
      ) : brief.isError ? (
        <Notice tone="error" title="Koç yüklenemedi">
          {brief.error instanceof ApiError ? `${brief.error.message} (${brief.error.code})` : brief.error.message}
        </Notice>
      ) : null}

      {!data && brief.isPending ? (
        <View style={{ gap: space.s3 }}>
          <Skeleton height={60} radiusKey="control" />
          <Skeleton height={229} radiusKey="card" />
          <Skeleton height={200} radiusKey="card" />
        </View>
      ) : data ? (
        <>
          {/* 1) Bağlam satırı: geri sayım küçük ama görünür (karar 1) + hafta çizelgesi. */}
          <ExamContextLine
            daysLeft={data.exam.daysLeft}
            examName={data.exam.name}
            activeDays={weekly?.activeDays ?? days.filter((d) => d === "done").length}
            goalDays={weekly?.goalDays ?? 5}
            days={days}
            onPickDate={() => router.push("/(tabs)/ben/ayarlar")}
          />

          {/* Canlı haftalık deneme penceresi açıkken (Doc 50) sıradaki kartın yerine geçer. */}
          {liveExam ? (
            <LiveExamPanel
              exam={liveExam}
              now={liveNow}
              paemLine={null}
              onJoin={() => router.push(liveExam.myState === "in_progress" ? { pathname: "/seans", params: { exam: liveExam.id, role: liveExam.my?.active?.role ?? "", title: liveExam.title } } : { pathname: "/(tabs)/denemeler/[examId]/kurallar", params: { examId: liveExam.id, role: "" } })}
              onRules={() => router.push({ pathname: "/(tabs)/denemeler/[examId]/kurallar", params: { examId: liveExam.id, role: "" } })}
              onResult={() => liveExam.my?.official && router.push({ pathname: "/deneme-sonuc/[attemptId]", params: { attemptId: liveExam.my.official.attemptId } })}
            />
          ) : next ? (
            /* 2) Sıradaki — ekranın tek birincil düğmesi. */
            <NextStepCard
              eyebrow={next.eyebrow}
              title={next.title}
              reason={next.reason}
              badge={next.badge}
              ctaLabel={next.action.type === "resume_session" ? "Devam et" : next.kind === "done" ? next.action.label : "Başla"}
              onPress={() => run(next.action)}
              disabled={offline && next.action.type !== "resume_session"}
              secondary={task?.kind === "resume" && task.finishSessionId ? { label: "Şimdilik bitir, sonucu gör", onPress: () => router.push({ pathname: "/sonuc", params: { sessionId: task.finishSessionId! } }) } : null}
            />
          ) : null}

          {/* 3) Bugünün rotası (2–6 madde, sayı koçun). */}
          {rotaSatirlari.length > 0 ? (
            <RouteList
              rows={rotaSatirlari}
              footer={goal != null ? `Günlük hedef ${goal} soru · ${Math.min(answered, goal)}` : null}
              onPlan={() => router.push(data.plan ? "/planim" : { pathname: "/planim", params: { kur: "1" } })}
            />
          ) : null}

          {/* 4) Senin için (≤3). */}
          <ForYouList rows={seninIcin} />

          {/* 5) Bu hafta (eski sunucuda `week` yok → gizli). */}
          {v3?.week ? (
            <WeekSummaryLine
              left={`${v3.week.solved} soru · ${v3.week.activeDays}/${v3.week.goalDays} gün`}
              right={v3.week.rankName}
            />
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

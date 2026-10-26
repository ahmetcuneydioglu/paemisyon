import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Bell, ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { Animated, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CountdownHero,
  CourseTile,
  LiveExamPanel,
  PlanShiftList,
  TaskHero,
  WeekStrip7,
} from "@/components/domain";
import {
  ActionBar,
  AppText,
  Badge,
  Button,
  Card,
  IconBadgeButton,
  ListRow,
  Notice,
  Skeleton,
} from "@/components/ui";
import { FocusSheet } from "@/features/home/focus-sheet";
import {
  homeKeys,
  todayIndexTr,
  useCoachBrief,
  useMe,
  type TodayTaskAction,
  type WeekDayState,
} from "@/features/home/queries";
import { useExams } from "@/features/exams/queries";
import { recordNotificationEvent, useUnreadCount } from "@/features/notifications/queries";
import { routeToHref } from "@/lib/deep-links";
import { ApiError, NetworkError } from "@/lib/api";
import { useNow } from "@/lib/use-now";
import { flushQueue, usePendingAnswers } from "@/lib/offline-queue";
import { useTheme } from "@/theme/ThemeProvider";
import { fontFamily } from "@/theme/tokens";

/** Hero'nun (sayı kartı) başlığa çöktüğü kaydırma aralığı (pt). */
const COLLAPSE_FROM = 150;
const COLLAPSE_TO = 230;

function tarihEtiketi(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        timeZone: "UTC",
      });
}

/** Eski sunucu `weekly.days` vermiyorsa aktif gün sayısından türetilen çizelge. */
function yedekGunler(activeDays: number, todayIndex: number): WeekDayState[] {
  return Array.from({ length: 7 }, (_, i) =>
    i < activeDays
      ? "done"
      : i === todayIndex
        ? "today"
        : i < todayIndex
          ? "missed"
          : "future",
  );
}

/**
 * Bugün — v4 "Nöbet defteri" yerleşimi (Doc 49/13 §2): marka + seri, serif selam, lacivert
 * geri sayım afişi, 7 günlük nöbet çizelgesi, günlük hedef satırı, düğmesiz görev kartı,
 * haftalık plan vardiya listesi, çizgili Hazırlık/Derslerin, kapanış cümlesi. Tek birincil
 * eylem alttaki sabit çubukta; sekiz görev durumu sunucunun `todayTask.kind` alanından.
 * Kaydırınca afiş ince başlığa çöker. Çevrimdışı: son bilinen brief + devre dışı CTA.
 */
export default function BugunScreen() {
  const router = useRouter();
  // Canlı haftalık deneme (Doc 50, 26 Eki): pencere açıkken PAEM sayacının yerine geçer.
  const examsQ = useExams();
  const unread = useUnreadCount();
  const liveExam = (examsQ.data ?? []).find((e) => e.publishMode === "takvimli" && e.availability === "open") ?? null;
  const liveNow = useNow(1000, Boolean(liveExam));
  const qc = useQueryClient();
  const { colors, space } = useTheme();
  const insets = useSafeAreaInsets();
  const me = useMe();
  const brief = useCoachBrief();
  const [focusOpen, setFocusOpen] = useState(false);
  const pending = usePendingAnswers();
  const [scrollY] = useState(() => new Animated.Value(0));

  const offline = brief.isError && brief.error instanceof NetworkError;
  const data = brief.data; // hata durumunda da son bilinen veri (react-query önbelleği)
  // Kampanya duyurusu (Doc 52 F2 `createInAppBanner`): sunucu koç kartı olarak verir; dokununca okundu sayılır.
  const announcement = data?.cards?.find((c) => c.type === "announcement") ?? null;
  const task = data?.todayTask ?? null;
  const weekly = data?.gamification?.weekly;
  const days =
    weekly?.days ?? yedekGunler(weekly?.activeDays ?? 0, todayIndexTr());
  const streak = data?.today?.streak?.current ?? 0;
  const goal = data?.today?.goal ?? task?.progress?.total ?? null;
  const answered = data?.today?.answered ?? task?.progress?.answered ?? 0;

  // Çöken başlık: sayı kartı yukarı kayınca ince "184 gün · PAEM 2027" satırı belirir.
  const headerOpacity = scrollY.interpolate({
    inputRange: [COLLAPSE_FROM, COLLAPSE_TO],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const headerHeight = insets.top + 44;

  function run(action: TodayTaskAction) {
    if (action.type === "open_exams") {
      router.push("/(tabs)/denemeler");
      return;
    }
    if (action.type === "resume_session" && action.sessionId) {
      router.push({
        pathname: "/seans",
        params: { resume: action.sessionId, source: action.source },
      });
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
      },
    });
  }

  const serif400 = { fontFamily: fontFamily.display[400] } as const;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{
          paddingHorizontal: space.screenGutter,
          paddingTop: insets.top + space.s4,
          paddingBottom: 150,
          gap: space.s5,
        }}
      >
        {/* Üst satır: marka sözcüğü + seri + zil (Doc 52 §9; rozet okunmamış sayısı). */}
        <View style={{ gap: space.s1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: space.s3,
              marginVertical: -10,
            }}
          >
            <AppText variant="brand" accessibilityRole="header" style={{ flex: 1 }}>
              paemisyon
            </AppText>
            {streak > 0 ? (
              <AppText variant="bodySm" tone="soft">
                Seri · {streak} gün
              </AppText>
            ) : null}
            <IconBadgeButton
              icon={Bell}
              label="Bildirimler"
              count={unread.data ?? 0}
              onPress={() => router.push("/bildirimler")}
              style={{ marginRight: -10 }}
            />
          </View>
          <AppText variant="brand" style={serif400}>
            {me.data?.displayName
              ? `Merhaba, ${me.data.displayName}`
              : "Merhaba"}
          </AppText>
        </View>

        {pending > 0 ? (
          <Card tone="alt" style={{ gap: space.s2 }}>
            <AppText variant="subhead">
              {pending} cevap gönderilmeyi bekliyor
            </AppText>
            <AppText variant="bodySm" tone="soft">
              Çevrimdışı çözdüklerin cihazda; bağlantı gelince kendiliğinden
              gider.
            </AppText>
            <Button
              title="Şimdi gönder"
              variant="secondary"
              onPress={() =>
                void flushQueue().then(() =>
                  qc.invalidateQueries({ queryKey: homeKeys.brief }),
                )
              }
            />
          </Card>
        ) : null}
        {announcement ? (
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
        ) : null}
        {offline ? (
          <Notice tone="warning" title="Çevrimdışısın">
            {data
              ? "Son bilinen durum gösteriliyor; yeni tur için bağlantı gerekiyor."
              : "Bağlantı gelince Bugün yüklenecek."}
          </Notice>
        ) : brief.isError ? (
          <Notice tone="error" title="Koç yüklenemedi">
            {brief.error instanceof ApiError
              ? `${brief.error.message} (${brief.error.code})`
              : brief.error.message}
          </Notice>
        ) : null}

        {!data && brief.isPending ? (
          <View style={{ gap: space.s3 }}>
            <Skeleton height={180} radiusKey="card" />
            <Skeleton height={72} radiusKey="control" />
            <Skeleton height={140} radiusKey="card" />
          </View>
        ) : data ? (
          <>
            {liveExam ? (
              <LiveExamPanel
                exam={liveExam}
                now={liveNow}
                paemLine={data.exam.daysLeft != null ? `${data.exam.name ?? "PAEM"}'e ${data.exam.daysLeft} gün.` : null}
                onJoin={() => router.push(liveExam.myState === "in_progress" ? { pathname: "/seans", params: { exam: liveExam.id, role: liveExam.my?.active?.role ?? "", title: liveExam.title } } : { pathname: "/(tabs)/denemeler/[examId]/kurallar", params: { examId: liveExam.id, role: "" } })}
                onRules={() => router.push({ pathname: "/(tabs)/denemeler/[examId]/kurallar", params: { examId: liveExam.id, role: "" } })}
                onResult={() => liveExam.my?.official && router.push({ pathname: "/deneme-sonuc/[attemptId]", params: { attemptId: liveExam.my.official.attemptId } })}
              />
            ) : (
              <CountdownHero
                examName={data.exam.name}
                examDateLabel={tarihEtiketi(data.exam.date)}
                daysLeft={data.exam.daysLeft}
                activeDays={
                  weekly?.activeDays ?? days.filter((d) => d === "done").length
                }
                goalDays={weekly?.goalDays ?? 5}
                onPickDate={() => router.push("/(tabs)/ben/ayarlar")}
              />
            )}

            <WeekStrip7 days={days} />

            {goal != null ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: space.s3,
                }}
              >
                <View
                  style={{
                    width: 2,
                    alignSelf: "stretch",
                    backgroundColor: colors.accent,
                  }}
                />
                <AppText variant="bodySm" tone="soft">
                  Bugünkü hedef {Math.min(answered, goal)}/{goal} soru
                </AppText>
              </View>
            ) : null}

            {task ? (
              <View style={{ gap: space.s2 }}>
                <TaskHero
                  kind={task.kind}
                  title={task.title}
                  body={task.reason}
                  progress={
                    task.kind === "resume" && task.progress
                      ? {
                          done: task.progress.answered,
                          total: task.progress.total,
                        }
                      : null
                  }
                  compact
                />
                {task.kind === "resume" && task.finishSessionId ? (
                  <Button
                    title="Şimdilik bitir, sonucu gör"
                    variant="ghost"
                    onPress={() =>
                      router.push({
                        pathname: "/sonuc",
                        params: { sessionId: task.finishSessionId! },
                      })
                    }
                  />
                ) : null}
                {task.secondary ? (
                  <ListRow
                    title={task.secondary.title}
                    subtitle={task.secondary.subtitle}
                    divider
                    onPress={() => run(task.secondary!.action)}
                    trailing={
                      <AppText variant="subhead" tone="accentInk">
                        {task.secondary.actionLabel}
                      </AppText>
                    }
                    chevron={false}
                  />
                ) : null}
              </View>
            ) : null}

            {/* Haftalık plan (Doc 49/12 F8-A) — vardiya listesi; dönüş gününde gizli. */}
            {task?.kind !== "comeback" ? (
              <PlanShiftList
                plan={data.plan ?? null}
                offer={Boolean(
                  data.cards?.some((c) => c.type === "plan_offer"),
                )}
                onOpen={() =>
                  router.push(
                    data.plan
                      ? "/planim"
                      : { pathname: "/planim", params: { kur: "1" } },
                  )
                }
                onStart={(item) => {
                  if (item.kind === "topic" && item.topicId) {
                    router.push({
                      pathname: "/seans",
                      params: {
                        source: "plan",
                        count: String(
                          Math.max(5, Math.min(20, item.remainingMinutes)),
                        ),
                        focusKind: "topic",
                        topicId: item.topicId,
                        courseId: "",
                        recipe: "",
                      },
                    });
                  } else if (item.kind === "review") {
                    router.push({
                      pathname: "/seans",
                      params: {
                        mode: "review",
                        source: "plan",
                        count: "10",
                        focusKind: "wrongs",
                        courseId: "",
                        topicId: "",
                        recipe: "",
                      },
                    });
                  } else {
                    router.push("/(tabs)/denemeler");
                  }
                }}
              />
            ) : null}

            {/* Hazırlık (Doc 48/02 karar 1–2): zayıf konular başta; dönüşte ve ölçüm yokken gizli. Çizgili liste, kart yok. */}
            {data.readiness.weakest.length > 0 ? (
              <View style={{ gap: space.s2 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <AppText variant="heading" accessibilityRole="header">
                    Hazırlık
                  </AppText>
                  {data.readiness.weakest.length > 0 ? (
                    <AppText variant="bodySm" tone="subtle">
                      En zayıf {data.readiness.weakest.length} konu
                    </AppText>
                  ) : null}
                </View>
                {data.readiness.weakest.length > 0 ? (
                  <View>
                    {data.readiness.weakest.map((t, i) => {
                      // Ünite reçetesi (Doc 53 F5): en zayıf konunun satırı özete ya da ünite maddeleriyle seansa gider.
                      const r = data.unitRecipe && data.unitRecipe.unit.topicId === t.topicId ? data.unitRecipe : null;
                      const uniteAd = r ? r.unit.title.split(" — ")[0] : null;
                      const ozete = r?.kind === "summary_then_questions";
                      return (
                        <ListRow
                          key={t.topicId}
                          title={t.name}
                          subtitle={
                            r
                              ? `${t.courseName} · en zayıf ünite ${uniteAd}${r.unit.accuracyPct != null ? ` (%${r.unit.accuracyPct})` : ""}`
                              : `${t.courseName} · %${Math.round(t.accuracy * 100)} doğru`
                          }
                          divider={i < data.readiness.weakest.length - 1}
                          chevron={false}
                          trailing={
                            <AppText variant="subhead" tone="accentInk">
                              {ozete ? "Özeti oku ›" : "10 soru ›"}
                            </AppText>
                          }
                          onPress={() =>
                            ozete && r
                              ? router.push({ pathname: "/ozet/[slug]", params: { slug: r.unit.slug, title: uniteAd ?? "" } })
                              : router.push({
                                  pathname: "/seans",
                                  params: {
                                    source: "home_weak_topic",
                                    count: "10",
                                    focusKind: "topic",
                                    topicId: t.topicId,
                                    courseId: "",
                                    recipe: "",
                                    ...(r ? { articleNos: r.session.articleNos.join(","), title: `${t.name} · ${uniteAd}` } : {}),
                                  },
                                })
                          }
                        />
                      );
                    })}
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={{ gap: space.s2 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <AppText variant="heading" accessibilityRole="header">
                  Derslerin
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push("/(tabs)/kutuphane")}
                  hitSlop={8}
                >
                  <AppText variant="subhead" tone="accentInk">
                    Tüm dersler
                  </AppText>
                </Pressable>
              </View>
              {data.readiness.courses.length > 0 ? (
                <View>
                  {data.readiness.courses.map((c) => (
                    <CourseTile
                      key={c.courseId}
                      name={c.name}
                      icon={c.icon}
                      accuracy={c.accuracy}
                      solved={c.solved}
                      state={c.state}
                      onPress={() =>
                        router.push({
                          pathname: "/seans",
                          params: {
                            source: "home_suggestion",
                            count: "10",
                            focusKind: "course",
                            courseId: c.courseId,
                            topicId: "",
                            recipe: "",
                          },
                        })
                      }
                    />
                  ))}
                </View>
              ) : (
                <AppText variant="bodySm" tone="soft">
                  İlk turdan sonra dersler ve doğruluk burada görünür. Sıfır
                  yazmıyoruz; henüz ölçülmedi.
                </AppText>
              )}
            </View>

            <AppText
              variant="brand"
              tone="soft"
              style={[serif400, { paddingTop: space.s2 }]}
            >
              Az ama her gün.
            </AppText>
          </>
        ) : null}
      </Animated.ScrollView>

      {/* Çöken başlık: hero kaydırılınca ince satır (Doc 49/13 §2 madde 7). */}
      {data?.exam.daysLeft != null ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: headerHeight,
            paddingTop: insets.top,
            paddingHorizontal: space.screenGutter,
            justifyContent: "center",
            backgroundColor: colors.bg,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.line,
            opacity: headerOpacity,
          }}
        >
          <AppText
            variant="brand"
            tone="accentInk"
            style={serif400}
            numberOfLines={1}
          >
            {data.exam.daysLeft} gün
            {data.exam.name ? ` · ${data.exam.name}` : ""}
          </AppText>
        </Animated.View>
      ) : null}

      {/* Yerleşim B: sabit eylem çubuğu — odak düğmesi + sunucunun verdiği birincil eylem (ekranda tek "Başla"). */}
      {task ? (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
          <BugunActionBar
            label={task.action.label}
            kind={task.kind}
            focusLabel={
              data?.focus?.kind && data.focus.kind !== "coach"
                ? (data.focus.label ?? "Seçili")
                : "Koç"
            }
            disabled={offline && task.action.type !== "resume_session"}
            onFocus={() => setFocusOpen(true)}
            onPress={() => run(task.action)}
          />
        </View>
      ) : null}

      <FocusSheet
        visible={focusOpen}
        onClose={() => {
          setFocusOpen(false);
          void qc.invalidateQueries({ queryKey: homeKeys.brief });
        }}
        focus={data?.focus ?? null}
        moduleId={me.data?.preferredModule?.id}
        unresolvedWrongCount={data?.readiness.unresolvedWrongCount ?? 0}
        startLabel={task?.action.label ?? "Başlat"}
        onStart={() => {
          setFocusOpen(false);
          if (task) run(task.action);
        }}
      />
    </View>
  );
}

function BugunActionBar({
  label,
  kind,
  focusLabel,
  disabled,
  onFocus,
  onPress,
}: {
  label: string;
  kind: string;
  focusLabel: string;
  disabled: boolean;
  onFocus: () => void;
  onPress: () => void;
}) {
  const { colors, radius, space } = useTheme();
  const showFocus = kind !== "resume" && kind !== "exam";
  return (
    <View
      style={{
        paddingHorizontal: space.screenGutter,
        paddingTop: space.s3,
        paddingBottom: space.s3,
        backgroundColor: colors.bg,
        borderTopWidth: 0.5,
        borderTopColor: colors.line,
        flexDirection: "row",
        gap: space.s2,
      }}
    >
      {showFocus ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Odak: ${focusLabel}`}
          onPress={onFocus}
          style={({ pressed }) => ({
            minHeight: 54,
            minWidth: 92,
            borderRadius: radius.card,
            borderWidth: 0.5,
            borderColor: colors.line,
            backgroundColor: colors.surface,
            paddingHorizontal: 12,
            justifyContent: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <AppText variant="label" tone="subtle">
            Odak
          </AppText>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <AppText
              variant="subhead"
              numberOfLines={1}
              style={{ maxWidth: 110 }}
            >
              {focusLabel}
            </AppText>
            <ChevronDown color={colors.inkSoft} size={16} strokeWidth={2} />
          </View>
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }}>
        <ActionBar
          title={label}
          onPress={onPress}
          variant={kind === "done" ? "secondary" : "primary"}
        />
      </View>
      {disabled ? (
        <Badge
          tone="warning"
          style={{ position: "absolute", top: -10, right: space.screenGutter }}
        >
          Çevrimdışı
        </Badge>
      ) : null}
    </View>
  );
}

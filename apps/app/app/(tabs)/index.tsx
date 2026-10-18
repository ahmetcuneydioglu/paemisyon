import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { CountdownHeader, CourseTile, PlanWeekCard, TaskHero } from "@/components/domain";
import { ActionBar, AppText, Badge, Button, Card, ListRow, Notice, Screen, Skeleton } from "@/components/ui";
import { FocusSheet } from "@/features/home/focus-sheet";
import { homeKeys, todayIndexTr, useCoachBrief, useMe, type TodayTaskAction } from "@/features/home/queries";
import { ApiError, NetworkError } from "@/lib/api";
import { flushQueue, usePendingAnswers } from "@/lib/offline-queue";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Bugün — Yerleşim B (Doc 48/02 kararı): görev kartı bağlamı anlatır; birincil eylem ve odak
 * sekme çubuğunun üstündeki sabit çubukta. Sekiz durum sunucunun `todayTask.kind` alanından
 * çizilir; istemci kural bilmez. Çevrimdışı: son bilinen brief + devre dışı CTA ve nedeni.
 */
export default function BugunScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { colors, space } = useTheme();
  const me = useMe();
  const brief = useCoachBrief();
  const [focusOpen, setFocusOpen] = useState(false);
  const pending = usePendingAnswers();

  const offline = brief.isError && brief.error instanceof NetworkError;
  const data = brief.data; // hata durumunda da son bilinen veri (react-query önbelleği)
  const task = data?.todayTask ?? null;

  const selamlama = (() => {
    const h = new Date().getHours();
    return h < 6 ? "İyi nöbetler" : h < 12 ? "Günaydın" : h < 18 ? "İyi günler" : "İyi akşamlar";
  })();

  function run(action: TodayTaskAction) {
    if (action.type === "open_exams") {
      router.push("/(tabs)/denemeler");
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
      },
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Screen style={{ paddingBottom: 140 }}>
        <View style={{ gap: space.s1 }}>
          <AppText variant="bodySm" tone="soft">
            {selamlama}
            {me.data?.displayName ? `, ${me.data.displayName}` : ""}
          </AppText>
          <AppText variant="title">Bugün</AppText>
        </View>

        {pending > 0 ? (
          <Card tone="alt" style={{ gap: space.s2 }}>
            <AppText variant="subhead">{pending} cevap gönderilmeyi bekliyor</AppText>
            <AppText variant="bodySm" tone="soft">
              Çevrimdışı çözdüklerin cihazda; bağlantı gelince kendiliğinden gider.
            </AppText>
            <Button title="Şimdi gönder" variant="secondary" onPress={() => void flushQueue().then(() => qc.invalidateQueries({ queryKey: homeKeys.brief }))} />
          </Card>
        ) : null}
        {offline ? (
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
            <Skeleton height={64} radiusKey="card" />
            <Skeleton height={180} radiusKey="card" />
            <Skeleton height={220} radiusKey="card" />
          </View>
        ) : data ? (
          <>
            <CountdownHeader
              examName={data.exam.name}
              daysLeft={data.exam.daysLeft}
              activeDays={data.gamification?.weekly?.activeDays ?? 0}
              targetDays={data.gamification?.weekly?.goalDays ?? 5}
              todayIndex={todayIndexTr()}
            />

            {task ? (
              <View style={{ gap: space.s2 }}>
                <TaskHero
                  kind={task.kind}
                  title={task.title}
                  body={task.reason}
                  meta={task.action.type === "start_session" && task.action.count ? `${task.action.count} soru` : task.progress?.label ?? null}
                  progress={task.progress ? { done: task.progress.answered, total: task.progress.total } : null}
                />
                {task.kind === "resume" && task.finishSessionId ? (
                  <Button title="Şimdilik bitir, sonucu gör" variant="ghost" onPress={() => router.push({ pathname: "/sonuc", params: { sessionId: task.finishSessionId! } })} />
                ) : null}
                {task.secondary ? (
                  <Card style={{ paddingVertical: 0 }}>
                    <ListRow title={task.secondary.title} subtitle={task.secondary.subtitle} divider={false} onPress={() => run(task.secondary!.action)} trailing={<AppText variant="subhead" tone="accentInk">{task.secondary.actionLabel}</AppText>} chevron={false} />
                  </Card>
                ) : null}
              </View>
            ) : null}

            {/* Haftalık plan (Doc 49/12 F8-A): özet sunucudan; plan yoksa koçun daveti varsa kart. */}
            {task?.kind !== "comeback" ? (
              <PlanWeekCard
                plan={data.plan ?? null}
                offer={Boolean(data.cards?.some((c) => c.type === "plan_offer"))}
                onOpen={() => router.push(data.plan ? "/planim" : { pathname: "/planim", params: { kur: "1" } })}
                onStart={(item) => {
                  if (item.kind === "topic" && item.topicId) {
                    router.push({ pathname: "/seans", params: { source: "plan", count: String(Math.max(5, Math.min(20, item.remainingMinutes))), focusKind: "topic", topicId: item.topicId, courseId: "", recipe: "" } });
                  } else if (item.kind === "review") {
                    router.push({ pathname: "/seans", params: { mode: "review", source: "plan", count: "10", focusKind: "wrongs", courseId: "", topicId: "", recipe: "" } });
                  } else {
                    router.push("/(tabs)/denemeler");
                  }
                }}
              />
            ) : null}

            {/* Hazırlık (Doc 48/02 karar 1–2): zayıf konular başta; dönüşte gizli. */}
            <View style={{ gap: space.s2 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                <AppText variant="heading" accessibilityRole="header">
                  Hazırlık
                </AppText>
                <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/kutuphane")} hitSlop={8}>
                  <AppText variant="subhead" tone="accentInk">
                    Tüm dersler
                  </AppText>
                </Pressable>
              </View>

              {task?.kind !== "comeback" && data.readiness.weakest.length > 0 ? (
                <Card style={{ paddingVertical: 0 }}>
                  <View style={{ paddingTop: space.s3 }}>
                    <AppText variant="label" tone="subtle">
                      En zayıf {data.readiness.weakest.length} konu
                    </AppText>
                  </View>
                  {data.readiness.weakest.map((t, i) => (
                    <ListRow
                      key={t.topicId}
                      title={t.name}
                      subtitle={`${t.courseName} · %${Math.round(t.accuracy * 100)} doğru`}
                      divider={i < data.readiness.weakest.length - 1}
                      chevron={false}
                      trailing={
                        <AppText variant="subhead" tone="accentInk">
                          10 soru ›
                        </AppText>
                      }
                      onPress={() =>
                        router.push({ pathname: "/seans", params: { source: "home_weak_topic", count: "10", focusKind: "topic", topicId: t.topicId, courseId: "", recipe: "" } })
                      }
                    />
                  ))}
                </Card>
              ) : null}

              {data.readiness.courses.length > 0 ? (
                <Card style={{ paddingVertical: space.s1 }}>
                  {data.readiness.courses.map((c) => (
                    <CourseTile key={c.courseId} name={c.name} icon={c.icon} accuracy={c.accuracy} solved={c.solved} state={c.state} onPress={() => router.push({ pathname: "/seans", params: { source: "home_suggestion", count: "10", focusKind: "course", courseId: c.courseId, topicId: "", recipe: "" } })} />
                  ))}
                </Card>
              ) : (
                <Card>
                  <AppText variant="subhead">Henüz ölçüm yok</AppText>
                  <AppText variant="bodySm" tone="soft">
                    İlk turdan sonra dersler ve doğruluk burada görünür. Sıfır yazmıyoruz; henüz ölçülmedi.
                  </AppText>
                </Card>
              )}
            </View>
          </>
        ) : null}
      </Screen>

      {/* Yerleşim B: sabit eylem çubuğu — odak düğmesi + sunucunun verdiği birincil eylem. */}
      {task ? (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
          <BugunActionBar
            label={task.action.label}
            kind={task.kind}
            focusLabel={data?.focus?.kind && data.focus.kind !== "coach" ? (data.focus.label ?? "Seçili") : "Koç"}
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

function BugunActionBar({ label, kind, focusLabel, disabled, onFocus, onPress }: { label: string; kind: string; focusLabel: string; disabled: boolean; onFocus: () => void; onPress: () => void }) {
  const { colors, radius, space } = useTheme();
  const showFocus = kind !== "resume" && kind !== "exam";
  return (
    <View style={{ paddingHorizontal: space.screenGutter, paddingTop: space.s3, paddingBottom: space.s3, backgroundColor: colors.bg, borderTopWidth: 0.5, borderTopColor: colors.line, flexDirection: "row", gap: space.s2 }}>
      {showFocus ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Odak: ${focusLabel}`} onPress={onFocus} style={({ pressed }) => ({ minHeight: 54, minWidth: 92, borderRadius: radius.card, borderWidth: 0.5, borderColor: colors.line, backgroundColor: colors.surface, paddingHorizontal: 12, justifyContent: "center", opacity: pressed ? 0.8 : 1 })}>
          <AppText variant="label" tone="subtle">
            Odak
          </AppText>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <AppText variant="subhead" numberOfLines={1} style={{ maxWidth: 110 }}>
              {focusLabel}
            </AppText>
            <ChevronDown color={colors.inkSoft} size={16} strokeWidth={2} />
          </View>
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }}>
        <ActionBar title={label} onPress={onPress} variant={kind === "done" ? "secondary" : "primary"} />
      </View>
      {disabled ? <Badge tone="warning" style={{ position: "absolute", top: -10, right: space.screenGutter }}>Çevrimdışı</Badge> : null}
    </View>
  );
}

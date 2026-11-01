import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useWindowDimensions, View } from "react-native";
import { CoveragePanel, ResumeStrip, TestCard, UpsellStrip } from "@/components/domain";
import { AppText, Notice, Screen, Skeleton } from "@/components/ui";
import { useCourseTests, type CourseTestCard } from "@/features/rooms/queries";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Testler (Doc 49/18; Figma 111:471 premium, 111:635 ücretsiz): dersin 20'şerlik SABİT setleri.
 * Kapsama paneli → sıradaki test → (ücretsizde) tek premium şeridi → konu başlıklı ızgara.
 * Durum, kilit ve bölümleme sunucudan; dokunuş: yarım → devam, kilitli → paywall, diğerleri → yeni tur.
 */
export default function TestlerScreen() {
  const router = useRouter();
  const { colors, space } = useTheme();
  const cols = useWindowDimensions().width >= 600 ? 3 : 2;
  const p = useLocalSearchParams<{ courseId: string; name?: string }>();
  const q = useCourseTests(p.courseId ?? null);
  const d = q.data;

  const baslat = (testId: string) => router.push({ pathname: "/seans", params: { courseTestId: testId, source: "course_test" } });
  const devam = (sessionId: string) => router.push({ pathname: "/seans", params: { resume: sessionId, source: "course_test" } });
  const dokun = (t: CourseTestCard) => {
    if (t.state === "locked") router.push("/paywall");
    else if (t.state === "progress" && t.sessionId) devam(t.sessionId);
    else baslat(t.id);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: "Testler" }} />
      <Screen inset="none">
        {q.isPending ? (
          <>
            <Skeleton height={104} radiusKey="card" />
            <Skeleton height={72} radiusKey="card" />
            <Skeleton height={300} radiusKey="card" />
          </>
        ) : q.isError ? (
          <Notice tone="error" title="Testler yüklenemedi">
            {q.error.message}
          </Notice>
        ) : d ? (
          <>
            <CoveragePanel label={d.course.name} value={d.seenQuestions} total={d.totalQuestions} unit="soru" right={`${d.completedTests}/${d.testCount} test tamamlandı`} />

            {d.next ? (
              <ResumeStrip
                label="Sıradaki"
                scopeName={`Test ${d.next.number}${d.next.heading ? ` · ${d.next.heading}` : ""}`}
                detail={d.next.sessionId ? `${d.next.answered}/${d.next.total} · ${d.next.total - d.next.answered} soru kaldı` : `${d.next.total} soru · başlanmadı`}
                cta={d.next.sessionId ? "Devam et" : "Başla"}
                onPress={() => (d.next!.sessionId ? devam(d.next!.sessionId) : baslat(d.next!.testId))}
              />
            ) : null}

            {d.lockedTests > 0 ? (
              <UpsellStrip title={`Test 1 senin, ${d.lockedTests} test daha var`} body="Bütün dersler, 20'şer soruluk testler" onPress={() => router.push("/paywall")} />
            ) : null}

            {d.sections.length === 0 ? (
              <AppText variant="bodySm" tone="soft">
                Bu dersin testleri hazırlanıyor.
              </AppText>
            ) : (
              d.sections.map((s) => (
                <View key={`${s.from}`} style={{ gap: space.s2 }}>
                  <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: space.s3 }}>
                    <AppText variant="subhead" accessibilityRole="header" style={{ flexShrink: 1 }}>
                      {s.heading}
                    </AppText>
                    <AppText variant="bodySm" tone="subtle" style={{ fontSize: 12, fontVariant: ["tabular-nums"] }}>
                      {s.from === s.to ? `Test ${s.from}` : `Test ${s.from}–${s.to}`}
                    </AppText>
                  </View>
                  {Array.from({ length: Math.ceil(s.tests.length / cols) }, (_, r) => s.tests.slice(r * cols, r * cols + cols)).map((row, i) => (
                    <View key={i} style={{ flexDirection: "row", gap: space.s3 }}>
                      {/* Her kart eşit sütunda: tek kalan kart komşusundan geniş çizilmesin. */}
                      {row.map((t) => (
                        <View key={t.id} style={{ flex: 1 }}>
                          <TestCard number={t.number} state={t.state} questionCount={t.questionCount} pct={t.pct} answered={t.answered} onPress={() => dokun(t)} />
                        </View>
                      ))}
                      {Array.from({ length: cols - row.length }, (_, k) => (
                        <View key={`bos-${k}`} style={{ flex: 1 }} />
                      ))}
                    </View>
                  ))}
                </View>
              ))
            )}
          </>
        ) : null}
      </Screen>
    </View>
  );
}

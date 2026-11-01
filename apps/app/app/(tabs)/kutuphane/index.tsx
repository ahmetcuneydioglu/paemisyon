import { useRouter } from "expo-router";
import { RotateCcw, Shuffle } from "lucide-react-native";
import { useWindowDimensions, View } from "react-native";
import { CourseCard, ResumeStrip } from "@/components/domain";
import { AppText, Chip, Notice, Screen, Skeleton } from "@/components/ui";
import { useStudyHub, type StudyCourse } from "@/features/rooms/queries";
import { useTheme } from "@/theme/ThemeProvider";

/** Izgara sütunu: telefon 2, dar tablet 3, geniş tablet 4. */
function sutunSayisi(width: number) {
  return width >= 900 ? 4 : width >= 600 ? 3 : 2;
}

/**
 * Çalış v2 (Doc 49/17; Figma 108:303) — "ders seç → ne yapacağını seç". Kaldığın yer şeridi
 * (yalnız taze yarım tur), ağırlığa göre ders kartı ızgarası, iki hızlı eylem. Izgara kalan
 * yüksekliği paylaşır: telefonda ekrana kaydırmasız sığar; sığmazsa (SE, büyük yazı) kartlar
 * 96 pt'de kalır ve ekran kayar — içerik kırpılmaz. Bütün sayı ve cümleler `/me/study`'den.
 */
export default function CalisScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const cols = sutunSayisi(useWindowDimensions().width);
  const q = useStudyHub();
  const d = q.data;

  const openCourse = (c: StudyCourse) => router.push({ pathname: "/(tabs)/kutuphane/ders/[id]", params: { id: c.id, name: c.name, icon: c.icon ?? "" } });
  const satirlar = d ? Array.from({ length: Math.ceil(d.courses.length / cols) }, (_, r) => d.courses.slice(r * cols, r * cols + cols)) : [];

  return (
    <Screen style={{ flexGrow: 1, gap: space.s4 }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: space.s3 }}>
        <AppText variant="title" accessibilityRole="header">
          Çalış
        </AppText>
        <AppText variant="bodySm" tone="soft" numberOfLines={1} style={{ flexShrink: 1 }}>
          {d ? (d.module?.name ?? "Hedef sınav seçilmedi") : ""}
        </AppText>
      </View>

      {q.isPending ? (
        <View style={{ flex: 1, gap: space.s3 }}>
          {Array.from({ length: 4 }, (_, i) => (
            <View key={i} style={{ flexDirection: "row", gap: space.s3 }}>
              <View style={{ flex: 1 }}>
                <Skeleton height={104} radiusKey="card" />
              </View>
              <View style={{ flex: 1 }}>
                <Skeleton height={104} radiusKey="card" />
              </View>
            </View>
          ))}
        </View>
      ) : q.isError ? (
        <Notice tone="error" title="Dersler yüklenemedi">
          {q.error.message}
        </Notice>
      ) : d ? (
        <>
          {d.resume ? (
            <ResumeStrip scopeName={d.resume.scopeName} detail={d.resume.detail} onPress={() => router.push({ pathname: "/seans", params: { resume: d.resume!.sessionId, source: "home_resume" } })} />
          ) : null}

          {!d.module ? (
            <Notice tone="warning" title="Hedef sınav seçilmemiş">
              Ben › Ayarlar’dan hedef sınavı seç; dersler ona göre gelir.
            </Notice>
          ) : d.courses.length === 0 ? (
            <AppText variant="bodySm" tone="soft">
              Bu sınavda henüz ders yok.
            </AppText>
          ) : (
            <View style={{ flex: 1, gap: space.s2 }}>
              <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: space.s3 }}>
                <AppText variant="heading" accessibilityRole="header">
                  Dersler
                </AppText>
                <AppText variant="bodySm" tone="subtle" style={{ fontSize: 12 }}>
                  hâkimiyet · ağırlığa göre
                </AppText>
              </View>
              <View style={{ flex: 1, gap: space.s3 }}>
                {satirlar.map((row, i) => (
                  <View key={i} style={{ flex: 1, flexDirection: "row", gap: space.s3 }}>
                    {row.map((c) => (
                      <CourseCard key={c.id} name={c.name} accuracyPct={c.accuracyPct} band={c.band} note={c.note} onPress={() => openCourse(c)} />
                    ))}
                    {Array.from({ length: cols - row.length }, (_, k) => (
                      <View key={`bos-${k}`} style={{ flex: 1 }} />
                    ))}
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ flexDirection: "row", gap: space.s3 }}>
            <Chip label="Karışık 10 soru" icon={Shuffle} onPress={() => router.push({ pathname: "/seans", params: { source: "study_hub", count: "10", focusKind: "coach", courseId: "", topicId: "", recipe: "" } })} style={{ flex: 1, justifyContent: "center" }} />
            <Chip
              label={d.totals.wrongCount > 0 ? `Yanlışlar · ${d.totals.wrongCount}` : d.totals.favoriteCount > 0 ? `Favoriler · ${d.totals.favoriteCount}` : "Yanlışlarım"}
              icon={RotateCcw}
              onPress={() => router.push({ pathname: "/(tabs)/kutuphane/tekrar", params: { sekme: d.totals.wrongCount > 0 || d.totals.favoriteCount === 0 ? "yanlislar" : "favoriler" } })}
              style={{ flex: 1, justifyContent: "center" }}
            />
          </View>
        </>
      ) : null}
    </Screen>
  );
}

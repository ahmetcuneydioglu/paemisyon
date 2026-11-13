import { useRouter } from "expo-router";
import { useState } from "react";
import { BookOpen, RotateCcw, Shuffle } from "lucide-react-native";
import { PixelRatio, useWindowDimensions, View } from "react-native";
import { CourseCard, ResumeStrip } from "@/components/domain";
import { AppText, Notice, Screen, ShortcutButton, Skeleton } from "@/components/ui";
import { useStudyHub, type StudyCourse } from "@/features/rooms/queries";
import { useTheme } from "@/theme/ThemeProvider";

/** İçerik sütunu üst sınırı (Figma `layout/maxContent`): tablette ortalanır. */
const ICERIK_EN = 600;

/**
 * Çalış (Figma 240:1072 koyu, 240:1080 açık, 240:1088 dar/büyük metin, 240:1096 tablet) —
 * "ders seç → ne yapacağını seç". Üstte çalışma kısayolları: Kart tekrarı (birincil, yalnız
 * tekrar varsa), Karışık 10 soru ve Yanlışlar; altında ağırlığa göre ders kartları. İki sütun;
 * dar ekranda ya da büyük metinde tek sütun ve alt alta kısayollar; tablette içerik 600 pt.
 * Kaldığın yer şeridi yalnız taze yarım turda. Bütün sayı ve cümleler `/me/study`'den.
 */
export default function CalisScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const { width } = useWindowDimensions();
  const q = useStudyHub();
  const d = q.data;

  const icerikEni = Math.min(width - space.screenGutter * 2, ICERIK_EN);
  // Tek sütun: 320 pt genişlik ya da büyük metin (Figma 240:1088) — iki sütunda ad 4+ satıra kırılır.
  const tekSutun = icerikEni < 340 || PixelRatio.getFontScale() >= 1.3;
  const cols = tekSutun ? 1 : 2;
  const [gridWidth, setGridWidth] = useState(0);
  // Hücre genişliği ölçülen satırdan: son satırdaki tek kart yarım genişlikte kalır.
  const cellWidth = gridWidth > 0 ? (gridWidth - space.s3 * (cols - 1)) / cols : 0;
  const satirlar = d ? Array.from({ length: Math.ceil(d.courses.length / cols) }, (_, r) => d.courses.slice(r * cols, r * cols + cols)) : [];
  const openCourse = (c: StudyCourse) => router.push({ pathname: "/(tabs)/kutuphane/ders/[id]", params: { id: c.id, name: c.name, icon: c.icon ?? "" } });

  return (
    <Screen style={{ gap: space.s6, alignItems: "center" }}>
      <View style={{ width: "100%", maxWidth: ICERIK_EN, gap: space.s6 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: space.s3 }}>
          <AppText variant="title" accessibilityRole="header">
            Çalış
          </AppText>
          <AppText variant="bodySm" tone="soft" numberOfLines={1} style={{ flexShrink: 1, fontSize: 12, lineHeight: 18 }}>
            {d ? (d.module?.name ?? "Hedef sınav seçilmedi") : ""}
          </AppText>
        </View>

        {q.isPending ? (
          <View style={{ gap: space.s3 }}>
            <Skeleton height={48} radiusKey="control" />
            <Skeleton height={50} radiusKey="control" />
            {Array.from({ length: 3 }, (_, i) => (
              <View key={i} style={{ flexDirection: "row", gap: space.s3 }}>
                <View style={{ flex: 1 }}>
                  <Skeleton height={130} radiusKey="card" />
                </View>
                <View style={{ flex: 1 }}>
                  <Skeleton height={130} radiusKey="card" />
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

            <View style={{ gap: space.s2 }}>
              {d.totals.flashcardsDue != null && d.totals.flashcardsDue > 0 ? (
                <ShortcutButton
                  variant="primary"
                  icon={BookOpen}
                  label={`Kart tekrarı · ${d.totals.flashcardsDue}`}
                  onPress={() => router.push({ pathname: "/kartlar", params: { mode: "due", source: "study_hub", resume: "", title: "Kart tekrarı" } })}
                />
              ) : null}
              <View style={{ flexDirection: tekSutun ? "column" : "row", gap: tekSutun ? space.s2 : space.s3 }}>
                <ShortcutButton
                  icon={Shuffle}
                  label="Karışık 10 soru"
                  onPress={() => router.push({ pathname: "/seans", params: { source: "study_hub", count: "10", focusKind: "coach", courseId: "", topicId: "", recipe: "" } })}
                  style={tekSutun ? undefined : { flex: 1 }}
                />
                <ShortcutButton
                  icon={RotateCcw}
                  label={d.totals.wrongCount > 0 ? `Yanlışlar · ${d.totals.wrongCount}` : d.totals.favoriteCount > 0 ? `Favoriler · ${d.totals.favoriteCount}` : "Yanlışlarım"}
                  onPress={() => router.push({ pathname: "/(tabs)/kutuphane/tekrar", params: { sekme: d.totals.wrongCount > 0 || d.totals.favoriteCount === 0 ? "yanlislar" : "favoriler" } })}
                  style={tekSutun ? undefined : { flex: 1 }}
                />
              </View>
            </View>

            {!d.module ? (
              <Notice tone="warning" title="Hedef sınav seçilmemiş">
                Ben › Ayarlar’dan hedef sınavı seç; dersler ona göre gelir.
              </Notice>
            ) : d.courses.length === 0 ? (
              <AppText variant="bodySm" tone="soft">
                Bu sınavda henüz ders yok.
              </AppText>
            ) : (
              <View style={{ gap: space.s3 }}>
                <AppText variant="heading" accessibilityRole="header">
                  Dersler
                </AppText>
                <View style={{ gap: space.s3 }} onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}>
                  {satirlar.map((row, i) => (
                    <View key={i} style={{ flexDirection: "row", gap: space.s3 }}>
                      {row.map((c) => (
                        <CourseCard key={c.id} name={c.name} accuracyPct={c.accuracyPct} note={c.note} onPress={() => openCourse(c)} style={cellWidth ? { flex: 0, width: cellWidth } : undefined} />
                      ))}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : null}
      </View>
    </Screen>
  );
}

import { useRouter } from "expo-router";
import { BookMarked, CalendarDays, RotateCcw, Star } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { CourseRoomCard } from "@/components/domain";
import { AppText, ListRow, Notice, Screen, Skeleton } from "@/components/ui";
import { useCourses } from "@/features/catalog/queries";
import { useCoachBrief, useMe } from "@/features/home/queries";
import { useBookmarks, useWrongAnswers } from "@/features/review/queries";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Çalış (Bugün v3, Doc 49/16 §4; Figma 68:878) — Kütüphane'nin yerine, iki sabit bölüm:
 * **Ders odaları** (ağırlığa göre 2 sütun; ad, ağırlık, hâkimiyet) ve **Araçlar** (Yanlışlarım,
 * Favorilerim, Konu özetleri, Haftalık planım — ince satırlar). Altta serbest tur. Mevzuat
 * kendi sekmesinde (karar 2); eski dört kapı kartı araç satırına indi.
 */
export default function CalisScreen() {
  const router = useRouter();
  const { colors, space } = useTheme();
  const me = useMe();
  const moduleId = me.data?.preferredModule?.id;
  const courses = useCourses(moduleId);
  const brief = useCoachBrief();
  const wrongs = useWrongAnswers();
  const bookmarks = useBookmarks();

  const readiness = new Map((brief.data?.readiness.courses ?? []).map((c) => [c.courseId, c]));
  const sirali = [...(courses.data ?? [])].sort((a, b) => b.weightPercent - a.weightPercent);
  // Anayasa'nın ünite özetleri yayında (Doc 53); konu özetleri satırı o dersin odasına götürür.
  const ozetDersi = sirali.find((c) => /anayasa/i.test(c.name)) ?? null;

  return (
    <Screen>
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: space.s3 }}>
        <AppText variant="title" accessibilityRole="header">
          Çalış
        </AppText>
        <AppText variant="bodySm" tone="soft" numberOfLines={1}>
          {me.data?.preferredModule?.name ?? "Hedef sınav seçilmedi"}
        </AppText>
      </View>

      <View style={{ gap: space.s2 }}>
        <AppText variant="label" tone="subtle" accessibilityRole="header">
          DERS ODALARI · AĞIRLIĞA GÖRE
        </AppText>
        {!moduleId ? (
          <Notice tone="warning" title="Hedef sınav seçilmemiş">
            Ben › Ayarlar’dan hedef sınavı seç; dersler ona göre gelir.
          </Notice>
        ) : courses.isPending ? (
          <Skeleton height={196} radiusKey="card" />
        ) : courses.isError ? (
          <Notice tone="error" title="Dersler yüklenemedi">
            {courses.error.message}
          </Notice>
        ) : sirali.length === 0 ? (
          <AppText variant="bodySm" tone="soft">
            Bu sınavda henüz ders yok.
          </AppText>
        ) : (
          <View style={{ gap: space.s3 }}>
            {Array.from({ length: Math.ceil(sirali.length / 2) }, (_, r) => sirali.slice(r * 2, r * 2 + 2)).map((row, i) => (
              <View key={i} style={{ flexDirection: "row", gap: space.s3 }}>
                {row.map((c) => (
                  <CourseRoomCard
                    key={c.id}
                    name={c.name}
                    weightPercent={c.weightPercent}
                    accuracy={readiness.get(c.id)?.accuracy ?? null}
                    onPress={() => router.push({ pathname: "/(tabs)/kutuphane/ders/[id]", params: { id: c.id, name: c.name, icon: c.icon ?? "" } })}
                  />
                ))}
                {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={{ gap: space.s2 }}>
        <AppText variant="label" tone="subtle" accessibilityRole="header">
          ARAÇLAR
        </AppText>
        <View>
          <ListRow
            title="Yanlışlarım"
            subtitle={wrongs.isPending ? "Yükleniyor…" : wrongs.isError ? "Yüklenemedi" : wrongs.data.length === 0 ? "Çözülmemiş yanlışın yok" : `${wrongs.data.length} soru kuyrukta`}
            leading={<RotateCcw color={colors.inkSoft} size={20} strokeWidth={1.75} />}
            onPress={() => router.push({ pathname: "/(tabs)/kutuphane/tekrar", params: { sekme: "yanlislar" } })}
          />
          <ListRow
            title="Favorilerim"
            subtitle={bookmarks.isPending ? "Yükleniyor…" : bookmarks.isError ? "Yüklenemedi" : bookmarks.data.length === 0 ? "Tur içinde yıldızla" : `${bookmarks.data.length} soru`}
            leading={<Star color={colors.inkSoft} size={20} strokeWidth={1.75} />}
            onPress={() => router.push({ pathname: "/(tabs)/kutuphane/tekrar", params: { sekme: "favoriler" } })}
          />
          {ozetDersi ? (
            <ListRow
              title="Konu özetleri"
              subtitle={`${ozetDersi.name} üniteleri`}
              leading={<BookMarked color={colors.inkSoft} size={20} strokeWidth={1.75} />}
              onPress={() => router.push({ pathname: "/(tabs)/kutuphane/ders/[id]", params: { id: ozetDersi.id, name: ozetDersi.name, icon: ozetDersi.icon ?? "" } })}
            />
          ) : null}
          <ListRow
            title="Haftalık planım"
            subtitle="Bu haftanın kalemleri ve sınava kadar dağılım"
            leading={<CalendarDays color={colors.inkSoft} size={20} strokeWidth={1.75} />}
            divider={false}
            onPress={() => router.push("/planim")}
          />
        </View>
      </View>

      <View style={{ gap: space.s2 }}>
        <AppText variant="label" tone="subtle" accessibilityRole="header">
          SERBEST TUR
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Karışık 10 soru, başla"
          onPress={() => router.push({ pathname: "/seans", params: { source: "home_suggestion", count: "10", focusKind: "coach", courseId: "", topicId: "", recipe: "" } })}
          style={({ pressed }) => ({ minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.s3, opacity: pressed ? 0.7 : 1 })}
        >
          <AppText variant="body">Karışık 10 soru</AppText>
          <View style={{ borderWidth: 1, borderColor: colors.accent, borderRadius: 999, paddingHorizontal: 12, minHeight: 32, justifyContent: "center" }}>
            <AppText variant="subhead" tone="accentInk" style={{ fontSize: 14, lineHeight: 18 }}>
              Başla
            </AppText>
          </View>
        </Pressable>
      </View>
    </Screen>
  );
}

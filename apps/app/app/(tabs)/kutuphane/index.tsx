import { useRouter } from "expo-router";
import { BookOpen, RotateCcw, Search, Star, CalendarDays } from "lucide-react-native";
import { View } from "react-native";
import { CourseTile, LegislationRow } from "@/components/domain";
import { AppText, Card, ListRow, Notice, Screen, SectionHeader, Skeleton } from "@/components/ui";
import { useCourses } from "@/features/catalog/queries";
import { useCoachBrief, useMe } from "@/features/home/queries";
import { useReadingProgress } from "@/features/mevzuat/queries";
import { useBookmarks, useWrongAnswers } from "@/features/review/queries";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Kütüphane ana (Doc 25 Bölge 2): kapsam haritası. Dersler (tercih edilen sınav), Mevzuat
 * girişi (kaldığın yer + arama), tekrar kuyrukları (yanlışlar, favoriler). Ağaç gezmek için,
 * döngü çalışmak için: her satır bir sonraki ekrana ya da doğrudan seansa götürür.
 */
export default function KutuphaneScreen() {
  const router = useRouter();
  const { colors, space } = useTheme();
  const me = useMe();
  const moduleId = me.data?.preferredModule?.id;
  const courses = useCourses(moduleId);
  const brief = useCoachBrief();
  const progress = useReadingProgress();
  const wrongs = useWrongAnswers();
  const bookmarks = useBookmarks();

  const readiness = new Map((brief.data?.readiness.courses ?? []).map((c) => [c.courseId, c]));
  const last = progress.data?.[0] ?? null;

  return (
    <Screen>
      <View style={{ gap: space.s1 }}>
        <AppText variant="bodySm" tone="soft">
          {me.data?.preferredModule?.name ? `${me.data.preferredModule.name} hazırlığı` : "Hedef sınav seçilmedi"}
        </AppText>
        <AppText variant="title">Kütüphane</AppText>
      </View>

      {/* Mevzuat: okumaya kaldığın yerden devam; arama her zaman bir dokunuş uzakta. */}
      <View style={{ gap: space.s2 }}>
        <SectionHeader title="Mevzuat" action="Tümü" onAction={() => router.push("/(tabs)/kutuphane/mevzuat")} />
        <Card style={{ paddingVertical: 0 }}>
          {progress.isPending ? (
            <View style={{ paddingVertical: space.s3 }}>
              <Skeleton height={44} />
            </View>
          ) : last ? (
            <LegislationRow law={last.lawShort} article={last.no} meta={`Kaldığın yer · ${last.lawName}`} onPress={() => router.push({ pathname: "/oku/[slug]", params: { slug: last.lawSlug, madde: last.no } })} />
          ) : (
            <ListRow title="Henüz okumaya başlamadın" subtitle="Bir kanun seç; kaldığın yer burada görünür." leading={<BookOpen color={colors.inkSoft} size={20} strokeWidth={1.75} />} onPress={() => router.push("/(tabs)/kutuphane/mevzuat")} />
          )}
          <ListRow title="Mevzuatta ara" subtitle="Madde numarası, başlık ya da metin" leading={<Search color={colors.accent} size={20} strokeWidth={1.75} />} divider={false} onPress={() => router.push({ pathname: "/(tabs)/kutuphane/mevzuat", params: { ara: "1" } })} />
        </Card>
      </View>

      {/* Dersler: doğruluk brief'in hazırlık verisinden; ölçüm yoksa dürüst "henüz çözülmedi". */}
      <View style={{ gap: space.s2 }}>
        <SectionHeader title="Dersler" />
        {!moduleId ? (
          <Notice tone="warning" title="Hedef sınav seçilmemiş">
            Ben › Ayarlar’dan hedef sınavı seç; dersler ona göre gelir.
          </Notice>
        ) : courses.isPending ? (
          <Skeleton height={240} radiusKey="card" />
        ) : courses.isError ? (
          <Notice tone="error" title="Dersler yüklenemedi">
            {courses.error.message}
          </Notice>
        ) : courses.data.length === 0 ? (
          <Card>
            <AppText variant="subhead">Bu sınavda henüz ders yok</AppText>
          </Card>
        ) : (
          <Card style={{ paddingVertical: space.s1 }}>
            {courses.data.map((c) => {
              const r = readiness.get(c.id);
              return (
                <CourseTile
                  key={c.id}
                  name={c.name}
                  icon={c.icon}
                  accuracy={r?.accuracy ?? null}
                  solved={r?.solved ?? 0}
                  state={r?.state ?? "sparse"}
                  onPress={() => router.push({ pathname: "/(tabs)/kutuphane/ders/[id]", params: { id: c.id, name: c.name, icon: c.icon ?? "" } })}
                />
              );
            })}
          </Card>
        )}
      </View>

      {/* Tekrar kuyrukları: sayılar sunucudan; tur başlatma Tekrar ekranında. */}
      <View style={{ gap: space.s2 }}>
        <SectionHeader title="Tekrar" />
        <Card style={{ paddingVertical: 0 }}>
          <ListRow title="Haftalık planım" subtitle="Bu haftanın kalemleri ve sınava kadar dağılım" leading={<CalendarDays color={colors.accent} size={20} strokeWidth={1.75} />} onPress={() => router.push("/planim")} />
          <ListRow
            title="Yanlışlarım"
            subtitle={wrongs.isPending ? "Yükleniyor…" : wrongs.isError ? "Yüklenemedi" : wrongs.data.length === 0 ? "Çözülmemiş yanlışın yok" : `${wrongs.data.length} çözülmemiş yanlış`}
            leading={<RotateCcw color={colors.accent} size={20} strokeWidth={1.75} />}
            onPress={() => router.push({ pathname: "/(tabs)/kutuphane/tekrar", params: { sekme: "yanlislar" } })}
          />
          <ListRow
            title="Favoriler"
            subtitle={bookmarks.isPending ? "Yükleniyor…" : bookmarks.isError ? "Yüklenemedi" : bookmarks.data.length === 0 ? "Tur içinde ⭐ ile işaretle" : `${bookmarks.data.length} soru`}
            leading={<Star color={colors.accent} size={20} strokeWidth={1.75} />}
            divider={false}
            onPress={() => router.push({ pathname: "/(tabs)/kutuphane/tekrar", params: { sekme: "favoriler" } })}
          />
        </Card>
      </View>
    </Screen>
  );
}

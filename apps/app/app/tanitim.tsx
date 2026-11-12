import { useRouter } from "expo-router";
import { CheckCircle2 } from "lucide-react-native";
import { useRef, useState, type ComponentRef, type ReactNode } from "react";
import { Pressable, ScrollView, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ContinueCard, ExamCard, FlashCard, FlashcardStateBar, LawCard, RankRow, RouteList, SummaryUnitRow, TestCard, WeekStrip7 } from "@/components/domain";
import { AppText, Badge, BrandMark, Button, Card, ScaleToFit, TextScaleCap } from "@/components/ui";
import { ornekDeneme, ornekDeste, ornekDevam, ornekHafta, ornekKanunlar, ornekKart, ornekOzet, ornekRota, ornekSiralama, ornekTestler } from "@/features/intro/ornekler";
import { markIntroSeen } from "@/lib/intro-seen";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Tanıtım (Doc 25 Bölge 0; Figma "Tanıtım v2", 147:401 — kullanıcı kararı 11 Kas 2026): beş
 * slayt uygulamanın beş temel yüzeyini GERÇEK alan bileşenleriyle gösterir — Bugün rotası,
 * bilgi kartı + konu özeti, testler, denemeler, güncel mevzuat. Örnek veri
 * `features/intro/ornekler.ts`'te (bankadan gerçek içerik). Kahramanlar süstür: ekran okuyucudan
 * gizlenir (slayt başlık + gövdeyle okunur), dokunuşa kapalıdır; bilgi kartı istisna — çevrilebilir.
 * Kahraman kalan yüksekliğe `ScaleToFit` ile sığar (SE → Pro Max). Son slayt ve "Atla" girişe
 * gider; ikisi de tanıtım bayrağını yazar.
 */
const SLIDES = [
  { key: "bugun", title: "Her gün rotan hazır", body: "Koçun zayıf konularına ve sınav takvimine bakar; bugün ne çalışacağını sıralı adımlarla önüne koyar." },
  { key: "kart", title: "Konuyu kartla ve özetle sindir", body: "Her konuda madde dayanaklı bilgi kartları ve kısa konu özetleri: önce özeti oku, sonra kartlarla tekrar et." },
  { key: "test", title: "Konu konu testlerle pekiştir", body: "Her ders için sıralı testler. İlerlemen kayıtlı; yarım kalan testi kaldığın yerden sürdürürsün." },
  { key: "deneme", title: "Gerçek sınav düzeninde dene", body: "100 soruluk haftalık denemeler ve çıkmış PAEM sınavları. Netini, ders kırılımını ve Türkiye sıralamanı hemen gör." },
  { key: "mevzuat", title: "Güncel mevzuat, madde madde", body: "Kanun ve yönetmelikler resmî kaynakla düzenli karşılaştırılır. Metin değişince güncellenir; ilgili kart ve özetler yeniden incelenir." },
] as const;
type SlideKey = (typeof SLIDES)[number]["key"];

export default function TanitimScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, space } = useTheme();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const last = index === SLIDES.length - 1;

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  // Programla kaydırmada iOS onMomentumScrollEnd çağırmaz; sayfa burada da güncellenir
  // (yoksa art arda "Devam et" aynı slayta gider — göz testi 11 Kas 2026).
  const go = (i: number) => {
    setIndex(i);
    scroller.current?.scrollTo({ x: i * width, animated: true });
  };
  const finish = () => {
    markIntroSeen();
    router.replace("/(auth)/login");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom + space.s4 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2, paddingHorizontal: space.screenGutter, minHeight: 44 }}>
        <BrandMark size={24} />
        <AppText variant="brand" style={{ flex: 1 }} accessibilityRole="header">
          Paemisyon
        </AppText>
        <Pressable accessibilityRole="button" onPress={finish} hitSlop={12} style={{ minHeight: 44, justifyContent: "center" }}>
          <AppText variant="subhead" tone="accentInk">
            {last ? "Zaten hesabım var" : "Atla"}
          </AppText>
        </Pressable>
      </View>

      <ScrollView ref={scroller} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScrollEnd} style={{ flex: 1 }}>
        {SLIDES.map((s, i) => (
          <View key={s.key} style={{ width, paddingHorizontal: space.screenGutter }}>
            <ScaleToFit style={{ paddingVertical: space.s3 }}>
              <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                {/* Önizleme yazısı en fazla 1,2× büyür; başlık ve gövde (aşağıda) tam büyür. */}
                <TextScaleCap max={1.2}>
                  <Hero kind={s.key} />
                </TextScaleCap>
              </View>
            </ScaleToFit>
            <View accessible accessibilityLabel={`${i + 1}/${SLIDES.length}. ${s.title}. ${s.body}`} style={{ gap: space.s2, paddingTop: space.s4, paddingBottom: space.s5 }}>
              <AppText variant="title">{s.title}</AppText>
              <AppText variant="body" tone="soft">
                {s.body}
              </AppText>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: space.screenGutter, gap: space.s4 }}>
        <View style={{ flexDirection: "row", gap: 6, justifyContent: "center" }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {SLIDES.map((s, i) => (
            <View key={s.key} style={{ width: i === index ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === index ? colors.accent : colors.surfaceAlt }} />
          ))}
        </View>
        <Button title={last ? "Başlayalım" : "Devam et"} onPress={() => (last ? finish() : go(index + 1))} />
      </View>
    </View>
  );
}

/** Dokunuşa kapalı önizleme sarmalı (bileşenlerin kendi basılı durumu ve gezinmesi devre dışı). */
function Static({ children, gap }: { children: ReactNode; gap?: number }) {
  return (
    <View pointerEvents="none" style={{ gap }}>
      {children}
    </View>
  );
}

const noop = () => {};

function Hero({ kind }: { kind: SlideKey }) {
  const { colors, space } = useTheme();
  const [flipped, setFlipped] = useState(false);

  if (kind === "bugun")
    return (
      <Static gap={space.s4}>
        <WeekStrip7 days={ornekHafta} />
        <RouteList rows={ornekRota} footer={null} />
      </Static>
    );

  if (kind === "kart")
    return (
      <View style={{ gap: space.s3 }}>
        <FlashCard card={ornekKart} flipped={flipped} onFlip={() => setFlipped((v) => !v)} height={236} />
        <View pointerEvents="none" style={{ gap: space.s2 }}>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.s2 }}>
            <AppText variant="subhead">{ornekDeste.total} kart</AppText>
            <AppText variant="bodySm" tone="soft">
              {ornekDeste.learned} öğrenildi · {ornekDeste.learning} tekrarda
            </AppText>
          </View>
          <FlashcardStateBar counts={ornekDeste} />
          <Card style={{ paddingVertical: 0, marginTop: space.s2 }}>
            <SummaryUnitRow unit={ornekOzet} onPress={noop} />
          </Card>
        </View>
      </View>
    );

  if (kind === "test")
    return (
      <Static gap={space.s3}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <AppText variant="heading">Polis Mevzuatı</AppText>
          <Badge>75 test</Badge>
        </View>
        {[0, 2].map((start) => (
          <View key={start} style={{ flexDirection: "row", gap: space.s3 }}>
            {ornekTestler.slice(start, start + 2).map((t) => (
              <TestCard key={t.number} {...t} onPress={noop} />
            ))}
          </View>
        ))}
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
          <CheckCircle2 size={16} color={colors.success} strokeWidth={1.75} />
          <AppText variant="bodySm" tone="soft">
            Test 1’deki yanlışların Tekrar’a düştü
          </AppText>
        </View>
      </Static>
    );

  if (kind === "deneme")
    return (
      <Static gap={space.s3}>
        <ExamCard exam={ornekDeneme} onAction={noop} />
        <Card style={{ paddingHorizontal: 0, paddingVertical: space.s2, gap: 0 }}>
          <AppText variant="label" tone="subtle" style={{ paddingHorizontal: space.s4, paddingVertical: space.s2 }}>
            SIRALAMA · PAEM11 DENEME-1
          </AppText>
          {ornekSiralama.map((r) => (
            <RankRow key={r.rank} {...r} />
          ))}
        </Card>
      </Static>
    );

  return (
    <Static gap={space.s3}>
      <ContinueCard resume={ornekDevam} first={null} onOpen={noop} />
      {ornekKanunlar.map((l) => (
        <LawCard key={l.slug} law={l} onPress={noop} verified />
      ))}
    </Static>
  );
}

import { useRouter } from "expo-router";
import { Check, ClipboardList, Flame, Map as MapIcon, Target } from "lucide-react-native";
import { useRef, useState, type ComponentRef } from "react";
import { Pressable, ScrollView, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText, Badge, Button, Card, ProgressBar } from "@/components/ui";
import { markIntroSeen } from "@/lib/intro-seen";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Tanıtım (Doc 25 Bölge 0; Flutter tanıtımıyla aynı beş mesaj, Nöbet diliyle). Kahramanlar
 * görsel değil, kit bileşenleriyle çizilir; böylece tema ve Dynamic Type'a uyar. Son slayt
 * kayda, "Zaten hesabım var" girişe gider; ikisi de bayrağı yazar.
 */
const SLIDES = [
  { key: "hedef", title: "Hedefin belli.\nArtık yolun da.", body: "Paemisyon, Komiser Yardımcılığı yolculuğunu tek merkezden yöneten kişisel hazırlık koçun." },
  { key: "soru", title: "Gerçek sınav soruları, kaynağıyla", body: "Yapay zekâ üretimi soru yok. Her soru gerçek sınavlardan; kaynağı bankada kayıtlı, editör denetiminden geçmiş." },
  { key: "koc", title: "Bugün ne çalışacağını koçun söyler", body: "Zayıf konuların, tekrarı gelen yanlışların ve günün hedefi her sabah tek kartta hazır. Yanlışların unutulmaz." },
  { key: "harita", title: "Nerede eksiksin, harita gösterir", body: "Kanun kanun, konu konu ısı haritası. Madde Atlası'nda hangi maddeyi fethettiğini görürsün." },
  { key: "deneme", title: "Canlı denemede yerini gör", body: "Herkes aynı anda yarışır; netin ve Türkiye sıralaman anında ekranda." },
] as const;

export default function TanitimScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, space } = useTheme();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const last = index === SLIDES.length - 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  const go = (i: number) => scroller.current?.scrollTo({ x: i * width, animated: true });
  const finish = (target: "/(auth)/login") => {
    markIntroSeen();
    router.replace(target);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom + space.s4 }}>
      <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: space.screenGutter, minHeight: 44, alignItems: "center" }}>
        <Pressable accessibilityRole="button" onPress={() => finish("/(auth)/login")} hitSlop={8}>
          <AppText variant="subhead" tone="accentInk">
            {last ? "Zaten hesabım var" : "Atla"}
          </AppText>
        </Pressable>
      </View>
      <ScrollView ref={scroller} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScroll} style={{ flex: 1 }}>
        {SLIDES.map((s, i) => (
          <View key={s.key} style={{ width, paddingHorizontal: space.screenGutter, gap: space.s5 }} accessibilityLabel={`Tanıtım, ${SLIDES.length} ekrandan ${i + 1}.si`}>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Hero kind={s.key} />
            </View>
            <View style={{ gap: space.s2, paddingBottom: space.s2 }}>
              <AppText variant="title">{s.title}</AppText>
              <AppText variant="body" tone="soft">
                {s.body}
              </AppText>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={{ paddingHorizontal: space.screenGutter, gap: space.s4 }}>
        <View style={{ flexDirection: "row", gap: 6, justifyContent: "center" }} accessibilityElementsHidden>
          {SLIDES.map((s, i) => (
            <View key={s.key} style={{ width: i === index ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === index ? colors.accent : colors.surfaceAlt }} />
          ))}
        </View>
        <Button title={last ? "İlk devriyene çık" : "Devam et"} onPress={() => (last ? finish("/(auth)/login") : go(index + 1))} />
      </View>
    </View>
  );
}

/** Slayt kahramanları: kit bileşenleriyle kurulmuş küçük sahneler (görsel yok). */
function Hero({ kind }: { kind: (typeof SLIDES)[number]["key"] }) {
  const { colors, space, radius } = useTheme();
  if (kind === "hedef")
    return (
      <Card style={{ gap: space.s3 }}>
        <AppText variant="label" tone="accentInk">
          PAEM 2027’ye
        </AppText>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
          <AppText variant="display" tone="accent">
            184
          </AppText>
          <AppText variant="heading">gün</AppText>
        </View>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {[1, 1, 1, 0, 0, 0, 0].map((d, i) => (
            <View key={i} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: d ? colors.success : colors.surfaceAlt, borderWidth: i === 3 ? 1.5 : 0, borderColor: colors.accent }} />
          ))}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Target color={colors.accent} size={18} strokeWidth={1.75} />
          <AppText variant="bodySm" tone="soft">
            Bu hafta 3/5 gün · tek hedef, tek plan
          </AppText>
        </View>
      </Card>
    );
  if (kind === "soru")
    return (
      <Card style={{ gap: space.s3 }}>
        <Badge tone="success">PAEM 10 · 2026 · çıkmış soru</Badge>
        <AppText variant="body">PVSK’ya göre polis, durdurduğu kişiye durdurma sebebini bildirir ve…</AppText>
        {["Kimliğini isteyebilir", "Üstünü dilediği gibi arayabilir"].map((t, i) => (
          <View key={t} style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radius.card, backgroundColor: i === 0 ? colors.successSoft : colors.surface, borderWidth: 1, borderColor: i === 0 ? colors.success : colors.line }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: i === 0 ? colors.success : colors.surfaceAlt, alignItems: "center", justifyContent: "center" }}>{i === 0 ? <Check color={colors.onAccent} size={14} strokeWidth={2.5} /> : <AppText variant="subhead">B</AppText>}</View>
            <AppText variant="bodySm" style={{ flex: 1 }}>
              {t}
            </AppText>
          </View>
        ))}
      </Card>
    );
  if (kind === "koc")
    return (
      <Card style={{ gap: space.s3 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <AppText variant="label" tone="accentInk">
            Bugünün görevi
          </AppText>
          <Badge tone="neutral">10 soru</Badge>
        </View>
        <AppText variant="title">Anayasa ile 10 soru</AppText>
        <AppText variant="bodySm" tone="soft">
          Zayıf konun Yürütme; koç yeni soruyla çözülmemiş yanlışı dengeler.
        </AppText>
        <View style={{ flexDirection: "row", gap: 4 }}>
          {Array.from({ length: 10 }, (_, i) => (
            <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < 6 ? colors.accent : colors.surfaceAlt }} />
          ))}
        </View>
      </Card>
    );
  if (kind === "harita")
    return (
      <Card style={{ gap: space.s3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <MapIcon color={colors.accent} size={18} strokeWidth={1.75} />
          <AppText variant="subhead">Madde Atlası · TCK</AppText>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {[3, 0, 1, 3, 0, 0, 1, 3, 0, 2, 0, 0, 1, 0, 3, 0].map((v, i) => (
            <View key={i} style={{ width: 44, height: 32, borderRadius: radius.control, backgroundColor: v === 0 ? colors.surface : v === 1 ? colors.accentSoft : v === 2 ? colors.warningSoft : colors.successSoft, borderWidth: 1, borderColor: v === 0 ? colors.line : "transparent", alignItems: "center", justifyContent: "center" }}>
              <AppText variant="bodySm" style={{ fontSize: 11, lineHeight: 14, color: v === 3 ? colors.successInk : colors.inkSoft }}>
                m.{i + 2}
              </AppText>
            </View>
          ))}
        </View>
        <ProgressBar value={0.45} tone="success" height={5} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Flame color={colors.success} size={14} strokeWidth={1.75} />
          <AppText variant="bodySm" tone="soft">
            7/16 madde temiz · zayıf konu kırmızıda
          </AppText>
        </View>
      </Card>
    );
  return (
    <Card style={{ gap: space.s3 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Badge tone="accent">Canlı</Badge>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <ClipboardList color={colors.inkSoft} size={16} strokeWidth={1.75} />
          <AppText variant="bodySm" tone="soft">
            312 katılımcı
          </AppText>
        </View>
      </View>
      <AppText variant="heading">PAEM 10 Deneme-4</AppText>
      {[
        ["🥇", "Mert K.", "71.25"],
        ["🥈", "Sen", "68.50"],
        ["🥉", "Ayşe D.", "66.00"],
      ].map(([m, n, s]) => (
        <View key={n} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6, backgroundColor: n === "Sen" ? colors.accentSoft : "transparent", borderRadius: radius.control, paddingHorizontal: 8 }}>
          <AppText variant="subhead">{m}</AppText>
          <AppText variant="subhead" style={{ flex: 1 }} tone={n === "Sen" ? "accentInk" : "ink"}>
            {n}
          </AppText>
          <AppText variant="stat">{s}</AppText>
        </View>
      ))}
    </Card>
  );
}

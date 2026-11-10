import { ImageOff, X, ZoomIn } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Image, Modal, Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import { AppText, IconButton, Skeleton } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";

/** Görsel çerçevesinin azami yüksekliği; şekil dizisi gibi geniş görseller yine tam genişlikte kalır. */
const MAX_HEIGHT = 320;
/** Boyut gelene kadar iskeletin yüksekliği (tipik çıkmış soru görseli 700×192 → ~100 pt). */
const SKELETON_HEIGHT = 120;
/**
 * Görsel kâğıdı: çıkmış sınav görselleri opak beyaz zeminli PNG'lerdir (siyah çizgi, renkli
 * dilim). Koyu temada çerçeveyi tema rengine boyarsak PNG'nin beyaz dikdörtgeni içinde
 * "yüzer"; o yüzden kâğıt her temada beyazdır, yalnız çerçeve çizgisi temaya uyar.
 */
const PAPER = "#FFFFFF";

type Size = { width: number; height: number };
type Phase = { kind: "loading" } | { kind: "ready"; size: Size } | { kind: "failed" };

/**
 * Soru görseli (şekil, grafik, tablo): kökün altında, kendi en-boy oranında, tam genişlikte.
 * Yüklenirken iskelet; yüklenemezse sessiz değil AÇIK yedek ("Görsel yüklenemedi", dokununca
 * yeniden dener) — aday "görsel eksik" sanmasın (7 Kas 2026 bildirimi). Dokununca tam ekran
 * büyütme (iki parmakla yakınlaştırma; ScrollView'un yerli zoom'u). Yalnız RN çekirdek `Image`
 * kullanır: yeni yerli modül yok, mevcut dev client ve mağaza derlemesi değişmeden çalışır.
 */
export function QuestionMedia({ url, alt = "Soru görseli", zoomable = true }: { url: string | null | undefined; alt?: string; zoomable?: boolean }) {
  const { colors, radius, space } = useTheme();
  // Sonuç, istendiği (url, deneme) anahtarıyla saklanır: anahtar değişince eski sonuç kendiliğinden
  // "yükleniyor" sayılır; effect içinde senkron setState gerekmez (react-hooks/set-state-in-effect).
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${url ?? ""}#${attempt}`;
  const [result, setResult] = useState<{ key: string; phase: Phase } | null>(null);
  const [frameWidth, setFrameWidth] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const phase: Phase = result?.key === requestKey ? result.phase : { kind: "loading" };

  useEffect(() => {
    if (!url) return;
    let alive = true;
    Image.getSize(
      url,
      (width, height) => {
        if (alive) setResult({ key: requestKey, phase: width > 0 && height > 0 ? { kind: "ready", size: { width, height } } : { kind: "failed" } });
      },
      () => {
        if (alive) setResult({ key: requestKey, phase: { kind: "failed" } });
      },
    );
    return () => {
      alive = false;
    };
  }, [url, requestKey]);

  if (!url) return null;

  const frame = { borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, overflow: "hidden" as const };

  if (phase.kind === "loading") {
    return (
      <View accessibilityLabel={`${alt} yükleniyor`} style={frame}>
        <Skeleton height={SKELETON_HEIGHT} radiusKey="card" />
      </View>
    );
  }

  if (phase.kind === "failed") {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${alt} yüklenemedi, yeniden denemek için dokun`}
        onPress={() => setAttempt((n) => n + 1)}
        style={({ pressed }) => [frame, { minHeight: 56, flexDirection: "row", alignItems: "center", gap: space.s3, paddingHorizontal: space.s4, paddingVertical: space.s3, backgroundColor: pressed ? colors.surface : colors.surfaceAlt }]}
      >
        <ImageOff color={colors.inkSoft} size={20} strokeWidth={1.75} />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="subhead">Görsel yüklenemedi</AppText>
          <AppText variant="bodySm" tone="soft">
            Bu soruya ait şekil ya da grafik var. Yeniden denemek için dokun.
          </AppText>
        </View>
      </Pressable>
    );
  }

  // Tam genişlik, en-boy oranı korunur; çok uzun görsel tavanda kırpılmaz, küçülüp ortalanır.
  const ratio = phase.size.width / phase.size.height;
  const naturalHeight = frameWidth > 0 ? frameWidth / ratio : SKELETON_HEIGHT;
  const height = Math.min(naturalHeight, MAX_HEIGHT);
  const width = height < naturalHeight ? height * ratio : frameWidth;

  return (
    <>
      <Pressable
        accessibilityRole={zoomable ? "imagebutton" : "image"}
        accessibilityLabel={zoomable ? `${alt}, büyütmek için dokun` : alt}
        disabled={!zoomable}
        onPress={() => setZoomOpen(true)}
        onLayout={(e) => setFrameWidth(e.nativeEvent.layout.width)}
        style={({ pressed }) => [frame, { backgroundColor: PAPER, alignItems: "center", opacity: pressed ? 0.92 : 1 }]}
      >
        {frameWidth > 0 ? <Image source={{ uri: url }} resizeMode="contain" style={{ width, height }} accessibilityIgnoresInvertColors /> : <View style={{ height: SKELETON_HEIGHT }} />}
        {zoomable ? (
          <View pointerEvents="none" style={{ position: "absolute", right: space.s2, bottom: space.s2, width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(17, 24, 39, 0.72)", alignItems: "center", justifyContent: "center" }}>
            <ZoomIn color="#FFFFFF" size={15} strokeWidth={2} />
          </View>
        ) : null}
      </Pressable>
      {zoomable ? <MediaZoom url={url} alt={alt} size={phase.size} open={zoomOpen} onClose={() => setZoomOpen(false)} /> : null}
    </>
  );
}

/**
 * Büyütme sayfası: beyaz kâğıt, iki parmakla 1×–4× yakınlaştırma. İki çıkış yolu: sağ üstte
 * kapat (44 pt) ve iOS sayfa kartının aşağı çekilmesi (`pageSheet`, HIG) — tek düğmeye bağımlı değil.
 */
function MediaZoom({ url, alt, size, open, onClose }: { url: string; alt: string; size: Size; open: boolean; onClose: () => void }) {
  const { space } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const ratio = size.width / size.height;
  const fitWidth = Math.min(screenWidth, screenHeight * ratio);
  const fitHeight = fitWidth / ratio;
  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose} onDismiss={onClose} presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: PAPER }}>
        <ScrollView
          minimumZoomScale={1}
          maximumZoomScale={4}
          bouncesZoom
          centerContent
          contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center" }}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          <Image source={{ uri: url }} resizeMode="contain" accessibilityLabel={alt} accessibilityIgnoresInvertColors style={{ width: fitWidth, height: fitHeight }} />
        </ScrollView>
        <View style={{ position: "absolute", top: space.s3, right: space.s3 }}>
          <IconButton icon={X} label="Görseli kapat" variant="secondary" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

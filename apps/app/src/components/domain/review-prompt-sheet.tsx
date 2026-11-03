import { Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ReviewPrompt } from "@/features/review-prompt/api";
import { useTheme } from "@/theme/ThemeProvider";
import { AppText, Button } from "@/components/ui";

/**
 * Mağaza değerlendirme alt sayfası (Doc 56; Figma 114:401 / 114:470 / 116:27).
 * Tutamak · etiket · Lora başlık · gövde · "Değerlendir" (birincil) · "Şimdi değil" (hayalet).
 * Başlıkta kapat ikonu yok: perdeye dokunmak ve sistem geri tuşu da "Şimdi değil" sayılır.
 * Fikir sormaz, yıldız göstermez; metinler sunucudan gelir (kural istemcide değil).
 */
export function ReviewPromptSheet({
  prompt,
  visible,
  busy = false,
  onRate,
  onDismiss,
}: {
  prompt: ReviewPrompt | null;
  visible: boolean;
  /** Yerel istem açılırken butonlar kilitlenir. */
  busy?: boolean;
  onRate: () => void;
  onDismiss: () => void;
}) {
  const { colors, radius, space } = useTheme();
  const insets = useSafeAreaInsets();
  if (!prompt) return null;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
      accessibilityViewIsModal
    >
      <Pressable
        accessibilityLabel="Kapat"
        accessibilityRole="button"
        onPress={onDismiss}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }}
      />
      <View
        testID="review-prompt-sheet"
        style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: radius.sheet,
          borderTopRightRadius: radius.sheet,
          paddingHorizontal: space.screenGutter,
          paddingTop: space.s2 + 2,
          paddingBottom: insets.bottom + space.s4,
          gap: space.s4,
        }}
      >
        <View style={{ alignItems: "center" }}>
          <View
            style={{
              width: 36,
              height: 5,
              borderRadius: 999,
              backgroundColor: colors.line,
            }}
          />
        </View>
        <View style={{ gap: space.s2, paddingTop: space.s2 }}>
          <AppText variant="label" tone="accentInk">
            {prompt.label}
          </AppText>
          <AppText variant="title" accessibilityRole="header">
            {prompt.title}
          </AppText>
          <AppText variant="body" tone="soft">
            {prompt.body}
          </AppText>
        </View>
        <Button
          title="Değerlendir"
          onPress={onRate}
          loading={busy}
          disabled={busy}
        />
        <Button
          title="Şimdi değil"
          variant="ghost"
          onPress={onDismiss}
          disabled={busy}
        />
      </View>
    </Modal>
  );
}

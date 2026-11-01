import { X } from "lucide-react-native";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { Modal, Platform, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { IconButton } from "./icon-button";
import { AppText } from "./temel";

/**
 * Alt sayfa (odak seçimi, filtre, onay). Tutamak + başlık + kapat; içerik kaydırılabilir.
 * Tam ekran oynatıcılar sheet değil, kök Stack ekranıdır (Doc 25 §7).
 */
export function Sheet({ visible, onClose, onDismissed, title, children, footer }: { visible: boolean; onClose: () => void; /** Kapanış animasyonu bitince (iOS); bir sonraki modalı/paylaşımı burada aç. */ onDismissed?: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const { colors, radius, space } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} onDismiss={onDismissed} accessibilityViewIsModal>
      <Pressable accessibilityLabel="Kapat" onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }} />
      <View
        style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: radius.sheet,
          borderTopRightRadius: radius.sheet,
          paddingBottom: insets.bottom + space.s4,
          maxHeight: "85%",
        }}
      >
        <View style={{ alignItems: "center", paddingTop: space.s2 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.line }} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: space.s5, paddingTop: space.s3, paddingBottom: space.s2 }}>
          <AppText variant="heading" style={{ flex: 1 }} accessibilityRole="header">
            {title}
          </AppText>
          <IconButton icon={X} label="Kapat" onPress={onClose} variant="ghost" />
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: space.s5, paddingBottom: space.s3, gap: space.s3 }}>{children}</ScrollView>
        {footer ? <View style={{ paddingHorizontal: space.s5, paddingTop: space.s2 }}>{footer}</View> : null}
      </View>
    </Modal>
  );
}

/**
 * Sheet'ten gezinme: iOS kapanmakta olan modalın üstüne sunum yapmaz (push/başka modal yutulur).
 * `closeThen` eylemi kapanış animasyonu bitince (`onDismissed`) koşar; Android'de hemen.
 * Kullanım: `<Sheet visible={s.visible} onClose={s.close} onDismissed={s.onDismissed}>`.
 */
export function useSheetAction() {
  const [visible, setVisible] = useState(false);
  const after = useRef<(() => void) | null>(null);
  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);
  const closeThen = useCallback((action: () => void) => {
    setVisible(false);
    if (Platform.OS === "ios") after.current = action;
    else action();
  }, []);
  const onDismissed = useCallback(() => {
    const a = after.current;
    after.current = null;
    a?.();
  }, []);
  return { visible, open, close, closeThen, onDismissed };
}

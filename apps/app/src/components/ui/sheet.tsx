import { X } from "lucide-react-native";
import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { IconButton } from "./icon-button";
import { AppText } from "./temel";

/**
 * Alt sayfa (odak seçimi, filtre, onay). Tutamak + başlık + kapat; içerik kaydırılabilir.
 * Tam ekran oynatıcılar sheet değil, kök Stack ekranıdır (Doc 25 §7).
 */
export function Sheet({ visible, onClose, title, children, footer }: { visible: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const { colors, radius, space } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} accessibilityViewIsModal>
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

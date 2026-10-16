import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Button, type ButtonVariant } from "./temel";

/**
 * Sabit eylem çubuğu (Yerleşim B, Doc 48/02): tek birincil eylem sekme çubuğunun üstünde,
 * içerik altında kaydırılırken yerinde kalır. Etiket ve davranış sunucudan gelen alandan
 * (todayTask.action) okunur; istemci kural bilmez.
 */
export function ActionBar({ title, onPress, loading, variant = "primary", secondary }: { title: string; onPress: () => void; loading?: boolean; variant?: ButtonVariant; secondary?: ReactNode }) {
  const { colors, space } = useTheme();
  return (
    <View style={{ paddingHorizontal: space.screenGutter, paddingTop: space.s3, paddingBottom: space.s3, backgroundColor: colors.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, gap: space.s2 }}>
      <Button title={title} onPress={onPress} loading={loading} variant={variant} />
      {secondary}
    </View>
  );
}

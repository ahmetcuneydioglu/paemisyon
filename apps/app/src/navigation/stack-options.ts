import type { Stack } from "expo-router";
import type { ComponentProps } from "react";
import { useTheme } from "@/theme/ThemeProvider";
import { fontFamily } from "@/theme/tokens";

type StackScreenOptions = Exclude<NonNullable<ComponentProps<typeof Stack>["screenOptions"]>, (...args: never[]) => unknown>;

/**
 * Sekme içi yığınların yerel başlık ayarı (Doc 25 §7: tab → liste → detay; başlıkta bağlam
 * etiketi, breadcrumb yok). iOS'ta sistem geri hareketi ve başlık; gölge yok.
 */
export function useStackOptions(): StackScreenOptions {
  const { colors } = useTheme();
  return {
    headerShown: true,
    headerStyle: { backgroundColor: colors.bg },
    headerShadowVisible: false,
    headerTintColor: colors.accentInk,
    headerTitleStyle: { fontFamily: fontFamily.body[600], fontSize: 17, color: colors.ink },
    headerBackButtonDisplayMode: "minimal",
    headerTitleAlign: "center",
    contentStyle: { backgroundColor: colors.bg },
  };
}

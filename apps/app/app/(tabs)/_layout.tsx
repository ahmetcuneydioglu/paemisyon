import { Tabs } from "expo-router";
import { BookOpen, ClipboardList, Home, Scale, User } from "lucide-react-native";
import type { ComponentType } from "react";
import { StyleSheet, type ColorValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { fontFamily, size } from "@/theme/tokens";

type IconProps = { color: string; size?: number; strokeWidth?: number };

/**
 * Anayasal beş sekme (Doc 25 §1; Doc 49 v2 kararı; 28 Eki 2026: Performans → Ben altına, yerine
 * Mevzuat): Bugün · Kütüphane · Denemeler · Mevzuat · Ben. Odak ekranları (seans, deneme) kök Stack'te açılır ve bu çubuğu görmez.
 * İkonlar Lucide, 24 ızgara, 1.75 kontur (Doc 48 ile aynı set).
 */
export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inkSubtle,
        tabBarLabelPosition: "below-icon",
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.line,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 56 + insets.bottom,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: fontFamily.body[600], fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={tab("Bugün", Home)} />
      <Tabs.Screen name="kutuphane" options={tab("Çalış", BookOpen)} />
      <Tabs.Screen name="denemeler" options={tab("Denemeler", ClipboardList)} />
      <Tabs.Screen name="mevzuat" options={tab("Mevzuat", Scale)} />
      <Tabs.Screen name="ben" options={tab("Ben", User)} />
    </Tabs>
  );
}

function tab(title: string, Icon: ComponentType<IconProps>) {
  return {
    title,
    tabBarAccessibilityLabel: `${title} sekmesi`,
    tabBarIcon: ({ color }: { color: ColorValue }) => <Icon color={String(color)} size={size.icon} strokeWidth={size.iconStroke} />,
  };
}

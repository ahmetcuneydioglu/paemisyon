import { Pressable, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { AppText } from "./temel";

export function ChoiceTabs({ value, options, onChange, label }: { value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; label: string }) {
  const { colors, radius, space } = useTheme();
  return <View accessibilityRole="tablist" accessibilityLabel={label} style={{ flexDirection: "row", gap: space.s2 }}>{options.map(o => <Pressable key={o.value} accessibilityRole="tab" accessibilityState={{ selected: o.value === value }} onPress={() => onChange(o.value)} style={({ pressed }) => ({ flex: 1, minHeight: 54, padding: space.s2, alignItems: "center", justifyContent: "center", borderRadius: radius.card, borderWidth: 1, borderColor: o.value === value ? colors.accent : colors.line, backgroundColor: o.value === value ? colors.accent : colors.surface, opacity: pressed ? 0.8 : 1 })}><AppText variant="subhead" tone={o.value === value ? "onAccent" : "ink"} style={{ textAlign: "center" }}>{o.label}</AppText></Pressable>)}</View>;
}

import { Pressable, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { AppText } from "./temel";

/**
 * `variant="segmented"`: iOS segment denetimi görünümü (surfaceAlt ray, seçili parça surface);
 * iki eşdeğer görünüm arasında geçiş için (Giriş yap / Kayıt ol). Varsayılan: dolgulu seçim kutuları.
 */
export function ChoiceTabs({ value, options, onChange, label, variant = "tiles" }: { value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; label: string; variant?: "tiles" | "segmented" }) {
  const { colors, radius, space } = useTheme();
  if (variant === "segmented")
    return (
      <View accessibilityRole="tablist" accessibilityLabel={label} style={{ flexDirection: "row", gap: 4, padding: 4, borderRadius: radius.control, backgroundColor: colors.surfaceAlt }}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable key={o.value} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => onChange(o.value)} style={{ flex: 1, minHeight: 40, alignItems: "center", justifyContent: "center", borderRadius: radius.control - 2, backgroundColor: on ? colors.surface : "transparent" }}>
              <AppText variant="subhead" tone={on ? "ink" : "soft"}>
                {o.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    );
  return <View accessibilityRole="tablist" accessibilityLabel={label} style={{ flexDirection: "row", gap: space.s2 }}>{options.map(o => <Pressable key={o.value} accessibilityRole="tab" accessibilityState={{ selected: o.value === value }} onPress={() => onChange(o.value)} style={({ pressed }) => ({ flex: 1, minHeight: 54, padding: space.s2, alignItems: "center", justifyContent: "center", borderRadius: radius.card, borderWidth: 1, borderColor: o.value === value ? colors.accent : colors.line, backgroundColor: o.value === value ? colors.accent : colors.surface, opacity: pressed ? 0.8 : 1 })}><AppText variant="subhead" tone={o.value === value ? "onAccent" : "ink"} style={{ textAlign: "center" }}>{o.label}</AppText></Pressable>)}</View>;
}

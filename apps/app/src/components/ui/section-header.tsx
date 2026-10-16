import { Pressable, View } from "react-native";
import { AppText } from "./temel";

/** Bölüm başlığı: sol heading, sağda isteğe bağlı bağlantı ("Tümü ›"). Her sekmede aynı anatomi. */
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
      <AppText variant="heading" accessibilityRole="header" style={{ flex: 1 }}>
        {title}
      </AppText>
      {action && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <AppText variant="subhead" tone="accentInk">
            {action}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

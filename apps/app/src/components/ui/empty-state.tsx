import type { ComponentType, ReactNode } from "react";
import { View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { AppText } from "./temel";

type IconProps = { color: string; size?: number; strokeWidth?: number };

/** Boş / veri yok durumu: ikon, başlık, bir cümle, isteğe bağlı eylem. "Henüz yeterli veri yok" dili. */
export function EmptyState({ icon: Icon, title, body, action }: { icon?: ComponentType<IconProps>; title: string; body?: string; action?: ReactNode }) {
  const { colors, space, radius } = useTheme();
  return (
    <View style={{ alignItems: "center", paddingVertical: space.s8, paddingHorizontal: space.s5, gap: space.s3 }}>
      {Icon ? (
        <View style={{ width: 56, height: 56, borderRadius: radius.card, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" }}>
          <Icon color={colors.inkSoft} size={26} strokeWidth={1.75} />
        </View>
      ) : null}
      <AppText variant="heading" style={{ textAlign: "center" }}>
        {title}
      </AppText>
      {body ? (
        <AppText variant="bodySm" tone="soft" style={{ textAlign: "center" }}>
          {body}
        </AppText>
      ) : null}
      {action ? <View style={{ marginTop: space.s2, alignSelf: "stretch" }}>{action}</View> : null}
    </View>
  );
}

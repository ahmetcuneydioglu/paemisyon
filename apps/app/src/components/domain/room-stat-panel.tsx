import type { ReactNode } from "react";
import { View } from "react-native";
import { AppText } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Oda durum paneli (Doc 49/14): lacivert panel (iki temada da koyu), solda büyük serif yüzde
 * ve alt satır, sağda iki küçük satır ya da rozet. Yüzde yoksa "—" değil, "Henüz çözülmedi".
 */
export function RoomStatPanel({ pct, sub, right, label }: { pct: number | null; sub: string; right?: ReactNode; label?: string | null }) {
  const { colors, radius, space, type } = useTheme();
  return (
    <View style={{ backgroundColor: colors.panel, borderRadius: radius.panel, padding: space.s4, gap: space.s1 }}>
      {label ? (
        <AppText variant="label" tone="panelSoft">
          {label}
        </AppText>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: space.s3 }}>
        <View style={{ gap: 2, minWidth: 0, flexShrink: 1 }}>
          {pct == null ? (
            <AppText variant="heading" tone="panelInk" style={{ fontFamily: type.display.fontFamily }}>
              Henüz çözülmedi
            </AppText>
          ) : (
            <AppText variant="display" tone="gold" style={{ fontSize: 44, lineHeight: 48 }}>
              %{pct}
            </AppText>
          )}
          <AppText variant="bodySm" tone="panelSoft">
            {sub}
          </AppText>
        </View>
        {right ? <View style={{ alignItems: "flex-end", gap: 4, flexShrink: 0 }}>{right}</View> : null}
      </View>
    </View>
  );
}

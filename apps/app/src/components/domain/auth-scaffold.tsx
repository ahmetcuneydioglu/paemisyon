import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/ui";
import { LEGAL } from "@/lib/site";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Giriş akışının form iskeleti (Figma "Yayın Öncesi — Açılış": E-posta, Kayıt, Şifremi unuttum,
 * Doğrula): üstte "‹ Geri" (44 pt), serif başlık + açıklama, kaydırılabilir gövde (klavye açılınca
 * içerik iOS'ta kendiliğinden yukarı kayar), altta isteğe bağlı sabit alan (yasal not, ikincil
 * bağlantı). Gezinme kök kapıdadır; bu iskelet yalnız geri gider.
 */
export function AuthScaffold({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, space } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: space.screenGutter - 8, minHeight: 44, flexDirection: "row", alignItems: "center" }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Geri" onPress={() => router.back()} hitSlop={8} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", minHeight: 44, paddingHorizontal: 8, opacity: pressed ? 0.6 : 1 })}>
          <ChevronLeft size={24} color={colors.accentInk} strokeWidth={1.75} />
          <AppText variant="body" tone="accentInk">
            Geri
          </AppText>
        </Pressable>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: space.screenGutter, paddingTop: space.s4, paddingBottom: space.s6, gap: space.s6 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        <View style={{ gap: space.s2 }}>
          <AppText variant="title" accessibilityRole="header">
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="bodySm" tone="soft">
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {children}
        {footer ? <View style={{ marginTop: "auto", paddingBottom: insets.bottom }}>{footer}</View> : null}
      </ScrollView>
    </View>
  );
}

/** "Devam ederek Kullanım Koşulları ve Gizlilik Politikası’nı kabul edersin." — bağlantılar web'de açılır. */
export function LegalNote({ lead = "Devam ederek" }: { lead?: string }) {
  const { space } = useTheme();
  const link = (label: string, url: string) => (
    <AppText variant="bodySm" tone="accentInk" accessibilityRole="link" onPress={() => void Linking.openURL(url)} style={{ textDecorationLine: "underline" }}>
      {label}
    </AppText>
  );
  return (
    <AppText variant="bodySm" tone="subtle" style={{ textAlign: "center", paddingHorizontal: space.s2 }}>
      {lead} {link("Kullanım Koşulları", LEGAL.terms)} ve {link("Gizlilik Politikası", LEGAL.privacy)}’nı kabul edersin.
    </AppText>
  );
}

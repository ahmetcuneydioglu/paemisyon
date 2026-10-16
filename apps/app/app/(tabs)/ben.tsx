import { useRouter } from "expo-router";
import { View } from "react-native";
import { AppText, Button, Card, Screen } from "@/components/ui";
import { useMe } from "@/features/home/queries";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTheme, type ThemePreference } from "@/theme/ThemeProvider";

/** Ben — F1: hesap özeti, tema tercihi, çıkış. Profil, rozetler, üyelik ve ayarlar F4'te. */
export default function BenScreen() {
  const auth = useAuth();
  const me = useMe();
  const router = useRouter();
  const { preference, setPreference, space } = useTheme();
  const options: { value: ThemePreference; label: string }[] = [
    { value: "system", label: "Sistem" },
    { value: "dark", label: "Koyu" },
    { value: "light", label: "Açık" },
  ];
  return (
    <Screen>
      <AppText variant="title">Ben</AppText>
      <Card>
        <AppText variant="label" tone="subtle">
          Hesap
        </AppText>
        <AppText variant="subhead">{me.data?.displayName ?? "—"}</AppText>
        <AppText variant="bodySm" tone="soft">
          {me.data?.email ?? auth.session?.user.email ?? ""}
        </AppText>
      </Card>
      <Card>
        <AppText variant="label" tone="subtle">
          Görünüm
        </AppText>
        <View style={{ flexDirection: "row", gap: space.s2 }}>
          {options.map((o) => (
            <Button key={o.value} title={o.label} variant={preference === o.value ? "primary" : "secondary"} style={{ flex: 1, minHeight: 44 }} onPress={() => setPreference(o.value)} />
          ))}
        </View>
      </Card>
      {__DEV__ ? (
        <Card>
          <AppText variant="label" tone="subtle">
            Geliştirici
          </AppText>
          <Button title="Bileşen galerisi" variant="secondary" onPress={() => router.push("/galeri")} />
        </Card>
      ) : null}
      <Button title="Çıkış yap" variant="ghost" onPress={() => void auth.signOut()} />
    </Screen>
  );
}

import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { AuthScaffold } from "@/components/domain";
import { Button, Notice, TextField } from "@/components/ui";
import { requestPasswordReset } from "@/lib/auth/email";
import { epostaDenetle } from "@/lib/eposta";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Şifremi unuttum (Figma "Giriş / Şifremi unuttum"): yenileme bağlantısı paemisyon.com'da açılır
 * (`/auth/callback?next=/sifre-yenile`, web'in sayfası); kullanıcı yeni şifreyle uygulamaya döner.
 * Bildirim hesabın varlığını ifşa etmez (web ile aynı cümle). Gönderimden sonra düğme "Girişe dön"
 * olur; aynı adrese art arda istek Supabase oran sınırına takılır, o hata gösterilir.
 */
export default function SifremiUnuttumScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ eposta?: string }>();
  const { space } = useTheme();
  const [email, setEmail] = useState(params.eposta ?? "");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const denetim = epostaDenetle(email);

  async function submit() {
    setTried(true);
    setError(null);
    if (denetim.durum === "gecersiz") return;
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bağlantı gönderilemedi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScaffold title="Şifreni yenile" subtitle="Hesabının e-posta adresini yaz; yenileme bağlantısını gönderelim. Bağlantı paemisyon.com’da açılır, yeni şifrenle uygulamaya dönersin.">
      <View style={{ gap: space.s4 }}>
        {error ? <Notice tone="error">{error}</Notice> : null}
        <TextField
          label="E-posta"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            setSent(false);
          }}
          error={tried && denetim.durum === "gecersiz" ? denetim.mesaj : null}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="send"
          onSubmitEditing={() => void submit()}
        />
        {sent ? <Notice tone="success">Bu adresle bir hesap varsa yenileme bağlantısı gönderildi. Gelen kutunu (ve gereksiz klasörünü) kontrol et.</Notice> : null}
      </View>
      {sent ? <Button title="Girişe dön" onPress={() => router.back()} /> : <Button title="Bağlantıyı gönder" loading={busy} onPress={() => void submit()} />}
    </AuthScaffold>
  );
}

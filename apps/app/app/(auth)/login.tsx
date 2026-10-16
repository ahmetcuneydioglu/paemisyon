import { useState } from "react";
import { Platform, View } from "react-native";
import { AppText, Button, Notice, Screen, TextField } from "@/components/ui";
import { signInWithProvider, SocialSignInCancelled, type SocialProvider } from "@/lib/auth/social";
import { env } from "@/lib/env";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Giriş (F1 iskelet): e-posta + şifre, Apple (iOS) ve Google. Kayıt, şifre sıfırlama ve
 * e-posta doğrulama F4'te. Yönlendirme kök kapıda; bu ekran yalnız oturum açar.
 */
export default function LoginScreen() {
  const { space } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"email" | SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(kind: "email" | SocialProvider, fn: () => Promise<void>) {
    setError(null);
    setBusy(kind);
    try {
      await fn();
    } catch (e) {
      if (!(e instanceof SocialSignInCancelled)) setError(e instanceof Error ? e.message : "Giriş tamamlanamadı.");
    } finally {
      setBusy(null);
    }
  }

  const emailValid = /\S+@\S+\.\S+/.test(email) && password.length >= 6;

  return (
    <Screen>
      <View style={{ gap: space.s2, marginTop: space.s8 }}>
        <AppText variant="label" tone="accent">
          Paemisyon
        </AppText>
        <AppText variant="title">Nöbete hoş geldin</AppText>
        <AppText variant="bodySm" tone="soft">
          Hesabınla gir; kaldığın yerden devam edersin.
        </AppText>
      </View>

      {error ? <Notice tone="error">{error}</Notice> : null}

      <View style={{ gap: space.s4 }}>
        <TextField label="E-posta" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
        <TextField label="Şifre" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" textContentType="password" />
        <Button
          title="Giriş yap"
          loading={busy === "email"}
          disabled={!emailValid || busy !== null}
          onPress={() =>
            run("email", async () => {
              const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
              if (err) throw new Error(err.message === "Invalid login credentials" ? "E-posta ya da şifre hatalı." : err.message);
            })
          }
        />
      </View>

      <View style={{ gap: space.s3 }}>
        {Platform.OS === "ios" ? (
          <Button title="Apple ile devam et" variant="secondary" loading={busy === "apple"} disabled={busy !== null} onPress={() => run("apple", () => signInWithProvider("apple"))} />
        ) : null}
        {env?.googleWebClientId ? (
          <Button title="Google ile devam et" variant="secondary" loading={busy === "google"} disabled={busy !== null} onPress={() => run("google", () => signInWithProvider("google"))} />
        ) : null}
      </View>
    </Screen>
  );
}

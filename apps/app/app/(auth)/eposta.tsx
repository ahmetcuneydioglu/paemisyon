import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState, type ComponentRef } from "react";
import { Pressable, type TextInput, View } from "react-native";
import { AuthScaffold, LegalNote } from "@/components/domain";
import { AppText, Button, ChoiceTabs, Notice, TextField } from "@/components/ui";
import { EmailNotConfirmed, MIN_PASSWORD, signInWithEmail, signUpWithEmail } from "@/lib/auth/email";
import { epostaDenetle } from "@/lib/eposta";
import { useTheme } from "@/theme/ThemeProvider";

type Mode = "giris" | "kayit";

/**
 * E-postayla giriş / kayıt (Figma "Yayın Öncesi — Açılış": E-posta ile giriş, Kayıt ol). Tek ekran,
 * segmentle iki kip; e-posta ve şifre kipler arasında korunur. Kurallar web ile aynı: ad soyad ≥2,
 * şifre ≥8, adres `epostaDenetle` (yazım hatası ENGELLEMEZ, öneri sunar; dokununca düzeltir).
 * Hatalar gönderimden sonra alan altında; sunucu hatası üstte bildirim. Doğrulanmamış hesapla
 * girişte ve doğrulama isteyen kayıtta "E-postanı doğrula" ekranına geçilir.
 */
export default function EpostaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mod?: string; eposta?: string }>();
  const { space } = useTheme();
  const [mode, setMode] = useState<Mode>(params.mod === "kayit" ? "kayit" : "giris");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(params.eposta ?? "");
  const [password, setPassword] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<ComponentRef<typeof TextInput>>(null);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  const kayit = mode === "kayit";
  const denetim = epostaDenetle(email);
  const nameError = kayit && tried && name.trim().length < 2 ? "Ad soyad zorunludur." : null;
  const emailError = tried && denetim.durum === "gecersiz" ? denetim.mesaj : null;
  const passwordError = tried ? (password.length === 0 ? "Şifre zorunludur." : kayit && password.length < MIN_PASSWORD ? `Şifre en az ${MIN_PASSWORD} karakter olmalı.` : null) : null;

  async function submit() {
    setTried(true);
    setError(null);
    if ((kayit && name.trim().length < 2) || denetim.durum === "gecersiz" || password.length === 0 || (kayit && password.length < MIN_PASSWORD)) return;
    setBusy(true);
    try {
      if (kayit) {
        const { verify } = await signUpWithEmail(name, email, password);
        if (verify) router.replace({ pathname: "/(auth)/dogrula", params: { eposta: email.trim() } });
      } else {
        await signInWithEmail(email, password);
      }
      // Oturum açıldıysa kök kapı onboarding'e ya da Bugün'e geçirir.
    } catch (e) {
      if (e instanceof EmailNotConfirmed) router.push({ pathname: "/(auth)/dogrula", params: { eposta: email.trim() } });
      else setError(e instanceof Error ? e.message : "İşlem tamamlanamadı.");
    } finally {
      setBusy(false);
    }
  }

  const switchMode = (m: string) => {
    setMode(m as Mode);
    setTried(false);
    setError(null);
  };

  return (
    <AuthScaffold title="E-postayla devam et" subtitle="Hesabın varsa giriş yap, yoksa birkaç saniyede oluştur." footer={kayit ? <LegalNote lead="Hesap oluşturarak" /> : undefined}>
      <ChoiceTabs
        variant="segmented"
        label="Giriş ya da kayıt"
        value={mode}
        onChange={switchMode}
        options={[
          { value: "giris", label: "Giriş yap" },
          { value: "kayit", label: "Kayıt ol" },
        ]}
      />

      <View style={{ gap: space.s4 }}>
        {error ? <Notice tone="error">{error}</Notice> : null}
        {kayit ? (
          <TextField label="Ad soyad" value={name} onChangeText={setName} error={nameError} autoComplete="name" textContentType="name" autoCapitalize="words" returnKeyType="next" onSubmitEditing={() => emailRef.current?.focus()} />
        ) : null}
        <TextField
          ref={emailRef}
          label="E-posta"
          value={email}
          onChangeText={setEmail}
          error={emailError}
          hint={
            denetim.durum === "oneri" ? (
              <Pressable accessibilityRole="button" accessibilityLabel={`${denetim.oneri} olarak düzelt`} onPress={() => setEmail(denetim.oneri)} hitSlop={8} style={{ minHeight: 32, justifyContent: "center" }}>
                <AppText variant="bodySm" tone="accentInk">
                  {denetim.mesaj} <AppText variant="subhead" tone="accentInk" style={{ fontSize: 14 }}>Düzelt</AppText>
                </AppText>
              </Pressable>
            ) : undefined
          }
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType={kayit ? "username" : "emailAddress"}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <TextField
          ref={passwordRef}
          label="Şifre"
          value={password}
          onChangeText={setPassword}
          error={passwordError}
          placeholder={kayit ? `En az ${MIN_PASSWORD} karakter` : undefined}
          secureTextEntry
          revealable
          autoComplete={kayit ? "new-password" : "current-password"}
          textContentType={kayit ? "newPassword" : "password"}
          passwordRules={kayit ? `minlength: ${MIN_PASSWORD};` : undefined}
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
        />
        {!kayit ? (
          <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: "/(auth)/sifremi-unuttum", params: { eposta: email.trim() } })} hitSlop={8} style={{ alignSelf: "flex-end", minHeight: 44, justifyContent: "center" }}>
            <AppText variant="subhead" tone="accentInk">
              Şifremi unuttum
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <Button title={kayit ? "Hesap oluştur" : "Giriş yap"} loading={busy} onPress={() => void submit()} />
    </AuthScaffold>
  );
}

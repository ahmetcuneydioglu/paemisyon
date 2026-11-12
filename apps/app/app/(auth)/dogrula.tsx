import { useLocalSearchParams, useRouter } from "expo-router";
import { MailCheck } from "lucide-react-native";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { AuthScaffold } from "@/components/domain";
import { AppText, Button, Notice } from "@/components/ui";
import { resendConfirmation } from "@/lib/auth/email";
import { useTheme } from "@/theme/ThemeProvider";

const RESEND_COOLDOWN_S = 60;

/**
 * E-postanı doğrula (Figma "Giriş / E-postanı doğrula"): kayıttan sonra ya da doğrulanmamış
 * hesapla girişte. Bağlantı paemisyon.com'da açılır; kullanıcı dönünce buradan giriş yapar.
 * "Yeniden gönder" 60 sn bekletilir (Supabase e-posta oran sınırı; boşuna hata göstermeyelim).
 */
export default function DogrulaScreen() {
  const router = useRouter();
  const { eposta = "" } = useLocalSearchParams<{ eposta?: string }>();
  const { colors, space, radius } = useTheme();
  const [wait, setWait] = useState(RESEND_COOLDOWN_S);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function resend() {
    setBusy(true);
    setNotice(null);
    try {
      await resendConfirmation(eposta);
      setNotice({ tone: "success", text: "Doğrulama e-postası yeniden gönderildi." });
      setWait(RESEND_COOLDOWN_S);
    } catch (e) {
      setNotice({ tone: "error", text: e instanceof Error ? e.message : "Gönderilemedi." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScaffold title="E-postanı kontrol et">
      <View style={{ gap: space.s4, alignItems: "flex-start" }}>
        <View style={{ width: 64, height: 64, borderRadius: radius.pill, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }} accessibilityElementsHidden>
          <MailCheck size={30} color={colors.accentInk} strokeWidth={1.5} />
        </View>
        <AppText variant="body" tone="soft">
          {eposta ? (
            <>
              <AppText variant="subhead">{eposta}</AppText> adresine doğrulama bağlantısı gönderdik.
            </>
          ) : (
            "E-posta adresine doğrulama bağlantısı gönderdik."
          )}{" "}
          Bağlantıya dokun, sonra buradan giriş yap.
        </AppText>
        <AppText variant="bodySm" tone="subtle">
          Birkaç dakikada gelmezse gereksiz (spam) klasörüne bak.
        </AppText>
        {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}
      </View>
      <View style={{ gap: space.s3 }}>
        <Button title="Giriş yap" onPress={() => router.replace({ pathname: "/(auth)/eposta", params: { mod: "giris", eposta } })} />
        <Button title={wait > 0 ? `Yeniden gönder (${wait} sn)` : "Bağlantıyı yeniden gönder"} variant="ghost" disabled={wait > 0 || !eposta} loading={busy} onPress={() => void resend()} />
      </View>
    </AuthScaffold>
  );
}

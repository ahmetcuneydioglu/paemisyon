import { type AuthError } from "@supabase/supabase-js";
import { authRedirectUrl } from "@/lib/site";
import { supabase } from "@/lib/supabase";

/**
 * E-posta ile kimlik (web `app/(auth)/actions.ts` ile aynı kurallar): şifre en az 8 karakter,
 * kayıtta ad soyad `display_name` olarak yazılır, doğrulama ve şifre yenileme bağlantıları
 * paemisyon.com'da açılır (izinli köken). Kullanıcıya Supabase'in İngilizce metni gösterilmez.
 */
export const MIN_PASSWORD = 8;

export class EmailNotConfirmed extends Error {
  constructor() {
    super("E-posta adresin henüz doğrulanmadı.");
    this.name = "EmailNotConfirmed";
  }
}

function tr(error: AuthError | Error): Error {
  const code = "code" in error ? (error.code as string | undefined) : undefined;
  const msg = error.message.toLowerCase();
  if (code === "email_not_confirmed" || msg.includes("email not confirmed")) return new EmailNotConfirmed();
  if (code === "invalid_credentials" || msg.includes("invalid login credentials")) return new Error("E-posta ya da şifre hatalı.");
  if (code === "user_already_exists" || msg.includes("already registered")) return new Error("Bu e-postayla zaten bir hesap var. Giriş yap ya da şifreni yenile.");
  if (code === "weak_password" || msg.includes("password should")) return new Error(`Şifre en az ${MIN_PASSWORD} karakter olmalı.`);
  if (code?.startsWith("over_") || msg.includes("rate limit") || msg.includes("security purposes")) return new Error("Çok sık denedin. Bir dakika sonra yeniden dene.");
  if (msg.includes("network") || msg.includes("fetch")) return new Error("Bağlantı kurulamadı. İnternetini kontrol edip yeniden dene.");
  return new Error("İşlem tamamlanamadı. Biraz sonra yeniden dene.");
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw tr(error);
}

/** `verify: true` → doğrulama e-postası gitti, oturum yok (Supabase "Confirm email" açık). */
export async function signUpWithEmail(name: string, email: string, password: string): Promise<{ verify: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { display_name: name.trim() }, emailRedirectTo: authRedirectUrl("/bugun") },
  });
  if (error) throw tr(error);
  return { verify: !data.session };
}

export async function resendConfirmation(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({ type: "signup", email: email.trim(), options: { emailRedirectTo: authRedirectUrl("/bugun") } });
  if (error) throw tr(error);
}

/** Hesabın varlığını ifşa etmez: hata olmasa da olsa da aynı bildirim gösterilir (web ile aynı). */
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: authRedirectUrl("/sifre-yenile") });
  if (error && (error.code?.startsWith("over_") || error.message.toLowerCase().includes("rate limit"))) throw tr(error);
}

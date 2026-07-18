"use server";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { authRedirectUrl, safeNext } from "@/lib/auth";
import { config } from "@/lib/config";

/** Kimlik server action'ları — Supabase Auth (tüm platformlarla ORTAK hesap, Doc 18 §7). */

export type AuthState = {
  error?: string;
  notice?: string;
  email?: string;
  verificationRequired?: boolean;
};

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  if (!email || !password) return { error: "E-posta ve şifre zorunludur." };

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "E-posta veya şifre hatalı." };
  redirect(next);
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (name.length < 2) return { error: "Ad Soyad zorunludur." };
  if (!email || password.length < 8)
    return { error: "Geçerli e-posta ve en az 8 karakterli şifre gir." };

  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name },
      emailRedirectTo: authRedirectUrl(config.siteUrl, "/bugun"),
    },
  });
  if (error) return { error: "Kayıt başarısız: " + error.message };
  if (data.session) redirect("/bugun");
  return {
    notice:
      "Hesabın oluşturuldu. E-postandaki doğrulama bağlantısına dokun, sonra giriş yap.",
    email,
    verificationRequired: true,
  };
}

export async function resendConfirmation(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "E-posta adresini gir." };
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: authRedirectUrl(config.siteUrl, "/bugun") },
  });
  if (error)
    return {
      error: "Doğrulama e-postası gönderilemedi. Biraz sonra tekrar dene.",
    };
  return { notice: "Doğrulama e-postası yeniden gönderildi.", email };
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "E-posta adresini gir." };
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: authRedirectUrl(config.siteUrl, "/sifre-yenile"),
  });
  if (error)
    return {
      error: "Sıfırlama bağlantısı gönderilemedi. Biraz sonra tekrar dene.",
    };
  // Hesabın varlığını ifşa etmeyen ortak mesaj.
  return {
    notice: "Bu adresle bir hesap varsa şifre yenileme bağlantısı gönderildi.",
  };
}

export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (password.length < 8) return { error: "Şifre en az 8 karakter olmalı." };
  if (password !== confirmation) return { error: "Şifreler eşleşmiyor." };
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user)
    return { error: "Şifre yenileme oturumu bulunamadı. Yeni bağlantı iste." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error)
    return { error: "Şifre güncellenemedi. Bağlantı süresi dolmuş olabilir." };
  return {
    notice: "Şifren güncellendi. Artık yeni şifrenle giriş yapabilirsin.",
  };
}

export async function signOut() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/");
}

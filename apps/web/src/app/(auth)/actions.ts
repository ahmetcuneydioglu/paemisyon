"use server";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { authRedirectUrl, safeNext } from "@/lib/auth";
import { config } from "@/lib/config";
import { alanAdi, epostaDenetle } from "@/lib/eposta";
import { alanTeslimEdilemezMi } from "@/lib/eposta-dns";

/** Kimlik server action'ları — Supabase Auth (tüm platformlarla ORTAK hesap, Doc 18 §7). */

export type AuthState = {
  error?: string;
  notice?: string;
  email?: string;
  verificationRequired?: boolean;
  /** Hata dönerken formu yeniden doldurmak için (React 19 formu sıfırlıyor). */
  name?: string;
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
  if (name.length < 2) return { error: "Ad Soyad zorunludur.", email, name };
  if (password.length < 8)
    return { error: "Şifre en az 8 karakter olmalı.", email, name };

  // Adres denetimi Supabase'e GİTMEDEN önce: yanlış yazılmış her adres bir
  // doğrulama maili ve ardından bir bounce demek (Supabase 3 Eylül 2026 uyarısı).
  // Yazım hatası önerisi burada DEĞİL, istemcide: engelleyici olmadığı için
  // sunucuya gidip dönmesi gereksiz, üstelik React 19 action sonrası formu
  // sıfırladığı için kullanıcının yazdığı ad ve şifre siliniyordu.
  const denetim = epostaDenetle(email);
  if (denetim.durum === "gecersiz") return { error: denetim.mesaj, email, name };
  if (await alanTeslimEdilemezMi(alanAdi(email))) {
    return {
      error: `"${alanAdi(email)}" adresine e-posta ulaşamıyor. Adresi kontrol et.`,
      email,
      name,
    };
  }

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
  const denetim = epostaDenetle(email);
  // Burada yalnız BİÇİM denetlenir: yazım hatası önerisi ya da DNS denetimi
  // yok. Bu akışlara mevcut kullanıcılar da girer; onları kendi hesaplarından
  // kilitlememek için kural kayıttan daha gevşek.
  if (denetim.durum === "gecersiz") return { error: denetim.mesaj, email };
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
  const denetim = epostaDenetle(email);
  if (denetim.durum === "gecersiz") return { error: denetim.mesaj, email };
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

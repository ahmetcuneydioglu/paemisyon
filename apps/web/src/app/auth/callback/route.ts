import { isAuthPKCECodeVerifierMissingError, type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { safeNext } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Supabase PKCE kodunu (e-posta onayı VE Google/Apple OAuth) veya SSR
 * token_hash'ini cookie oturumuna çevirir. Tüm sağlayıcılar aynı callback'i
 * kullanır — akış tek merkezde.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const next = safeNext(params.get("next"));

  // Sağlayıcı hatayla döndüyse (kullanıcı iptal etti / yetki reddi): iptalde
  // sessizce giriş sayfasına, gerçek hatada hata sayfasına. Ham mesaj sızmaz.
  const providerError = params.get("error");
  if (providerError) {
    const cancelled = /access_denied|cancel/i.test(providerError);
    return NextResponse.redirect(
      new URL(cancelled ? "/giris" : "/auth-hatasi", request.url),
    );
  }

  const supabase = await supabaseServer();

  let error: unknown = null;
  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    }));
  } else {
    error = new Error("Doğrulama kodu yok.");
  }

  // PKCE kodu BAŞKA bir istemcide (mobil uygulama) üretildiyse eşleşen verifier bu
  // tarayıcıda yoktur ve oturum buraya taşınamaz (11 Kas 2026, mobil kayıt E2E).
  // Doğrulama e-postasında hesap Supabase /verify adımında ZATEN doğrulanmıştır;
  // kullanıcıya genel hata yerine durumunu söyleyen sayfa gösterilir. Kalıcı çözüm
  // e-posta şablonlarının token_hash bağlantısına geçmesidir (yukarıdaki dal).
  if (code && isAuthPKCECodeVerifierMissingError(error)) {
    const url = new URL("/auth-hatasi", request.url);
    url.searchParams.set("neden", "baska-cihaz");
    url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  const destination = new URL(error ? "/auth-hatasi" : next, request.url);
  return NextResponse.redirect(destination);
}

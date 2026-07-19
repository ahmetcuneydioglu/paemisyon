/**
 * Sosyal giriş sağlayıcıları — TEK MERKEZ (web + ileride mobil ortak kullanır).
 * Kimlik doğrulama Supabase Auth üzerinden; her kullanıcı tek auth.users kaydı,
 * app kullanıcı id'si = Supabase uid (ayrı profiles tablosu yok, JIT provisioning).
 * Yeni sağlayıcı eklemek = buraya bir satır; buton/akış otomatik türer.
 */
export const OAUTH_PROVIDERS = [
  { id: "google", label: "Google ile devam et" },
  { id: "apple", label: "Apple ile devam et" },
] as const;

export type OAuthProviderId = (typeof OAUTH_PROVIDERS)[number]["id"];

/**
 * OAuth callback dönüş adresi — İSTEMCİDEN türetilir (window.location.origin) ki
 * localhost / Vercel preview / prod hepsinde tutarlı çalışsın; sabit domain gömülmez.
 * `next` yalnız uygulama-içi göreli yol olabilir (open-redirect koruması callback'te).
 */
export function oauthRedirectTo(origin: string, next: string): string {
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("next", next);
  return url.toString();
}

/**
 * Ham Supabase/OAuth hatalarını kullanıcıya GÖSTERME — sade Türkçe mesaja çevir.
 * Teknik ayrıntı konsola/loga kalır. Bilinmeyen hatalar için güvenli genel mesaj.
 */
export function authErrorMessage(
  provider: OAuthProviderId,
  raw?: string | null,
): string {
  const name = provider === "google" ? "Google" : "Apple";
  const r = (raw ?? "").toLowerCase();
  if (r.includes("not enabled") || r.includes("unsupported") || r.includes("provider"))
    return `${name} ile giriş şu an kullanılamıyor. Lütfen daha sonra tekrar deneyin.`;
  if (r.includes("popup") || r.includes("redirect"))
    return `${name} penceresi açılamadı. Tarayıcı engellemesini kaldırıp tekrar deneyin.`;
  if (r.includes("cancel") || r.includes("access_denied"))
    return "Giriş işlemi iptal edildi.";
  return `${name} ile giriş başlatılamadı. Lütfen tekrar deneyin.`;
}

/** Callback tarafındaki (sağlayıcıdan dönen) hata kodunu sade mesaja çevirir. */
export function callbackErrorMessage(errorCode?: string | null): string {
  const r = (errorCode ?? "").toLowerCase();
  if (r.includes("access_denied") || r.includes("cancel"))
    return "Giriş işlemi iptal edildi.";
  if (r.includes("email") && r.includes("exist"))
    return "Bu e-posta adresi başka bir giriş yöntemiyle kullanılıyor.";
  return "Oturum oluşturulamadı. Lütfen tekrar deneyin.";
}

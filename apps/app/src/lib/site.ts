/**
 * paemisyon.com adresleri (uygulama içinden açılan web sayfaları ve Supabase yönlendirmeleri).
 * Yönlendirme kökeni Supabase'in izinli adres listesinde KAYITLI olmalı; web ile aynı köken
 * (`apps/web/src/lib/config.ts` siteUrl) kullanılır, yoksa doğrulama/sıfırlama bağlantısı kırılır.
 */
export const SITE_URL = "https://paemisyon.com";

export const LEGAL = {
  terms: `${SITE_URL}/kosullar`,
  privacy: `${SITE_URL}/gizlilik`,
} as const;

/** Web'in `authRedirectUrl`'i ile aynı biçim: `/auth/callback?next=<yol>`. */
export function authRedirectUrl(next: string): string {
  return `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`;
}

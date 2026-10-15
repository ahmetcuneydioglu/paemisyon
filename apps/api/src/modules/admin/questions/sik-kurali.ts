/** Beş şık kuralı (8 Eyl 2026, Doc 49 A0 / T2): yeni her soru A–E. */
export const SIK_SAYISI = 5;

/**
 * Şık sayısı kuralı. Yeni soruda tam `hedef` şık. Düzenlemede (`mevcut`
 * verilmiş) soru zaten daha az şıklıysa aynı sayı korunabilir: artırmak
 * serbest, azaltmak yasak. Hata yoksa null döner.
 */
export function sikKuraliHatasi(
  sikSayisi: number,
  hedef: number = SIK_SAYISI,
  mevcut?: number,
): string | null {
  const izinli = mevcut !== undefined && mevcut < hedef ? mevcut : hedef;
  if (sikSayisi === hedef || sikSayisi === izinli) return null;
  return izinli === hedef
    ? `Yeni soru tam ${hedef} şık içermeli (A–E).`
    : `Soru ${hedef} şıka tamamlanmalı ya da mevcut ${izinli} şık korunmalı.`;
}

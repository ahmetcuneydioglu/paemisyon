import { Resolver } from "node:dns/promises";

/**
 * "Bu alan adı posta kabul ediyor mu?" — kayıt anında DNS'e bakar.
 *
 * Biçim denetiminin yakalayamadığı tek şey budur: "gmial.com" kusursuz biçimde
 * yazılmış ama var olmayan bir alan adıdır. MX kaydı yoksa RFC 5321 §5.1
 * gereği A kaydına düşülür (eski usul teslimat), o da yoksa adres teslim
 * edilemez demektir.
 *
 * FAIL-OPEN: DNS yavaşlar, zaman aşımına uğrar ya da geçici hata verirse kayıt
 * ENGELLENMEZ. Aksi halde DNS'in takıldığı bir dakikada hiç kimse kaydolamaz —
 * bounce'tan çok daha pahalı bir arıza olurdu. Yalnız "bu alan adı YOK" cevabı
 * (NXDOMAIN/ENODATA) engeller.
 *
 * Yalnız sunucuda çalışır (node:dns).
 */

const ZAMAN_ASIMI_MS = 2500;
/** Süreç ömrü boyunca alan adı → teslim edilemez mi? (aynı sağlayıcı tekrar sorulmaz) */
const onbellek = new Map<string, boolean>();

const YOK = new Set(["ENOTFOUND", "ENODATA", "NXDOMAIN"]);
const hataKodu = (e: unknown) =>
  typeof e === "object" && e !== null && "code" in e
    ? String((e as { code?: unknown }).code)
    : "";

async function sureliSor<T>(is: Promise<T>): Promise<T | "zaman-asimi"> {
  let zamanlayici: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      is,
      new Promise<"zaman-asimi">((coz) => {
        zamanlayici = setTimeout(() => coz("zaman-asimi"), ZAMAN_ASIMI_MS);
      }),
    ]);
  } finally {
    if (zamanlayici) clearTimeout(zamanlayici);
  }
}

/** MX yoksa A kaydına düşülür (RFC 5321 §5.1 örtük MX). */
async function adresKaydiVarMi(cozucu: Resolver, alan: string): Promise<boolean> {
  try {
    const a = await sureliSor(cozucu.resolve4(alan));
    if (a === "zaman-asimi") return true; // fail-open: var say
    return a.length > 0;
  } catch (e) {
    // Kesin "yok" cevabı değilse engelleme (fail-open).
    return !YOK.has(hataKodu(e));
  }
}

export async function alanTeslimEdilemezMi(alan: string): Promise<boolean> {
  const anahtar = alan.toLowerCase();
  const bellekte = onbellek.get(anahtar);
  if (bellekte !== undefined) return bellekte;

  const cozucu = new Resolver({ timeout: ZAMAN_ASIMI_MS, tries: 1 });
  let teslimEdilemez: boolean;
  try {
    const mx = await sureliSor(cozucu.resolveMx(anahtar));
    if (mx === "zaman-asimi") return false; // fail-open, önbelleğe de yazma
    teslimEdilemez = mx.length > 0 ? false : !(await adresKaydiVarMi(cozucu, anahtar));
  } catch (e) {
    if (!YOK.has(hataKodu(e))) return false; // geçici/bilinmeyen DNS hatası → geçir
    teslimEdilemez = !(await adresKaydiVarMi(cozucu, anahtar));
  }
  onbellek.set(anahtar, teslimEdilemez);
  return teslimEdilemez;
}

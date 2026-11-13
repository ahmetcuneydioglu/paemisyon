/**
 * Resmî madde metnini EKRANDA akıtır; metnin kendisi değişmez (kaynak bankada olduğu gibi kalır).
 *
 * 13 Kas 2026 Faz 4: mevzuat.gov.tr PDF'inden gelen metinlerde satır sonları cümlenin ortasında
 * ("kesintinin\ngerçekleştiği", tek başına "yer", tek başına "de") kalıyordu; okuyucu bunları
 * olduğu gibi basıyordu.
 *
 * UZUNLUK KORUNUR: yalnız uygun "\n" karakterleri boşluğa döner, başka hiçbir karakter eklenmez
 * ya da silinmez. Vurgulamalar (web'de var, uygulamada F5) ham metindeki karakter konumlarıyla
 * saklanır; konum kaydıran bir dönüşüm onları bozar. Web'deki eşi: `apps/web/src/lib/madde-metni.ts` (aynı içerik).
 *
 * Birleştirme kuralı muhafazakârdır: önceki satır cümle sonu işaretiyle (. : ; ? !) bitmiyorsa VE
 * sonraki satır küçük harfle başlıyorsa (ya da önceki satır harfle bitip sonraki büyük harfle
 * başlıyorsa) satır sonu boşluğa döner. Fıkra "(2)", bent "a)", paragraf
 * (büyük harf) ve ek/değişiklik notu "(Ek: …)" satırları yerinde kalır.
 */
const BENT = /^[a-zçğıöşüA-ZÇĞİÖŞÜ]{1,2}\)\s/;
const KUCUK = /^[a-zçğıöşü]/;
const HARF = /^[a-zçğıöşüA-ZÇĞİÖŞÜ]/u;
const HARFLE_BITER = /[a-zçğıöşüA-ZÇĞİÖŞÜ]$/u;
const CUMLE_SONU = /[.:;?!]["”’)]?$/;

export function akiciMaddeMetni(metin: string): string {
  const satirlar = metin.split("\n");
  let cikti = satirlar[0] ?? "";
  for (let i = 1; i < satirlar.length; i++) {
    const onceki = satirlar[i - 1]!.trimEnd();
    const satir = satirlar[i]!;
    const bas = satir.trimStart();
    // Küçük harfle başlayan satır her zaman devamdır; büyük harfle başlayan satır yalnız önceki satır
    // bir HARFLE (noktalamasız) bitiyorsa devamdır ("yapılacağı\nAdalet ve İçişleri", 1481 md 5).
    // Virgülle biten satırdan sonra gelen büyük harfli satır bir sayım öğesi olabilir; dokunulmaz.
    // Tamamı büyük harf satır (çok satırlı başlık, cetvel/tablo hücresi: "RÜTBELER\nMESLEK") yerinde kalır.
    const buyukHarfli = (x: string) => !/[a-zçğıöşü]/.test(x);
    const devam = KUCUK.test(bas) || (HARF.test(bas) && HARFLE_BITER.test(onceki) && !buyukHarfli(bas) && !buyukHarfli(onceki));
    const birlestir = onceki !== "" && bas !== "" && !CUMLE_SONU.test(onceki) && devam && !BENT.test(bas);
    cikti += (birlestir ? " " : "\n") + satir;
  }
  return cikti;
}

/** Başlıksız madde için metnin ilk cümlesi (değişiklik şerhi atlanır), en çok `max` karakter. */
export function maddeOnizleme(metin: string, max = 90): string | null {
  const govde = akiciMaddeMetni(metin).replace(/^\s*\((?:[^()]*)\)\s*/g, "").trim();
  if (!govde) return null;
  const cumle = govde.split(/(?<=[.;:])\s+|\n/)[0] ?? govde;
  return cumle.length > max ? `${cumle.slice(0, max - 2).replace(/\s+\S*$/, "")}…` : cumle;
}

/**
 * Türkçe hâl eki — biçimlenmiş saat/tarih/ad sonuna kesme işaretiyle (13 Kas 2026 provası: "04:47'a
 * kadar", "Cuma'a" gibi sabit yazılmış ekler okunuşa uymuyordu; doğrusu "04:47'ye", "Cuma'ya").
 *
 * Ek, metnin OKUNUŞUNUN son kelimesine göre seçilir: "04:47" → "kırk yedi" → yedi; "04:00" → "dört";
 * "13" → "on üç" → üç; kelime ise kendisi. Ünlü uyumu (kalın/ince), kaynaştırma (y) ve sert
 * ünsüz benzeşmesi (d → t) uygulanır.
 */
export type HalEki = "e" | "de" | "den";

const BIRLER = ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"];
const ONLAR = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"];

/** Sayının okunuşundaki son kelime (yalnız ek seçimi için). */
function sayiSonKelime(n: number): string {
  if (n === 0) return "sıfır";
  if (n % 10 !== 0) return BIRLER[n % 10] ?? "";
  if (n % 100 !== 0) return ONLAR[(n % 100) / 10] ?? "";
  if (n % 1000 !== 0) return "yüz";
  return n % 1_000_000 !== 0 ? "bin" : "milyon";
}

function okunusSonKelime(metin: string): string {
  const t = metin.trim();
  const saat = /(\d{1,2})[:.](\d{2})$/.exec(t);
  if (saat) {
    const dk = Number(saat[2]);
    return sayiSonKelime(dk === 0 ? Number(saat[1]) : dk);
  }
  const sayi = /(\d+)$/.exec(t);
  if (sayi) return sayiSonKelime(Number(sayi[1]));
  const kelime = /([\p{L}]+)$/u.exec(t);
  return (kelime?.[1] ?? t).toLocaleLowerCase("tr-TR");
}

const INCE = new Set(["e", "i", "ö", "ü"]);
const UNLU = new Set(["a", "ı", "o", "u", "e", "i", "ö", "ü"]);
const SERT = new Set(["f", "s", "t", "k", "ç", "ş", "h", "p"]);

/** Yalnız ek ("ye", "da", "ten"…); kesme işaretini çağıran koyar. */
export function halEki(metin: string, ek: HalEki): string {
  const k = okunusSonKelime(metin);
  const unluler = [...k].filter((c) => UNLU.has(c));
  const ince = INCE.has(unluler[unluler.length - 1] ?? "a");
  const son = k[k.length - 1] ?? "";
  const unluyleBiter = UNLU.has(son);
  const a = ince ? "e" : "a";
  if (ek === "e") return `${unluyleBiter ? "y" : ""}${a}`;
  const d = SERT.has(son) ? "t" : "d";
  return ek === "de" ? `${d}${a}` : `${d}${a}n`;
}

/** "04:47" + "e" → "04:47'ye"; "Cuma" + "e" → "Cuma'ya"; "13 Kasım" + "de" → "13 Kasım'da". */
export function ekle(metin: string, ek: HalEki): string {
  return `${metin}'${halEki(metin, ek)}`;
}

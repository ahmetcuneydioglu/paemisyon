/**
 * Kayıt öncesi e-posta denetimi — bounce'ı kaynağında keser.
 *
 * Neden var: kayıt akışı adresi hiç denetlemeden Supabase'e veriyordu, Supabase
 * de yazılan her adrese doğrulama maili atıyordu. Yanlış yazılan bir adres
 * (ör. "gmial.com") geri dönüyor; Supabase 3 Eylül 2026'da yüksek bounce oranı
 * uyarısı gönderdi. Kullanıcı için de kötü: "mail gelmedi" diye bekliyor,
 * oysa adres yanlış ve kimse ona bunu söylemiyor.
 *
 * Tasarım ilkesi: GEVŞEK ol. Amaç kapıda kimseyi bırakmak değil, teslim
 * edilemeyeceği KESİN olan adresleri durdurmak. Bu yüzden:
 *  - Biçim kuralı dar değil (artı adresleme, IDN, uzun uzantılar geçer).
 *  - Yazım hatası ENGELLEMEZ, yalnız sorar (gerçekten o adresi kullanan biri
 *    "devam et" diyebilmeli).
 *  - Tek kullanımlık adres kara listesi YOK: hazır listeler Apple'ın
 *    privaterelay.appleid.com'unu ve meşru takma-adres servislerini de
 *    kapsıyor; mevcut kullanıcıların 31'i Apple relay adresinde.
 */

/** Alan adı etiketi: harf/rakamla başlar ve biter, arada tire olabilir. */
const ETIKET = String.raw`[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?`;
/** Uzantı: en az 2 harf (".istanbul" geçer) ya da punycode (xn--…). */
const UZANTI = String.raw`(?:xn--[a-z0-9-]{2,}|\p{L}{2,})`;
const BICIM = new RegExp(
  String.raw`^[^\s@,;:<>()[\]\\"]{1,64}@(?:${ETIKET}\.)+${UZANTI}$`,
  "iu",
);

/**
 * Posta alamayacağı KESİN olan alan adları (RFC 2606/6761 ile ayrılmış).
 * Dünyada hiçbir sunucu bu uzantılarda çalışamaz — reddetmek kimseyi mağdur etmez.
 */
const AYRILMIS_UZANTILAR = new Set([
  "test",
  "example",
  "invalid",
  "localhost",
  "local",
  "internal",
  "home",
  "lan",
]);
const AYRILMIS_ALANLAR = new Set(["example.com", "example.net", "example.org"]);

/**
 * Bilinen GERÇEK sağlayıcılar. İki işi var:
 *  1) yazım hatası önerisinin hedefleri,
 *  2) "bunlar zaten doğru" listesi — listedeki bir alan adı asla düzeltilmeye
 *     çalışılmaz. Bu ikincisi şart: "mail.com" gerçek bir sağlayıcıdır ve
 *     "gmail.com"a bir harf uzaktır; liste olmasa kullanıcıya "gmail.com mu
 *     demek istedin?" diye sorardık.
 */
const YAYGIN_ALANLAR = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "yahoo.com",
  "live.com",
  "msn.com",
  "me.com",
  "yandex.com",
  "protonmail.com",
  "proton.me",
  "windowslive.com",
  "hotmail.com.tr",
  "yahoo.com.tr",
  "mynet.com",
  "superonline.com",
  "ttmail.com",
  "gmail.com.tr",
  "outlook.com.tr",
  // Aşağıdakiler öneri hedefi olmaktan çok "doğru kabul et" içindir.
  "mail.com",
  "gmx.com",
  "gmx.net",
  "aol.com",
  "zoho.com",
  "fastmail.com",
  "tuta.com",
  "tutanota.com",
  "mail.ru",
  "yandex.com.tr",
  "yandex.ru",
  "turk.net",
  "ttnet.net.tr",
  "e-kolay.net",
  "passinbox.com",
  "privaterelay.appleid.com",
];

export type EpostaSonuc =
  | { durum: "gecerli" }
  | { durum: "gecersiz"; mesaj: string }
  | { durum: "oneri"; oneri: string; mesaj: string };

export function alanAdi(eposta: string): string {
  return eposta.slice(eposta.lastIndexOf("@") + 1).toLowerCase();
}

/**
 * Damerau-Levenshtein (yer değiştirme dahil): "gmial" → "gmail" tek işlemdir,
 * düz Levenshtein'da iki. Yazım hatalarının çoğu bitişik harf takasıdır.
 */
export function duzenlemeUzakligi(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const bedel = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + bedel);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[m][n];
}

/** Yaygın bir sağlayıcıya çok yakın ama birebir eşit değilse onu önerir. */
export function alanOnerisi(alan: string): string | null {
  if (YAYGIN_ALANLAR.includes(alan)) return null;
  let enIyi: { alan: string; uzaklik: number } | null = null;
  for (const aday of YAYGIN_ALANLAR) {
    // Kısa alan adlarında 2 uzaklık fazla cömert: "mail.com" → "gmail.com"
    // gibi gerçek adresleri yanlışlıkla düzeltmeye kalkardı.
    const sinir = aday.length <= 9 ? 1 : 2;
    const u = duzenlemeUzakligi(alan, aday);
    if (u > 0 && u <= sinir && (!enIyi || u < enIyi.uzaklik)) {
      enIyi = { alan: aday, uzaklik: u };
    }
  }
  return enIyi?.alan ?? null;
}

/** Senkron denetim: biçim + teslim edilemez alan + yazım hatası önerisi. */
export function epostaDenetle(ham: string): EpostaSonuc {
  const eposta = ham.trim();
  if (!eposta) return { durum: "gecersiz", mesaj: "E-posta adresi zorunludur." };
  if (!BICIM.test(eposta)) {
    return {
      durum: "gecersiz",
      mesaj: "E-posta adresi geçerli görünmüyor. Örnek: adin@gmail.com",
    };
  }

  const alan = alanAdi(eposta);
  const uzanti = alan.slice(alan.lastIndexOf(".") + 1);
  if (AYRILMIS_UZANTILAR.has(uzanti) || AYRILMIS_ALANLAR.has(alan)) {
    return {
      durum: "gecersiz",
      mesaj: `"${alan}" adresine e-posta ulaşamaz. Kullandığın gerçek adresi yaz.`,
    };
  }

  const oneri = alanOnerisi(alan);
  if (oneri) {
    return {
      durum: "oneri",
      oneri: `${eposta.slice(0, eposta.lastIndexOf("@"))}@${oneri}`,
      mesaj: `"${alan}" yazdın. "${oneri}" mi demek istedin?`,
    };
  }
  return { durum: "gecerli" };
}

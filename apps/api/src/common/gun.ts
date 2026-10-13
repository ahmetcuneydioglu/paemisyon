/**
 * Uygulama günü — TEK tanım (Doc 48 D2, 14 Eki 2026: gün TR saatiyle 04.00'te döner).
 *
 * Neden 04.00: aday vardiyalı çalışıyor. Gece nöbetinde 01.00'de çözülen soru
 * "bugünün" emeğidir; gün gece yarısı bölünürse yorgun adayın halkası, haftalık
 * günü ve kotası nöbetin ortasında sıfırlanır. (Önceden sınır UTC gece yarısı =
 * TR 03.00'tü ve kodda üç ayrı kopyası vardı.)
 *
 * Türkiye sabit UTC+3 (2016'dan beri yaz saati yok) → TR 04.00 = UTC 01.00.
 *
 * İki farklı soru, iki fonksiyon:
 *  - `gunAnahtari(t)`: @db.Date kolonlarına yazılan/okunan GÜN (daily_usage.usage_date,
 *    streak.last_active_date, daily_focus.day). UTC gece yarısı Date olarak döner —
 *    mevcut kolonlarla birebir uyumlu, migration gerekmez.
 *  - `gunBaslangici(t)`: o uygulama gününün başladığı AN — zaman damgası karşılaştırmaları
 *    için ("bugün başlatılan turlar": startedAt >= gunBaslangici()).
 * İkisi karıştırılmamalı: sayaç bir güne, tur sayımı başka güne yazılırdı.
 *
 * Takvim anlamı olan şeyler BU tanımı kullanmaz: sınava kalan gün (TR takvim günü),
 * e-posta "bugün gönderildi" (TR gece yarısı), canlı denemenin "bugün" olması.
 */

/** Gün sınırının UTC gece yarısından kayması: TR 04.00 = UTC 01.00. */
export const GUN_KAYMASI_MS = 3_600_000;

const GUN_MS = 86_400_000;

/** Uygulama günü anahtarı (UTC gece yarısı Date) — @db.Date kolonları için. */
export function gunAnahtari(t: Date = new Date()): Date {
  const d = new Date(t.getTime() - GUN_KAYMASI_MS);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Uygulama gününün başladığı an (TR 04.00) — zaman damgası karşılaştırmaları için. */
export function gunBaslangici(t: Date = new Date()): Date {
  return new Date(gunAnahtari(t).getTime() + GUN_KAYMASI_MS);
}

/** Uygulama haftasının ilk günü (Pazartesi) anahtarı — @db.Date kolonları için. */
export function haftaBasi(t: Date = new Date()): Date {
  const g = gunAnahtari(t);
  const pzt = (g.getUTCDay() + 6) % 7; // Pzt=0 … Paz=6
  return new Date(g.getTime() - pzt * GUN_MS);
}

/** Uygulama haftasının başladığı an (Pazartesi TR 04.00). */
export function haftaBaslangici(t: Date = new Date()): Date {
  return new Date(haftaBasi(t).getTime() + GUN_KAYMASI_MS);
}

/** "YYYY-MM-DD" — uygulama gününün metin anahtarı (seed, önbellek anahtarı). */
export function gunMetni(t: Date = new Date()): string {
  return gunAnahtari(t).toISOString().slice(0, 10);
}

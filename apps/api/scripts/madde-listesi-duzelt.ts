/**
 * Gömülü font (Private Use Area) madde işaretlerini okunur listeye çevirir.
 *
 * Kitap PDF'leri madde işareti için kendi fontuna gömülü glif kullanıyor
 * (ör. U+F050). O font dışında hiçbir yerde karşılığı yok: panelde kutu,
 * uygulamada soru işareti olarak çıkıyor. Ayrıca PDF metninde maddeler tek
 * satıra diziliyor, oysa soru kökü olarak ALT ALTA okunmalı.
 *
 *   " A. B. C. Yukarıdaki … hangisidir?"
 * →  "• A.\n• B.\n• C.\n\nYukarıdaki … hangisidir?"
 */
const PUA = /[\u{E000}-\u{F8FF}\u{F0000}-\u{FFFFD}]/u;
const PUA_G = /[\u{E000}-\u{F8FF}\u{F0000}-\u{FFFFD}]/gu;
/** Listeyi kapatan soru cümlesi ("Yukarıdaki … hangisidir?"). */
const KAPANIS = /\b(Yukarıda(?:ki|kilerden)?\b.*)$/s;

export function puaVarMi(metin: string): boolean {
  return PUA.test(metin);
}

export function maddeListesiniDuzelt(kok: string): string {
  if (!PUA.test(kok)) return kok;
  const parcalar = kok.split(PUA_G).map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  if (parcalar.length === 0) return kok.replace(PUA_G, '').trim();

  // Son parça hem son maddeyi hem kapanış sorusunu taşıyabilir.
  let kapanis = '';
  const son = parcalar[parcalar.length - 1];
  const m = KAPANIS.exec(son);
  if (m && m.index > 0) {
    parcalar[parcalar.length - 1] = son.slice(0, m.index).trim();
    kapanis = m[1].trim();
  } else if (m && m.index === 0) {
    parcalar.pop();
    kapanis = m[1].trim();
  }
  const maddeler = parcalar.filter(Boolean).map((s) => `• ${s}`);
  return kapanis ? `${maddeler.join('\n')}\n\n${kapanis}` : maddeler.join('\n');
}

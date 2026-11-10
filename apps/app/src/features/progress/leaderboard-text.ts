/**
 * Liderlik metin yardımcıları — saf fonksiyonlar, birim testli (web `leaderboard-util.ts`
 * karşılığı). Takip/motivasyon cümlesi moral-koruyan tondadır (Doc 12) ve isme ek TAKMAZ
 * (Türkçe ünlü uyumu riski): "Önünde Ayşe var — fark sadece 4 puan."
 */

/** Tam sayı, Türkçe binlik ayırıcıyla: 1316 → "1.316" (web `toLocaleString("tr-TR")`). */
export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString("tr-TR");
}

/** "Son aktif" — YYYY-MM-DD → göreli metin (cihaz gününe göre). `now` yalnız test için. */
export function formatLastActive(iso: string | null, now: Date = new Date()): string {
  if (!iso) return "—";
  const parts = iso.slice(0, 10).split("-").map(Number);
  if (parts.length !== 3 || parts.some((p) => !Number.isFinite(p))) return "—";
  const [y, m, d] = parts as [number, number, number];
  const then = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Yaz saati günlerinde 23/25 saatlik farkı yuvarlayarak tam güne indir.
  const days = Math.round((today.getTime() - then.getTime()) / 3_600_000 / 24);
  if (days <= 0) return "bugün";
  if (days === 1) return "dün";
  if (days < 7) return `${days} gün önce`;
  if (days < 30) return `${Math.floor(days / 7)} hafta önce`;
  return `${Math.floor(days / 30)} ay önce`;
}

/** Motivasyon cümlesi — dönem sıralamasına göre; dallar web `motivationLine` ile aynı sırada. */
export function motivationLine(rank: number, pointsToNext: number | null, nextName: string | null): string {
  if (rank === 1) return "Zirvedesin — tacı koru! 👑";
  if (pointsToNext != null && nextName) {
    if (pointsToNext > 0) return `Önünde ${nextName} var — fark sadece ${fmtInt(pointsToNext)} puan.`;
    return `${nextName} ile berabersin — 1 doğruyla öne geç!`;
  }
  if (rank > 0 && rank <= 10) return "İlk 10'dasın — bir adım daha yukarı!";
  if (rank > 0) return "Her doğru seni yukarı taşır. Devam et!";
  return "Bir tur çöz, tabloda yerini al.";
}

/** Avatar baş harfleri: ilk + son sözcük, Türkçe büyük harf ("ilker yıldız" → "İY"). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toLocaleUpperCase("tr-TR");
}

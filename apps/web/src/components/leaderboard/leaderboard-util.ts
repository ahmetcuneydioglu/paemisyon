/** "Son aktif" — YYYY-MM-DD → insani göreli metin (istemci saatine göre). */
export function formatLastActive(iso: string | null): string {
  if (!iso) return "—";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const parts = iso.slice(0, 10).split("-").map(Number);
  if (parts.length !== 3) return "—";
  const then = new Date(parts[0], parts[1] - 1, parts[2]);
  const days = Math.round((today.getTime() - then.getTime()) / 86_400_000);
  if (days <= 0) return "bugün";
  if (days === 1) return "dün";
  if (days < 7) return `${days} gün önce`;
  if (days < 30) return `${Math.floor(days / 7)} hafta önce`;
  return `${Math.floor(days / 30)} ay önce`;
}

/** Motivasyon şeridi mesajı — dönem sıralamasına göre (moral-koruyan, Doc 12). */
export function motivationLine(
  rank: number,
  pointsToNext: number | null,
  nextName: string | null,
): string {
  if (rank === 1) return "Zirvedesin — tacı koru! 👑";
  if (pointsToNext != null && pointsToNext > 0 && nextName) {
    return `${nextName}'i geçmek için sadece ${pointsToNext.toLocaleString("tr-TR")} puan kaldı.`;
  }
  if (rank > 0 && rank <= 10) return "İlk 10'dasın — bir adım daha yukarı!";
  if (rank > 0) return "Her doğru seni yukarı taşır. Devam et!";
  return "Bugün bir quiz çöz, tabloda yerini al.";
}

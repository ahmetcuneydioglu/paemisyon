/**
 * Rütbe sistemi (Doc 24 §5, Doc 26 §5 gamification) — SAF mantık, birim testli.
 *
 * İlke: bu kitleye şeker-pembe rozet olmaz; ilerleme MESLEK diliyle anlatılır.
 * İsimler gerçek rütbe silsilesini ÇAĞRIŞTIRIR ama birebir kopyalamaz
 * (kurumsal hassasiyet — Doc 24 §5). Son rütbe hedef sınavın kapısıdır.
 *
 * Puan = çözülen soru + 15 × aktif gün. Süreklilik hacim kadar değerlidir:
 * her aktif gün ~15 soruluk katkı yapar — "her gün gelen" kullanıcı,
 * hafta sonu 200 soru çözüp kaybolan kullanıcıdan daha hızlı terfi eder.
 */

export interface RankInfo {
  level: number;
  name: string;
  /** Toplam ilerleme puanı. */
  score: number;
  /** Sonraki rütbe; son rütbedeyse null. */
  next: { level: number; name: string; minScore: number } | null;
  /** Bu rütbenin başladığı puan (ilerleme çubuğu tabanı). */
  minScore: number;
}

/** Rütbe kataloğu — eşikler yaklaşık 2× büyür; terfi temposu yavaşlayarak uzar. */
export const RANKS: ReadonlyArray<{ level: number; name: string; minScore: number }> = [
  { level: 1, name: 'Aday', minScore: 0 },
  { level: 2, name: 'Devriye', minScore: 150 },
  { level: 3, name: 'Kıdemli Devriye', minScore: 400 },
  { level: 4, name: 'Ekip Amiri', minScore: 900 },
  { level: 5, name: 'Grup Amiri', minScore: 1800 },
  { level: 6, name: 'Vardiya Amiri', minScore: 3500 },
  { level: 7, name: 'Birim Amiri', minScore: 7000 },
  { level: 8, name: 'Komiserlik Kapısı', minScore: 12000 },
];

/** Aktif gün katsayısı — süreklilik primi (Doc 24 §2: ilerleme kanıtı bileşik faizdir). */
export const ACTIVE_DAY_POINTS = 15;

export function rankScore(totalSolved: number, activeDays: number): number {
  return Math.max(0, totalSolved) + ACTIVE_DAY_POINTS * Math.max(0, activeDays);
}

export function computeRank(score: number): RankInfo {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (score >= r.minScore) current = r;
    else break;
  }
  const next = RANKS.find((r) => r.level === current.level + 1) ?? null;
  return {
    level: current.level,
    name: current.name,
    score,
    minScore: current.minScore,
    next: next ? { level: next.level, name: next.name, minScore: next.minScore } : null,
  };
}

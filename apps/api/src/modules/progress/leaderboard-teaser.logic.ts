/**
 * Bugün'deki lider tahtası özeti (Doc 49/16 §9 eki, 2 Kas 2026): ilk 3 + "sen" + takip
 * cümlesi. Metin SUNUCUDA üretilir ki web ve Expo aynı tonu taşısın (Doc 12: moral bozmaz,
 * kışkırtmaz; fark cümlesi hep kazanılabilir). Saf fonksiyon — DB'siz test edilir.
 */
export interface TeaserRow {
  rank: number;
  displayName: string;
  points: number;
  isMe: boolean;
}

export interface TeaserMe {
  rank: number;
  points: number;
  pointsToNext: number | null;
  nextName: string | null;
}

export interface LeaderboardTeaser {
  period: 'today';
  /** Bugün en az 1 doğru yapan kişi sayısı (tahtanın doluluğu). */
  scorers: number;
  top: TeaserRow[];
  /** Bugün puanı yoksa null. */
  me: TeaserMe | null;
  line: string;
}

export function teaserLine(me: TeaserMe | null, scorers: number): string {
  if (!me) {
    return scorers === 0
      ? 'Tahta bugün bomboş — ilk sırayı kapma şansı.'
      : 'Bugün 1 doğru yap, tahtaya adını yazdır.';
  }
  if (me.rank === 1) return 'Zirvedesin — burayı kimseye kaptırma.';
  if (me.nextName == null || me.pointsToNext == null) return 'Her doğru cevap seni yukarı taşır.';
  if (me.pointsToNext === 0) return `${me.nextName} ile berabersin — 1 doğruyla öne geç.`;
  return `Önünde ${me.nextName} var — fark ${me.pointsToNext} doğru.`;
}

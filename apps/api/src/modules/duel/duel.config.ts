/**
 * Düello kuralları — TEK yer (Doc 59). Puanlama, süre, XP ve sınırlar buradan okunur;
 * `app_settings` ile ezilebilenler `SETTING_KEYS.duel*` anahtarlarıdır (bayrak, günlük hak).
 * İstemci kural bilmez: bu değerler hub cevabında (`/me/duel`) hazır metin/sayı olarak gider.
 */
export const DUEL_RULES = {
  duel: { questionCount: 10, secondsPerQuestion: 20, players: 2 },
  room: {
    minPlayers: 3,
    maxPlayers: 8,
    questionCounts: [10, 15, 20] as const,
    secondsOptions: [15, 20, 30] as const,
    quick: { questionCount: 10, secondsPerQuestion: 20, maxPlayers: 8 },
  },
  /** Senkron geri sayım (maç başı). */
  countdownMs: 3_000,
  /** Soru kapanışı ile sonraki soru arası: doğru cevap + sıralama gösterimi. */
  revealMs: 3_500,
  /** Ağ gecikmesi payı: süre bitiminden sonra bu kadar geç gelen cevap kabul edilir. */
  answerGraceMs: 400,
  score: {
    correct: 100,
    /** Doğru cevapta kalan süre oranıyla çarpılır; herkese aynı formül. */
    maxSpeedBonus: 50,
  },
  xp: {
    duel: { win: 60, draw: 25, loss: 10 },
    /** Salon: sıra → XP; listede olmayan sıra `other` alır. */
    room: { byPlacement: [100, 70, 50] as readonly number[], other: 15 },
  },
  rating: { start: 1000, k: 24, floor: 100 },
  queue: {
    /** İstemci yoklaması bu kadar uzatır; yoklamayan kayıt düşer. */
    heartbeatMs: 10_000,
    /** Bu süre sonunda istemci "rakip bulunamadı, tekrar dene" gösterir. */
    searchTimeoutMs: 45_000,
  },
  invite: { ttlMs: 60_000 },
  code: { ttlMs: 10 * 60_000, length: 6 },
  /** Bu kadar süre başlamayan lobi süpürücü tarafından kapatılır. */
  lobbyTtlMs: 15 * 60_000,
  /** 20 saniyede okunabilir soru: kök + şıkların toplam karakter tavanı. */
  maxQuestionChars: 650,
} as const;

export const DUEL_FREE_DAILY_LIMIT_DEFAULT = 5;
export const DUEL_ENABLED_DEFAULT = false;

/** Bayrak kapalıyken yalnız admin ve beta rolleri görür (bilgi kartlarıyla aynı kalıp). */
export function duelAcik(anahtar: boolean, roles: readonly string[]): boolean {
  return anahtar || roles.includes('admin') || roles.includes('beta');
}

export const duelTopic = (matchId: string) => `duel:${matchId}`;
export const duelUserTopic = (userId: string) => `duel-user:${userId}`;

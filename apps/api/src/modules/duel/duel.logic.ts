import { DUEL_RULES } from './duel.config';

/**
 * Düello oyun motoru — SAF fonksiyonlar (veritabanı, saat, rastgelelik dışarıdan gelir).
 *
 * Zaman modeli: maçın her fazı `phaseEndsAt` damgası taşır. Hiçbir zamanlayıcı yoktur;
 * `advance` "şu an"a göre maçı olması gereken faza taşır. Böylece istemciler askıya alınsa,
 * Realtime kopsa ya da sunucu yeniden başlasa da akış sunucu saatine göre doğru kalır.
 */

export type Phase = 'lobby' | 'countdown' | 'question' | 'reveal' | 'finished' | 'cancelled';

export interface EngineState {
  phase: Phase;
  /** Aktif soru (0 tabanlı); lobi/geri sayımda -1. */
  index: number;
  phaseStartedAt: number | null;
  phaseEndsAt: number | null;
}

export interface EngineRules {
  questionCount: number;
  secondsPerQuestion: number;
  revealMs: number;
  graceMs: number;
}

export type EngineEvent =
  | { type: 'question_opened'; index: number; at: number }
  | { type: 'question_closed'; index: number; at: number }
  | { type: 'finished'; at: number };

/**
 * Maçı `now` anına taşır. `allAnswered` yalnız GİRİŞTEKİ açık soru için anlamlıdır
 * (sonradan açılan soruya henüz kimse cevap vermemiştir).
 *
 * Geride kalmış maç zincirleme ilerler: fazlar PLANLANAN anlarında açılıp kapanır
 * (gerçek "şimdi" ile değil), böylece kimse bakmazken geçen sorular süresi dolmuş sayılır.
 */
export function advance(
  state: EngineState,
  rules: EngineRules,
  now: number,
  allAnswered: boolean,
): { state: EngineState; events: EngineEvent[] } {
  let s = { ...state };
  const events: EngineEvent[] = [];
  let erkenKapanis = allAnswered && state.phase === 'question';

  for (let guard = 0; guard < rules.questionCount * 2 + 4; guard++) {
    if (s.phase === 'countdown') {
      if (s.phaseEndsAt == null || now < s.phaseEndsAt) break;
      s = soruAc(0, s.phaseEndsAt, rules);
      events.push({ type: 'question_opened', index: 0, at: s.phaseStartedAt! });
      erkenKapanis = false;
      continue;
    }
    if (s.phase === 'question') {
      const bitis = s.phaseEndsAt! + rules.graceMs;
      let kapanis: number | null = null;
      if (erkenKapanis) kapanis = Math.min(now, bitis);
      else if (now > bitis) kapanis = bitis;
      if (kapanis == null) break;
      events.push({ type: 'question_closed', index: s.index, at: kapanis });
      s = {
        phase: 'reveal',
        index: s.index,
        phaseStartedAt: kapanis,
        phaseEndsAt: kapanis + rules.revealMs,
      };
      erkenKapanis = false;
      continue;
    }
    if (s.phase === 'reveal') {
      if (now < s.phaseEndsAt!) break;
      const sonraki = s.index + 1;
      if (sonraki >= rules.questionCount) {
        events.push({ type: 'finished', at: s.phaseEndsAt! });
        s = { phase: 'finished', index: s.index, phaseStartedAt: s.phaseEndsAt, phaseEndsAt: null };
        break;
      }
      s = soruAc(sonraki, s.phaseEndsAt!, rules);
      events.push({ type: 'question_opened', index: sonraki, at: s.phaseStartedAt! });
      continue;
    }
    break; // lobby | finished | cancelled: zamanla ilerlemez
  }
  return { state: s, events };
}

function soruAc(index: number, at: number, rules: EngineRules): EngineState {
  return {
    phase: 'question',
    index,
    phaseStartedAt: at,
    phaseEndsAt: at + rules.secondsPerQuestion * 1000,
  };
}

/** Cevap bu anda kabul edilir mi? (faz, soru sırası ve sunucu saati) */
export function answerWindow(
  state: EngineState,
  rules: EngineRules,
  index: number,
  now: number,
): { ok: true; elapsedMs: number } | { ok: false; reason: 'not_open' | 'wrong_index' | 'late' } {
  if (state.phase !== 'question') return { ok: false, reason: 'not_open' };
  if (state.index !== index) return { ok: false, reason: 'wrong_index' };
  if (now > state.phaseEndsAt! + rules.graceMs) return { ok: false, reason: 'late' };
  const limit = rules.secondsPerQuestion * 1000;
  const elapsedMs = Math.min(limit, Math.max(0, now - state.phaseStartedAt!));
  return { ok: true, elapsedMs };
}

/** Doğru: taban + kalan süre oranında hız bonusu. Yanlış/boş: 0. */
export function scoreAnswer(
  isCorrect: boolean,
  elapsedMs: number,
  limitMs: number,
  cfg: { correct: number; maxSpeedBonus: number } = DUEL_RULES.score,
): number {
  if (!isCorrect) return 0;
  const kalan = Math.max(0, Math.min(1, 1 - elapsedMs / limitMs));
  return cfg.correct + Math.round(cfg.maxSpeedBonus * kalan);
}

export interface Standing {
  userId: string;
  score: number;
  correctCount: number;
  /** Doğru cevapların toplam süresi; küçük olan öndedir. */
  correctMs: number;
  /** Maçtan ayrılan/atılan: sıralamada her zaman kalanların ARKASINDA. */
  forfeited?: boolean;
}

export interface Placed extends Standing {
  placement: number;
}

function ayni(a: Standing, b: Standing): boolean {
  return (
    !!a.forfeited === !!b.forfeited &&
    a.score === b.score &&
    a.correctCount === b.correctCount &&
    a.correctMs === b.correctMs
  );
}

/**
 * Sıralama: puan ↓, doğru sayısı ↓, doğru cevap süresi ↑. Üçü de eşitse AYNI sıra
 * (1, 1, 3 — "yarışma sıralaması"). Ayrılanlar kalanların arkasına düşer.
 */
export function rankStandings(rows: readonly Standing[]): Placed[] {
  const sirali = [...rows].sort(
    (a, b) =>
      Number(!!a.forfeited) - Number(!!b.forfeited) ||
      b.score - a.score ||
      b.correctCount - a.correctCount ||
      a.correctMs - b.correctMs ||
      a.userId.localeCompare(b.userId), // yalnız kararlı sıra için; yerleşimi etkilemez
  );
  const out: Placed[] = [];
  sirali.forEach((r, i) => {
    const onceki = out[i - 1];
    out.push({ ...r, placement: onceki && ayni(onceki, r) ? onceki.placement : i + 1 });
  });
  return out;
}

export type Outcome = 'win' | 'loss' | 'draw';

/** 1'e 1 sonuç: iki oyuncu da 1. ise berabere. */
export function duelOutcome(me: Placed, other: Placed): Outcome {
  if (me.placement === other.placement) return 'draw';
  return me.placement < other.placement ? 'win' : 'loss';
}

export function duelXp(outcome: Outcome, cfg = DUEL_RULES.xp.duel): number {
  return cfg[outcome];
}

export function roomXp(placement: number, cfg = DUEL_RULES.xp.room): number {
  return cfg.byPlacement[placement - 1] ?? cfg.other;
}

/** Elo: 1'e 1 lig puanı değişimi (kazanan + kaybeden toplamı sıfıra yakın, taban korunur). */
export function eloDelta(
  mine: number,
  theirs: number,
  outcome: Outcome,
  cfg: { k: number; floor: number } = DUEL_RULES.rating,
): number {
  const beklenen = 1 / (1 + 10 ** ((theirs - mine) / 400));
  const gercek = outcome === 'win' ? 1 : outcome === 'draw' ? 0.5 : 0;
  const delta = Math.round(cfg.k * (gercek - beklenen));
  return Math.max(delta, cfg.floor - mine);
}

/**
 * Salon puanı (SP): her rakibe karşı ikili Elo'nun ortalaması — 8 kişilik salonda
 * birinci, 3 kişilik salondakinden fazla kazanmaz ama kimi yendiği hesaba girer.
 */
export function roomRatingDelta(
  me: { rating: number; placement: number },
  others: readonly { rating: number; placement: number }[],
  cfg: { k: number; floor: number } = DUEL_RULES.rating,
): number {
  if (others.length === 0) return 0;
  let toplam = 0;
  for (const o of others) {
    const beklenen = 1 / (1 + 10 ** ((o.rating - me.rating) / 400));
    const gercek = me.placement < o.placement ? 1 : me.placement === o.placement ? 0.5 : 0;
    toplam += gercek - beklenen;
  }
  const delta = Math.round((cfg.k * 2 * toplam) / others.length);
  return Math.max(delta, cfg.floor - me.rating);
}

/** Galibiyet serisi: kazanınca +1, kaybedince 0, beraberlikte korunur. */
export function nextStreak(current: number, outcome: Outcome): number {
  if (outcome === 'win') return current + 1;
  if (outcome === 'loss') return 0;
  return current;
}

/** Karıştırılan harfler yok (0/O, 1/I/L): sesli okunup elle yazılabilir kod. */
const KOD_ALFABESI = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** `bytes`: kriptografik rastgele baytlar (servis `randomBytes` verir). */
export function codeFromBytes(bytes: Uint8Array, length = DUEL_RULES.code.length): string {
  let s = '';
  for (let i = 0; i < length; i++) s += KOD_ALFABESI[bytes[i] % KOD_ALFABESI.length];
  return s;
}

/** Kullanıcının yazdığı kod: boşluk, tire ve küçük harf hoş görülür. */
export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Başkan ayrılınca devir: en eski katılan, hâlâ içerideki oyuncu. */
export function nextHost(
  players: readonly { userId: string; joinedAt: number; gone: boolean }[],
  leavingId: string,
): string | null {
  const aday = players
    .filter((p) => !p.gone && p.userId !== leavingId)
    .sort((a, b) => a.joinedAt - b.joinedAt || a.userId.localeCompare(b.userId))[0];
  return aday?.userId ?? null;
}

/** Başkan oyunu başlatabilir mi? Neden başlatamadığı cümlesi sunucuda üretilir. */
export function roomStartBlocker(
  players: readonly { isReady: boolean; isHost: boolean }[],
  min: number = DUEL_RULES.room.minPlayers,
): string | null {
  if (players.length < min) return `Başlamak için en az ${min} kişi gerekir.`;
  if (players.some((p) => !p.isHost && !p.isReady)) return 'Herkes hazır olunca başlatabilirsin.';
  return null;
}

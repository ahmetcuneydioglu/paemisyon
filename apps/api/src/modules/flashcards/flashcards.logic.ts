/**
 * Bilgi kartları saf mantığı (Doc 56): öğrenme durumu türetme, mod sayımları, kuyruk kurma,
 * oturum özeti. Veritabanı yok; servis ve spec aynı kodu kullanır. İstemci eşik bilmez.
 */
import {
  OGRENILDI_MIN_ARALIK_GUN,
  OGRENILDI_MIN_REPS,
  OTURUM_ICI_TEKRAR_EN_COK,
  ZOR_MIN_LAPSES,
  type FlashcardMode,
} from './flashcard.constants';

/** Türetilen öğrenme durumu — saklanmaz. `due` ayrı bayraktır (öğrenilmiş kart da vadesi gelince due olur). */
export type LearningState = 'new' | 'learning' | 'learned';

export interface ReviewRow {
  flashcardId: string;
  reps: number;
  lapses: number;
  intervalDays: number;
  dueAt: Date;
  lastRating: 'again' | 'known' | 'easy';
}

export interface CardState {
  state: LearningState;
  due: boolean;
  hard: boolean;
  dueAt: string | null;
}

export function learningState(r: ReviewRow | null | undefined): LearningState {
  if (!r) return 'new';
  return r.reps >= OGRENILDI_MIN_REPS && r.intervalDays >= OGRENILDI_MIN_ARALIK_GUN
    ? 'learned'
    : 'learning';
}

export function isHard(r: ReviewRow | null | undefined): boolean {
  return !!r && (r.lapses >= ZOR_MIN_LAPSES || r.lastRating === 'again');
}

export function cardState(r: ReviewRow | null | undefined, now: Date): CardState {
  return {
    state: learningState(r),
    due: !!r && r.dueAt.getTime() <= now.getTime(),
    hard: isHard(r),
    dueAt: r ? r.dueAt.toISOString() : null,
  };
}

export interface ModeCounts {
  total: number;
  new: number;
  learning: number;
  learned: number;
  due: number;
  hard: number;
  favorites: number;
  /** Kilitli (premium) kartlar sayımlara GİRMEZ; yalnız burada görünür. */
  locked: number;
}

export interface CardRef {
  id: string;
  sortOrder: number;
  locked: boolean;
  bookmarked: boolean;
  review: ReviewRow | null;
}

/** Açık kartların mod sayımları (kilitli kartlar yalnız `locked`'a yazılır). */
export function modeCounts(cards: readonly CardRef[], now: Date): ModeCounts {
  const c: ModeCounts = {
    total: 0,
    new: 0,
    learning: 0,
    learned: 0,
    due: 0,
    hard: 0,
    favorites: 0,
    locked: 0,
  };
  for (const k of cards) {
    if (k.locked) {
      c.locked += 1;
      continue;
    }
    c.total += 1;
    const s = cardState(k.review, now);
    c[s.state] += 1;
    if (s.due) c.due += 1;
    if (s.hard) c.hard += 1;
    if (k.bookmarked) c.favorites += 1;
  }
  return c;
}

/** Sunucunun önerdiği mod: vadesi gelen varsa due, yoksa yeni, yoksa zor, yoksa hepsi. */
export function suggestedMode(c: ModeCounts): FlashcardMode {
  if (c.due > 0) return 'due';
  if (c.new > 0) return 'new';
  if (c.hard > 0) return 'hard';
  return 'all';
}

/** Deterministik karıştırma (oturum kimliğiyle tohumlanır; test edilebilir). */
export function seededShuffle<T>(arr: readonly T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * Kuyruk: moda göre açık kartları seçer ve sıralar.
 *  due       vadesi geçen, en eski vade önce
 *  new       hiç görülmemiş, müfredat sırası
 *  hard      zorlanılan, en eski vade önce
 *  favorites favoriler, müfredat sırası
 *  all       vade → yeni → kalan (öğreniliyor/öğrenildi), kendi içinde sıralı
 *  mixed     rastgele (tohumlu)
 *
 * `karisik` (kullanıcı kararı 13 Kas 2026): geniş kapsamda (ders ya da tüm kartlar) kartlar konu konu,
 * müfredat sırasıyla gelmesin diye her grup kendi içinde tohumla karıştırılır. Grup önceliği korunur
 * (`all`: vade → yeni → kalan). Konu ve ünite kapsamı sıralı kalır; orada sıra müfredatın kendisidir.
 */
export function buildQueue(
  cards: readonly CardRef[],
  mode: FlashcardMode,
  now: Date,
  limit: number,
  seed = '',
  karisik = false,
): string[] {
  const acik = cards.filter((k) => !k.locked);
  const bySort = (a: CardRef, b: CardRef) => a.sortOrder - b.sortOrder;
  const byDue = (a: CardRef, b: CardRef) =>
    (a.review?.dueAt.getTime() ?? 0) - (b.review?.dueAt.getTime() ?? 0) || bySort(a, b);
  const st = (k: CardRef) => cardState(k.review, now);
  /** Grup sırası: karışık kapsamda tohumlu karıştırma, değilse grubun kendi ölçütü. */
  const sirala = (grup: CardRef[], olcut: (a: CardRef, b: CardRef) => number, ek: string) =>
    karisik ? seededShuffle(grup.sort(bySort), `${seed}:${ek}`) : grup.sort(olcut);
  let secim: CardRef[];
  switch (mode) {
    case 'due':
      secim = sirala(
        acik.filter((k) => st(k).due),
        byDue,
        'due',
      );
      break;
    case 'new':
      secim = sirala(
        acik.filter((k) => !k.review),
        bySort,
        'new',
      );
      break;
    case 'hard':
      secim = sirala(
        acik.filter((k) => st(k).hard),
        byDue,
        'hard',
      );
      break;
    case 'favorites':
      secim = sirala(
        acik.filter((k) => k.bookmarked),
        bySort,
        'fav',
      );
      break;
    case 'mixed':
      secim = seededShuffle(acik, seed);
      break;
    case 'all':
    default: {
      const vade = sirala(
        acik.filter((k) => st(k).due),
        byDue,
        'due',
      );
      const yeni = sirala(
        acik.filter((k) => !k.review),
        bySort,
        'new',
      );
      const kalan = sirala(
        acik.filter((k) => k.review && !st(k).due),
        byDue,
        'rest',
      );
      secim = [...vade, ...yeni, ...kalan];
    }
  }
  return secim.slice(0, limit).map((k) => k.id);
}

/**
 * Oturum içi tekrar: "Tekrar" denen kart kuyruğun sonuna döner; aynı kart turda en çok
 * OTURUM_ICI_TEKRAR_EN_COK kez görünür. Saf: yeni kuyruğu döndürür (ya da aynısını).
 */
export function requeueAgain(queue: readonly string[], cardId: string): string[] {
  const gorunme = queue.filter((id) => id === cardId).length;
  if (gorunme >= OTURUM_ICI_TEKRAR_EN_COK) return [...queue];
  return [...queue, cardId];
}

export interface EventRow {
  flashcardId: string;
  rating: 'again' | 'known' | 'easy';
  undoneAt: Date | null;
}

export interface SessionSummary {
  reviewed: number;
  known: number;
  again: number;
  /** Benzersiz kart sayısı (aynı kart iki kez görünmüş olabilir). */
  uniqueCards: number;
  knownPct: number | null;
}

export function sessionSummary(events: readonly EventRow[]): SessionSummary {
  const gecerli = events.filter((e) => !e.undoneAt);
  const known = gecerli.filter((e) => e.rating !== 'again').length;
  const again = gecerli.length - known;
  return {
    reviewed: gecerli.length,
    known,
    again,
    uniqueCards: new Set(gecerli.map((e) => e.flashcardId)).size,
    knownPct: gecerli.length ? Math.round((known / gecerli.length) * 100) : null,
  };
}

/** Günlük hedefe sayılan kart: bugün geri alınmamış olaylardan BENZERSİZ kart sayısı. */
export function dailyDone(events: readonly EventRow[]): number {
  return new Set(events.filter((e) => !e.undoneAt).map((e) => e.flashcardId)).size;
}

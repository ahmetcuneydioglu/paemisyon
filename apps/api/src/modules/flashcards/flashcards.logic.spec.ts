import {
  buildQueue,
  cardState,
  dailyDone,
  learningState,
  modeCounts,
  requeueAgain,
  seededShuffle,
  sessionSummary,
  suggestedMode,
  type CardRef,
  type ReviewRow,
} from './flashcards.logic';

const now = new Date('2026-11-05T10:00:00Z');
const G = 86_400_000;
const rev = (p: Partial<ReviewRow>): ReviewRow => ({
  flashcardId: 'x',
  reps: 0,
  lapses: 0,
  intervalDays: 0,
  dueAt: new Date(now.getTime() + G),
  lastRating: 'known',
  ...p,
});
const card = (id: string, p: Partial<CardRef> = {}): CardRef => ({
  id,
  sortOrder: Number(id.replace(/\D/g, '')) || 0,
  locked: false,
  bookmarked: false,
  review: null,
  ...p,
});

describe('learningState / cardState (Doc 56 §5.2 — saklanmaz, türetilir)', () => {
  it('kayıt yoksa new; reps<3 learning; reps≥3 ve aralık≥7 learned', () => {
    expect(learningState(null)).toBe('new');
    expect(learningState(rev({ reps: 2, intervalDays: 10 }))).toBe('learning');
    expect(learningState(rev({ reps: 3, intervalDays: 3 }))).toBe('learning');
    expect(learningState(rev({ reps: 3, intervalDays: 7 }))).toBe('learned');
  });
  it('öğrenilmiş kart da vadesi geçince due olur; tek doğru cevap öğrenildi demek değildir', () => {
    const s = cardState(
      rev({ reps: 4, intervalDays: 14, dueAt: new Date(now.getTime() - 1) }),
      now,
    );
    expect(s).toMatchObject({ state: 'learned', due: true });
    expect(cardState(rev({ reps: 1, intervalDays: 1 }), now).state).toBe('learning');
  });
  it('hard: lapses≥2 ya da son puan again', () => {
    expect(cardState(rev({ lapses: 2 }), now).hard).toBe(true);
    expect(cardState(rev({ lastRating: 'again' }), now).hard).toBe(true);
    expect(cardState(rev({ lapses: 1 }), now).hard).toBe(false);
  });
});

describe('modeCounts / suggestedMode', () => {
  const cards = [
    card('c1'),
    card('c2', { review: rev({ dueAt: new Date(now.getTime() - G) }) }),
    card('c3', { review: rev({ reps: 3, intervalDays: 7 }), bookmarked: true }),
    card('c4', { locked: true }),
    card('c5', { review: rev({ lapses: 2, dueAt: new Date(now.getTime() - 1) }) }),
  ];
  it('kilitli kart sayımlara girmez, yalnız locked', () => {
    const c = modeCounts(cards, now);
    expect(c).toEqual({
      total: 4,
      new: 1,
      learning: 2,
      learned: 1,
      due: 2,
      hard: 1,
      favorites: 1,
      locked: 1,
    });
  });
  it('öneri: due > new > hard > all', () => {
    expect(suggestedMode(modeCounts(cards, now))).toBe('due');
    expect(suggestedMode({ ...modeCounts(cards, now), due: 0 })).toBe('new');
    expect(suggestedMode({ ...modeCounts(cards, now), due: 0, new: 0 })).toBe('hard');
    expect(suggestedMode({ ...modeCounts(cards, now), due: 0, new: 0, hard: 0 })).toBe('all');
  });
});

describe('buildQueue', () => {
  const cards = [
    card('c1'),
    card('c2', { review: rev({ dueAt: new Date(now.getTime() - 2 * G) }) }),
    card('c3', { review: rev({ dueAt: new Date(now.getTime() - G) }) }),
    card('c4', { locked: true, review: rev({ dueAt: new Date(now.getTime() - 5 * G) }) }),
    card('c5', { review: rev({ reps: 2 }) }),
    card('c6', { bookmarked: true }),
  ];
  it('due: en eski vade önce; kilitli kart asla girmez', () => {
    expect(buildQueue(cards, 'due', now, 20)).toEqual(['c2', 'c3']);
  });
  it('new: görülmemişler müfredat sırasıyla', () => {
    expect(buildQueue(cards, 'new', now, 20)).toEqual(['c1', 'c6']);
  });
  it('all: vade → yeni → kalan; limit uygulanır', () => {
    expect(buildQueue(cards, 'all', now, 20)).toEqual(['c2', 'c3', 'c1', 'c6', 'c5']);
    expect(buildQueue(cards, 'all', now, 3)).toEqual(['c2', 'c3', 'c1']);
  });
  it('favorites yalnız favoriler', () => {
    expect(buildQueue(cards, 'favorites', now, 20)).toEqual(['c6']);
  });
  it('mixed: aynı tohum aynı sıra, farklı tohum farklı sıra olabilir, küme aynı', () => {
    const a = buildQueue(cards, 'mixed', now, 20, 's1');
    const b = buildQueue(cards, 'mixed', now, 20, 's1');
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual(['c1', 'c2', 'c3', 'c5', 'c6']);
    expect(seededShuffle([1, 2, 3, 4, 5], 'x')).not.toEqual([1, 2, 3, 4, 5]);
  });
});

describe('requeueAgain', () => {
  it('"Tekrar" denen kart sona döner; en çok 2 görünüm', () => {
    expect(requeueAgain(['a', 'b'], 'a')).toEqual(['a', 'b', 'a']);
    expect(requeueAgain(['a', 'b', 'a'], 'a')).toEqual(['a', 'b', 'a']);
  });
});

describe('sessionSummary / dailyDone', () => {
  const ev = (flashcardId: string, rating: 'again' | 'known', undone = false) => ({
    flashcardId,
    rating,
    undoneAt: undone ? now : null,
  });
  it('geri alınan olay sayılmaz; benzersiz kart ayrı sayılır', () => {
    const s = sessionSummary([
      ev('a', 'known'),
      ev('b', 'again'),
      ev('b', 'known'),
      ev('c', 'known', true),
    ]);
    expect(s).toEqual({ reviewed: 3, known: 2, again: 1, uniqueCards: 2, knownPct: 67 });
    expect(dailyDone([ev('a', 'known'), ev('a', 'again'), ev('c', 'known', true)])).toBe(1);
  });
  it('boş oturumda yüzde null', () => {
    expect(sessionSummary([]).knownPct).toBeNull();
  });
});

import {
  advance,
  answerWindow,
  codeFromBytes,
  duelOutcome,
  duelXp,
  eloDelta,
  nextHost,
  nextStreak,
  normalizeCode,
  rankStandings,
  roomRatingDelta,
  roomStartBlocker,
  roomXp,
  scoreAnswer,
  type EngineRules,
  type EngineState,
} from './duel.logic';

const RULES: EngineRules = {
  questionCount: 3,
  secondsPerQuestion: 20,
  revealMs: 3000,
  graceMs: 400,
};
const T0 = 1_000_000;
const geriSayim: EngineState = {
  phase: 'countdown',
  index: -1,
  phaseStartedAt: T0 - 3000,
  phaseEndsAt: T0,
};

describe('advance — zaman damgasından tembel ilerleme', () => {
  it('geri sayım bitmeden değişmez', () => {
    const r = advance(geriSayim, RULES, T0 - 1, false);
    expect(r.state).toEqual(geriSayim);
    expect(r.events).toEqual([]);
  });

  it('geri sayım bitince ilk soru PLANLANAN anda açılır (geç bakılsa da)', () => {
    const r = advance(geriSayim, RULES, T0 + 5000, false);
    expect(r.state).toEqual({
      phase: 'question',
      index: 0,
      phaseStartedAt: T0,
      phaseEndsAt: T0 + 20_000,
    });
    expect(r.events).toEqual([{ type: 'question_opened', index: 0, at: T0 }]);
  });

  it('süre + tolerans dolmadan soru kapanmaz', () => {
    const q: EngineState = {
      phase: 'question',
      index: 0,
      phaseStartedAt: T0,
      phaseEndsAt: T0 + 20_000,
    };
    expect(advance(q, RULES, T0 + 20_400, false).state.phase).toBe('question');
    const r = advance(q, RULES, T0 + 20_401, false);
    expect(r.state).toEqual({
      phase: 'reveal',
      index: 0,
      phaseStartedAt: T0 + 20_400,
      phaseEndsAt: T0 + 23_400,
    });
  });

  it('herkes cevaplayınca soru o an kapanır', () => {
    const q: EngineState = {
      phase: 'question',
      index: 0,
      phaseStartedAt: T0,
      phaseEndsAt: T0 + 20_000,
    };
    const r = advance(q, RULES, T0 + 4000, true);
    expect(r.state).toEqual({
      phase: 'reveal',
      index: 0,
      phaseStartedAt: T0 + 4000,
      phaseEndsAt: T0 + 7000,
    });
    expect(r.events).toEqual([{ type: 'question_closed', index: 0, at: T0 + 4000 }]);
  });

  it('erken kapanış yalnız girişteki soruya uygulanır, sonraki soruya taşmaz', () => {
    // bayrak yanlışlıkla dolu gelse bile bu çağrıda YENİ açılan soru hemen kapanmaz
    const r = advance(geriSayim, RULES, T0 + 1000, true);
    expect(r.state).toEqual({
      phase: 'question',
      index: 0,
      phaseStartedAt: T0,
      phaseEndsAt: T0 + 20_000,
    });
    const gosterim: EngineState = {
      phase: 'reveal',
      index: 0,
      phaseStartedAt: T0,
      phaseEndsAt: T0 + 3000,
    };
    const r2 = advance(gosterim, RULES, T0 + 3500, true);
    expect(r2.state.phase).toBe('question');
    expect(r2.state.index).toBe(1);
  });

  it('kimse bakmazken geçen maç zincirleme biter (askıya alınmış istemciler)', () => {
    const r = advance(geriSayim, RULES, T0 + 10 * 60_000, false);
    expect(r.state.phase).toBe('finished');
    expect(r.events.filter((e) => e.type === 'question_closed')).toHaveLength(3);
    expect(r.events.at(-1)?.type).toBe('finished');
    // bitiş anı planlanan andır: 3 × (20 sn + 0,4 tolerans + 3 sn gösterim)
    expect(r.events.at(-1)?.at).toBe(T0 + 3 * 23_400);
  });

  it('son sorunun gösterimi bitince maç biter', () => {
    const son: EngineState = {
      phase: 'reveal',
      index: 2,
      phaseStartedAt: T0,
      phaseEndsAt: T0 + 3000,
    };
    expect(advance(son, RULES, T0 + 2999, false).state.phase).toBe('reveal');
    expect(advance(son, RULES, T0 + 3000, false).state.phase).toBe('finished');
  });

  it('bitmiş / iptal / lobi maçı ikinci kez ilerletmek hiçbir şey yapmaz (idempotent)', () => {
    for (const phase of ['finished', 'cancelled', 'lobby'] as const) {
      const s: EngineState = { phase, index: 2, phaseStartedAt: T0, phaseEndsAt: null };
      const r = advance(s, RULES, T0 + 999_999, true);
      expect(r.state).toEqual(s);
      expect(r.events).toEqual([]);
    }
  });
});

describe('answerWindow — sunucu saati esastır', () => {
  const q: EngineState = {
    phase: 'question',
    index: 1,
    phaseStartedAt: T0,
    phaseEndsAt: T0 + 20_000,
  };

  it('açık soruya zamanında cevap kabul edilir, süre sunucudan ölçülür', () => {
    expect(answerWindow(q, RULES, 1, T0 + 7300)).toEqual({ ok: true, elapsedMs: 7300 });
  });
  it('tolerans içindeki geç cevap kabul edilir ama süre tavanı aşılmaz', () => {
    expect(answerWindow(q, RULES, 1, T0 + 20_300)).toEqual({ ok: true, elapsedMs: 20_000 });
  });
  it('süre bittikten sonra gelen cevap reddedilir', () => {
    expect(answerWindow(q, RULES, 1, T0 + 20_401)).toEqual({ ok: false, reason: 'late' });
  });
  it('başka soruya (eski ya da gelecek) cevap reddedilir', () => {
    expect(answerWindow(q, RULES, 0, T0 + 100)).toEqual({ ok: false, reason: 'wrong_index' });
    expect(answerWindow(q, RULES, 2, T0 + 100)).toEqual({ ok: false, reason: 'wrong_index' });
  });
  it('gösterim / geri sayım fazında cevap reddedilir', () => {
    expect(answerWindow({ ...q, phase: 'reveal' }, RULES, 1, T0 + 100)).toEqual({
      ok: false,
      reason: 'not_open',
    });
  });
});

describe('scoreAnswer', () => {
  it('yanlış ve boş 0 puan', () => {
    expect(scoreAnswer(false, 0, 20_000)).toBe(0);
  });
  it('doğru: 100 + kalan süre oranında bonus', () => {
    expect(scoreAnswer(true, 0, 20_000)).toBe(150);
    expect(scoreAnswer(true, 10_000, 20_000)).toBe(125);
    expect(scoreAnswer(true, 20_000, 20_000)).toBe(100);
  });
  it('sınır dışı süre bonusu taşırmaz', () => {
    expect(scoreAnswer(true, -500, 20_000)).toBe(150);
    expect(scoreAnswer(true, 99_000, 20_000)).toBe(100);
  });
});

describe('rankStandings — eşitlik bozma', () => {
  const s = (
    userId: string,
    score: number,
    correctCount: number,
    correctMs: number,
    forfeited = false,
  ) => ({
    userId,
    score,
    correctCount,
    correctMs,
    forfeited,
  });

  it('puan, sonra doğru sayısı, sonra doğru cevap süresi', () => {
    const r = rankStandings([
      s('a', 500, 4, 9000),
      s('b', 500, 5, 9000),
      s('c', 600, 4, 9000),
      s('d', 500, 5, 8000),
    ]);
    expect(r.map((x) => [x.userId, x.placement])).toEqual([
      ['c', 1],
      ['d', 2],
      ['b', 3],
      ['a', 4],
    ]);
  });

  it('tam eşitlik aynı sırayı paylaşır, sonraki sıra atlanır', () => {
    const r = rankStandings([s('a', 500, 4, 9000), s('b', 500, 4, 9000), s('c', 100, 1, 1000)]);
    expect(r.map((x) => x.placement)).toEqual([1, 1, 3]);
  });

  it('ayrılan oyuncu puanı yüksek olsa da kalanların arkasındadır', () => {
    const r = rankStandings([s('kacan', 900, 6, 100, true), s('kalan', 100, 1, 5000)]);
    expect(r.map((x) => x.userId)).toEqual(['kalan', 'kacan']);
  });

  it('1v1: tam eşitlik berabere, aksi kazanan/kaybeden', () => {
    const [x, y] = rankStandings([s('a', 500, 4, 9000), s('b', 500, 4, 9000)]);
    expect(duelOutcome(x, y)).toBe('draw');
    const [k, l] = rankStandings([s('a', 500, 4, 9000), s('b', 500, 4, 8000)]);
    expect(k.userId).toBe('b');
    expect(duelOutcome(k, l)).toBe('win');
    expect(duelOutcome(l, k)).toBe('loss');
  });
});

describe('ödüller', () => {
  it('1v1 XP', () => {
    expect([duelXp('win'), duelXp('draw'), duelXp('loss')]).toEqual([60, 25, 10]);
  });
  it('salon XP: ilk üç ve diğerleri', () => {
    expect([1, 2, 3, 4, 8].map((p) => roomXp(p))).toEqual([100, 70, 50, 15, 15]);
  });
  it('Elo: eşit puanda kazanan +12, kaybeden −12, berabere 0', () => {
    expect(eloDelta(1000, 1000, 'win')).toBe(12);
    expect(eloDelta(1000, 1000, 'loss')).toBe(-12);
    expect(eloDelta(1000, 1000, 'draw')).toBe(0);
  });
  it('Elo: güçlüyü yenmek daha çok kazandırır; taban altına inilmez', () => {
    expect(eloDelta(1000, 1400, 'win')).toBeGreaterThan(eloDelta(1000, 1000, 'win'));
    expect(eloDelta(105, 100, 'loss')).toBe(-5);
  });
  it('salon puanı: eşit puanlı üç kişide birinci artar, sonuncu düşer, ortadaki sabit', () => {
    const o = (placement: number) => ({ rating: 1000, placement });
    expect(roomRatingDelta(o(1), [o(2), o(3)])).toBe(24);
    expect(roomRatingDelta(o(2), [o(1), o(3)])).toBe(0);
    expect(roomRatingDelta(o(3), [o(1), o(2)])).toBe(-24);
  });
  it('seri: galibiyet artırır, mağlubiyet sıfırlar, beraberlik korur', () => {
    expect([nextStreak(4, 'win'), nextStreak(4, 'loss'), nextStreak(4, 'draw')]).toEqual([5, 0, 4]);
  });
});

describe('kod ve salon yardımcıları', () => {
  it('kod karışan karakter içermez, istenen uzunluktadır', () => {
    const kod = codeFromBytes(Uint8Array.from({ length: 6 }, (_, i) => i * 41));
    expect(kod).toHaveLength(6);
    expect(kod).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]+$/);
  });
  it('kullanıcının yazdığı kod normalleşir', () => {
    expect(normalizeCode(' s-4kd 9p ')).toBe('S4KD9P');
  });
  it('başkan ayrılınca en eski kalan oyuncu başkan olur', () => {
    const p = (userId: string, joinedAt: number, gone = false) => ({ userId, joinedAt, gone });
    expect(nextHost([p('h', 1), p('b', 3), p('a', 2), p('c', 0, true)], 'h')).toBe('a');
    expect(nextHost([p('h', 1)], 'h')).toBeNull();
  });
  it('başlatma: en az 3 kişi ve başkan dışında herkes hazır', () => {
    const o = (isReady: boolean, isHost = false) => ({ isReady, isHost });
    expect(roomStartBlocker([o(false, true), o(true)])).toMatch(/en az 3/);
    expect(roomStartBlocker([o(false, true), o(true), o(false)])).toMatch(/hazır/);
    expect(roomStartBlocker([o(false, true), o(true), o(true)])).toBeNull();
  });
});

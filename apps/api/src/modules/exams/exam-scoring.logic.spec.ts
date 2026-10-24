import {
  mean,
  median,
  percentileBand,
  rankWithTies,
  rankingName,
  scoreAttempt,
} from './exam-scoring.logic';
import {
  availabilityOf,
  canStartOfficial,
  canStartPractice,
  deadlineFor,
  isPastDeadline,
  legacyStateOf,
  listOrder,
  myStateOf,
  resultLocked,
} from './exam-state.logic';

const ans = (q: string, v: string, sel: string | null, ok: boolean | null) => ({
  questionId: q,
  questionVersionId: v,
  selectedOptionId: sel,
  isCorrect: ok,
});

describe('scoreAttempt (net)', () => {
  const set = new Map([
    ['v1', 'q1'],
    ['v2', 'q2'],
    ['v3', 'q3'],
    ['v4', 'q4'],
  ]);

  it('net = doğru − yanlış/4; boş etkilemez', () => {
    const r = scoreAttempt({
      total: 4,
      questionIdByVersion: set,
      answers: [
        ans('q1', 'v1', 'o', true),
        ans('q2', 'v2', 'o', false),
        ans('q3', 'v3', null, null),
      ],
    });
    expect(r).toMatchObject({
      correct: 1,
      wrong: 1,
      blank: 2,
      creditAll: 0,
      excluded: 0,
      scoredTotal: 4,
    });
    expect(r.score).toBe(0.75);
    expect(r.correct + r.wrong + r.blank + r.creditAll + r.excluded).toBe(4);
  });

  it('sete ait olmayan cevap sayılmaz (anahtar şişirmesi kapalı)', () => {
    const r = scoreAttempt({
      total: 4,
      questionIdByVersion: set,
      answers: [ans('qX', 'vX', 'o', true), ans('q1', 'v1', 'o', true)],
    });
    expect(r.correct).toBe(1);
  });

  it('herkese doğru say: yanlış cevaplanan iptal sorusu da doğru sayılır', () => {
    const r = scoreAttempt({
      total: 4,
      questionIdByVersion: set,
      answers: [ans('q1', 'v1', 'o', false), ans('q2', 'v2', 'o', true)],
      adjustments: new Map([['q1', 'credit_all']]),
    });
    expect(r).toMatchObject({ correct: 1, wrong: 0, blank: 2, creditAll: 1, excluded: 0 });
    expect(r.score).toBe(2);
  });

  it('hesaptan çıkar: toplam düşer, cevap sayılmaz', () => {
    const r = scoreAttempt({
      total: 4,
      questionIdByVersion: set,
      answers: [ans('q1', 'v1', 'o', true), ans('q2', 'v2', 'o', false)],
      adjustments: new Map([['q2', 'exclude']]),
    });
    expect(r).toMatchObject({ correct: 1, wrong: 0, blank: 2, excluded: 1, scoredTotal: 3 });
    expect(r.score).toBe(1);
    expect(r.correct + r.wrong + r.blank + r.creditAll + r.excluded).toBe(4);
  });

  it('eski oturum (set yok): cevaplar aynen sayılır', () => {
    const r = scoreAttempt({
      total: 2,
      answers: [ans('q1', 'v1', 'o', true), ans('q2', 'v2', 'o', true)],
    });
    expect(r.score).toBe(2);
  });
});

describe('rankWithTies', () => {
  const t = (iso: string) => new Date(iso);
  it('net ↓, az yanlış, kısa süre, erken teslim; tam eşitlikte ortak sıra ve atlama', () => {
    const rows = [
      {
        key: 'a',
        score: 78.25,
        wrongCount: 5,
        durationSeconds: 100,
        submittedAt: t('2026-10-24T20:00:00Z'),
      },
      {
        key: 'b',
        score: 74.5,
        wrongCount: 8,
        durationSeconds: 120,
        submittedAt: t('2026-10-24T20:00:00Z'),
      },
      {
        key: 'c',
        score: 74.5,
        wrongCount: 8,
        durationSeconds: 120,
        submittedAt: t('2026-10-24T20:00:00Z'),
      },
      {
        key: 'd',
        score: 74.5,
        wrongCount: 6,
        durationSeconds: 200,
        submittedAt: t('2026-10-24T20:00:00Z'),
      },
      {
        key: 'e',
        score: 73,
        wrongCount: 6,
        durationSeconds: 90,
        submittedAt: t('2026-10-24T20:00:00Z'),
      },
    ];
    const r = rankWithTies(rows).map((x) => [x.row.key, x.rank]);
    // d: aynı net ama daha az yanlış → b/c'nin önünde.
    expect(r).toEqual([
      ['a', 1],
      ['d', 2],
      ['b', 3],
      ['c', 3],
      ['e', 5],
    ]);
  });
  it('erken teslim eşitlik bozucudur', () => {
    const r = rankWithTies([
      {
        key: 'late',
        score: 50,
        wrongCount: 4,
        durationSeconds: 100,
        submittedAt: t('2026-10-24T21:00:00Z'),
      },
      {
        key: 'early',
        score: 50,
        wrongCount: 4,
        durationSeconds: 100,
        submittedAt: t('2026-10-24T20:00:00Z'),
      },
    ]);
    expect(r.map((x) => x.row.key)).toEqual(['early', 'late']);
    expect(r.map((x) => x.rank)).toEqual([1, 2]);
  });
});

describe('istatistik yardımcıları', () => {
  it('percentileBand 245/1203 → ilk %25; 1/1203 → %5', () => {
    expect(percentileBand(245, 1203)).toBe(25);
    expect(percentileBand(1, 1203)).toBe(5);
    expect(percentileBand(1203, 1203)).toBe(100);
  });
  it('median/mean', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(mean([1, 2])).toBe(1.5);
    expect(mean([])).toBeNull();
  });
  it('rankingName kısaltır', () => {
    expect(rankingName('Ahmet Can Demir')).toBe('Ahmet D.');
    expect(rankingName('Merve')).toBe('Merve');
    expect(rankingName('  ')).toBe('Aday');
    expect(rankingName('Elif ışık')).toBe('Elif I.');
  });
});

describe('exam-state', () => {
  const now = new Date('2026-10-25T18:30:00Z'); // Pazar 21:30 TR
  const takvimli = {
    publishMode: 'takvimli' as const,
    startAt: new Date('2026-10-25T18:00:00Z'),
    endAt: new Date('2026-10-25T20:30:00Z'),
    durationMinutes: 150,
    practiceAfterEnd: true,
  };
  const serbest = {
    publishMode: 'serbest' as const,
    startAt: new Date('2026-10-20T00:00:00Z'),
    endAt: null,
    durationMinutes: 150,
    practiceAfterEnd: true,
  };
  const none = { officialStatus: null, practiceInProgress: false };
  const done = { officialStatus: 'completed' as const, practiceInProgress: false };
  const live = { officialStatus: 'in_progress' as const, practiceInProgress: false };

  it('takvimli pencere: açılıştan kapanışa kadar herkes girebilir', () => {
    expect(availabilityOf(takvimli, new Date('2026-10-25T17:59:00Z'))).toBe('upcoming');
    expect(availabilityOf(takvimli, now)).toBe('open');
    expect(availabilityOf(takvimli, new Date('2026-10-25T20:31:00Z'))).toBe('closed');
    expect(legacyStateOf(takvimli, now)).toBe('active');
  });

  it('serbest süresiz açık; endAt doluysa kapanır', () => {
    expect(availabilityOf(serbest, now)).toBe('open');
    expect(availabilityOf({ ...serbest, endAt: new Date('2026-10-24T00:00:00Z') }, now)).toBe(
      'closed',
    );
  });

  it('resmî çözüm bir kez; tekrar çözüm resmî bitince', () => {
    expect(canStartOfficial(serbest, none, now)).toBe(true);
    expect(canStartOfficial(serbest, done, now)).toBe(false);
    expect(canStartPractice(serbest, none, now)).toBe(false);
    expect(canStartPractice(serbest, done, now)).toBe(true);
    expect(canStartPractice(serbest, live, now)).toBe(false);
  });

  it('kapanan takvimli deneme: pratik yalnız anahtar açıksa', () => {
    const closed = new Date('2026-10-26T10:00:00Z');
    expect(canStartOfficial(takvimli, none, closed)).toBe(false);
    expect(canStartPractice(takvimli, none, closed)).toBe(true);
    expect(canStartPractice({ ...takvimli, practiceAfterEnd: false }, none, closed)).toBe(false);
  });

  it('son tarih: takvimli resmî çözüm pencere kapanışıyla sınırlı, en az 60 sn', () => {
    const d = deadlineFor(takvimli, 'official', new Date('2026-10-25T19:30:00Z'));
    expect(d.toISOString()).toBe('2026-10-25T20:30:00.000Z'); // 150 dk yerine pencere
    const late = deadlineFor(takvimli, 'official', new Date('2026-10-25T20:29:50Z'));
    expect(late.getTime() - new Date('2026-10-25T20:29:50Z').getTime()).toBe(60_000);
    const practice = deadlineFor(takvimli, 'practice', new Date('2026-10-26T10:00:00Z'));
    expect(practice.toISOString()).toBe('2026-10-26T12:30:00.000Z');
  });

  it('ağ payı 10 sn', () => {
    const dl = new Date('2026-10-25T20:30:00Z');
    expect(isPastDeadline(dl, new Date('2026-10-25T20:30:09Z'))).toBe(false);
    expect(isPastDeadline(dl, new Date('2026-10-25T20:30:11Z'))).toBe(true);
  });

  it('sonuç kilidi yalnız takvimli resmî çözümde, pencere kapanana kadar', () => {
    expect(resultLocked(takvimli, 'official', now)).toBe(true);
    expect(resultLocked(takvimli, 'official', new Date('2026-10-25T20:31:00Z'))).toBe(false);
    expect(resultLocked(takvimli, 'practice', now)).toBe(false);
    expect(resultLocked(serbest, 'official', now)).toBe(false);
  });

  it('liste sırası ve aday durumu', () => {
    expect(myStateOf(live)).toBe('in_progress');
    expect(myStateOf(done)).toBe('completed');
    expect(listOrder('open', 'in_progress')).toBe(0);
    expect(listOrder('open', 'new')).toBe(1);
    expect(listOrder('open', 'completed')).toBe(2);
    expect(listOrder('upcoming', 'new')).toBe(3);
    expect(listOrder('closed', 'completed')).toBe(4);
  });
});

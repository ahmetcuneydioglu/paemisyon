import {
  atamaPlani,
  bolumle,
  konuSirasi,
  siradaki,
  testDurumu,
  type TestSatiri,
} from './course-tests.logic';

const ids = (n: number, p = 'q') => Array.from({ length: n }, (_, i) => `${p}${i + 1}`);
const satir = (o: Partial<TestSatiri> & { number: number }): TestSatiri => ({
  id: `t${o.number}`,
  topicId: 'a',
  topicName: 'A',
  questionCount: 20,
  bestPct: null,
  inProgress: null,
  ...o,
});

describe('course-tests.logic (Doc 49/18)', () => {
  describe('atamaPlani — kararlı atama', () => {
    it('ilk dolum: 45 soru → 20 + 20 + 5', () => {
      const p = atamaPlani(null, ids(45));
      expect(p.sonaEkle).toBeNull();
      expect(p.yeniTestler.map((t) => [t.number, t.questionIds.length])).toEqual([
        [1, 20],
        [2, 20],
        [3, 5],
      ]);
    });
    it("yeni sorular önce son testi 20'ye tamamlar, sonra yeni test açar", () => {
      const p = atamaPlani({ number: 3, count: 5 }, ids(18, 'n'));
      expect(p.sonaEkle).toEqual({ testNumber: 3, startPosition: 5, questionIds: ids(15, 'n') });
      expect(p.yeniTestler).toEqual([{ number: 4, questionIds: ['n16', 'n17', 'n18'] }]);
    });
    it('dolu son test hiç değişmez', () => {
      const p = atamaPlani({ number: 2, count: 20 }, ids(3));
      expect(p.sonaEkle).toBeNull();
      expect(p.yeniTestler).toEqual([{ number: 3, questionIds: ids(3) }]);
    });
    it('atanacak soru yoksa plan boş', () => {
      expect(atamaPlani({ number: 1, count: 7 }, [])).toEqual({ sonaEkle: null, yeniTestler: [] });
    });
  });

  it('konu sırası: üst konu, hemen ardından çocukları; sortOrder ile', () => {
    const sira = konuSirasi([
      { id: 'b', parentId: null, sortOrder: 2 },
      { id: 'a', parentId: null, sortOrder: 1 },
      { id: 'a2', parentId: 'a', sortOrder: 2 },
      { id: 'a1', parentId: 'a', sortOrder: 1 },
      { id: 'yetim', parentId: 'baska-ders', sortOrder: 0 },
    ]);
    expect([...sira.entries()].sort((x, y) => x[1] - y[1]).map((e) => e[0])).toEqual([
      'a',
      'a1',
      'a2',
      'b',
      'yetim',
    ]);
  });

  it('durum: ücretsizde Test 1 dışı kilitli; yarım > tamamlandı > yeni', () => {
    expect(testDurumu(satir({ number: 2 }), false)).toBe('locked');
    expect(testDurumu(satir({ number: 1 }), false)).toBe('new');
    expect(testDurumu(satir({ number: 2, bestPct: 80 }), true)).toBe('done');
    const yarim = { sessionId: 's', answered: 11, total: 20 };
    expect(testDurumu(satir({ number: 2, bestPct: 80, inProgress: yarim }), true)).toBe('progress');
  });

  it('bölümle: aynı başlık konusuna sahip ardışık testler bir bölüm', () => {
    const b = bolumle(
      [
        satir({ number: 1, topicId: 'a', topicName: 'Temel Kavramlar', bestPct: 85 }),
        satir({ number: 2, topicId: 'a', topicName: 'Temel Kavramlar' }),
        satir({ number: 3, topicId: 'b', topicName: 'T.C. Anayasası' }),
        satir({ number: 4, topicId: 'b', topicName: 'T.C. Anayasası' }),
      ],
      true,
    );
    expect(b.map((s) => [s.heading, s.from, s.to])).toEqual([
      ['Temel Kavramlar', 1, 2],
      ['T.C. Anayasası', 3, 4],
    ]);
    expect(b[0]!.tests[0]).toMatchObject({ state: 'done', pct: 85 });
  });

  it('sıradaki: önce yarım test, yoksa ilk açık ve başlanmamış', () => {
    const rows = [
      satir({ number: 1, bestPct: 70 }),
      satir({ number: 2 }),
      satir({ number: 3, inProgress: { sessionId: 's3', answered: 4, total: 20 } }),
    ];
    expect(siradaki(rows, true)).toMatchObject({ number: 3, sessionId: 's3', answered: 4 });
    expect(siradaki(rows.slice(0, 2), true)).toMatchObject({ number: 2, sessionId: null });
    // Ücretsiz: Test 1 bitmiş, diğerleri kilitli → sıradaki yok.
    expect(siradaki(rows.slice(0, 2), false)).toBeNull();
  });
});

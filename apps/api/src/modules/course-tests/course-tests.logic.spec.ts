import {
  atamaPlani,
  bolumle,
  konuSirasi,
  siradaki,
  sonucCumlesi,
  sonucOnceligi,
  testeDogru,
  yonelmeEki,
  testDurumu,
  type TestSatiri,
} from './course-tests.logic';

const ids = (n: number, p = 'q') => Array.from({ length: n }, (_, i) => `${p}${i + 1}`);
const satir = (o: Partial<TestSatiri> & { number: number }): TestSatiri => ({
  id: `t${o.number}`,
  topicId: 'a',
  topicName: 'A',
  questionCount: 20,
  best: null,
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
    expect(testDurumu(satir({ number: 2, best: { pct: 80, correct: 16, wrong: 4 } }), true)).toBe(
      'done',
    );
    const yarim = { sessionId: 's', answered: 11, total: 20 };
    expect(
      testDurumu(
        satir({ number: 2, best: { pct: 80, correct: 16, wrong: 4 }, inProgress: yarim }),
        true,
      ),
    ).toBe('progress');
  });

  it('bölümle: aynı başlık konusuna sahip ardışık testler bir bölüm', () => {
    const b = bolumle(
      [
        satir({
          number: 1,
          topicId: 'a',
          topicName: 'Temel Kavramlar',
          best: { pct: 85, correct: 17, wrong: 3 },
        }),
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
    expect(b[0]!.tests[0]).toMatchObject({ state: 'done', pct: 85, correct: 17, wrong: 3 });
  });

  it('sıradaki: önce yarım test, yoksa ilk açık ve başlanmamış', () => {
    const rows = [
      satir({ number: 1, best: { pct: 70, correct: 14, wrong: 6 } }),
      satir({ number: 2 }),
      satir({ number: 3, inProgress: { sessionId: 's3', answered: 4, total: 20 } }),
    ];
    expect(siradaki(rows, true)).toMatchObject({ number: 3, sessionId: 's3', answered: 4 });
    expect(siradaki(rows.slice(0, 2), true)).toMatchObject({ number: 2, sessionId: null });
    // Ücretsiz: Test 1 bitmiş, diğerleri kilitli → sıradaki yok.
    expect(siradaki(rows.slice(0, 2), false)).toBeNull();
  });

  describe('sonuç ekranı (Doc 49/18 §8)', () => {
    const acik = { number: 4, locked: false };
    const kilitli = { number: 2, locked: true };
    it('öncelik: zayıf testte yanlışlar, değilse açık sıradaki, sonra yanlışlar, sonra inceleme', () => {
      expect(sonucOnceligi({ pct: 40, wrong: 11, next: acik })).toBe('wrongs');
      expect(sonucOnceligi({ pct: 85, wrong: 3, next: acik })).toBe('next');
      expect(sonucOnceligi({ pct: 85, wrong: 3, next: kilitli })).toBe('wrongs');
      expect(sonucOnceligi({ pct: 100, wrong: 0, next: null })).toBe('review');
      // Eşik tam %50: zayıf sayılmaz.
      expect(sonucOnceligi({ pct: 50, wrong: 10, next: acik })).toBe('next');
    });
    it('cümle: bir sonraki adımı söyler', () => {
      expect(
        sonucCumlesi({ number: 1, pct: 40, wrong: 11, next: { number: 2, locked: false } }),
      ).toBe("Test 2'ye geçmeden önce 11 yanlışını bir tur daha çöz.");
      expect(sonucCumlesi({ number: 3, pct: 100, wrong: 0, next: acik })).toBe(
        'Hepsi doğru; Test 4 seni bekliyor.',
      );
      expect(sonucCumlesi({ number: 1, pct: 85, wrong: 3, next: kilitli })).toContain("Premium'da");
      expect(sonucCumlesi({ number: 51, pct: 90, wrong: 2, next: null })).toContain('son testi');
    });
  });

  it('yönelme eki okunuşa göre', () => {
    const ekler = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 51, 74].map(
      (n) => `${n}'${yonelmeEki(n)}`,
    );
    expect(ekler).toEqual([
      "1'e",
      "2'ye",
      "3'e",
      "4'e",
      "5'e",
      "6'ya",
      "7'ye",
      "8'e",
      "9'a",
      "10'a",
      "20'ye",
      "30'a",
      "40'a",
      "50'ye",
      "60'a",
      "70'e",
      "80'e",
      "90'a",
      "100'e",
      "51'e",
      "74'e",
    ]);
    expect(testeDogru(4)).toBe("Test 4'e");
  });
});

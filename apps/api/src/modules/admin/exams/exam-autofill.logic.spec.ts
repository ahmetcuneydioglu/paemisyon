import {
  allocateQuota,
  pickQuestions,
  pickSectionQuestions,
} from './exam-autofill.logic';

describe('allocateQuota', () => {
  it('ağırlıklara orantılı dağıtır (PAEM benzeri: %30 + 7×%10)', () => {
    const sections = [
      { sectionId: 'gk', weight: 30, available: 500 },
      ...['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => ({
        sectionId: id,
        weight: 10,
        available: 500,
      })),
    ];
    const q = allocateQuota(sections, 100);
    expect(q.get('gk')).toBe(30);
    for (const id of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) expect(q.get(id)).toBe(10);
  });

  it('kesirli payları en-büyük-kalan ile dağıtır; toplam tam tutar', () => {
    const q = allocateQuota(
      [
        { sectionId: 'x', weight: 50, available: 99 },
        { sectionId: 'y', weight: 30, available: 99 },
        { sectionId: 'z', weight: 20, available: 99 },
      ],
      25,
    );
    const total = [...q.values()].reduce((a, b) => a + b, 0);
    expect(total).toBe(25);
    expect(q.get('x')).toBeGreaterThanOrEqual(12);
  });

  it('kapasitesi dolan bölümün payını diğerlerine aktarır', () => {
    const q = allocateQuota(
      [
        { sectionId: 'kucuk', weight: 50, available: 3 },
        { sectionId: 'buyuk', weight: 50, available: 100 },
      ],
      20,
    );
    expect(q.get('kucuk')).toBe(3);
    expect(q.get('buyuk')).toBe(17);
  });

  it('toplam kapasite istekten azsa eldeki kadar döner', () => {
    const q = allocateQuota(
      [
        { sectionId: 'a', weight: 60, available: 4 },
        { sectionId: 'b', weight: 40, available: 5 },
      ],
      100,
    );
    expect((q.get('a') ?? 0) + (q.get('b') ?? 0)).toBe(9);
  });

  it('tüm ağırlıklar 0 ise eşit pay varsayar; boş bölüm dışlanır', () => {
    const q = allocateQuota(
      [
        { sectionId: 'a', weight: 0, available: 50 },
        { sectionId: 'b', weight: 0, available: 50 },
        { sectionId: 'bos', weight: 0, available: 0 },
      ],
      10,
    );
    expect(q.get('a')).toBe(5);
    expect(q.get('b')).toBe(5);
    expect(q.has('bos')).toBe(false);
  });
});

describe('pickQuestions', () => {
  it('az kullanılmış soruları önce seçer', () => {
    const picked = pickQuestions(
      [
        { questionId: 'eski1', usageCount: 3 },
        { questionId: 'taze1', usageCount: 0 },
        { questionId: 'eski2', usageCount: 2 },
        { questionId: 'taze2', usageCount: 0 },
      ],
      2,
      () => 0.5,
    );
    expect(picked.sort()).toEqual(['taze1', 'taze2']);
  });

  it('kota havuzdan büyükse tüm havuzu döner; girişi mutasyona uğratmaz', () => {
    const pool = [
      { questionId: 'a', usageCount: 1 },
      { questionId: 'b', usageCount: 0 },
    ];
    const copy = JSON.parse(JSON.stringify(pool));
    expect(pickQuestions(pool, 10).length).toBe(2);
    expect(pool).toEqual(copy);
  });

  it('bölüm kotası konulara dengeli dağılır — büyük konuya yığılmaz', () => {
    // Genel Kültür senaryosu: 3 konu, boyutlar 200/150/6; kota 30.
    const pool = [
      ...Array.from({ length: 200 }, (_, i) => ({
        questionId: 'tarih$i'.replace('$i', String(i)),
        usageCount: 0,
        topicId: 'tarih',
      })),
      ...Array.from({ length: 150 }, (_, i) => ({
        questionId: 'dil$i'.replace('$i', String(i)),
        usageCount: 0,
        topicId: 'dil',
      })),
      ...Array.from({ length: 6 }, (_, i) => ({
        questionId: 'guncel$i'.replace('$i', String(i)),
        usageCount: 0,
        topicId: 'guncel',
      })),
    ];
    const picked = pickSectionQuestions(pool, 30, () => 0.5);
    expect(picked.length).toBe(30);
    const countOf = (prefix: string) =>
      picked.filter((id) => id.startsWith(prefix)).length;
    // Küçük konu (6) tamamen girer; kalan 24 iki büyük konuya dengeli dağılır.
    expect(countOf('guncel')).toBe(6);
    expect(countOf('tarih')).toBe(12);
    expect(countOf('dil')).toBe(12);
  });

  it('tek konulu bölümde davranış değişmez (pickQuestions ile aynı)', () => {
    const pool = [
      { questionId: 'a', usageCount: 1, topicId: 't' },
      { questionId: 'b', usageCount: 0, topicId: 't' },
    ];
    expect(pickSectionQuestions(pool, 1, () => 0.5)).toEqual(['b']);
  });

  it('aynı kullanım seviyesinde rastgeleliğe göre karışır (enjekte rand)', () => {
    const seq = [0.9, 0.1, 0.5];
    let i = 0;
    const picked = pickQuestions(
      [
        { questionId: 'a', usageCount: 0 },
        { questionId: 'b', usageCount: 0 },
        { questionId: 'c', usageCount: 0 },
      ],
      3,
      () => seq[i++ % seq.length],
    );
    expect(picked).toEqual(['b', 'c', 'a']);
  });
});

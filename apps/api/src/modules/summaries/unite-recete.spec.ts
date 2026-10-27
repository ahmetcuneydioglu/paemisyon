import { pickUnitRecipe, unitMastery, type UnitForRecipe } from './unite-recete';

const U = (
  slug: string,
  solved: number,
  correct: number,
  completedAt: string | null = null,
): UnitForRecipe => ({
  slug,
  title: slug,
  topicId: 't',
  isPremium: false,
  articleNos: ['1'],
  mastery: unitMastery(solved, correct),
  completedAt,
});

describe('ünite hâkimiyeti bandı — konu eşiğiyle aynı', () => {
  it('çözüm yok → new; az veri → sparse; <%60 → weak; ≥%70 → strong; arası normal', () => {
    expect(unitMastery(0, 0).band).toBe('new');
    expect(unitMastery(5, 5).band).toBe('sparse');
    expect(unitMastery(10, 5).band).toBe('weak');
    expect(unitMastery(10, 8).band).toBe('strong');
    expect(unitMastery(10, 6).band).toBe('normal');
    expect(unitMastery(10, 6).accuracyPct).toBe(60);
    expect(unitMastery(0, 0).accuracyPct).toBeNull();
  });
});

describe('koç reçetesi (zayıf konunun üniteleri)', () => {
  it('zayıf ünitelerden doğruluğu en düşük seçilir; özet okunmamışsa önce özet', () => {
    const r = pickUnitRecipe([U('a', 12, 10), U('b', 15, 6), U('c', 10, 3)]);
    expect(r?.unit.slug).toBe('c');
    expect(r?.kind).toBe('summary_then_questions');
    expect(r?.session).toEqual({ topicId: 't', articleNos: ['1'], count: 10 });
  });

  it('özeti bitirilmiş ünite için özet reçetesi tekrar çıkmaz: doğrudan soru', () => {
    const r = pickUnitRecipe([U('c', 10, 3, '2026-10-26T00:00:00Z'), U('b', 15, 6)]);
    expect(r?.unit.slug).toBe('c');
    expect(r?.kind).toBe('questions');
  });

  it('hiçbir ünite eşiği geçmiyorsa en az çözülmüş ünite (hiç çözülmemiş önce)', () => {
    const r = pickUnitRecipe([U('a', 4, 1), U('b', 0, 0), U('c', 7, 2)]);
    expect(r?.unit.slug).toBe('b');
    expect(r?.unit.band).toBe('new');
  });

  it('ünite yoksa null', () => {
    expect(pickUnitRecipe([])).toBeNull();
  });

  it('deterministik: aynı veri aynı ünite (günde bir kez kuralının temeli)', () => {
    const data = [U('a', 20, 8), U('b', 20, 8)];
    expect(pickUnitRecipe(data)?.unit.slug).toBe(pickUnitRecipe([...data])?.unit.slug);
  });
});

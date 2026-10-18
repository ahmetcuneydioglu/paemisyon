import {
  dakikaDagit,
  haftaButcesi,
  haftaEvresi,
  haftaKapanisiTasimasi,
  haftalikSureOnDegeri,
  haftalikSureyiNormalize,
  kalemBittiMi,
  konuPuanlari,
  planUret,
  soruHedefi,
  ufukHaftalari,
  type PlanTopicInput,
} from './plan.logic';

const W0 = new Date('2026-10-19T00:00:00Z'); // Pazartesi
const gun = (n: number) => new Date(W0.getTime() + n * 86_400_000);

function konu(
  id: string,
  sectionId: string,
  sectionWeight: number,
  publishedQuestions: number,
  over: Partial<PlanTopicInput> = {},
): PlanTopicInput {
  return {
    topicId: id,
    name: id,
    sectionId,
    sectionWeight,
    publishedQuestions,
    solved: 0,
    correct: 0,
    mastery: 0,
    wrongCount: 0,
    ...over,
  };
}

/** Küçük bir PAEM benzeri müfredat: 3 bölüm, 8 konu. */
const MUFREDAT: PlanTopicInput[] = [
  konu('tck', 'ceza', 30, 400),
  konu('cmk', 'ceza', 30, 300),
  konu('kabahat', 'ceza', 30, 50),
  konu('anayasa', 'kamu', 40, 500, { mastery: 0.8, solved: 120, correct: 100 }),
  konu('idare', 'kamu', 40, 250),
  konu('pvsk', 'mevzuat', 30, 300, { wrongCount: 8, mastery: 0.3, solved: 40, correct: 15 }),
  konu('7068', 'mevzuat', 30, 200),
  konu('bos', 'mevzuat', 30, 0),
];

describe('plan.logic (Doc 49/12 F8-A)', () => {
  it('haftalık süre: 30 dk adıma yuvarlanır, 1–14 saat arası', () => {
    expect(haftalikSureyiNormalize(137)).toBe(150);
    expect(haftalikSureyiNormalize(10)).toBe(60);
    expect(haftalikSureyiNormalize(9999)).toBe(14 * 60);
    expect(haftalikSureOnDegeri(45, 20)).toBe(240); // 45×5 = 225 → 7,5 adım yukarı → 240
    expect(haftalikSureOnDegeri(null, 40)).toBe(300);
    expect(haftalikSureOnDegeri(null, 10)).toBe(90); // 15×5 = 75 → 90
  });

  it('evre: haftanın son gününe kalan güne göre build / exam_mode / taper', () => {
    const sinav = gun(60);
    expect(haftaEvresi(W0, sinav)).toBe('build');
    expect(haftaEvresi(gun(35), sinav)).toBe('exam_mode'); // son gün 41 → 19 gün kala
    expect(haftaEvresi(gun(56), sinav)).toBe('taper'); // son gün 62 → sınav geçmiş/0
    expect(haftaEvresi(W0, null)).toBe('build');
  });

  it('ufuk: tarih yoksa 12 hafta; tarih varsa sınav haftası dahil, tavan 26', () => {
    expect(ufukHaftalari(W0, null)).toHaveLength(12);
    expect(ufukHaftalari(W0, gun(20))).toHaveLength(3);
    expect(ufukHaftalari(W0, gun(400))).toHaveLength(26);
    expect(ufukHaftalari(W0, gun(2))).toHaveLength(1);
  });

  it('konu puanı: ağırlık × bölüm içi pay × ihtiyaç; yayımsız konu girmez; ustalık düşürür', () => {
    const p = konuPuanlari(MUFREDAT);
    expect(p.find((x) => x.topicId === 'bos')).toBeUndefined();
    const puan = (id: string) => p.find((x) => x.topicId === id)!.score;
    // anayasa: kamu %40 × 500/750 × (1.6−0.8) = 0.213; idare: %40 × 250/750 × 1.6 = 0.213 → eşit
    expect(puan('anayasa')).toBeCloseTo(puan('idare'), 3);
    // pvsk yanlış primi: %30 × 300/500 × 1.3 × 1.2 = 0.281 > 7068: %30 × 200/500 × 1.6 = 0.192
    expect(puan('pvsk')).toBeGreaterThan(puan('7068'));
    expect(p.reduce((a, b) => a + b.score, 0)).toBeCloseTo(1, 6);
  });

  it('soru hedefi: 60 sn varsayılan, 5e yuvarlı, en az 5; ortalama 30–120 sn arasına kırpılır', () => {
    expect(soruHedefi(60)).toBe(60);
    expect(soruHedefi(45, 90)).toBe(30);
    expect(soruHedefi(5)).toBe(5);
    expect(soruHedefi(60, 10)).toBe(120); // 30 sn tabanı
  });

  it('bütçe: exam_mode premiumda %30 tekrar + %20 deneme; ücretsizde konu; taper yarı bütçe', () => {
    expect(haftaButcesi(300, 'build', true)).toEqual({ topic: 300, review: 0, mock: 0 });
    expect(haftaButcesi(300, 'exam_mode', true)).toEqual({ topic: 150, review: 90, mock: 60 });
    expect(haftaButcesi(300, 'exam_mode', false)).toEqual({ topic: 300, review: 0, mock: 0 });
    expect(haftaButcesi(300, 'taper', true)).toEqual({ topic: 0, review: 150, mock: 0 });
    expect(haftaButcesi(300, 'taper', false)).toEqual({ topic: 150, review: 0, mock: 0 });
  });

  it('plan: deterministik, bütçe aşılmaz, aynı konu bir haftada bir kez, en çok iki hafta', () => {
    const inp = {
      startWeek: W0,
      examDate: gun(70),
      weeklyMinutes: 300,
      topics: MUFREDAT,
      isPremium: true,
    };
    const a = planUret(inp);
    const b = planUret(inp);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.weeks).toHaveLength(11);
    const sayac = new Map<string, number>();
    for (const w of a.weeks) {
      const konuDk = w.items
        .filter((i) => i.kind === 'topic')
        .reduce((s, i) => s + i.targetMinutes, 0);
      const butce = haftaButcesi(300, w.phase, true).topic;
      expect(konuDk).toBeLessThanOrEqual(butce);
      const ids = w.items.filter((i) => i.topicId).map((i) => i.topicId!);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) sayac.set(id, (sayac.get(id) ?? 0) + 1);
      for (const i of w.items) {
        if (i.kind === 'topic') expect(i.targetMinutes).toBeGreaterThanOrEqual(20);
      }
    }
    for (const n of sayac.values()) expect(n).toBeLessThanOrEqual(2);
    expect(a.coverage.syllabusTopics).toBe(7);
    expect(a.coverage.pctOfSyllabus).toBeGreaterThan(0);
  });

  it('plan: exam_mode haftalarında premium tekrar+deneme kalemi, taper haftasında yalnız tekrar', () => {
    const a = planUret({
      startWeek: W0,
      examDate: gun(40),
      weeklyMinutes: 300,
      topics: MUFREDAT,
      isPremium: true,
    });
    const evreler = a.weeks.map((w) => w.phase);
    expect(evreler[0]).toBe('build');
    expect(evreler.at(-1)).toBe('taper');
    const examWeek = a.weeks.find((w) => w.phase === 'exam_mode')!;
    expect(examWeek.items.some((i) => i.kind === 'review')).toBe(true);
    expect(examWeek.items.some((i) => i.kind === 'mock')).toBe(true);
    const taper = a.weeks.at(-1)!;
    expect(taper.items.every((i) => i.kind === 'review')).toBe(true);
    // Ücretsizde review/mock yok
    const u = planUret({
      startWeek: W0,
      examDate: gun(40),
      weeklyMinutes: 300,
      topics: MUFREDAT,
      isPremium: false,
    });
    expect(u.weeks.flatMap((w) => w.items).every((i) => i.kind === 'topic')).toBe(true);
  });

  it('plan: haftalar tek derse boğulmaz — ilk haftada en az iki bölüm', () => {
    const a = planUret({
      startWeek: W0,
      examDate: null,
      weeklyMinutes: 300,
      topics: MUFREDAT,
      isPremium: false,
    });
    const bolum = new Map(MUFREDAT.map((t) => [t.topicId, t.sectionId]));
    const ilk = new Set(a.weeks[0].items.map((i) => bolum.get(i.topicId!)));
    expect(ilk.size).toBeGreaterThanOrEqual(2);
  });

  it('taşınan dakika konunun payına eklenir ve bütçenin içinden gelir', () => {
    const konular = [
      { topicId: 'a', score: 0.5, ek: 0 },
      { topicId: 'b', score: 0.3, ek: 0 },
      { topicId: 'c', score: 0.2, ek: 0 },
    ];
    const yok = dakikaDagit(konular, 300, 1000);
    const var_ = dakikaDagit(
      konular.map((k) => (k.topicId === 'c' ? { ...k, ek: 40 } : k)),
      300,
      1000,
    );
    expect(var_.get('c')!).toBeGreaterThan(yok.get('c')!);
    const toplam = (m: Map<string, number>) => [...m.values()].reduce((x, y) => x + y, 0);
    expect(Math.abs(toplam(var_) - 300)).toBeLessThanOrEqual(10);
  });

  it('kalem bitti: soru VEYA dakika hedefi; sıfır hedef sayılmaz', () => {
    expect(
      kalemBittiMi({ targetMinutes: 60, targetQuestions: 60, doneMinutes: 10, doneQuestions: 60 }),
    ).toBe(true);
    expect(
      kalemBittiMi({ targetMinutes: 60, targetQuestions: 60, doneMinutes: 60, doneQuestions: 3 }),
    ).toBe(true);
    expect(
      kalemBittiMi({ targetMinutes: 60, targetQuestions: 0, doneMinutes: 0, doneQuestions: 0 }),
    ).toBe(false);
    expect(
      kalemBittiMi({ targetMinutes: 60, targetQuestions: 60, doneMinutes: 59, doneQuestions: 59 }),
    ).toBe(false);
  });

  it('hafta kapanışı: eksik dakikanın yarısı taşınır (premium); ücretsizde taşıma yok', () => {
    const items = [
      {
        kind: 'topic' as const,
        topicId: 'tck',
        targetMinutes: 60,
        targetQuestions: 60,
        doneMinutes: 20,
        doneQuestions: 10,
      },
      {
        kind: 'topic' as const,
        topicId: 'cmk',
        targetMinutes: 40,
        targetQuestions: 40,
        doneMinutes: 40,
        doneQuestions: 5,
      },
      {
        kind: 'review' as const,
        topicId: null,
        targetMinutes: 60,
        targetQuestions: 60,
        doneMinutes: 0,
        doneQuestions: 0,
      },
    ];
    expect([...haftaKapanisiTasimasi(items, true)]).toEqual([['tck', 20]]);
    expect(haftaKapanisiTasimasi(items, false).size).toBe(0);
  });
});

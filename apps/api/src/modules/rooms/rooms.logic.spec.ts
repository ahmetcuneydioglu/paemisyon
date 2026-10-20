import { band, dersKocCumlesi, enZayif, konuKocCumlesi, maddeAraligi } from './rooms.logic';

describe('rooms.logic (Doc 49/14)', () => {
  it('band: new/sparse/weak/normal/strong tek eşikten', () => {
    expect(band(0, null)).toBe('new');
    expect(band(4, 0.5)).toBe('sparse');
    expect(band(12, 0.4)).toBe('weak');
    expect(band(12, 0.65)).toBe('normal');
    expect(band(12, 0.8)).toBe('strong');
  });
  it('en zayıf: en az 10 çözülmüş konular içinde en düşük doğruluk', () => {
    const r = enZayif([
      { topicId: 'a', name: 'A', solved: 3, correct: 0, accuracy: 0 },
      { topicId: 'b', name: 'B', solved: 24, correct: 9, accuracy: 0.38 },
      { topicId: 'c', name: 'C', solved: 12, correct: 5, accuracy: 0.44 },
    ]);
    expect(r?.topicId).toBe('b');
    expect(enZayif([])).toBeNull();
  });
  it('ders koç cümlesi: zayıf konu + plan bağı; veri yoksa null', () => {
    const w = { topicId: 'y', name: 'Yürütme', solved: 12, correct: 4, accuracy: 4 / 12 };
    expect(dersKocCumlesi({ solved: 100, weakest: w, weakestInPlan: true })).toBe(
      "Koç önerisi: Yürütme — 12 sorunun 4'ü doğru, bu hafta planında.",
    );
    expect(
      dersKocCumlesi({
        solved: 100,
        weakest: { ...w, accuracy: 0.8, correct: 10 },
        weakestInPlan: false,
      }),
    ).toBeNull();
    expect(dersKocCumlesi({ solved: 0, weakest: null, weakestInPlan: false })).toMatch(/ilk turun/);
  });
  it('konu koç cümlesi: son 5 cevap önce', () => {
    expect(
      konuKocCumlesi({ solved: 12, accuracy: 0.44, son5Dogru: 2, son5Toplam: 5, inPlan: true }),
    ).toBe("Son 5 cevabın 2'si doğru; kısa bir turla toparla.");
    expect(
      konuKocCumlesi({ solved: 12, accuracy: 0.44, son5Dogru: null, son5Toplam: 0, inPlan: true }),
    ).toMatch(/planında/);
  });
  it('madde aralığı', () => {
    expect(maddeAraligi(['104', '118', '110'])).toBe('md. 104–118');
    expect(maddeAraligi(['19'])).toBe('md. 19');
    expect(maddeAraligi([])).toBeNull();
  });
});

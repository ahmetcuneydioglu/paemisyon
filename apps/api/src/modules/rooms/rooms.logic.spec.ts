import {
  band,
  dersKocCumlesi,
  dersKunyesi,
  enZayif,
  kaldiginYer,
  konuKocCumlesi,
  konuKunyesi,
  maddeAraligi,
  yayginAgirlik,
} from './rooms.logic';

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

  describe('Çalış v2 (Doc 49/17)', () => {
    it('yaygın ağırlık: en sık değer, eşitlikte büyük', () => {
      expect(yayginAgirlik([30, 10, 10, 10])).toBe(10);
      expect(yayginAgirlik([20, 10])).toBe(20);
      expect(yayginAgirlik([])).toBeNull();
    });
    it('ders künyesi: farklı ağırlık > başlanmadı > yanlış > yanlış yok', () => {
      const k = (w: number, solved: number, wrongCount: number) =>
        dersKunyesi({ weightPercent: w, yayginAgirlik: 10, solved, wrongCount });
      expect(k(30, 40, 5)).toBe('Sınavda %30');
      expect(k(10, 0, 0)).toBe('Henüz başlanmadı');
      expect(k(10, 40, 18)).toBe('18 yanlış');
      expect(k(10, 40, 0)).toBe('Yanlış yok');
    });
    it('konu künyesi: yalnız dolu parçalar', () => {
      expect(konuKunyesi({ solved: 24, unitCount: 4, wrongCount: 6 })).toBe(
        '24 soru · 4 ünite özeti · 6 yanlış',
      );
      expect(konuKunyesi({ solved: 0, unitCount: 0, wrongCount: 0 })).toBe('Henüz çözülmedi');
    });
    it('kaldığın yer: cevapsız ya da bayat tur yok, taze turda kalan sayı', () => {
      const now = new Date('2026-11-01T12:00:00Z');
      const tur = {
        sessionId: 's',
        scopeName: 'Temel Haklar',
        answered: 6,
        total: 10,
        lastActivityAt: new Date('2026-11-01T10:00:00Z'),
      };
      const gun = 86_400_000;
      expect(kaldiginYer(tur, now, gun)?.detail).toBe('6/10 · 4 soru kaldı');
      expect(kaldiginYer({ ...tur, answered: 0 }, now, gun)).toBeNull();
      expect(
        kaldiginYer({ ...tur, lastActivityAt: new Date('2026-10-30T10:00:00Z') }, now, gun),
      ).toBeNull();
      expect(kaldiginYer(null, now, gun)).toBeNull();
    });
  });
});

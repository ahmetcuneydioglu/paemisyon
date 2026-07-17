import { computeRank, rankScore, RANKS } from './rank.logic';

describe('rankScore', () => {
  it('çözülen + 15×aktif gün — süreklilik hacim kadar değerli', () => {
    expect(rankScore(100, 10)).toBe(250);
    expect(rankScore(0, 0)).toBe(0);
    expect(rankScore(-5, -1)).toBe(0); // savunmacı
  });
  it('her gün gelen, hafta sonu yığanı geçer', () => {
    const herGun = rankScore(140, 14); // günde 10 soru, 14 gün
    const yigan = rankScore(200, 2); // 2 günde 200 soru
    expect(herGun).toBeGreaterThan(yigan);
  });
});

describe('computeRank', () => {
  it('sıfır puan = Aday', () => {
    const r = computeRank(0);
    expect(r.name).toBe('Aday');
    expect(r.next?.name).toBe('Devriye');
  });
  it('eşik tam sınırda terfi eder', () => {
    expect(computeRank(149).name).toBe('Aday');
    expect(computeRank(150).name).toBe('Devriye');
  });
  it('orta rütbe: doğru seviye + sonraki hedef', () => {
    const r = computeRank(2000);
    expect(r.name).toBe('Grup Amiri');
    expect(r.minScore).toBe(1800);
    expect(r.next).toEqual({ level: 6, name: 'Vardiya Amiri', minScore: 3500 });
  });
  it('son rütbede next null — Komiserlik Kapısı', () => {
    const r = computeRank(99999);
    expect(r.name).toBe('Komiserlik Kapısı');
    expect(r.next).toBeNull();
  });
  it('katalog tutarlı: seviyeler ardışık, eşikler artan', () => {
    for (let i = 1; i < RANKS.length; i++) {
      expect(RANKS[i].level).toBe(RANKS[i - 1].level + 1);
      expect(RANKS[i].minScore).toBeGreaterThan(RANKS[i - 1].minScore);
    }
  });
});

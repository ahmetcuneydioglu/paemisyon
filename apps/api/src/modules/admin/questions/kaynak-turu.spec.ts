import { kaynakTuru, sentetikMi } from './kaynak-turu';

describe('kaynakTuru (Doc 49 A0 — kuyruk ayrıştırması)', () => {
  it('AI üretimi ön eki → ai (büyük/küçük harf ve boşluk duyarsız)', () => {
    expect(kaynakTuru('AI üretimi — Analitik Akıl Yürütme P10')).toBe('ai');
    expect(kaynakTuru('  ai Üretimi — güncel olaylar parti-2')).toBe('ai');
  });

  it('Mevzuat türetimi ön eki → turetim', () => {
    expect(kaynakTuru('Mevzuat türetimi — 2918 md 48')).toBe('turetim');
    expect(kaynakTuru('MEVZUAT TÜRETİMİ — 5271 md 91')).toBe('turetim');
  });

  it('başka her etiket → gercek', () => {
    expect(kaynakTuru('PAEM 9 — 2025 resmî sınav')).toBe('gercek');
    expect(kaynakTuru('Kaymakamlık 2022 — Soru 14')).toBe('gercek');
    // "AI" kelimesi ortada geçiyorsa sentetik sayılmaz: yalnız ÖN EK belirleyici.
    expect(kaynakTuru('Kitap — AI üretimi bölümü s.12')).toBe('gercek');
  });

  it('boş / null / yalnız boşluk → yok', () => {
    expect(kaynakTuru(null)).toBe('yok');
    expect(kaynakTuru(undefined)).toBe('yok');
    expect(kaynakTuru('   ')).toBe('yok');
  });

  it('sentetikMi yalnız ai ve turetim için doğru', () => {
    expect(sentetikMi('AI üretimi — x')).toBe(true);
    expect(sentetikMi('Mevzuat türetimi — 3201 md 4')).toBe(true);
    expect(sentetikMi('PAEM 8')).toBe(false);
    expect(sentetikMi(null)).toBe(false);
  });
});

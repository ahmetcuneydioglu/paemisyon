import { kaynakTuru, sentetikMi, topluOnayEngeli } from './kaynak-turu';

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

describe('topluOnayEngeli (kullanıcı kararı 11 Kas 2026)', () => {
  const tam = { sikSayisi: 5, dogruSayisi: 1, kunyeSayisi: 1 };

  it('AI üretimi her durumda atlanır (sentetik)', () => {
    const e = topluOnayEngeli({ ...tam, sourceLabel: 'AI üretimi — Analitik Akıl Yürütme P10' });
    expect(e).toEqual({ sentetik: true, neden: expect.stringContaining('AI üretimi') });
  });

  it('beş şıklı, tek doğrulu, künyeli mevzuat türetimi geçer', () => {
    expect(topluOnayEngeli({ ...tam, sourceLabel: 'Mevzuat türetimi — PVSK md 12' })).toBeNull();
  });

  it('künyesi olmayan türetim hattan geçmemiştir → atlanır', () => {
    const e = topluOnayEngeli({ ...tam, kunyeSayisi: 0, sourceLabel: 'Mevzuat türetimi — 6136 md 7' });
    expect(e?.sentetik).toBe(true);
    expect(e?.neden).toContain('künye');
  });

  it('dört şıklı türetim atlanır', () => {
    const e = topluOnayEngeli({ ...tam, sikSayisi: 4, sourceLabel: 'Mevzuat türetimi — 657 md 104' });
    expect(e?.neden).toContain('5 şık');
  });

  it('tek doğru şık kapısı her türde geçerli; gerçek soru künye istemez', () => {
    expect(topluOnayEngeli({ ...tam, dogruSayisi: 2, sourceLabel: 'Mevzuat türetimi — PVSK md 9' })?.sentetik).toBe(false);
    expect(topluOnayEngeli({ ...tam, dogruSayisi: 0, sourceLabel: 'PAEM 9 — 2025' })?.neden).toContain('doğru şık');
    expect(topluOnayEngeli({ sikSayisi: 4, dogruSayisi: 1, kunyeSayisi: 0, sourceLabel: 'PAEM 9 — 2025' })).toBeNull();
  });
});

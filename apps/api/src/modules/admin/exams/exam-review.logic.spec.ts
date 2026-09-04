import {
  bayraklariHesapla,
  stemAnahtari,
  tekrarEdenKokler,
  type ReviewCandidate,
} from './exam-review.logic';

const temiz: ReviewCandidate = {
  stem: '5237 sayılı Kanuna göre taksirle öldürme suçunun cezası nedir?',
  sourceLabel: '2023 PAEM 1. Aşama',
  explanation: 'TCK m.85 uyarınca…',
  articleNo: '85',
  courseName: 'Ceza Hukuku',
  optionCorrectCount: 1,
  usedBefore: false,
};

describe('bayraklariHesapla', () => {
  const bos = new Set<string>();

  it('kusursuz soruda bayrak yok', () => {
    expect(bayraklariHesapla(temiz, bos)).toEqual([]);
  });

  it('kaynak etiketi boşsa işaretler — ama bu ENGEL değildir', () => {
    expect(bayraklariHesapla({ ...temiz, sourceLabel: null }, bos)).toEqual(['kaynak-yok']);
    expect(bayraklariHesapla({ ...temiz, sourceLabel: '   ' }, bos)).toEqual(['kaynak-yok']);
  });

  it('açıklaması olmayan soruyu işaretler (sınav sonrası geri bildirim yok)', () => {
    expect(bayraklariHesapla({ ...temiz, explanation: '' }, bos)).toEqual(['aciklama-yok']);
  });

  it('mevzuat dersinde madde bağı yoksa işaretler', () => {
    for (const ders of ['Ceza Hukuku', 'Anayasa Hukuku', 'Polis Mevzuatı', 'İdare Hukuku']) {
      expect(
        bayraklariHesapla({ ...temiz, courseName: ders, articleNo: null }, bos),
      ).toContain('madde-yok');
    }
  });

  it('mevzuat DIŞI derste madde bağı beklemez', () => {
    for (const ders of ['Genel Kültür ve Analitik Düşünme', 'Silah Bilgisi', 'Protokol Bilgisi']) {
      expect(
        bayraklariHesapla({ ...temiz, courseName: ders, articleNo: null }, bos),
      ).not.toContain('madde-yok');
    }
  });

  it('tek doğru şıkkı olmayan soruyu işaretler', () => {
    expect(bayraklariHesapla({ ...temiz, optionCorrectCount: 0 }, bos)).toContain('sik-bozuk');
    expect(bayraklariHesapla({ ...temiz, optionCorrectCount: 2 }, bos)).toContain('sik-bozuk');
  });

  it('daha önce yayınlanmış denemede çıkan soruyu işaretler', () => {
    expect(bayraklariHesapla({ ...temiz, usedBefore: true }, bos)).toEqual([
      'daha-once-kullanildi',
    ]);
  });

  it('bayraklar birikir', () => {
    const f = bayraklariHesapla(
      { ...temiz, sourceLabel: null, explanation: null, articleNo: null, usedBefore: true },
      bos,
    );
    expect(f).toEqual(
      expect.arrayContaining(['kaynak-yok', 'aciklama-yok', 'daha-once-kullanildi', 'madde-yok']),
    );
  });
});

describe('tekrarEdenKokler', () => {
  it('aynı sette iki kez geçen kökü yakalar', () => {
    const kokler = tekrarEdenKokler([temiz.stem, 'Bambaşka bir soru.', temiz.stem]);
    expect(kokler.has(stemAnahtari(temiz.stem))).toBe(true);
    expect(bayraklariHesapla(temiz, kokler)).toEqual(['benzer-kok']);
  });

  it('yalnız boşluk/büyük harf farkı olan kökleri AYNI sayar', () => {
    const kokler = tekrarEdenKokler([
      'Aşağıdakilerden   hangisi   doğrudur?',
      'aşağıdakilerden hangisi doğrudur?',
    ]);
    expect(kokler.size).toBe(1);
  });

  it('tek geçen kökü işaretlemez', () => {
    expect(tekrarEdenKokler([temiz.stem, 'Başka soru']).size).toBe(0);
  });

  it('yalnız SONU ayrışan uzun kökleri de yakalar (aynı sorunun iki kaydı)', () => {
    const ortak =
      'Anayasaya göre temel hak ve hürriyetlerin sınırlanmasında ölçülülük ilkesi';
    const kokler = tekrarEdenKokler([
      `${ortak} bakımından aşağıdakilerden hangisi söylenebilir?`,
      `${ortak} açısından hangisi doğrudur?`,
    ]);
    expect(kokler.size).toBe(1);
  });
});

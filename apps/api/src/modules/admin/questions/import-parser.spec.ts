import * as iconv from 'iconv-lite';
import {
  decodeText,
  mapRows,
  normalizeHeader,
  parseCsv,
  detectArticleNo,
  parseImportFile,
  parseBookletOptionLine,
  detectBookletSections,
  detectBookletTitle,
  stripBookletTitle,
  parseBookletAnswerKeyLine,
  parseBookletQuestionCode,
  parseBookletQuestionNumberLine,
  detectMathQuestionRows,
} from './import-parser';

const HEADER = 'soru;A;B;C;D;E;dogru;aciklama;zorluk';

function csv(...lines: string[]): Buffer {
  return Buffer.from([HEADER, ...lines].join('\n'), 'utf8');
}

describe('normalizeHeader', () => {
  it('Türkçe karakter ve büyük/küçük harfi normalize eder', () => {
    expect(normalizeHeader(' DOĞRU ')).toBe('dogru');
    expect(normalizeHeader('Açıklama')).toBe('aciklama');
    expect(normalizeHeader('SORU')).toBe('soru');
  });
});

describe('decodeText', () => {
  it('UTF-8 BOM temizlenir', () => {
    const buf = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('soru', 'utf8')]);
    expect(decodeText(buf)).toBe('soru');
  });

  it('Windows-1254 (TR Excel) düşer ve Türkçe karakterler doğru çözülür', () => {
    const buf = iconv.encode('şığüöç DOĞRU', 'windows-1254');
    expect(decodeText(buf)).toBe('şığüöç DOĞRU');
  });
});

describe('parseCsv ayraç', () => {
  it('noktalı virgül (TR Excel) ve virgül ikisi de çalışır', () => {
    expect(parseCsv(Buffer.from('a;b;c'))[0]).toEqual(['a', 'b', 'c']);
    expect(parseCsv(Buffer.from('a,b,c'))[0]).toEqual(['a', 'b', 'c']);
  });
});

describe('mapRows doğrulama', () => {
  it('geçerli satırı ayrıştırır: doğru şık işaretli, zorluk eşlenmiş', () => {
    const r = mapRows(parseCsv(csv('TBMM üye tam sayısı kaçtır?;550;600;500;450;;B;2017 değişikliği;kolay')));
    expect(r.errors).toEqual([]);
    expect(r.valid).toHaveLength(1);
    const q = r.valid[0];
    expect(q.stem).toContain('TBMM');
    expect(q.options).toHaveLength(4);
    expect(q.options.find((o) => o.isCorrect)?.label).toBe('B');
    expect(q.difficulty).toBe('easy');
    expect(q.explanation).toBe('2017 değişikliği');
  });

  it('5 şık (E dolu) desteklenir', () => {
    const r = mapRows(parseCsv(csv('Soru metni burada?;1;2;3;4;5;E;;zor')));
    expect(r.valid[0].options).toHaveLength(5);
    expect(r.valid[0].options.find((o) => o.isCorrect)?.label).toBe('E');
    expect(r.valid[0].difficulty).toBe('hard');
  });

  it('zorluk boşsa orta varsayılır', () => {
    const r = mapRows(parseCsv(csv('Soru metni burada?;evet;hayır;;;;A;;')));
    expect(r.valid[0].difficulty).toBe('medium');
  });

  it("dogru harfi dolu şıklardan biri değilse hata", () => {
    const r = mapRows(parseCsv(csv('Soru metni burada?;evet;hayır;;;;C;;')));
    expect(r.valid).toHaveLength(0);
    expect(r.errors[0].message).toContain("dogru");
  });

  it('tek şık hata; boş satır sessizce atlanır', () => {
    const r = mapRows(parseCsv(csv('Soru metni burada?;tek;;;;;A;;', ';;;;;;;;')));
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0].message).toContain('En az 2');
  });

  it('atlamalı şık (A,B boş D dolu) hata', () => {
    const r = mapRows(parseCsv(csv('Soru metni burada?;;;dolu;dolu;;C;;')));
    expect(r.valid).toHaveLength(0);
    expect(r.errors[0].message).toContain('sıralı');
  });

  it('başlık yoksa net hata', () => {
    const r = mapRows(parseCsv(Buffer.from('bambaşka;bir;dosya\nx;y;z')));
    expect(r.valid).toHaveLength(0);
    expect(r.errors[0].message).toContain('Başlık satırı bulunamadı');
  });

  it('kısa soru kökü hata; satır numarası insan-dostu', () => {
    const r = mapRows(parseCsv(csv('ab;1;2;;;;A;;')));
    expect(r.errors[0]).toEqual({ rowNo: 2, message: expect.stringContaining('kısa') });
  });
});

describe('parseImportFile', () => {
  it('csv uzantısıyla uçtan uca çalışır', async () => {
    const r = await parseImportFile(csv('Geçerli bir soru mu?;evet;hayır;;;;A;;orta'), 'sorular.csv');
    expect(r.valid).toHaveLength(1);
    expect(r.totalRows).toBe(1);
  });
});

describe('parseBookletOptionLine', () => {
  it('tab ile aynı satıra basılan iki şıkkı ayrı çıkarır', () => {
    expect(parseBookletOptionLine('A) Ocak\tB) Mart')).toEqual([
      { label: 'A', text: 'Ocak' },
      { label: 'B', text: 'Mart' },
    ]);
  });

  it('birden fazla boşlukla yan yana basılan şıkları ayrı çıkarır', () => {
    expect(parseBookletOptionLine('C) Mayıs   D) Eylül')).toEqual([
      { label: 'C', text: 'Mayıs' },
      { label: 'D', text: 'Eylül' },
    ]);
  });

  it('tek şıklı normal satırı değiştirmeden çıkarır', () => {
    expect(parseBookletOptionLine('E) Kasım')).toEqual([{ label: 'E', text: 'Kasım' }]);
  });

  it('şıkla başlayan satırda tek boşluğa inmiş devam şıklarını ayırır', () => {
    expect(parseBookletOptionLine('A) On\tB) On beş\tC) Kırk beş D) Altmış')).toEqual([
      { label: 'A', text: 'On' },
      { label: 'B', text: 'On beş' },
      { label: 'C', text: 'Kırk beş' },
      { label: 'D', text: 'Altmış' },
    ]);
  });

  it('şıksız devam satırını seçenek sanmaz', () => {
    expect(parseBookletOptionLine('seçenek metninin devamı')).toEqual([]);
  });
});

describe('kitapçık üstbilgisi temizleme', () => {
  const ods = 'ÖLÇME, DEĞERLENDİRME VE SINAV HİZMETLERİ GENEL MÜDÜRLÜĞÜ';

  it('sıra sayısıyla başlayan resmî kitapçık başlığını saptar', () => {
    const page = `2\n8. DÖNEM İLK DERECE AMİRLİK EĞİTİMİ \tA\n${ods}\n1. Soru`;
    expect(detectBookletTitle([page])).toBe('8. DÖNEM İLK DERECE AMİRLİK EĞİTİMİ \tA');
  });

  it('başlığı şık sonundan tab/boşluk farkına rağmen söker', () => {
    const title = '8. DÖNEM İLK DERECE AMİRLİK EĞİTİMİ \tA';
    expect(stripBookletTitle(
      'Belediye Başkanı 8. DÖNEM İLK DERECE AMİRLİK EĞİTİMİ A',
      title,
    )).toBe('Belediye Başkanı');
  });

  it('başlık yoksa yan yana şıkları ayıran boşlukları korur', () => {
    const line = 'A) Ocak   B) Mart';
    expect(stripBookletTitle(line, '8. DÖNEM EĞİTİMİ A')).toBe(line);
  });

  it('ilk satırlardaki olağan soru metnini kitapçık başlığı sanmaz', () => {
    expect(detectBookletTitle([`1\n${ods}\n1. Aşağıdakilerden hangisi A`])).toBeNull();
  });

  it('kitapçık türü harfi olmayan tekrarlı e-sınav üstbilgisini saptar', () => {
    const header = 'Emlak/Millî Emlak Müdür ve Müdür Yardımcılığı';
    expect(detectBookletTitle([
      `${header}\n2\n${ods}\n(130383)`,
      `${header}\n3\n${ods}\n(130387)`,
    ])).toBe(header);
  });
});

describe('kurum soru kodlu e-sınav işaretleri', () => {
  it('parantezli soru kodunu ayrıştırır', () => {
    expect(parseBookletQuestionCode('(130383)')).toBe('130383');
    expect(parseBookletQuestionCode('130383')).toBeNull();
  });

  it('klasik ve kurum kodlu cevap anahtarı satırlarını birlikte destekler', () => {
    expect(parseBookletAnswerKeyLine('1. C')).toEqual({ id: '1', answer: 'C', cancelled: false });
    expect(parseBookletAnswerKeyLine('(130383) A')).toEqual({
      id: '130383',
      answer: 'A',
      cancelled: false,
    });
  });

  it('iptal edilmiş soru anahtarını (İPTAL) tanır — soru düşmesin', () => {
    expect(parseBookletAnswerKeyLine('71. B - İPTAL')).toEqual({
      id: '71',
      answer: null,
      cancelled: true,
    });
    expect(parseBookletAnswerKeyLine('75. A - İPTAL')).toEqual({
      id: '75',
      answer: null,
      cancelled: true,
    });
    expect(parseBookletAnswerKeyLine('12. İPTAL')).toEqual({
      id: '12',
      answer: null,
      cancelled: true,
    });
  });
});

describe('klasik soru numarası ve matematik kapsam filtresi', () => {
  it('metni aynı satırda olmayan soru numarasını kabul eder', () => {
    expect(parseBookletQuestionNumberLine('26.')).toEqual({ id: '26', stem: '' });
    expect(parseBookletQuestionNumberLine('27. İşlemin sonucu kaçtır?')).toEqual({
      id: '27', stem: 'İşlemin sonucu kaçtır?',
    });
  });

  it('yoğun matematik bloğunu eler, tekil demografi oranını korur', () => {
    const rows = [
      { rowNo: 1, text: 'Aşağıdaki cümlelerin hangisinde yazım yanlışı vardır?' },
      { rowNo: 2, text: 'Bir paragrafın giriş cümlesi hangisidir?' },
      { rowNo: 3, text: '9 / (1 + 1/2) işleminin sonucu kaçtır? A) 1 B) 2' },
      { rowNo: 4, text: 'K, L ve M birer rakam olmak üzere işlemin sonucu kaçtır?' },
      { rowNo: 5, text: 'x + 4 = 12 denklemini sağlayan x kaçtır?' },
      { rowNo: 6, text: 'A ve B kümelerinin Venn şeması verilmiştir.' },
      { rowNo: 7, text: 'Satış fiyatına %20 zam yapılan ürün kaç liradır?' },
      { rowNo: 8, text: 'Üçgenin bir açısı 40 derece ise diğer açı kaçtır?' },
      { rowNo: 9, text: 'Orta Asya\'da kurulan ilk Türk devleti hangisidir?' },
      { rowNo: 10, text: 'Tabloda 0-14 yaş grubunun genel nüfusa oranı verilmiştir.' },
    ];
    expect(detectMathQuestionRows(rows)).toEqual([3, 4, 5, 6, 7, 8]);
  });
});

describe('detectBookletSections', () => {
  const cover = `
KONULAR \tSORU SAYISI \tTOPLAM SORU SAYISI
Polis Meslek Mevzuatı \t30
100 \t120
Ceza Muhakemesi Hukuku \t10
Ceza Hukuku \t10
Anayasa Hukuku \t10
İdare Hukuku \t10
Atatürk İlkeleri ve İnkılap Tarihi \t10
İnsan Hakları \t10
Genel Kültür \t10`;

  it('kapak konu tablosunu ardışık soru aralıklarına çevirir', () => {
    const sections = detectBookletSections([cover], 100);
    expect(sections).toHaveLength(8);
    expect(sections[0]).toEqual({
      name: 'Polis Meslek Mevzuatı', questionCount: 30, startRow: 1, endRow: 30,
    });
    expect(sections[4]).toEqual({
      name: 'İdare Hukuku', questionCount: 10, startRow: 61, endRow: 70,
    });
    expect(sections[7]).toEqual({
      name: 'Genel Kültür', questionCount: 10, startRow: 91, endRow: 100,
    });
  });

  it('bölüm toplamı soru sayısıyla uyuşmazsa planı reddeder', () => {
    expect(detectBookletSections([cover], 99)).toEqual([]);
  });
});

// ── Madde Atlası: madde tespiti (Doc 25 §4) ──

describe('detectArticleNo', () => {
  const cases: [string, string | null][] = [
    // Gerçek kök kalıpları
    ["2559 sayılı PVSK'nın 16'ncı maddesine göre zor kullanma...", '16'],
    ['Polis Vazife ve Salâhiyet Kanunu madde 16 uyarınca...', '16'],
    ["Anayasa'nın 19. maddesi kişi hürriyetini düzenler.", '19'],
    ['657 sayılı Kanunun 125 inci maddesinde sayılan cezalar...', '125'],
    ['PVSK m.16 kapsamında aşağıdakilerden hangisi...', '16'],
    ['İlgili düzenleme md. 48 hükmündedir.', '48'],
    // Harf ekli madde ↔ fıkra ayrımı
    ["PVSK'nın 4/A maddesi durdurma yetkisini düzenler.", '4/A'],
    ['Kanunun 16/2 maddesine göre...', '16'], // bölü-rakam = fıkra, atılır
    ['madde 4/a uyarınca...', '4/A'], // harf büyütülür
    // Ek / geçici maddeler
    ['5442 sayılı Kanunun ek madde 6 hükmü...', 'Ek 6'],
    ['Ek 1 inci madde kapsamında...', 'Ek 1'],
    ['Anılan kanunun geçici madde 2 düzenlemesi...', 'Geçici 2'],
    // Birden çok madde: İLK geçen kazanır
    ['Kanunun 5. maddesi ile 13. maddesi birlikte...', '5'],
    // Madde yok
    ['Aşağıdaki dağlardan hangisi Kuzey Anadolu Dağları içinde yer almaz?', null],
    ['1982 Anayasası hangi yılda kabul edilmiştir?', null],
  ];
  it.each(cases)('%s → %s', (stem, expected) => {
    expect(detectArticleNo(stem)).toBe(expected);
  });
});

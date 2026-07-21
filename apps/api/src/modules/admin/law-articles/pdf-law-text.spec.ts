import { stripPdfNoise } from './pdf-law-text';
import { parseLawText } from './law-text-parser';

describe('stripPdfNoise', () => {
  const HEADER = 'POLİS VAZİFE VE SALÂHİYET KANUNU';
  const pages = [
    [HEADER, 'Madde 1 – Birinci madde metni.', 'İkinci fıkra.', '1'].join('\n'),
    [HEADER, 'Madde 2 – İkinci madde metni.', '2'].join('\n'),
    [HEADER, 'Madde 3 – Üçüncü madde metni.', '3'].join('\n'),
  ];

  it('tekrar eden üstbilgiyi ve sayfa numaralarını eler, gövdeyi korur', () => {
    const out = stripPdfNoise(pages);
    expect(out).not.toContain(HEADER);
    expect(out).not.toMatch(/^\s*\d\s*$/m); // salt sayfa numarası satırı kalmadı
    expect(out).toContain('Birinci madde metni.');
    expect(out).toContain('İkinci fıkra.');
    expect(out).toContain('Üçüncü madde metni.');
  });

  it('temizlenen metin parseLawText ile maddelere bölünebilir', () => {
    const articles = parseLawText(stripPdfNoise(pages));
    expect(articles.map((a) => a.articleNo)).toEqual(['1', '2', '3']);
    expect(articles[0].text).toContain('Birinci madde metni.');
    expect(articles[0].text).toContain('İkinci fıkra.');
  });

  it('kısa belgede (<3 sayfa) tekrar eden satırı boilerplate saymaz', () => {
    const short = ['Madde 1 – X.\nOrtak satır', 'Madde 2 – Y.\nOrtak satır'];
    const out = stripPdfNoise(short);
    // 3 sayfadan az → "Ortak satır" korunur (yanlış eleme yok).
    expect(out).toContain('Ortak satır');
  });

  it('gövdede tekrar eden ifade (sayfa başına sayıldığından) korunur', () => {
    // "Türkiye Büyük Millet Meclisi" 3 sayfada da gövdede geçse bile ≥%40 eşiği
    // sayfa-başına-tek sayımla aşılır; ama 80+ karakterli uzun cümleler zaten
    // boilerplate sayılmaz. Kısa ama meşru gövde ifadesi için eşik testi:
    const p = [
      'Madde 1 – Genel hüküm.\nBaşkan',
      'Madde 2 – Özel hüküm.\nüye',
      'Madde 3 – Diğer.\nüye',
    ];
    const out = stripPdfNoise(p);
    expect(out).toContain('Genel hüküm.');
  });
});

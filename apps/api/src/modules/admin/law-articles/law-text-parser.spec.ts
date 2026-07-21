import { parseLawText } from './law-text-parser';

describe('parseLawText', () => {
  it('temel: maddeleri böler, başlık etiketini gövdeden düşer', () => {
    const raw = [
      'Madde 1 – Bu Kanunun amacı memurların hizmet şartlarını düzenlemektir.',
      'Madde 2 – Kapsam bu maddede belirtilmiştir.',
    ].join('\n');
    const out = parseLawText(raw);
    expect(out).toEqual([
      { articleNo: '1', text: 'Bu Kanunun amacı memurların hizmet şartlarını düzenlemektir.' },
      { articleNo: '2', text: 'Kapsam bu maddede belirtilmiştir.' },
    ]);
  });

  it('Ek/Geçici madde kanonik biçime çevrilir', () => {
    const raw = [
      'Madde 16 – Asıl madde metni.',
      'Ek Madde 6 – Ek madde metni.',
      'Geçici Madde 2 – Geçici hüküm metni.',
    ].join('\n');
    const out = parseLawText(raw);
    expect(out.map((a) => a.articleNo)).toEqual(['16', 'Ek 6', 'Geçici 2']);
  });

  it('farklı ayraçlar ve BÜYÜK harf başlıklar (Türkçe İ dahil) tanınır', () => {
    const raw = [
      'MADDE 1- Düz tire ile.',
      'MADDE 2. Nokta ile.',
      'GEÇİCİ MADDE 1 – Büyük harf geçici.',
    ].join('\n');
    const out = parseLawText(raw);
    expect(out.map((a) => a.articleNo)).toEqual(['1', '2', 'Geçici 1']);
    expect(out[0].text).toBe('Düz tire ile.');
    expect(out[2].text).toBe('Büyük harf geçici.');
  });

  it('çok satırlı gövde ve "(Değişik: …)" şerhi orijinal casing ile korunur', () => {
    const raw = [
      'Madde 4/A – (Değişik: 5/7/2022-1234/1 md.) Sözleşmeli personel.',
      'İkinci fıkra devam ediyor.',
      '',
      'Üçüncü paragraf.',
      'Madde 5 – Sonraki madde.',
    ].join('\n');
    const out = parseLawText(raw);
    expect(out[0].articleNo).toBe('4/A');
    expect(out[0].text).toBe(
      '(Değişik: 5/7/2022-1234/1 md.) Sözleşmeli personel.\nİkinci fıkra devam ediyor.\n\nÜçüncü paragraf.',
    );
    expect(out[1].articleNo).toBe('5');
  });

  it('madde numarasındaki fıkra ("/2") düşer, harf eki ("/a") büyür', () => {
    const raw = ['Madde 16/2 – Fıkra numarası.', 'Madde 20/b – Harf eki.'].join('\n');
    const out = parseLawText(raw);
    expect(out.map((a) => a.articleNo)).toEqual(['16', '20/B']);
  });

  it('ilk maddeden önceki fihrist/başlık metni yok sayılır', () => {
    const raw = [
      '657 SAYILI DEVLET MEMURLARI KANUNU',
      'BİRİNCİ KISIM',
      'Genel Hükümler',
      'Madde 1 – İlk madde.',
    ].join('\n');
    const out = parseLawText(raw);
    expect(out).toEqual([{ articleNo: '1', text: 'İlk madde.' }]);
  });

  it('yalnız başlıktan ibaret (boş gövdeli) madde düşürülür', () => {
    const raw = ['Madde 7 –', 'Madde 8 – Dolu madde.'].join('\n');
    const out = parseLawText(raw);
    expect(out).toEqual([{ articleNo: '8', text: 'Dolu madde.' }]);
  });

  it('metin içindeki "5 inci maddesi" gibi atıflar başlık sanılmaz', () => {
    const raw = [
      'Madde 3 – Bu hususta 5 inci maddesi hükümleri uygulanır ve madde devam eder.',
      'Madde 4 – Sonraki.',
    ].join('\n');
    const out = parseLawText(raw);
    expect(out.map((a) => a.articleNo)).toEqual(['3', '4']);
    expect(out[0].text).toContain('5 inci maddesi');
  });

  it('boş girdi boş dizi döndürür', () => {
    expect(parseLawText('')).toEqual([]);
    expect(parseLawText('   \n\n  ')).toEqual([]);
  });
});

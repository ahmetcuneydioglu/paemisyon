import { parseDocument } from './law-document-parser';

describe('parseDocument (Doc 29 — bölüm + kenar başlığı yakalama)', () => {
  const SAMPLE = [
    'BİRİNCİ KISIM',
    'Genel Hükümler',
    'BİRİNCİ BÖLÜM',
    'Amaç ve Tanımlar',
    'Amaç',
    'Madde 1 – (1) Bu Kanunun amacı budur.',
    'Tanımlar',
    'Madde 2 – (1) Bu Kanunda geçen;',
    'a) Terim: açıklama.',
    'İKİNCİ BÖLÜM',
    'Yetki',
    'Yakalama ve yakalanan kişi hakkında yapılacak işlemler12',
    'Madde 3 – (1) Yetki maddesidir.',
  ].join('\n');

  it('kısım/bölüm hiyerarşisini kurar', () => {
    const doc = parseDocument(SAMPLE);
    expect(doc.sections.map((s) => s.heading)).toEqual([
      'BİRİNCİ KISIM — Genel Hükümler',
      'BİRİNCİ BÖLÜM — Amaç ve Tanımlar',
      'İKİNCİ BÖLÜM — Yetki',
    ]);
    // BÖLÜM'ler KISIM'a bağlanır.
    expect(doc.sections[1].parentOrder).toBe(0);
    expect(doc.sections[2].parentOrder).toBe(0);
  });

  it('kenar başlıklarını yakalar ve gövdeden düşer', () => {
    const doc = parseDocument(SAMPLE);
    const m2 = doc.articles.find((a) => a.articleNo === '2')!;
    expect(m2.title).toBe('Tanımlar');
    // Başlık, önceki maddenin (m.1) gövdesine sızmamalı.
    const m1 = doc.articles.find((a) => a.articleNo === '1')!;
    expect(m1.text).not.toContain('Tanımlar');
  });

  it('dipnot rakamlı başlığı temizler', () => {
    const doc = parseDocument(SAMPLE);
    const m3 = doc.articles.find((a) => a.articleNo === '3')!;
    expect(m3.title).toBe('Yakalama ve yakalanan kişi hakkında yapılacak işlemler');
    expect(m3.sectionOrder).toBe(2); // İKİNCİ BÖLÜM
  });

  it('cümle biten satırı başlık sanmaz', () => {
    const doc = parseDocument(
      'Madde 1 – Gövde satırı.\nBu bir devam cümlesidir.\nMadde 2 – İkinci madde.',
    );
    const m2 = doc.articles.find((a) => a.articleNo === '2')!;
    expect(m2.title).toBeNull();
    // Devam cümlesi m.1 gövdesinde kalır.
    expect(doc.articles[0].text).toContain('devam cümlesidir');
  });
});

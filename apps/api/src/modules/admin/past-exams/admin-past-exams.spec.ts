import { cozulebilirlikHesapla } from './admin-past-exams.service';

/**
 * Çözülebilirlik tanısı (Doc 36 §7.2) — panelde "yayına aldım ama uygulamada
 * çözülemiyor" sorusunun cevabını veren mantık.
 */

const soru = (status: string | null, cancelled = false) => ({
  cancelled,
  question: { currentVersion: status ? { status } : null },
});

const donem = (over: Partial<Parameters<typeof cozulebilirlikHesapla>[0]> = {}) => ({
  kind: 'resmi',
  status: 'published',
  examId: 'e1',
  questions: [soru('published'), soru('published')],
  ...over,
});

describe('cozulebilirlikHesapla', () => {
  it('her şey yerindeyse çözülebilir', () => {
    const c = cozulebilirlikHesapla(donem());
    expect(c.cozulebilir).toBe(true);
    expect(c.engeller).toEqual([]);
    expect(c.yayindaSoru).toBe(2);
  });

  it('taslak dönem çözülemez', () => {
    const c = cozulebilirlikHesapla(donem({ status: 'draft' }));
    expect(c.cozulebilir).toBe(false);
    expect(c.engeller.join(' ')).toContain('yayına alınmamış');
  });

  it('motora bağlı değilse çözülemez ama BAĞLANABİLİR', () => {
    const c = cozulebilirlikHesapla(donem({ examId: null }));
    expect(c.cozulebilir).toBe(false);
    expect(c.motoraBaglanabilir).toBe(true);
    expect(c.engeller.join(' ')).toContain('motoruna bağlı değil');
  });

  it('konu analizi dönemi ne çözülebilir ne bağlanabilir', () => {
    // Aday hatırlatmasından türetilen dağılıma "çıkmış sınav" demek bankanın
    // varlık nedenini harcar (Doc 36 §1) — düğme hiç etkinleşmemeli.
    const c = cozulebilirlikHesapla(
      donem({ kind: 'analiz', examId: null, questions: [] }),
    );
    expect(c.cozulebilir).toBe(false);
    expect(c.motoraBaglanabilir).toBe(false);
    expect(c.engeller.join(' ')).toContain('konu analizi');
  });

  it('onaylanmamış sorular sayılmaz — bağlama düğmesi kapalı kalır', () => {
    const c = cozulebilirlikHesapla(
      donem({ examId: null, questions: [soru('in_review'), soru('draft')] }),
    );
    expect(c.yayindaSoru).toBe(0);
    expect(c.motoraBaglanabilir).toBe(false);
    expect(c.engeller.join(' ')).toContain('onaylanmış');
  });

  it('iptal edilen soru sete girmez ama ayrıca sayılır', () => {
    // Puanlanmayan soruyu puanlamak adayın netini yanlış hesaplamak olur.
    const c = cozulebilirlikHesapla(
      donem({ questions: [soru('published'), soru('published', true)] }),
    );
    expect(c.yayindaSoru).toBe(1);
    expect(c.iptalSoru).toBe(1);
    expect(c.cozulebilir).toBe(true);
  });

  it('sürümü olmayan soru çökertmez', () => {
    const c = cozulebilirlikHesapla(donem({ questions: [soru(null)] }));
    expect(c.yayindaSoru).toBe(0);
  });

  it('birden çok engel birlikte listelenir', () => {
    const c = cozulebilirlikHesapla(
      donem({ status: 'draft', examId: null, questions: [soru('in_review')] }),
    );
    expect(c.engeller).toHaveLength(3);
  });
});

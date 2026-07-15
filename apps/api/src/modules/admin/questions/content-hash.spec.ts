import { questionFingerprint } from './import-parser';

describe('questionFingerprint (Doc 20 EK 2 — tekrar tespiti)', () => {
  const stem = 'T.C. Anayasası’na göre aşağıdakilerden hangisi doğrudur?';
  const opts = ['Devletin şekli', 'Cumhuriyetin nitelikleri', 'Devletin başkenti', 'Yaşama hakkı'];

  it('MEB A/B: aynı soru, şıklar KARIŞIK + doğru cevap farklı → AYNI parmak izi', () => {
    const a = questionFingerprint(stem, ['A) yanlış', 'B) doğru', 'C) x', 'D) y']);
    const b = questionFingerprint(stem, ['D) y', 'A) yanlış', 'C) x', 'B) doğru']); // sıra değişik
    expect(a).toBe(b);
  });

  it('tırnak/dash/whitespace gürültüsü → AYNI parmak izi', () => {
    const a = questionFingerprint("T.C. Anayasası'na göre  hangisi—doğrudur?", opts);
    const b = questionFingerprint('T.C. Anayasası’na göre hangisi–doğrudur?', opts);
    expect(a).toBe(b);
  });

  it('büyük/küçük harf farkı → AYNI parmak izi', () => {
    expect(questionFingerprint(stem, opts)).toBe(
      questionFingerprint(stem.toLocaleUpperCase('tr-TR'), opts.map((o) => o.toLocaleUpperCase('tr-TR'))),
    );
  });

  it('farklı kök → FARKLI parmak izi', () => {
    expect(questionFingerprint(stem, opts)).not.toBe(questionFingerprint(stem + ' değişti', opts));
  });

  it('bir şık farklıysa → FARKLI parmak izi', () => {
    const other = [...opts];
    other[3] = 'Tamamen başka bir şık';
    expect(questionFingerprint(stem, opts)).not.toBe(questionFingerprint(stem, other));
  });

  it('64 karakter hex döndürür', () => {
    expect(questionFingerprint(stem, opts)).toMatch(/^[0-9a-f]{64}$/);
  });
});

import { SRS_BASLANGIC, hizliMi, srsGuncelle } from './srs';

const G = 86_400_000;
const now = new Date('2026-10-16T10:00:00Z');
const gun = (d: Date) => Math.round((d.getTime() - now.getTime()) / G);

describe('srsGuncelle (Doc 49 S1-A)', () => {
  it('ilk doğru: 1 gün, ease +0.10', () => {
    const r = srsGuncelle(null, true, { now });
    expect(r).toMatchObject({ reps: 1, intervalDays: 1, lapses: 0, ease: 2.6 });
    expect(gun(r.dueAt)).toBe(1);
  });
  it('ikinci doğru 3 gün, üçüncü doğru önceki×ease', () => {
    const a = srsGuncelle(null, true, { now });
    const b = srsGuncelle(a, true, { now });
    expect(b.intervalDays).toBe(3);
    const c = srsGuncelle(b, true, { now });
    expect(c.intervalDays).toBe(Math.round(3 * b.ease));
    expect(c.reps).toBe(3);
  });
  it('hızlı cevap ease +0.15, tavan 3.00', () => {
    let s = srsGuncelle(null, true, { now, fast: true });
    expect(s.ease).toBe(2.65);
    for (let i = 0; i < 10; i++) s = srsGuncelle(s, true, { now, fast: true });
    expect(s.ease).toBe(3);
  });
  it('yanlış: reps sıfırlanır, lapse artar, 1 gün; ikinci lapse aynı gün; ease taban 1.30', () => {
    const a = srsGuncelle({ ease: 2.5, intervalDays: 14, reps: 3, lapses: 0 }, false, { now });
    expect(a).toMatchObject({ reps: 0, lapses: 1, intervalDays: 1, ease: 2.3 });
    const b = srsGuncelle(a, false, { now });
    expect(b.intervalDays).toBe(0);
    expect(gun(b.dueAt)).toBe(0);
    let s = b;
    for (let i = 0; i < 10; i++) s = srsGuncelle(s, false, { now });
    expect(s.ease).toBe(1.3);
  });
  it('aralık tavanı 60 gün', () => {
    const r = srsGuncelle({ ease: 3, intervalDays: 50, reps: 6, lapses: 0 }, true, { now });
    expect(r.intervalDays).toBe(60);
  });
  it('sınava 10 gün kala aralık sınav gününü aşmaz; 31 gün kala etkilemez', () => {
    const s = { ease: 2.5, intervalDays: 14, reps: 4, lapses: 0 };
    const yakin = srsGuncelle(s, true, { now, examDate: new Date(now.getTime() + 10 * G) });
    expect(yakin.intervalDays).toBe(10);
    const uzak = srsGuncelle(s, true, { now, examDate: new Date(now.getTime() + 31 * G) });
    expect(uzak.intervalDays).toBe(35);
    const gecmis = srsGuncelle(s, true, { now, examDate: new Date(now.getTime() - 5 * G) });
    expect(gecmis.intervalDays).toBe(1);
  });
  it('başlangıç durumu değişmez (saf)', () => {
    srsGuncelle(SRS_BASLANGIC, false, { now });
    expect(SRS_BASLANGIC).toEqual({ ease: 2.5, intervalDays: 0, reps: 0, lapses: 0 });
  });
  it('hizliMi: 20 sn altı', () => {
    expect(hizliMi(12_000)).toBe(true);
    expect(hizliMi(25_000)).toBe(false);
    expect(hizliMi(null)).toBe(false);
  });
});

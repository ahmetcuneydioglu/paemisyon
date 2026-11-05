import { kartSrsGuncelle } from './kart-srs';

const G = 86_400_000;
const now = new Date('2026-11-05T10:00:00Z');
const gun = (d: Date) => Math.round((d.getTime() - now.getTime()) / G);

describe('kartSrsGuncelle (Doc 56 §6) — soru SRS motoruyla aynı dil', () => {
  it('ilk "Biliyorum": 1 gün, ease +0.10', () => {
    const r = kartSrsGuncelle(null, 'known', { now });
    expect(r).toMatchObject({ reps: 1, intervalDays: 1, lapses: 0, ease: 2.6 });
    expect(gun(r.dueAt)).toBe(1);
  });

  it('tek doğru yetmez: 1 → 3 → ×ease; üçüncüde reps 3', () => {
    const a = kartSrsGuncelle(null, 'known', { now });
    const b = kartSrsGuncelle(a, 'known', { now });
    const c = kartSrsGuncelle(b, 'known', { now });
    expect(b.intervalDays).toBe(3);
    expect(c.intervalDays).toBe(Math.round(3 * b.ease));
    expect(c.reps).toBe(3);
  });

  it('"Tekrar": reps sıfırlanır, lapse artar, 1 gün; ikinci lapse aynı gün', () => {
    const a = kartSrsGuncelle({ ease: 2.5, intervalDays: 14, reps: 3, lapses: 0 }, 'again', {
      now,
    });
    expect(a).toMatchObject({ reps: 0, lapses: 1, intervalDays: 1, ease: 2.3 });
    const b = kartSrsGuncelle(a, 'again', { now });
    expect(gun(b.dueAt)).toBe(0);
  });

  it('"Kolay": hızlı ödülü ease +0.15', () => {
    expect(kartSrsGuncelle(null, 'easy', { now }).ease).toBe(2.65);
  });

  it('sınava 10 gün kala aralık sınav gününü aşmaz', () => {
    const r = kartSrsGuncelle({ ease: 2.5, intervalDays: 14, reps: 4, lapses: 0 }, 'known', {
      now,
      examDate: new Date(now.getTime() + 10 * G),
    });
    expect(r.intervalDays).toBe(10);
  });
});

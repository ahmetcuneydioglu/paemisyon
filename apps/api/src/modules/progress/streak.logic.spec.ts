import { computeStreakUpdate, freezesLeft } from './streak.logic';

const D = (s: string) => new Date(`${s}T00:00:00.000Z`);

// 2026-07-13 Pazartesi, 2026-07-15 Çarşamba.
const state = (over: Partial<Parameters<typeof computeStreakUpdate>[0] & object> = {}) => ({
  currentStreak: 5,
  longestStreak: 10,
  lastActiveDate: D('2026-07-13'),
  freezeWeekStart: null,
  freezesUsed: 0,
  ...over,
});

describe('computeStreakUpdate — seri sigortası (Doc 24 §7.2)', () => {
  it('ardışık gün: seri artar, sigorta harcanmaz', () => {
    const u = computeStreakUpdate(state(), D('2026-07-14'), 1);
    expect(u.currentStreak).toBe(6);
    expect(u.freezeSpent).toBe(false);
  });

  it('aynı gün: değişmez', () => {
    expect(computeStreakUpdate(state(), D('2026-07-13'), 1).currentStreak).toBe(5);
  });

  it('TAM 1 gün kaçtı + hak var: sigorta devrede, seri yaşar', () => {
    const u = computeStreakUpdate(state(), D('2026-07-15'), 1);
    expect(u.currentStreak).toBe(6); // kaçan gün affedildi + bugün
    expect(u.freezeSpent).toBe(true);
    expect(u.freezesUsed).toBe(1);
  });

  it('1 gün kaçtı ama haftalık hak bitmiş: sıfırlanır', () => {
    const u = computeStreakUpdate(
      state({ freezeWeekStart: D('2026-07-13'), freezesUsed: 1 }),
      D('2026-07-15'),
      1,
    );
    expect(u.currentStreak).toBe(1);
    expect(u.freezeSpent).toBe(false);
  });

  it('premium hakkı (3): ikinci sigorta da çalışır', () => {
    const u = computeStreakUpdate(
      state({ freezeWeekStart: D('2026-07-13'), freezesUsed: 1 }),
      D('2026-07-15'),
      3,
    );
    expect(u.freezeSpent).toBe(true);
    expect(u.freezesUsed).toBe(2);
  });

  it('2+ gün boşluk: sigorta kapsamı dışı, sıfırlanır', () => {
    const u = computeStreakUpdate(state(), D('2026-07-16'), 3);
    expect(u.currentStreak).toBe(1);
    expect(u.freezeSpent).toBe(false);
  });

  it('yeni haftada haklar tazelenir', () => {
    // Geçen hafta (6 Tem Pzt) 1 hak kullanılmış; bu hafta yeni sayaç.
    const u = computeStreakUpdate(
      state({ freezeWeekStart: D('2026-07-06'), freezesUsed: 1 }),
      D('2026-07-15'),
      1,
    );
    expect(u.freezeSpent).toBe(true); // taze hakla affedildi
    expect(u.freezeWeekStart).toEqual(D('2026-07-13'));
    expect(u.freezesUsed).toBe(1);
  });

  it('seri 0 iken sigorta devreye girmez (koruyacak seri yok)', () => {
    const u = computeStreakUpdate(state({ currentStreak: 0 }), D('2026-07-15'), 1);
    expect(u.currentStreak).toBe(1);
    expect(u.freezeSpent).toBe(false);
  });

  it('ilk aktivite: seri 1 başlar', () => {
    const u = computeStreakUpdate(null, D('2026-07-15'), 1);
    expect(u.currentStreak).toBe(1);
    expect(u.longestStreak).toBe(1);
  });
});

describe('freezesLeft', () => {
  it('bu hafta kullanılmadıysa tam hak', () => {
    expect(freezesLeft(null, D('2026-07-15'), 1)).toBe(1);
  });
  it('bu hafta kullanıldıysa düşer; geçen haftanınki sayılmaz', () => {
    expect(
      freezesLeft({ freezeWeekStart: D('2026-07-13'), freezesUsed: 1 }, D('2026-07-15'), 3),
    ).toBe(2);
    expect(
      freezesLeft({ freezeWeekStart: D('2026-07-06'), freezesUsed: 3 }, D('2026-07-15'), 3),
    ).toBe(3);
  });
});

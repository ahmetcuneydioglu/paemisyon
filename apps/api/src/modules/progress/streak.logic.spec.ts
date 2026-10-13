import {
  computeStreakUpdate,
  freezesLeft,
  liveStreak,
  weeklyFreezeAllowance,
} from './streak.logic';

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

// Gösterilen seri (14 Eki 2026): kayıtlı değer yalnız tur bitince güncellendiği
// için kırılmış seri "🔥 N gün" diye görünmeye devam ediyordu.
describe('liveStreak — gösterilen seri canlı seridir', () => {
  it('hiç aktivite yoksa ya da seri 0 ise 0', () => {
    expect(liveStreak(null, D('2026-07-15'), 1)).toBe(0);
    expect(liveStreak(state({ currentStreak: 0 }), D('2026-07-13'), 1)).toBe(0);
  });

  it('bugün ya da dün aktif: kayıtlı seri', () => {
    expect(liveStreak(state(), new Date('2026-07-13T21:40:00.000Z'), 1)).toBe(5);
    expect(liveStreak(state(), D('2026-07-14'), 1)).toBe(5);
  });

  it('TAM 1 gün kaçtı + hak var: bugün çalışırsa yaşar, gösterilir', () => {
    expect(liveStreak(state(), D('2026-07-15'), 1)).toBe(5);
  });

  it('TAM 1 gün kaçtı ama haftalık hak bitmiş: kırık (0)', () => {
    const prev = state({ freezeWeekStart: D('2026-07-13'), freezesUsed: 1 });
    expect(liveStreak(prev, D('2026-07-15'), 1)).toBe(0);
  });

  it('2+ gün kaçtı: sigorta kapsamı dışı, kırık (0)', () => {
    expect(liveStreak(state(), D('2026-07-16'), 3)).toBe(0);
  });

  it('hafta dönümü: geçen haftanın harcanmış hakkı bu haftayı bağlamaz', () => {
    // Paz aktif, Pzt kaçtı, Salı bakılıyor — hak geçen hafta harcanmıştı.
    const prev = state({
      lastActiveDate: D('2026-07-19'),
      freezeWeekStart: D('2026-07-13'),
      freezesUsed: 1,
    });
    expect(liveStreak(prev, D('2026-07-21'), 1)).toBe(5);
  });

  it('computeStreakUpdate ile tutarlı: gösterilen >0 ⇔ bugünkü tur seriyi sürdürür', () => {
    const durumlar = [
      state(),
      state({ freezeWeekStart: D('2026-07-13'), freezesUsed: 1 }),
      state({ currentStreak: 1 }),
    ];
    for (const prev of durumlar) {
      for (const gun of ['2026-07-14', '2026-07-15', '2026-07-16', '2026-07-18']) {
        for (const hak of [1, 3]) {
          const surer = computeStreakUpdate(prev, D(gun), hak).currentStreak > 1;
          expect(liveStreak(prev, D(gun), hak) > 0).toBe(surer);
        }
      }
    }
  });
});

describe('weeklyFreezeAllowance', () => {
  it('ücretsiz 1, premium 3', () => {
    expect(weeklyFreezeAllowance(false)).toBe(1);
    expect(weeklyFreezeAllowance(true)).toBe(3);
  });
});

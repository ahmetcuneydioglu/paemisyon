/**
 * Seri + sigorta hesabı (Doc 24 §7.2, Doc 26 §5) — SAF fonksiyon, birim testli.
 * Kural: kaçan TAM 1 gün, haftalık hak varsa affedilir (free 1, premium 3);
 * 2+ gün boşluk sigorta kapsamı dışıdır. Hafta = Pzt başlangıçlı UTC.
 */

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  /** UTC gün başlangıcı; hiç aktivite yoksa null. */
  lastActiveDate: Date | null;
  freezeWeekStart: Date | null;
  freezesUsed: number;
}

export interface StreakUpdate {
  currentStreak: number;
  longestStreak: number;
  freezeWeekStart: Date;
  freezesUsed: number;
  /** Bu güncellemede sigorta harcandı mı (koç kartı/bildirim için). */
  freezeSpent: boolean;
}

export function computeStreakUpdate(
  prev: StreakState | null,
  today: Date,
  weeklyAllowance: number,
): StreakUpdate {
  const weekStart = startOfUtcWeek(today);
  const sameWeek =
    prev?.freezeWeekStart != null &&
    startOfUtcDay(prev.freezeWeekStart).getTime() === weekStart.getTime();
  let freezesUsed = sameWeek ? prev!.freezesUsed : 0; // yeni hafta → haklar tazelenir
  let freezeSpent = false;

  const last = prev?.lastActiveDate ? startOfUtcDay(prev.lastActiveDate) : null;
  let current = prev?.currentStreak ?? 0;

  if (!last) {
    current = 1;
  } else {
    const diffDays = Math.round((today.getTime() - last.getTime()) / 86_400_000);
    if (diffDays === 1) {
      current += 1;
    } else if (diffDays === 2 && current > 0 && freezesUsed < weeklyAllowance) {
      freezesUsed += 1;
      freezeSpent = true;
      current += 1; // kaçan gün affedildi, bugün de sayıldı
    } else if (diffDays > 1) {
      current = 1; // sigortasız/kapsam dışı boşluk → sıfırla
    }
    // diffDays === 0 → aynı gün, değişmez
  }

  return {
    currentStreak: current,
    longestStreak: Math.max(prev?.longestStreak ?? 0, current),
    freezeWeekStart: weekStart,
    freezesUsed,
    freezeSpent,
  };
}

/** Bu hafta kalan sigorta hakkı (koç brief'i için). */
export function freezesLeft(
  prev: Pick<StreakState, 'freezeWeekStart' | 'freezesUsed'> | null,
  today: Date,
  weeklyAllowance: number,
): number {
  const weekStart = startOfUtcWeek(today);
  const sameWeek =
    prev?.freezeWeekStart != null &&
    startOfUtcDay(prev.freezeWeekStart).getTime() === weekStart.getTime();
  return Math.max(0, weeklyAllowance - (sameWeek ? prev!.freezesUsed : 0));
}

export function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

/** Pazartesi başlangıçlı UTC hafta (koç snapshot konvansiyonuyla aynı). */
export function startOfUtcWeek(d: Date): Date {
  const day = startOfUtcDay(d);
  const offset = (day.getUTCDay() + 6) % 7; // Pzt=0 … Paz=6
  return new Date(day.getTime() - offset * 86_400_000);
}

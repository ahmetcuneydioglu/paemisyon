import { CoachContext } from './coach.types';
import { deriveMode } from './coach.service';
import { badgeNearRule } from './rules/badge-near.rule';
import { comebackRule } from './rules/comeback.rule';
import { examModeRule } from './rules/exam-mode.rule';
import { slumpWatchRule } from './rules/slump-watch.rule';
import { taperRule } from './rules/taper.rule';
import { courseTrendRule } from './rules/course-trend.rule';
import { dailyQuizRule } from './rules/daily-quiz.rule';
import { examInProgressRule } from './rules/exam-in-progress.rule';
import { examLiveRule } from './rules/exam-live.rule';
import { examTodayRule } from './rules/exam-today.rule';
import { goalRemainingRule } from './rules/goal-remaining.rule';
import { motivationRule } from './rules/motivation.rule';
import { newExamRule } from './rules/new-exam.rule';
import { quickReviewRule } from './rules/quick-review.rule';
import { streakRiskRule } from './rules/streak-risk.rule';
import { weakTopicRule } from './rules/weak-topic.rule';

/** Nötr bağlam: hiçbir kural tetiklenmez; testler tek alanı değiştirir. */
function ctx(over: Partial<CoachContext> = {}): CoachContext {
  return {
    now: new Date('2026-07-14T10:00:00Z'),
    trHour: 13,
    user: {
      id: 'u1',
      displayName: 'Test',
      dailyGoal: 20,
      isPremium: false,
      onboardingCompleted: true,
      preferredModuleName: null,
    },
    streak: { current: 0, longest: 0, activeYesterday: false },
    answeredToday: 0,
    stats: { totalSolved: 0, totalCorrect: 0, totalSessions: 0 },
    unresolvedWrongCount: 0,
    weakestTopic: null,
    exams: {
      live: null,
      todayUpcoming: null,
      newPublished: null,
      completedCount: 0,
      bestNet: null,
    },
    dailyQuizPlayed: true,
    nextBadge: null,
    weekly: { activeDays: 0, goalDays: 5 },
    maxDailyQuestions: 0,
    courseTrend: null,
    daysSinceLastActivity: 0,
    daysToExam: null,
    volume: { last7: 0, prev7: 0 },
    ...over,
  };
}

const liveExam = {
  id: 'e1',
  title: 'Deneme 1',
  endAt: new Date('2026-07-14T12:00:00Z'),
  attempted: false,
  inProgress: false,
};

describe('exam_live (kural 1)', () => {
  it('katılmamışsa 100 öncelikle tetiklenir', () => {
    const c = examLiveRule(ctx({ exams: { ...ctx().exams, live: liveExam } }));
    expect(c?.priority).toBe(100);
    expect(c?.body).toContain('Deneme 1');
  });
  it('katıldıysa veya yarım oturum varsa sessiz', () => {
    expect(
      examLiveRule(ctx({ exams: { ...ctx().exams, live: { ...liveExam, attempted: true } } })),
    ).toBeNull();
    expect(
      examLiveRule(ctx({ exams: { ...ctx().exams, live: { ...liveExam, inProgress: true } } })),
    ).toBeNull();
  });
});

describe('exam_in_progress (kural 2)', () => {
  it('yarım oturumda deneme rotasına yönlendirir', () => {
    const c = examInProgressRule(
      ctx({ exams: { ...ctx().exams, live: { ...liveExam, inProgress: true } } }),
    );
    expect(c?.priority).toBe(95);
    expect(c?.cta?.route).toBe('/denemeler/e1');
  });
  it('aktif deneme yoksa sessiz', () => {
    expect(examInProgressRule(ctx())).toBeNull();
  });
});

describe('exam_today (kural 3)', () => {
  it('bugünkü denemeyi TR saatiyle duyurur', () => {
    const c = examTodayRule(
      ctx({
        exams: {
          ...ctx().exams,
          todayUpcoming: {
            id: 'e2',
            title: 'Deneme 2',
            startAt: new Date('2026-07-14T17:00:00Z'), // TR 20:00
            questionCount: 40,
            durationMinutes: 60,
          },
        },
      }),
    );
    expect(c?.title).toContain("20:00'de");
    expect(c?.body).toBe('Deneme 2 · 40 soru · 60 dk');
  });
});

describe('streak_risk (kural 4)', () => {
  const risky = {
    streak: { current: 7, longest: 10, activeYesterday: true },
    answeredToday: 0,
    trHour: 19,
  };
  it('akşam + dün aktif + bugün 0 soruda tetiklenir', () => {
    const c = streakRiskRule(ctx(risky));
    expect(c?.title).toContain('7 günlük serin');
  });
  it('18 öncesi, bugün çalışmışsa veya seri yoksa sessiz', () => {
    expect(streakRiskRule(ctx({ ...risky, trHour: 17 }))).toBeNull();
    expect(streakRiskRule(ctx({ ...risky, answeredToday: 3 }))).toBeNull();
    expect(
      streakRiskRule(ctx({ ...risky, streak: { current: 0, longest: 0, activeYesterday: true } })),
    ).toBeNull();
  });
});

describe('goal_remaining (kural 5)', () => {
  it('hedefin yarısından azı kaldıysa tetiklenir', () => {
    const c = goalRemainingRule(ctx({ answeredToday: 12 })); // kalan 8 ≤ 10
    expect(c?.title).toContain('8 soru kaldı');
  });
  it('hedef tamamlandıysa veya çok erkense sessiz', () => {
    expect(goalRemainingRule(ctx({ answeredToday: 20 }))).toBeNull();
    expect(goalRemainingRule(ctx({ answeredToday: 5 }))).toBeNull(); // kalan 15 > 10
  });
});

describe('quick_review (kural 6)', () => {
  it('5+ çözülmemiş yanlışta tekrar önerir', () => {
    const c = quickReviewRule(ctx({ unresolvedWrongCount: 7 }));
    expect(c?.cta?.route).toBe('/review');
  });
  it('5 altında sessiz', () => {
    expect(quickReviewRule(ctx({ unresolvedWrongCount: 4 }))).toBeNull();
  });
});

describe('weak_topic (kural 7)', () => {
  it('zayıf konuyu adıyla söyler, meta ile quiz kurdurur', () => {
    const c = weakTopicRule(
      ctx({ weakestTopic: { topicId: 't1', name: 'Ceza Hukuku', mastery: 0.3 } }),
    );
    expect(c?.title).toContain('Ceza Hukuku');
    expect(c?.meta?.topicId).toBe('t1');
  });
});

describe('course_trend (kural 8)', () => {
  it('±%10 üzeri değişimde tetiklenir; artışta CTA yok', () => {
    const up = courseTrendRule(ctx({ courseTrend: { courseName: 'Genel Mevzuat', deltaPct: 12 } }));
    expect(up?.title).toContain('%12 arttı');
    expect(up?.cta).toBeUndefined();
    const down = courseTrendRule(ctx({ courseTrend: { courseName: 'Ceza', deltaPct: -15 } }));
    expect(down?.title).toContain('zayıfladı');
    expect(down?.cta?.route).toBe('/catalog');
  });
  it('%10 altı değişimde sessiz', () => {
    expect(courseTrendRule(ctx({ courseTrend: { courseName: 'X', deltaPct: 5 } }))).toBeNull();
  });
});

describe('daily_quiz (kural 9)', () => {
  it('oynanmadıysa çağırır, oynandıysa sessiz', () => {
    expect(dailyQuizRule(ctx({ dailyQuizPlayed: false }))?.meta?.mode).toBe('daily');
    expect(dailyQuizRule(ctx())).toBeNull();
  });
});

describe('badge_near (kural 10)', () => {
  it('%80+ ilerlemede tetiklenir', () => {
    const c = badgeNearRule(
      ctx({ nextBadge: { key: 'streak_7', name: '7 Gün Seri', progress: 6, target: 7 } }),
    );
    expect(c?.title).toContain('7 Gün Seri');
  });
  it('%80 altında sessiz', () => {
    expect(
      badgeNearRule(ctx({ nextBadge: { key: 'solved_100', name: '100 Soru', progress: 50, target: 100 } })),
    ).toBeNull();
  });
  it('eşik aşıldıysa (hak edilmiş, verilmemiş) "kaldı" demez', () => {
    expect(
      badgeNearRule(ctx({ nextBadge: { key: 'first_session', name: 'İlk Adım', progress: 1, target: 1 } })),
    ).toBeNull();
  });
});

describe('new_exam (kural 11)', () => {
  it('yeni yayınlanan denemeyi duyurur', () => {
    const c = newExamRule(
      ctx({ exams: { ...ctx().exams, newPublished: { id: 'e3', title: 'Deneme 3' } } }),
    );
    expect(c?.body).toBe('Deneme 3');
  });
});

describe('comeback (kural 12)', () => {
  it('3+ gün aradan sonra birikim diliyle tetiklenir (suçlama yok — Doc 26)', () => {
    const c = comebackRule(
      ctx({
        daysSinceLastActivity: 4,
        stats: { totalSolved: 2847, totalCorrect: 2000, totalSessions: 90 },
      }),
    );
    expect(c?.title).toContain('Hoş geldin');
    expect(c?.body).toContain('2.847');
    expect(c?.body).not.toContain('özledik');
  });
  it('aktif kullanıcıda ve hiç aktivitesi olmayanda sessiz', () => {
    expect(comebackRule(ctx({ daysSinceLastActivity: 1 }))).toBeNull();
    expect(comebackRule(ctx({ daysSinceLastActivity: null }))).toBeNull();
  });
});

describe('motivation (kural 13)', () => {
  it('metin veriye göre deterministik: seri > hedef > varsayılan', () => {
    expect(motivationRule(ctx({ streak: { current: 5, longest: 5, activeYesterday: true } }))?.title)
      .toBe('5 gündür üst üste çalışıyorsun');
    expect(motivationRule(ctx({ answeredToday: 25 }))?.title).toBe('Bugünkü hedefini tamamladın');
    expect(motivationRule(ctx())?.title).toBe('Bugün de bir adım ileri');
  });
});

// ── Doc 25 §3 durum makinesi kuralları ──

describe('exam_mode (sınava ≤30 gün)', () => {
  it('4-30 gün aralığında tetiklenir; yanlış varsa yanlış turuna yönlendirir', () => {
    const c = examModeRule(ctx({ daysToExam: 23, unresolvedWrongCount: 12 }));
    expect(c?.priority).toBe(84);
    expect(c?.title).toContain('23 gün');
    expect(c?.cta?.route).toBe('/review');
    expect(c?.cta?.label).toContain('12');
  });
  it('yanlış yoksa denemelere yönlendirir', () => {
    expect(examModeRule(ctx({ daysToExam: 10 }))?.cta?.route).toBe('/denemeler');
  });
  it('tarih yoksa, uzaksa veya taper penceresindeyse sessiz', () => {
    expect(examModeRule(ctx())).toBeNull();
    expect(examModeRule(ctx({ daysToExam: 31 }))).toBeNull();
    expect(examModeRule(ctx({ daysToExam: 3 }))).toBeNull();
  });
});

describe('taper (sınava ≤3 gün)', () => {
  it('güven diliyle tetiklenir, çözülen soruyu TR formatında söyler', () => {
    const c = taperRule(
      ctx({
        daysToExam: 2,
        stats: { totalSolved: 11400, totalCorrect: 8000, totalSessions: 300 },
      }),
    );
    expect(c?.priority).toBe(97);
    expect(c?.title).toBe('Hazırsın.');
    expect(c?.body).toContain('11.400');
    expect(c?.cta).toBeDefined();
  });
  it('sınav günü CTA yok — ürün susmayı bilir', () => {
    const c = taperRule(ctx({ daysToExam: 0 }));
    expect(c?.title).toContain('sınav günü');
    expect(c?.cta).toBeUndefined();
  });
  it('4+ gün kala sessiz', () => {
    expect(taperRule(ctx({ daysToExam: 4 }))).toBeNull();
  });
});

describe('slump_watch (tempo düşüşü)', () => {
  it('son 7 gün önceki 7 günün yarısının altındaysa tetiklenir', () => {
    const c = slumpWatchRule(ctx({ volume: { last7: 20, prev7: 80 } }));
    expect(c?.priority).toBe(80);
    expect(c?.body).toContain('10 soru');
    expect(c?.meta?.suggestedCount).toBe(10);
  });
  it('önceki hafta hacim azsa (yeni kullanıcı) yanlış alarm vermez', () => {
    expect(slumpWatchRule(ctx({ volume: { last7: 0, prev7: 39 } }))).toBeNull();
  });
  it('tempo korunuyorsa veya sınav yaklaşmışsa sessiz', () => {
    expect(slumpWatchRule(ctx({ volume: { last7: 45, prev7: 80 } }))).toBeNull();
    expect(
      slumpWatchRule(ctx({ volume: { last7: 10, prev7: 80 }, daysToExam: 20 })),
    ).toBeNull();
  });
});

describe('deriveMode (durum makinesi etiketi — Doc 25 §3)', () => {
  const card = (type: string) => ({ type, priority: 50, title: 't' }) as any;
  it('öncelik sırası: comeback > taper > exam_day > streak_risk > exam_mode > slump_watch', () => {
    expect(deriveMode(ctx(), [card('comeback'), card('taper')])).toBe('comeback');
    expect(deriveMode(ctx(), [card('taper'), card('exam_live')])).toBe('taper');
    expect(deriveMode(ctx(), [card('exam_today'), card('streak_risk')])).toBe('exam_day');
    expect(deriveMode(ctx(), [card('streak_risk'), card('exam_mode')])).toBe('streak_risk');
    expect(deriveMode(ctx(), [card('exam_mode'), card('slump_watch')])).toBe('exam_mode');
    expect(deriveMode(ctx(), [card('slump_watch')])).toBe('slump_watch');
    expect(deriveMode(ctx(), [card('goal_remaining')])).toBe('normal');
  });
});

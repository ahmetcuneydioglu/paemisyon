import {
  blockedBy,
  evaluate,
  normalizePlatform,
  pickMoment,
  promptCopy,
  type ReviewPromptInput,
} from './review-prompt.logic';

const NOW = new Date('2026-11-03T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

function base(over: Partial<ReviewPromptInput> = {}): ReviewPromptInput {
  return {
    platform: 'ios',
    killSwitch: false,
    now: NOW,
    userCreatedAt: daysAgo(30),
    totalSessions: 12,
    lastPrompt: null,
    recentComplaints: 0,
    session: { mode: 'practice', totalQuestions: 10, correctCount: 9 },
    streak: { current: 3, activeToday: true },
    previousBestPct: 70,
    earnedBadges: 0,
    weeklyTop: false,
    ...over,
  };
}

describe('review-prompt engelleri (Doc 57 §3)', () => {
  it('platform yoksa, kill switch açıksa, hesap/tur eşiği dolmamışsa sorulmaz', () => {
    expect(blockedBy(base({ platform: null }))).toBe('platform');
    expect(blockedBy(base({ killSwitch: true }))).toBe('kill_switch');
    expect(blockedBy(base({ userCreatedAt: daysAgo(2) }))).toBe('account_age');
    expect(blockedBy(base({ totalSessions: 4 }))).toBe('session_count');
    expect(blockedBy(base({ totalSessions: 5 }))).toBeNull();
  });

  it('sönüm: gösterim/erteleme 30 gün, kabul 180 gün; panel değeri geçersiz', () => {
    expect(blockedBy(base({ lastPrompt: { outcome: 'dismissed', createdAt: daysAgo(29) } }))).toBe(
      'cooldown',
    );
    expect(
      blockedBy(base({ lastPrompt: { outcome: 'dismissed', createdAt: daysAgo(31) } })),
    ).toBeNull();
    expect(blockedBy(base({ lastPrompt: { outcome: 'shown', createdAt: daysAgo(10) } }))).toBe(
      'cooldown',
    );
    expect(blockedBy(base({ lastPrompt: { outcome: 'accepted', createdAt: daysAgo(100) } }))).toBe(
      'cooldown',
    );
    expect(
      blockedBy(base({ lastPrompt: { outcome: 'accepted', createdAt: daysAgo(181) } })),
    ).toBeNull();
    expect(
      blockedBy(
        base({ lastPrompt: { outcome: 'dismissed', createdAt: daysAgo(8) }, minGapDays: 7 }),
      ),
    ).toBeNull();
  });

  it('şikayet, deneme ekranı ve kötü tur engeller', () => {
    expect(blockedBy(base({ recentComplaints: 1 }))).toBe('recent_complaint');
    expect(
      blockedBy(base({ session: { mode: 'deneme', totalQuestions: 100, correctCount: 90 } })),
    ).toBe('exam_result');
    expect(
      blockedBy(
        base({
          session: { mode: 'deneme', totalQuestions: 100, correctCount: 90 },
          weeklyTop: true,
        }),
      ),
    ).toBeNull();
    expect(
      blockedBy(base({ session: { mode: 'practice', totalQuestions: 10, correctCount: 4 } })),
    ).toBe('bad_session');
    // Kötü turda seri anı bile tetiklenmez — yarın sorulur.
    expect(
      evaluate(
        base({
          session: { mode: 'practice', totalQuestions: 10, correctCount: 4 },
          streak: { current: 7, activeToday: true },
        }),
      ),
    ).toBeNull();
  });
});

describe('review-prompt an seçimi (öncelik sırası)', () => {
  it('seri 30 > seri 7 > haftalık > kişisel rekor > rozet', () => {
    expect(
      pickMoment(
        base({ streak: { current: 30, activeToday: true }, weeklyTop: true, earnedBadges: 2 }),
      ),
    ).toBe('streak_30');
    expect(pickMoment(base({ streak: { current: 7, activeToday: true }, weeklyTop: true }))).toBe(
      'streak_7',
    );
    expect(pickMoment(base({ weeklyTop: true }))).toBe('weekly_top');
    expect(pickMoment(base())).toBe('personal_best');
    expect(pickMoment(base({ previousBestPct: 95, earnedBadges: 1 }))).toBe('badge');
    expect(pickMoment(base({ previousBestPct: 95 }))).toBeNull();
  });

  it('seri bugün değilse (dünkü 7) sayılmaz; 8 gün de an değildir', () => {
    expect(
      pickMoment(base({ streak: { current: 7, activeToday: false }, previousBestPct: 95 })),
    ).toBeNull();
    expect(
      pickMoment(base({ streak: { current: 8, activeToday: true }, previousBestPct: 95 })),
    ).toBeNull();
  });

  it('kişisel rekor: ≥10 soru, ≥%80 ve öncekinden iyi; ilk kayıtta önceki yok sayılır', () => {
    expect(
      pickMoment(base({ session: { mode: 'practice', totalQuestions: 5, correctCount: 5 } })),
    ).toBeNull();
    expect(
      pickMoment(base({ session: { mode: 'practice', totalQuestions: 10, correctCount: 7 } })),
    ).toBeNull();
    expect(pickMoment(base({ previousBestPct: 90 }))).toBeNull();
    expect(pickMoment(base({ previousBestPct: null }))).toBe('personal_best');
  });
});

describe('review-prompt metinleri (onaylı, 3 Kas 2026)', () => {
  it('ad her yerde Paemisyon; yıldız ya da rakamlı puan geçmez', () => {
    for (const m of ['streak_7', 'streak_30', 'weekly_top', 'personal_best', 'badge'] as const) {
      const c = promptCopy(m);
      expect(`${c.title} ${c.body}`).toContain('Paemisyon');
      expect(`${c.label} ${c.title} ${c.body}`).not.toMatch(/PAEM\b|yıldız|puan ver|oyla/i);
    }
  });
  it('seri anı gün sayısını taşır, varsayılan mesaj 3', () => {
    expect(promptCopy('streak_30').title).toBe('30 gündür buradasın.');
    expect(promptCopy('streak_7').label).toBe('7 günlük seri');
    expect(promptCopy('badge')).toEqual({
      label: 'Bir dakikan var mı?',
      title: 'Bugün iyi gitti.',
      body: "Paemisyon'la çalışmak hoşuna gidiyorsa mağazadaki değerlendirmen bizim için çok şey ifade eder.",
    });
  });
  it('platform başlığı normalize edilir', () => {
    expect(normalizePlatform(' iOS ')).toBe('ios');
    expect(normalizePlatform('android')).toBe('android');
    expect(normalizePlatform('web')).toBeNull();
    expect(normalizePlatform(undefined)).toBeNull();
  });
});

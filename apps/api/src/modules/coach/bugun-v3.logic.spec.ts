import { computeHomeV3, ROTA_EN_AZ, ROTA_EN_COK, type BugunV3Input } from './bugun-v3.logic';
import type { TodayTask } from './home-v2.types';

/**
 * Bugün v3 (Doc 49/16): tek birincil adım, 2–6 maddelik rota, en çok 3 "senin için".
 * Korunanlar: özet→soru reçetesi önce; deneme her şeyi ezer; taze yarım tur devam eder;
 * rota sınırları; senin için'de sıradakiyle aynı konu tekrar etmez.
 */
const NOW = new Date('2026-10-30T15:00:00Z');
const gorev = (over: Partial<TodayTask> = {}): TodayTask => ({
  kind: 'start',
  title: 'Anayasa ile 10 soru',
  reason: 'Zayıf konun.',
  progress: null,
  action: {
    type: 'start_session',
    label: 'Başla · 10 soru',
    count: 10,
    recipe: 'coach',
    source: 'home_task',
  },
  finishSessionId: null,
  secondary: null,
  ...over,
});
const zayif = (id: string, name: string, acc: number) => ({
  topicId: id,
  name,
  courseName: 'Anayasa Hukuku',
  accuracy: acc,
  solved: 12,
});
function girdi(over: Partial<BugunV3Input> = {}): BugunV3Input {
  return {
    now: NOW,
    goal: 20,
    answeredToday: 5,
    dailyQuizPlayed: true,
    activeSession: null,
    todayTask: gorev(),
    weakestUnit: {
      unit: {
        slug: 'yurutme',
        title: 'Yürütme — Anayasa',
        topicId: 't1',
        isPremium: false,
        accuracyPct: 42,
        solved: 12,
        band: 'weak' as never,
      },
      kind: 'summary_then_questions',
      session: { topicId: 't1', articleNos: ['104', '105'], count: 10 },
    },
    readiness: {
      courses: [],
      weakest: [zayif('t1', 'Yürütme', 0.42), zayif('t2', 'İdari Yargı', 0.48)],
      unresolvedWrongCount: 4,
    },
    exams: {
      live: null,
      todayUpcoming: null,
      nextUpcoming: {
        id: 'e4',
        title: 'Deneme 4',
        startAt: new Date('2026-10-31T17:00:00Z'),
        questionCount: 100,
      },
    },
    plan: null,
    todayTopicAnswered: {},
    reviewDoneToday: false,
    ...over,
  };
}

describe('computeHomeV3', () => {
  it('zayıf ünitede özet→soru reçetesini tek adım yapar; özeti açar', () => {
    const r = computeHomeV3(girdi());
    expect(r.nextStep.kind).toBe('summary_then_questions');
    expect(r.nextStep.title).toBe('4 dk özet, sonra 10 soru');
    expect(r.nextStep.eyebrow).toBe('SIRADAKİ · Anayasa Hukuku · Yürütme');
    expect(r.nextStep.badge).toBe('%42 · en zayıf');
    expect(r.nextStep.action).toMatchObject({
      type: 'open_summary',
      route: '/ozet/yurutme',
      source: 'home_next',
    });
    expect(r.nextStep.estimateMin).toBe(4 + 3);
  });

  it('özet okunduysa sorulara geçer ve madde listesini taşır', () => {
    const r = computeHomeV3(girdi({ weakestUnit: { ...girdi().weakestUnit!, kind: 'questions' } }));
    expect(r.nextStep.kind).toBe('questions');
    expect(r.nextStep.action).toMatchObject({
      type: 'start_session',
      count: 10,
      articleNos: ['104', '105'],
      focus: { topicId: 't1' },
    });
  });

  it('deneme günü her şeyi ezer', () => {
    const r = computeHomeV3(
      girdi({
        todayTask: gorev({
          kind: 'exam',
          title: 'Canlı deneme şu an açık',
          action: {
            type: 'open_exams',
            label: 'Denemeye gir',
            route: '/denemeler/e1',
            source: 'home_task',
          },
        }),
        exams: { live: { id: 'e1', title: 'Deneme 1' }, todayUpcoming: null, nextUpcoming: null },
      }),
    );
    expect(r.nextStep.kind).toBe('exam');
    expect(r.route[0]).toMatchObject({ kind: 'exam', label: 'Deneme 1' });
    expect(r.forYou.some((f) => f.kind === 'exam')).toBe(false);
  });

  it('taze yarım tur devam eder', () => {
    const tur = {
      sessionId: 's1',
      mode: 'practice' as const,
      total: 10,
      answered: 6,
      startedAt: new Date(NOW.getTime() - 20 * 60_000),
      lastActivityAt: new Date(NOW.getTime() - 12 * 60_000),
      scopeName: 'Anayasa · Yürütme',
    };
    const r = computeHomeV3(
      girdi({
        activeSession: tur,
        todayTask: gorev({
          kind: 'resume',
          action: {
            type: 'resume_session',
            label: 'Devam et · 4 soru',
            sessionId: 's1',
            source: 'home_resume',
          },
        }),
      }),
    );
    expect(r.nextStep.kind).toBe('resume');
    expect(r.nextStep.title).toBe('Anayasa · Yürütme turuna devam et');
    expect(r.nextStep.reason).toBe('6/10 · 12 dk önce');
    expect(r.nextStep.action).toMatchObject({
      type: 'resume_session',
      sessionId: 's1',
      source: 'home_next',
    });
  });

  it('rota 2–6 madde, sıra sabit: özet, soru, yanlış, günün quizi; süre tahminleri', () => {
    const r = computeHomeV3(girdi());
    expect(r.route.length).toBeGreaterThanOrEqual(ROTA_EN_AZ);
    expect(r.route.length).toBeLessThanOrEqual(ROTA_EN_COK);
    expect(r.route.map((i) => i.kind)).toEqual(['summary', 'questions', 'review', 'daily']);
    expect(r.route.map((i) => i.estimateMin)).toEqual([4, 3, 1, null]);
    expect(r.route.at(-1)).toMatchObject({ kind: 'daily', done: true, action: null });
  });

  it('tamamlanma gerçek veriden: özet okundu (reçete questions), konuda 10 soru çözüldü, yanlış turu bitti', () => {
    const r = computeHomeV3(
      girdi({
        weakestUnit: { ...girdi().weakestUnit!, kind: 'questions' },
        todayTopicAnswered: { t1: 10 },
        reviewDoneToday: true,
      }),
    );
    expect(r.route.map((i) => [i.kind, i.done])).toEqual([
      ['summary', true],
      ['questions', true],
      ['review', true],
      ['daily', true],
    ]);
    const yarim = computeHomeV3(girdi({ todayTopicAnswered: { t1: 4 } }));
    expect(yarim.route[1]).toMatchObject({ kind: 'questions', done: false, detail: '4/10' });
  });

  it('plan kalemleri rotayı 6 ile doldurur, sıradaki konuyu tekrarlamaz', () => {
    const plan = {
      items: ['t1', 't3', 't4', 't5', 't6'].map((t, i) => ({
        id: `p${i}`,
        kind: 'topic' as const,
        topicId: t,
        topicName: `Konu ${t}`,
        remainingMinutes: 30,
        status: 'pending',
      })),
    };
    const r = computeHomeV3(girdi({ plan, dailyQuizPlayed: false }));
    expect(r.route.length).toBe(ROTA_EN_COK);
    expect(r.route.some((i) => i.label === 'Konu t1')).toBe(false);
    expect(r.route.filter((i) => i.kind === 'plan_topic').length).toBe(2);
  });

  it('hafif gün: ünite ve yanlış yoksa rota en az 2 madde', () => {
    const r = computeHomeV3(
      girdi({
        weakestUnit: null,
        readiness: { courses: [], weakest: [], unresolvedWrongCount: 0 },
        exams: { live: null, todayUpcoming: null, nextUpcoming: null },
      }),
    );
    expect(r.route.length).toBe(ROTA_EN_AZ);
    expect(r.route.map((i) => i.kind)).toEqual(['questions', 'daily']);
    expect(r.nextStep.kind).toBe('questions');
  });

  it('senin için: yanlış kuyruğu, ikinci zayıf konu, yaklaşan deneme — en çok 3', () => {
    const r = computeHomeV3(girdi());
    expect(r.forYou.map((f) => f.kind)).toEqual(['wrongs', 'weak_topic', 'exam']);
    expect(r.forYou[1]!.label).toBe('İdari Yargı · %48');
    expect(r.forYou[2]!.label).toMatch(/^Deneme 4 · Cmt \d\d:\d\d · 100 soru$/);
    expect(r.forYou[2]!.action).toMatchObject({ type: 'open_exams', route: '/denemeler/e4' });
  });

  it('hedef dolunca yanlış tekrarı sıradaki olur, senin için yanlış kuyruğunu tekrarlamaz', () => {
    const r = computeHomeV3(
      girdi({
        weakestUnit: null,
        todayTask: gorev({
          kind: 'done',
          title: 'Bugünlük tamam',
          action: {
            type: 'start_session',
            label: 'Biraz daha · 5 soru',
            count: 5,
            recipe: 'coach',
            source: 'home_task',
          },
        }),
      }),
    );
    expect(r.nextStep.kind).toBe('review');
    expect(r.forYou.some((f) => f.kind === 'wrongs')).toBe(false);
    expect(r.forYou.length).toBeLessThanOrEqual(3);
  });
});

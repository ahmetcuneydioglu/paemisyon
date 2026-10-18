import { PlanService, haftaBasi } from './plan.service';

describe('PlanService (Doc 49/12 F8-A)', () => {
  it('haftaBasi: Pazartesi; Pazar önceki Pazartesi; Pazartesi kendisi', () => {
    expect(haftaBasi(new Date('2026-10-17T10:00:00Z')).toISOString().slice(0, 10)).toBe(
      '2026-10-12',
    ); // Cmt
    expect(haftaBasi(new Date('2026-10-18T23:00:00Z')).toISOString().slice(0, 10)).toBe(
      '2026-10-12',
    ); // Paz
    expect(haftaBasi(new Date('2026-10-19T00:30:00Z')).toISOString().slice(0, 10)).toBe(
      '2026-10-12',
    ); // Pzt 03.30 TR: uygulama günü 04.00'te döner
    expect(haftaBasi(new Date('2026-10-19T02:00:00Z')).toISOString().slice(0, 10)).toBe(
      '2026-10-19',
    ); // Pzt 05.00 TR
  });

  it('aktif plan yoksa { plan: null }', async () => {
    const s = new PlanService({ studyPlan: { findFirst: async () => null } } as never);
    await expect(s.getPlan('u1')).resolves.toEqual({ plan: null });
  });

  it('plan varsa: bu hafta ayrışır, ücretsizde gelecek haftalar kilitli, sıradaki kalem başlanmış olan', async () => {
    const item = (weekStart: string, name: string, done = 0) => ({
      id: 'i-' + name + weekStart,
      weekStart: new Date(weekStart),
      kind: 'topic',
      topicId: 't-' + name,
      topic: { name, course: { name: 'Ceza' } },
      targetQuestions: 20,
      targetMinutes: 60,
      doneQuestions: done,
      doneMinutes: done,
      status: 'pending',
    });
    const prisma = {
      studyPlan: {
        findFirst: async () => ({
          id: 'p1',
          examDate: new Date('2027-03-01'),
          examTypeId: null,
          weeklyMinutes: 300,
          horizonWeeks: 2,
          createdAt: new Date('2026-10-10T00:00:00Z'),
          revisedAt: null,
          items: [
            item('2026-10-12', 'CMK', 30),
            item('2026-10-12', 'TCK', 0),
            item('2026-10-19', 'PVSK'),
          ],
        }),
      },
      quizAnswer: { count: async () => 35 },
    };
    const s = new PlanService(prisma as never);
    const r = await s.getPlan('u1', false, new Date('2026-10-17T10:00:00Z'));
    expect(r.plan).toMatchObject({
      id: 'p1',
      examDate: '2027-03-01',
      currentWeekStart: '2026-10-12',
      phase: 'build',
      premiumLocked: true,
    });
    expect(r.plan!.thisWeek.items.map((k) => k.topicName)).toEqual(['CMK', 'TCK']);
    expect(r.plan!.thisWeek.summary).toMatchObject({
      targetMinutes: 120,
      doneMinutes: 30,
      pct: 25,
      offPlanQuestions: 5,
    });
    // Başlanmış ama bitmemiş kalem (CMK 30/60) önce gelir; TCK 0/60 geride kalsa da.
    expect(r.plan!.nextItem?.topicName).toBe('CMK');
    expect(r.plan!.weeks.map((w) => [w.state, w.locked, w.items.length])).toEqual([
      ['current', false, 2],
      ['future', true, 0],
    ]);
    const p = await s.getPlan('u1', true, new Date('2026-10-17T10:00:00Z'));
    expect(p.plan!.weeks[1].items).toHaveLength(1);
  });

  it('sıradaki kalem: hiçbiri başlanmamışsa oransal en geride (büyük hedef önce); biten kalem atlanır', async () => {
    const item = (name: string, target: number, done: number, status = 'pending') => ({
      id: 'i-' + name,
      weekStart: new Date('2026-10-12'),
      kind: 'topic',
      topicId: 't-' + name,
      topic: { name, course: { name: 'Ceza' } },
      targetQuestions: 20,
      targetMinutes: target,
      doneQuestions: 0,
      doneMinutes: done,
      status,
    });
    const prisma = {
      studyPlan: {
        findFirst: async () => ({
          id: 'p1',
          examDate: null,
          examTypeId: null,
          weeklyMinutes: 300,
          horizonWeeks: 1,
          createdAt: new Date('2026-10-10T00:00:00Z'),
          revisedAt: null,
          items: [item('A', 30, 0), item('B', 90, 0), item('C', 60, 60, 'done')],
        }),
      },
      quizAnswer: { count: async () => 0 },
    };
    const s = new PlanService(prisma as never);
    const r = await s.getPlan('u1', false, new Date('2026-10-17T10:00:00Z'));
    expect(r.plan!.nextItem?.topicName).toBe('B');
  });
});

describe('PlanService.haftalikRevizyon (Doc 49/12 F8-A §3)', () => {
  const now = new Date('2026-10-19T05:00:00Z'); // Pzt 08.00 TR → bu hafta 2026-10-19
  function kur(isPremium: boolean) {
    const calls: Record<string, unknown[]> = {
      updateMany: [],
      deleteMany: [],
      createMany: [],
      planUpdate: [],
    };
    const prisma = {
      studyPlan: {
        findMany: async () => [
          {
            id: 'p1',
            userId: 'u1',
            examDate: new Date('2026-12-27'),
            examTypeId: 'et1',
            weeklyMinutes: 300,
            user: { status: 'active', entitlement: { isPremium, validUntil: null } },
          },
          {
            id: 'p-silinmis',
            userId: 'u-silinmis',
            examDate: null,
            examTypeId: 'et1',
            weeklyMinutes: 300,
            user: { status: 'deleted', entitlement: null },
          },
        ],
        update: async (a: unknown) => calls.planUpdate.push(a),
      },
      studyPlanItem: {
        findMany: async (a: { where: { weekStart?: { lt?: Date; gte?: Date } } }) =>
          a.where.weekStart?.lt
            ? [
                {
                  id: 'i1',
                  kind: 'topic',
                  topicId: 't1',
                  targetMinutes: 60,
                  targetQuestions: 60,
                  doneMinutes: 60,
                  doneQuestions: 10,
                },
                {
                  id: 'i2',
                  kind: 'topic',
                  topicId: 't2',
                  targetMinutes: 60,
                  targetQuestions: 60,
                  doneMinutes: 20,
                  doneQuestions: 5,
                },
              ]
            : [],
        updateMany: async (a: unknown) => calls.updateMany.push(a),
        deleteMany: (a: unknown) => calls.deleteMany.push(a),
        createMany: (a: unknown) => calls.createMany.push(a),
      },
      examSection: {
        findMany: async () => [
          {
            id: 's1',
            weightPercent: 100,
            courses: [
              {
                course: {
                  deletedAt: null,
                  topics: [
                    { id: 't1', name: 'A', _count: { questions: 100 } },
                    { id: 't2', name: 'B', _count: { questions: 100 } },
                  ],
                },
              },
            ],
          },
        ],
      },
      userTopicProgress: { findMany: async () => [] },
      wrongAnswer: { findMany: async () => [] },
      quizAnswer: { aggregate: async () => ({ _avg: { timeSpentMs: null } }) },
      $transaction: async (ops: unknown[]) => Promise.all(ops),
    };
    return { s: new PlanService(prisma as never), calls };
  }
  it('geçen haftayı kapatır: biten done, kalan skipped; ücretsizde yeniden üretim yok', async () => {
    const { s, calls } = kur(false);
    const r = await s.haftalikRevizyon(now);
    // Silinmiş hesabın planı dolaşılmaz, arşivlenir.
    expect(r).toEqual({ kapanan: 2, yenilenen: 0, arsivlenen: 1 });
    expect(calls.updateMany).toEqual([
      { where: { id: { in: ['i1'] } }, data: { status: 'done' } },
      { where: { id: { in: ['i2'] } }, data: { status: 'skipped' } },
    ]);
    expect(calls.planUpdate).toEqual([
      { where: { id: 'p-silinmis' }, data: { status: 'archived' } },
    ]);
    expect(calls.createMany).toHaveLength(0);
  });
  it('premium: gelecek haftalar yeniden üretilir, taşınan dakika konuya eklenir, revisedAt yazılır', async () => {
    const { s, calls } = kur(true);
    const r = await s.haftalikRevizyon(now);
    expect(r.yenilenen).toBe(1);
    expect(calls.deleteMany[0]).toMatchObject({
      where: { planId: 'p1', weekStart: { gte: new Date('2026-10-19T00:00:00Z') } },
    });
    const rows = (
      calls.createMany[0] as { data: { topicId: string | null; targetMinutes: number }[] }
    ).data;
    expect(rows.length).toBeGreaterThan(0);
    const t2 = rows.filter((x) => x.topicId === 't2').reduce((a, x) => a + x.targetMinutes, 0);
    const t1 = rows.filter((x) => x.topicId === 't1').reduce((a, x) => a + x.targetMinutes, 0);
    expect(t2).toBeGreaterThanOrEqual(t1); // t2'ye 20 dk taşındı (eksik 40'ın yarısı)
    expect(calls.planUpdate).toContainEqual(
      expect.objectContaining({
        where: { id: 'p1' },
        data: expect.objectContaining({ revisedAt: now }),
      }),
    );
  });
  it('sınavı geçen plan arşivlenir', async () => {
    const { s, calls } = kur(true);
    (
      s as unknown as { prisma: { studyPlan: { findMany: () => Promise<unknown[]> } } }
    ).prisma.studyPlan.findMany = async () => [
      {
        id: 'p9',
        userId: 'u1',
        examDate: new Date('2026-10-10'),
        examTypeId: 'et1',
        weeklyMinutes: 300,
        user: { entitlement: null },
      },
    ];
    const r = await s.haftalikRevizyon(now);
    expect(r).toEqual({ kapanan: 0, yenilenen: 0, arsivlenen: 1 });
    expect(calls.planUpdate[0]).toMatchObject({
      where: { id: 'p9' },
      data: { status: 'archived' },
    });
  });
});

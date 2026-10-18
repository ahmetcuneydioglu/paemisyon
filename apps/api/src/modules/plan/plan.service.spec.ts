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

  it('plan varsa: bu hafta ayrışır, ücretsizde gelecek haftalar kilitli, sıradaki kalem en geride olan', async () => {
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
    expect(r.plan!.nextItem?.topicName).toBe('TCK');
    expect(r.plan!.weeks.map((w) => [w.state, w.locked, w.items.length])).toEqual([
      ['current', false, 2],
      ['future', true, 0],
    ]);
    const p = await s.getPlan('u1', true, new Date('2026-10-17T10:00:00Z'));
    expect(p.plan!.weeks[1].items).toHaveLength(1);
  });
});

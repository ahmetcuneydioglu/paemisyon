import { PlanService, haftaBasi } from './plan.service';

describe('PlanService iskeleti (Doc 49 S1-E)', () => {
  it('haftaBasi: Pazartesi; Pazar önceki Pazartesi; Pazartesi kendisi', () => {
    expect(haftaBasi(new Date('2026-10-17T10:00:00Z')).toISOString().slice(0, 10)).toBe(
      '2026-10-12',
    ); // Cmt
    expect(haftaBasi(new Date('2026-10-18T23:00:00Z')).toISOString().slice(0, 10)).toBe(
      '2026-10-12',
    ); // Paz
    expect(haftaBasi(new Date('2026-10-19T00:00:00Z')).toISOString().slice(0, 10)).toBe(
      '2026-10-19',
    ); // Pzt
  });
  it('aktif plan yoksa { plan: null }', async () => {
    const s = new PlanService({ studyPlan: { findFirst: async () => null } } as never);
    await expect(s.getPlan('u1')).resolves.toEqual({ plan: null });
  });
  it('plan varsa bu haftanın kalemleri ayrışır', async () => {
    const item = (weekStart: string, name: string) => ({
      id: 'i-' + name,
      weekStart: new Date(weekStart),
      topicId: 't1',
      topic: { name },
      targetQuestions: 20,
      targetMinutes: 60,
      doneQuestions: 5,
      doneMinutes: 10,
      status: 'pending',
    });
    const s = new PlanService({
      studyPlan: {
        findFirst: async () => ({
          id: 'p1',
          examDate: new Date('2027-03-01'),
          weeklyMinutes: 300,
          createdAt: new Date('2026-10-10T00:00:00Z'),
          revisedAt: null,
          items: [item('2026-10-12', 'CMK'), item('2026-10-19', 'TCK')],
        }),
      },
    } as never);
    const r = await s.getPlan('u1', new Date('2026-10-17T10:00:00Z'));
    expect(r.plan).toMatchObject({
      id: 'p1',
      examDate: '2027-03-01',
      currentWeekStart: '2026-10-12',
    });
    expect(r.plan!.thisWeek.map((k) => k.topicName)).toEqual(['CMK']);
    expect(r.plan!.items).toHaveLength(2);
  });
});

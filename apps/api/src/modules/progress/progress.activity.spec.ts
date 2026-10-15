import { ProgressService } from './progress.service';

const D = (s: string) => new Date(`${s}T00:00:00.000Z`);

function setup(streak: Record<string, unknown> | null) {
  const prisma = {
    streak: {
      findUnique: jest.fn().mockResolvedValue(streak),
      upsert: jest.fn().mockResolvedValue({}),
    },
  };
  return { service: new ProgressService(prisma as never), prisma };
}

describe('ProgressService.touchActivity — aktiflik cevap anında (Doc 48 D3)', () => {
  it('ilk aktivite: seri 1 başlar, son aktif gün yazılır', async () => {
    const { service, prisma } = setup(null);
    await service.touchActivity('u1', false, D('2026-10-14'));
    const arg = prisma.streak.upsert.mock.calls[0][0];
    expect(arg.create).toMatchObject({
      userId: 'u1',
      currentStreak: 1,
      lastActiveDate: D('2026-10-14'),
    });
  });

  it('ertesi gün seri artar', async () => {
    const { service, prisma } = setup({
      currentStreak: 4,
      longestStreak: 9,
      lastActiveDate: D('2026-10-13'),
      freezeWeekStart: null,
      freezesUsed: 0,
    });
    await service.touchActivity('u1', false, D('2026-10-14'));
    expect(prisma.streak.upsert.mock.calls[0][0].update).toMatchObject({
      currentStreak: 5,
      lastActiveDate: D('2026-10-14'),
    });
  });

  it('aynı gün ikinci çağrı etkisiz (yazma yok)', async () => {
    const { service, prisma } = setup({
      currentStreak: 4,
      longestStreak: 9,
      lastActiveDate: D('2026-10-14'),
      freezeWeekStart: null,
      freezesUsed: 0,
    });
    await service.touchActivity('u1', true, D('2026-10-14'));
    expect(prisma.streak.upsert).not.toHaveBeenCalled();
  });
});

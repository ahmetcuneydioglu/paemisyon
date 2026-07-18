import { BadgeService } from './badge.service';

/** Prisma taklidi — yalnız BadgeService'in dokunduğu yüzey. */
function prismaMock(opts: {
  earned?: string[];
  totalSolved?: number;
  totalCorrect?: number;
  longestStreak?: number;
  examCount?: number;
}) {
  const catalog = [
    {
      key: 'first_session',
      name: 'İlk Adım',
      description: 'd',
      kind: 'solved',
      threshold: 1,
      sortOrder: 1,
    },
    {
      key: 'solved_100',
      name: '100 Soru',
      description: 'd',
      kind: 'solved',
      threshold: 100,
      sortOrder: 2,
    },
    {
      key: 'streak_7',
      name: '7 Gün Seri',
      description: 'd',
      kind: 'streak',
      threshold: 7,
      sortOrder: 6,
    },
    {
      key: 'first_exam',
      name: 'İlk Deneme',
      description: 'd',
      kind: 'exam',
      threshold: 1,
      sortOrder: 8,
    },
    {
      key: 'accuracy_70',
      name: 'Keskin Nişancı',
      description: 'd',
      kind: 'accuracy',
      threshold: 70,
      sortOrder: 10,
    },
  ];
  const createMany = jest.fn().mockResolvedValue({ count: 0 });
  return {
    prisma: {
      badge: { findMany: jest.fn().mockResolvedValue(catalog) },
      userBadge: {
        findMany: jest
          .fn()
          .mockResolvedValue((opts.earned ?? []).map((badgeKey) => ({ badgeKey }))),
        createMany,
      },
      userStats: {
        findUnique: jest.fn().mockResolvedValue({
          totalSolved: opts.totalSolved ?? 0,
          totalCorrect: opts.totalCorrect ?? 0,
        }),
      },
      streak: {
        findUnique: jest.fn().mockResolvedValue({ longestStreak: opts.longestStreak ?? 0 }),
      },
      quizSession: { count: jest.fn().mockResolvedValue(opts.examCount ?? 0) },
    },
    createMany,
  };
}

describe('BadgeService.checkAndAward', () => {
  it('eşiği geçen kazanılmamış rozetleri verir', async () => {
    const { prisma, createMany } = prismaMock({
      totalSolved: 105,
      totalCorrect: 35,
      longestStreak: 3,
      examCount: 1,
    });
    const earned = await new BadgeService(prisma as never).checkAndAward('u1');
    expect(earned.map((b) => b.key)).toEqual(['first_session', 'solved_100', 'first_exam']);
    expect(createMany).toHaveBeenCalledWith(expect.objectContaining({ skipDuplicates: true }));
  });

  it('zaten kazanılmışları atlar; hepsi kazanılmışsa yazma yapmaz', async () => {
    const { prisma, createMany } = prismaMock({
      earned: ['first_session', 'solved_100', 'first_exam'],
      totalSolved: 105,
      longestStreak: 3,
      examCount: 1,
    });
    const earned = await new BadgeService(prisma as never).checkAndAward('u1');
    expect(earned).toEqual([]);
    expect(createMany).not.toHaveBeenCalled();
  });

  it('accuracy rozeti 100 sorudan önce değerlendirilmez', async () => {
    const { prisma } = prismaMock({ totalSolved: 50, totalCorrect: 45 }); // %90 ama 50 soru
    const earned = await new BadgeService(prisma as never).checkAndAward('u1');
    expect(earned.map((b) => b.key)).not.toContain('accuracy_70');
  });

  it('seri rozeti REKOR üzerinden — bozulan seri rozeti geri almaz', async () => {
    const { prisma } = prismaMock({ longestStreak: 8, totalSolved: 1 });
    const earned = await new BadgeService(prisma as never).checkAndAward('u1');
    expect(earned.map((b) => b.key)).toContain('streak_7');
  });
});

describe('BadgeService.listForUser', () => {
  it('kazanılan ve kilitli rozetleri tek profil kataloğunda döndürür', async () => {
    const earnedAt = new Date('2026-07-18T00:00:00.000Z');
    const prisma = {
      badge: {
        findMany: jest.fn().mockResolvedValue([
          { key: 'first_session', name: 'İlk Adım', description: 'd' },
          { key: 'solved_100', name: '100 Soru', description: 'd' },
        ]),
      },
      userBadge: {
        findMany: jest.fn().mockResolvedValue([{ badgeKey: 'first_session', earnedAt }]),
      },
    };

    const result = await new BadgeService(prisma as never).listForUser('u1');

    expect(result.earnedCount).toBe(1);
    expect(result.totalCount).toBe(2);
    expect(result.items).toEqual([
      expect.objectContaining({
        key: 'first_session',
        earned: true,
        earnedAt: earnedAt.toISOString(),
      }),
      expect.objectContaining({ key: 'solved_100', earned: false, earnedAt: null }),
    ]);
  });
});

import { CatalogService } from './catalog.service';

const KONU = (id: string, name: string) => ({
  id,
  name,
  sortOrder: 1,
  isPremium: false,
  children: [] as { id: string; name: string; sortOrder: number; isPremium: boolean }[],
});

describe('CatalogService.getTopics — zayıf bayrağı sunucuda (Doc 48 D5)', () => {
  function setup() {
    const prisma = {
      topic: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            KONU('t1', 'Temel Haklar ve Ödevler'),
            KONU('t2', 'Yürütme'),
            KONU('t3', 'Yargı'),
            KONU('t4', 'Yasama'),
          ]),
      },
      userTopicProgress: {
        findMany: jest.fn().mockResolvedValue([
          // 26 çözülmüş, %38 → zayıf
          { topicId: 't1', solvedCount: 26, correctCount: 10, mastery: 10 / 26 },
          // %63 → zayıf değil (eşik %60)
          { topicId: 't3', solvedCount: 16, correctCount: 10, mastery: 0.625 },
          // %20 ama 5 soru → az veri, zayıf sayılmaz (eşik ≥10 çözülmüş)
          { topicId: 't4', solvedCount: 5, correctCount: 1, mastery: 0.2 },
        ]),
      },
      $queryRaw: jest.fn().mockResolvedValue([{ cnt: 3 }]),
    };
    return new CatalogService(prisma as never);
  }

  it('tek eşik (≥10 çözülmüş, < %60) — istemci kural hesaplamaz', async () => {
    const r = await setup().getTopics('c1', 'u1');
    const zayif = Object.fromEntries(r.topics.map((t) => [t.id, t.weak]));
    expect(zayif).toEqual({ t1: true, t2: false, t3: false, t4: false });
    expect(r.topics.find((t) => t.id === 't1')!.mastery).toBe(38);
    expect(r.topics.find((t) => t.id === 't2')!.mastery).toBeNull();
  });
});

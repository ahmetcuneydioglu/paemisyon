import { NotFoundException } from '@nestjs/common';
import { KILITLI_UNITE_ACIK_KART, SummariesService } from './summaries.service';

const BLOK = (i: number, type = 'rule') => ({
  id: `b${i}`,
  type,
  title: `Kart ${i}`,
  body: 'x',
  rows: null,
  sortOrder: i,
  articleRefs: [{ lawArticle: { articleNo: String(80 + i), title: null, sortKey: i } }],
});

function setup(unit: Record<string, unknown> | null, progress: unknown = null) {
  const prisma = {
    summaryUnit: { findFirst: jest.fn().mockResolvedValue(unit), findMany: jest.fn() },
    summaryProgress: {
      findUnique: jest.fn().mockResolvedValue(progress),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    userUnitProgress: {
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
  return { svc: new SummariesService(prisma as never), prisma };
}

const UNIT = {
  id: 'u1',
  slug: 'anayasa-yasama-1',
  title: 'Yasama I',
  subtitle: null,
  articleFrom: '75',
  articleTo: '86',
  readingMinutes: 12,
  isPremium: true,
  topicId: 't1',
  legislation: { slug: 't-c-anayasasi', name: 'T.C. Anayasası', shortName: null },
  topic: { name: 'T.C. Anayasası', course: { name: 'Anayasa Hukuku' } },
  blocks: [BLOK(0, 'concept'), BLOK(1), BLOK(2), BLOK(3, 'bridge')],
};

describe('SummariesService.getUnit — kilit sunucuda (Doc 53 karar 8)', () => {
  it('premium ünite + misafir: yalnız ilk kartlar, locked=true, toplam sayı görünür', async () => {
    const { svc } = setup(UNIT);
    const r = await svc.getUnit('anayasa-yasama-1', null);
    expect(r.locked).toBe(true);
    expect(r.blocks).toHaveLength(KILITLI_UNITE_ACIK_KART);
    expect(r.totalBlocks).toBe(4);
    expect(r.progress).toBeNull();
  });

  it('premium ünite + premium kullanıcı: bütün kartlar, köprü seans parametresi taşır', async () => {
    const { svc } = setup(UNIT, { lastBlockIndex: 2, completedAt: null });
    const r = await svc.getUnit('anayasa-yasama-1', {
      id: 'me',
      email: 'a@b',
      roles: ['user'],
      isPremium: true,
    });
    expect(r.locked).toBe(false);
    expect(r.blocks).toHaveLength(4);
    expect(r.blocks[3].session).toEqual({ topicId: 't1', articleNos: ['83'] });
    expect(r.progress).toEqual({ lastBlockIndex: 2, completedAt: null });
  });

  it('ücretsiz ünite + ücretsiz kullanıcı: kilit yok', async () => {
    const { svc } = setup({ ...UNIT, isPremium: false });
    const r = await svc.getUnit('x', { id: 'me', email: 'a@b', roles: ['user'], isPremium: false });
    expect(r.locked).toBe(false);
    expect(r.blocks).toHaveLength(4);
  });

  it('kaynak etiketi (sourceLabel) yanıtta YOK — 4 Eyl 2026 kuralı', async () => {
    const { svc } = setup({ ...UNIT, sourceLabel: 'AI özeti — gizli' });
    const r = await svc.getUnit('x', null);
    expect(JSON.stringify(r)).not.toContain('AI özeti');
  });

  it('yayında olmayan ünite 404', async () => {
    const { svc } = setup(null);
    await expect(svc.getUnit('yok', null)).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('SummariesService.saveProgress', () => {
  it('kart indeksi sınırlanır, tamamlanma damgası yalnız completed ile yazılır', async () => {
    const { svc, prisma } = setup({ id: 'u1' });
    const me = { id: 'me', email: 'a@b', roles: ['user'], isPremium: false };
    await svc.saveProgress(me, { slug: 's', lastBlockIndex: 9999 });
    expect(prisma.summaryProgress.upsert.mock.calls[0][0].update).toEqual({ lastBlockIndex: 500 });
    await svc.saveProgress(me, { slug: 's', lastBlockIndex: 3, completed: true });
    expect(prisma.summaryProgress.upsert.mock.calls[1][0].update.completedAt).toBeInstanceOf(Date);
  });

  it('bilinmeyen slug sessizce ok:false', async () => {
    const { svc, prisma } = setup(null);
    const r = await svc.saveProgress(
      { id: 'me', email: 'a@b', roles: [], isPremium: false },
      { slug: 'yok' },
    );
    expect(r).toEqual({ ok: false });
    expect(prisma.summaryProgress.upsert).not.toHaveBeenCalled();
  });
});

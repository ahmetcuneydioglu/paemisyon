import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { AdminFlashcardsService } from './admin-flashcards.service';

/**
 * Admin bilgi kartları (Doc 56 §8.1): yayın kapısı (rol, eskime, mevzuat kontrolü, doğrulama),
 * toplu yayında AI kartlarının atlanması, düzenlemede yeniden doğrulama ve sürüm/eskime kuralları.
 */
const now = new Date('2026-11-05T10:00:00Z');
const admin = { id: 'adm', email: 'a@x', roles: ['admin'], isPremium: true } as AuthenticatedUser;
const editor = { id: 'ed', email: 'e@x', roles: ['editor'], isPremium: false } as AuthenticatedUser;

const ARTICLES = [
  {
    id: 'a75',
    articleNo: '75',
    title: null,
    text: 'TBMM genel oyla seçilen altıyüz milletvekilinden oluşur.',
  },
  { id: 'a77', articleNo: '77', title: null, text: 'Seçimler beş yılda bir aynı günde yapılır.' },
];

const CARD = (over: Record<string, unknown> = {}) => ({
  id: 'k1',
  kind: 'numeric',
  front: 'TBMM kaç üyeden oluşur?',
  back: '600 milletvekili.',
  explanation: null,
  difficulty: 2,
  status: 'in_review',
  verificationStatus: 'pending_review',
  staleSince: null,
  sourceLabel: 'Editör',
  generatedBy: null,
  version: 1,
  sortOrder: 0,
  updatedAt: now,
  publishedAt: null,
  createdAt: now,
  derivedNumbers: null,
  counterNumbers: [],
  legislationId: 'leg1',
  verifiedAt: null,
  publishedBy: null,
  createdBy: null,
  topic: { id: 't1', name: 'T.C. Anayasası', course: { id: 'c1', name: 'Anayasa Hukuku' } },
  summaryUnit: null,
  legislation: { id: 'leg1', slug: 't-c-anayasasi', name: 'T.C. Anayasası', shortName: null },
  articles: [
    {
      relation: 'primary',
      articleVersionNo: 1,
      lawArticle: { id: 'a75', articleNo: '75', title: null, sortKey: 75 },
    },
  ],
  ...over,
});

function setup(card: ReturnType<typeof CARD> | null = CARD()) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prisma: any = {
    flashcard: {
      findFirst: jest.fn().mockResolvedValue(card),
      findMany: jest.fn().mockResolvedValue(card ? [card] : []),
      count: jest.fn().mockResolvedValue(card ? 1 : 0),
      groupBy: jest.fn().mockResolvedValue([{ status: 'in_review', _count: { _all: 1 } }]),
      update: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({ id: 'yeni' }),
      aggregate: jest.fn().mockResolvedValue({ _max: { sortOrder: 3 } }),
    },
    flashcardArticle: { deleteMany: jest.fn() },
    lawArticle: {
      findMany: jest.fn().mockResolvedValue(ARTICLES),
      findUnique: jest.fn().mockResolvedValue({ legislationId: 'leg1' }),
    },
    lawArticleVersion: {
      groupBy: jest.fn().mockResolvedValue([{ lawArticleId: 'a75', _max: { versionNo: 2 } }]),
    },
    auditLog: { findMany: jest.fn().mockResolvedValue([]) },
    legislation: { findFirst: jest.fn().mockResolvedValue({ id: 'leg1', name: 'T.C. Anayasası' }) },
    topic: { findFirst: jest.fn().mockResolvedValue({ id: 't1' }) },
    summaryUnit: { findFirst: jest.fn().mockResolvedValue(null) },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn(prisma),
  );
  const audit = { log: jest.fn(async () => undefined) };
  return { svc: new AdminFlashcardsService(prisma, audit as never), prisma, audit };
}

describe('AdminFlashcardsService — yayın kapısı', () => {
  it('editör yayınlayamaz', async () => {
    const { svc } = setup();
    await expect(svc.publish(editor, 'k1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('eskimiş ya da "yenilenmeli" kart yayınlanamaz; gerekçe detayda görünür', async () => {
    const { svc } = setup(CARD({ staleSince: now, verificationStatus: 'needs_refresh' }));
    const d = await svc.detail('k1');
    expect(d.gate.canPublish).toBe(false);
    expect(d.gate.reasons).toHaveLength(2);
    await expect(svc.publish(admin, 'k1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('doğrulamayı geçmeyen kart yayınlanamaz (cevaptaki sayı metinde yok)', async () => {
    const { svc } = setup(CARD({ back: '550 milletvekili.' }));
    const d = await svc.detail('k1');
    expect(d.validation.ok).toBe(false);
    expect(d.gate.reasons[0]).toMatch(/kusur/);
  });

  it('temiz kart: admin yayınlar, publishedBy ve audit yazılır', async () => {
    const { svc, prisma, audit } = setup();
    await svc.publish(admin, 'k1');
    expect(prisma.flashcard.update.mock.calls[0][0].data).toMatchObject({
      status: 'published',
      publishedBy: 'adm',
    });
    expect(audit.log).toHaveBeenCalledWith(admin, 'flashcard.publish', 'flashcard', 'k1');
  });

  it('toplu yayın: AI kaynaklı kart atlanır, editör kartı yayınlanır, yayındaki sayılmaz', async () => {
    const { svc, prisma } = setup();
    const cards: Record<string, ReturnType<typeof CARD>> = {
      ai: CARD({ id: 'ai', sourceLabel: 'AI bilgi kartı — T.C. Anayasası md 75–86' }),
      ed: CARD({ id: 'ed' }),
      pub: CARD({ id: 'pub', status: 'published' }),
    };
    prisma.flashcard.findFirst.mockImplementation(
      async ({ where }: { where: { id: string } }) => cards[where.id] ?? null,
    );
    const r = await svc.publishMany(admin, ['ai', 'ed', 'pub', 'yok']);
    expect(r.published).toEqual(['ed']);
    expect(r.skipped).toEqual([
      { id: 'ai', reason: expect.stringMatching(/AI kaynaklı/) },
      { id: 'yok', reason: 'bulunamadı' },
    ]);
  });
});

describe('AdminFlashcardsService — düzenleme ve içe aktarma', () => {
  it('düzenleme yeniden doğrular; geçmezse yazılmaz', async () => {
    const { svc, prisma } = setup();
    await expect(svc.update(editor, 'k1', { back: '550 üye' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.flashcard.update).not.toHaveBeenCalled();
  });

  it('düzenleme: referanslar güncel sürüme bağlanır, eskime kalkar, yenilenmeli → inceleme, sürüm artar', async () => {
    const { svc, prisma } = setup(CARD({ staleSince: now, verificationStatus: 'needs_refresh' }));
    const r = await svc.update(editor, 'k1', {
      back: '600 milletvekili; genel oyla.',
      articleRefs: ['75', '77'],
    });
    expect(r.validation.ok).toBe(true);
    expect(prisma.flashcardArticle.deleteMany).toHaveBeenCalledWith({
      where: { flashcardId: 'k1' },
    });
    const data = prisma.flashcard.update.mock.calls[0][0].data;
    expect(data).toMatchObject({
      staleSince: null,
      verificationStatus: 'pending_review',
      version: 2,
    });
    expect(data.articles.create).toEqual([
      { lawArticleId: 'a75', articleVersionNo: 2, relation: 'primary' },
      { lawArticleId: 'a77', articleVersionNo: null, relation: 'related' },
    ]);
  });

  it('yeni kart: kaynak etiketi ön eki zorunlu; geçerli kart in_review açılır', async () => {
    const { svc, prisma } = setup();
    const base = {
      topicId: '7b0f9e2a-4d6c-4c4b-9c5c-1f2a3b4c5d6e',
      legislationSlug: 't-c-anayasasi',
      kind: 'numeric' as const,
      front: 'TBMM kaç üyeden oluşur?',
      back: '600',
      articleRefs: ['75'],
    };
    await expect(svc.create(editor, { ...base, sourceLabel: 'Kitap X' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    const r = await svc.create(editor, base);
    expect(r.id).toBe('yeni');
    expect(prisma.flashcard.create.mock.calls[0][0].data).toMatchObject({
      status: 'in_review',
      sourceLabel: 'Editör',
      sortOrder: 4,
      createdBy: 'ed',
    });
  });

  it('mevzuat kontrolü: verified → verifiedAt dolar', async () => {
    const { svc, prisma } = setup();
    await svc.setVerification(editor, 'k1', { status: 'verified' });
    expect(prisma.flashcard.update.mock.calls[0][0].data.verifiedAt).toBeInstanceOf(Date);
  });

  it('içe aktarma dry-run yalnız doğrular, yazmaz', async () => {
    const { svc, prisma } = setup();
    const r = await svc.import(
      editor,
      {
        deck: {
          topicId: 't1',
          legislationSlug: 't-c-anayasasi',
          sourceLabel: 'AI bilgi kartı — x',
        },
        cards: [
          { kind: 'numeric', front: 'Kaç?', back: '600', articleRefs: ['75'] },
          { kind: 'numeric', front: 'Kaç yılda?', back: '4 yılda bir', articleRefs: ['77'] },
        ],
      },
      { replace: false, dryRun: true },
    );
    expect(r).toMatchObject({ dryRun: true, count: 2, ok: false, fails: 1 });
    expect(prisma.flashcard.create).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

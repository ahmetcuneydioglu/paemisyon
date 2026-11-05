import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FlashcardsService, flashcardsAcik } from './flashcards.service';

const now = new Date('2026-11-05T10:00:00Z');
const G = 86_400_000;
const me = { id: 'me', email: 'a@b', roles: ['user'], isPremium: false };
const premium = { ...me, isPremium: true };

const CARD = (id: string, p: Record<string, unknown> = {}) => ({
  id,
  kind: 'qa',
  front: `Soru ${id}`,
  back: `Cevap ${id}`,
  explanation: null,
  difficulty: 2,
  sortOrder: 0,
  sourceLabel: 'AI bilgi kartı — gizli etiket',
  topic: { id: 't1', name: 'Temel Haklar', isPremium: false },
  summaryUnit: null,
  articles: [
    {
      relation: 'primary',
      lawArticle: { articleNo: '13', title: 'Sınırlama', legislation: { slug: 'anayasa' } },
    },
  ],
  ...p,
});

function setup(
  o: {
    enabled?: boolean;
    cards?: unknown[];
    reviews?: unknown[];
    bookmarks?: unknown[];
    event?: unknown;
    latestEvent?: unknown;
    session?: unknown;
  } = {},
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prisma: any = {
    topic: {
      findFirst: jest.fn().mockResolvedValue({
        id: 't1',
        name: 'Temel Haklar',
        courseId: 'c1',
        children: [],
      }),
    },
    summaryUnit: { findFirst: jest.fn() },
    course: { findFirst: jest.fn() },
    flashcard: {
      findMany: jest.fn().mockResolvedValue(o.cards ?? []),
      findFirst: jest.fn(),
    },
    flashcardReview: {
      findMany: jest.fn().mockResolvedValue(o.reviews ?? []),
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest
        .fn()
        .mockImplementation(async ({ create }) => ({ flashcardId: 'c1', ...create })),
      update: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    flashcardReport: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'r1' }),
    },
    flashcardBookmark: {
      findMany: jest.fn().mockResolvedValue(o.bookmarks ?? []),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    flashcardReviewEvent: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(o.event ?? null),
      findFirst: jest.fn().mockResolvedValue(o.latestEvent ?? null),
      create: jest.fn(),
      update: jest.fn(),
    },
    flashcardSession: {
      findFirst: jest.fn().mockResolvedValue(o.session ?? null),
      updateMany: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 's1' }),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({ flashcardDailyGoal: 20, targetExamDate: null }),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn(prisma),
  );
  const settings = { flashcardsEnabled: jest.fn(async () => o.enabled ?? true) };
  const progress = { touchActivity: jest.fn(async () => undefined) };
  const appEvents = { emit: jest.fn(async () => undefined) };
  return {
    svc: new FlashcardsService(
      prisma as never,
      settings as never,
      progress as never,
      appEvents as never,
    ),
    prisma,
    progress,
    appEvents,
  };
}

describe('flashcardsAcik — bayrak kapalıyken yalnız admin ve beta', () => {
  it('kapalı: user görmez, admin/beta görür; açık: herkes', () => {
    expect(flashcardsAcik(false, ['user'])).toBe(false);
    expect(flashcardsAcik(false, ['admin'])).toBe(true);
    expect(flashcardsAcik(false, ['beta'])).toBe(true);
    expect(flashcardsAcik(true, ['user'])).toBe(true);
  });
});

describe('FlashcardsService.overview', () => {
  it('bayrak kapalıysa 404 FLASHCARDS_DISABLED', async () => {
    const { svc } = setup({ enabled: false, cards: [CARD('c1')] });
    await expect(svc.overview(me, { topicId: 't1' }, now)).rejects.toMatchObject({
      response: { code: 'FLASHCARDS_DISABLED' },
    });
  });

  it('kilitli (premium) kartlar sayıma girmez, locked sayısına yazılır; ücretsizde tamamı kilitliyse locked=true', async () => {
    const { svc } = setup({
      cards: [
        CARD('c1', { summaryUnit: { slug: 'u', title: 'Ü', isPremium: true } }),
        CARD('c2', { topic: { id: 't1', name: 'x', isPremium: true } }),
      ],
    });
    const r = await svc.overview(me, { topicId: 't1' }, now);
    expect(r.counts).toMatchObject({ total: 0, locked: 2 });
    expect(r.locked).toBe(true);
    const p = await svc.overview(premium, { topicId: 't1' }, now);
    expect(p.counts).toMatchObject({ total: 2, new: 2, locked: 0 });
    expect(p.suggestedMode).toBe('new');
  });

  it('kapsam yoksa tüm kartlar: etiket "Tüm kartlar", konu filtresi yok', async () => {
    const { svc, prisma } = setup({ cards: [CARD('c1'), CARD('c2', { topicId: 't2' })] });
    const r = await svc.overview(me, {}, now);
    expect(r.scope).toEqual({
      courseId: null,
      topicId: null,
      unitSlug: null,
      label: 'Tüm kartlar',
    });
    expect(r.counts.total).toBe(2);
    const where = prisma.flashcard.findMany.mock.calls[0][0].where;
    expect(where.topicId).toBeUndefined();
  });
});

describe('FlashcardsService.startSession', () => {
  it('kartlar içerikle döner; kaynak etiketi (sourceLabel) yanıtta YOK', async () => {
    const { svc, prisma } = setup({ cards: [CARD('c1'), CARD('c2')] });
    const r = await svc.startSession(me, { scope: { topicId: 't1' }, mode: 'new' }, now);
    expect(r.sessionId).toBe('s1');
    expect(r.cards.map((c) => c.id)).toEqual(['c1', 'c2']);
    expect(r.cards[0]!.articles[0]).toEqual({
      no: '13',
      title: 'Sınırlama',
      legislationSlug: 'anayasa',
    });
    expect(r.cards[0]!.state).toEqual({ state: 'new', due: false, hard: false, dueAt: null });
    expect(JSON.stringify(r)).not.toContain('gizli etiket');
    // Eski yarım oturum kapatılır: tek "kaldığın yer".
    expect(prisma.flashcardSession.updateMany).toHaveBeenCalled();
  });

  it('kapsamın tamamı kilitliyse 403 PREMIUM_REQUIRED', async () => {
    const { svc } = setup({
      cards: [CARD('c1', { topic: { id: 't1', name: 'x', isPremium: true } })],
    });
    await expect(
      svc.startSession(me, { scope: { topicId: 't1' }, mode: 'all' }, now),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('modda kart yoksa 404 NO_CARDS', async () => {
    const { svc } = setup({ cards: [CARD('c1')] });
    await expect(
      svc.startSession(me, { scope: { topicId: 't1' }, mode: 'due' }, now),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('FlashcardsService.recordEvent — idempotent, tek transaction', () => {
  const session = { id: 's1', userId: 'me', queue: ['c1', 'c2'], cursor: 0, completedAt: null };

  it('ilk puan: durum yazılır, olay prevState=null ile kaydedilir, cursor ilerler', async () => {
    const { svc, prisma } = setup({ session });
    const r = await svc.recordEvent(
      me,
      's1',
      { clientEventId: 'e1', flashcardId: 'c1', rating: 'known' },
      now,
    );
    expect(prisma.flashcardReview.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.flashcardReview.upsert.mock.calls[0][0].create).toMatchObject({
      reps: 1,
      intervalDays: 1,
      knownCount: 1,
      againCount: 0,
    });
    expect(prisma.flashcardReviewEvent.create.mock.calls[0][0].data).toMatchObject({
      clientEventId: 'e1',
      prevState: Prisma.DbNull,
    });
    expect(prisma.flashcardSession.update.mock.calls[0][0].data).toMatchObject({
      cursor: 1,
      queue: ['c1', 'c2'],
    });
    expect(r.state).toMatchObject({ state: 'learning', due: false });
    expect(r.idempotent).toBe(false);
  });

  it('"Tekrar": kart kuyruğun sonuna döner (oturum içi tekrar)', async () => {
    const { svc, prisma } = setup({ session });
    const r = await svc.recordEvent(
      me,
      's1',
      { clientEventId: 'e2', flashcardId: 'c1', rating: 'again' },
      now,
    );
    expect(prisma.flashcardSession.update.mock.calls[0][0].data.queue).toEqual(['c1', 'c2', 'c1']);
    expect(r.requeued).toBe(true);
  });

  it('aynı clientEventId ikinci kez: durum DEĞİŞMEZ, aynı yanıt', async () => {
    const { svc, prisma } = setup({
      session,
      event: { flashcardId: 'c1', undoneAt: null },
    });
    prisma.flashcardReview.findUnique.mockResolvedValue({
      flashcardId: 'c1',
      reps: 1,
      lapses: 0,
      intervalDays: 1,
      dueAt: new Date(now.getTime() + G),
      lastRating: 'known',
    });
    const r = await svc.recordEvent(
      me,
      's1',
      { clientEventId: 'e1', flashcardId: 'c1', rating: 'again' },
      now,
    );
    expect(r.idempotent).toBe(true);
    expect(prisma.flashcardReview.upsert).not.toHaveBeenCalled();
    expect(prisma.flashcardReviewEvent.create).not.toHaveBeenCalled();
    expect(r.state.state).toBe('learning');
  });

  it('bitmiş oturum 409; kuyrukta olmayan kart 400', async () => {
    const { svc } = setup({ session: { ...session, completedAt: now } });
    await expect(
      svc.recordEvent(me, 's1', { clientEventId: 'e3', flashcardId: 'c1', rating: 'known' }, now),
    ).rejects.toBeInstanceOf(ConflictException);
    const { svc: svc2 } = setup({ session });
    await expect(
      svc2.recordEvent(me, 's1', { clientEventId: 'e4', flashcardId: 'zz', rating: 'known' }, now),
    ).rejects.toThrow(/kuyruğunda değil/);
  });
});

describe('FlashcardsService.undoEvent', () => {
  const ev = {
    id: 7n,
    flashcardId: 'c1',
    sessionId: 's1',
    rating: 'again',
    undoneAt: null,
    reviewedAt: new Date(now.getTime() - 60_000),
    prevState: null,
  };
  it('son olay değilse 409 UNDO_NOT_LATEST', async () => {
    const { svc } = setup({ event: ev, latestEvent: { id: 9n } });
    await expect(svc.undoEvent(me, 's1', 'e1', now)).rejects.toMatchObject({
      response: { code: 'UNDO_NOT_LATEST' },
    });
  });
  it('pencere geçtiyse 409 UNDO_EXPIRED', async () => {
    const { svc } = setup({
      event: { ...ev, reviewedAt: new Date(now.getTime() - 11 * 60_000) },
      latestEvent: { id: 7n },
    });
    await expect(svc.undoEvent(me, 's1', 'e1', now)).rejects.toMatchObject({
      response: { code: 'UNDO_EXPIRED' },
    });
  });
  it('ilk karşılaşma geri alınınca durum satırı silinir, kopya kuyruktan düşer, cursor geri', async () => {
    const { svc, prisma } = setup({
      event: ev,
      latestEvent: { id: 7n },
      session: { id: 's1', userId: 'me', queue: ['c1', 'c2', 'c1'], cursor: 1, completedAt: null },
    });
    const r = await svc.undoEvent(me, 's1', 'e1', now);
    expect(prisma.flashcardReview.deleteMany).toHaveBeenCalled();
    expect(prisma.flashcardReviewEvent.update.mock.calls[0][0].data.undoneAt).toBe(now);
    expect(prisma.flashcardSession.update.mock.calls[0][0].data).toMatchObject({
      queue: ['c1', 'c2'],
      cursor: 0,
    });
    expect(r.state.state).toBe('new');
  });
  it('önceki durum varsa geri yüklenir', async () => {
    const prev = {
      ease: 2.6,
      intervalDays: 3,
      reps: 2,
      lapses: 0,
      dueAt: now.toISOString(),
      lastReviewedAt: now.toISOString(),
      lastRating: 'known',
      reviewCount: 2,
      knownCount: 2,
      againCount: 0,
    };
    const { svc, prisma } = setup({ event: { ...ev, prevState: prev }, latestEvent: { id: 7n } });
    await svc.undoEvent(me, 's1', 'e1', now);
    expect(prisma.flashcardReview.update.mock.calls[0][0].data).toMatchObject({
      reps: 2,
      intervalDays: 3,
      knownCount: 2,
    });
  });
});

describe('FlashcardsService.roomCounts / dueTotal (oda alanları)', () => {
  it('konu başına sayım; kilitli kart yalnız locked', async () => {
    const { svc } = setup({
      cards: [
        { ...CARD('c1'), topicId: 't1' },
        { ...CARD('c2'), topicId: 't1', summaryUnit: { isPremium: true } },
        { ...CARD('c3'), topicId: 't2' },
      ],
      reviews: [
        {
          flashcardId: 'c3',
          reps: 3,
          lapses: 0,
          intervalDays: 7,
          dueAt: new Date(now.getTime() - 1),
          lastRating: 'known',
        },
      ],
    });
    const r = await svc.roomCounts('me', false, { courseId: 'k' }, now);
    expect(r.total).toMatchObject({ total: 2, locked: 1, due: 1, learned: 1 });
    expect(r.byTopic.get('t1')).toMatchObject({ total: 1, locked: 1 });
    expect(r.byTopic.get('t2')).toMatchObject({ total: 1, due: 1 });
  });
  it('dueTotal ücretsizde kilitli kartı saymaz', async () => {
    const { svc, prisma } = setup();
    prisma.flashcardReview.findMany.mockResolvedValue([
      { flashcard: { topic: { isPremium: false }, summaryUnit: null } },
      { flashcard: { topic: { isPremium: true }, summaryUnit: null } },
    ]);
    expect(await svc.dueTotal('me', false, now)).toBe(1);
    expect(await svc.dueTotal('me', true, now)).toBe(2);
  });
});

describe('Aşama 5 — seri, olay, istatistik', () => {
  const session = { id: 's1', userId: 'me', queue: ['c1', 'c2'], cursor: 0, completedAt: null };

  it('ilk gerçek puan seriye dokunur; idempotent tekrar dokunmaz', async () => {
    const { svc, progress } = setup({ session });
    await svc.recordEvent(
      me,
      's1',
      { clientEventId: 'e1', flashcardId: 'c1', rating: 'known' },
      now,
    );
    expect(progress.touchActivity).toHaveBeenCalledTimes(1);
    expect(progress.touchActivity).toHaveBeenCalledWith('me', false, expect.any(Date));
    const tekrar = setup({ session, event: { flashcardId: 'c1', undoneAt: null } });
    await tekrar.svc.recordEvent(
      me,
      's1',
      { clientEventId: 'e1', flashcardId: 'c1', rating: 'known' },
      now,
    );
    expect(tekrar.progress.touchActivity).not.toHaveBeenCalled();
  });

  it('oturum ilk kez tamamlanınca flashcard_session_completed olayı yazılır; ikinci tamamlama yazmaz', async () => {
    const acik = setup({ session });
    await acik.svc.completeSession(me, 's1', now);
    expect(acik.appEvents.emit).toHaveBeenCalledWith(
      'flashcard_session_completed',
      'me',
      expect.objectContaining({ entityId: 's1' }),
    );
    const kapali = setup({ session: { ...session, completedAt: now } });
    await kapali.svc.completeSession(me, 's1', now);
    expect(kapali.appEvents.emit).not.toHaveBeenCalled();
  });

  it('stats: kapsamsız sayımlar, ders dağılımı, 30 günlük oran (10 olaydan az → null), 7 gün', async () => {
    const topic = {
      id: 't1',
      name: 'x',
      isPremium: false,
      courseId: 'k1',
      course: { name: 'Anayasa Hukuku' },
    };
    const { svc, prisma } = setup({
      cards: [
        CARD('c1', { topic }),
        CARD('c2', { topic }),
        CARD('c3', {
          topic: { ...topic, isPremium: true, courseId: 'k2', course: { name: 'PVSK' } },
        }),
      ],
      reviews: [
        {
          flashcardId: 'c1',
          reps: 3,
          lapses: 0,
          intervalDays: 10,
          dueAt: new Date(now.getTime() + 86_400_000),
          lastRating: 'known',
        },
      ],
    });
    prisma.flashcardReviewEvent.findMany.mockResolvedValue([
      { rating: 'known', reviewedAt: now },
      { rating: 'again', reviewedAt: now },
    ]);
    const r = await svc.stats(me, now);
    expect(r.counts).toMatchObject({ total: 2, learned: 1, locked: 1 });
    expect(r.last30).toEqual({ reviewed: 2, known: 1, knownPct: null });
    expect(r.last7).toHaveLength(7);
    expect(r.last7[6]).toMatchObject({ reviewed: 2, known: 1 });
    expect(r.courses.map((c) => c.courseName)).toEqual(['Anayasa Hukuku', 'PVSK']);
    expect(r.courses[1]).toMatchObject({ total: 0, locked: 1 });
  });

  it('hata bildirimi: yayındaki karta yazılır; aynı karta açık bildirim varsa tekrarlamaz; kart yoksa 404', async () => {
    const { svc, prisma } = setup();
    const user = { id: 'u1', roles: [] } as never;
    prisma.flashcard.findFirst.mockResolvedValue({ id: 'c1' });
    const r1 = await svc.report(user, 'c1', 'Doğru cevap hatalı — 550 olmalı');
    expect(r1).toEqual({ id: 'r1', alreadyReported: false });
    expect(prisma.flashcardReport.create).toHaveBeenCalledWith({
      data: { userId: 'u1', flashcardId: 'c1', message: 'Doğru cevap hatalı — 550 olmalı' },
      select: { id: true },
    });
    prisma.flashcardReport.findFirst.mockResolvedValueOnce({ id: 'r1' });
    const r2 = await svc.report(user, 'c1', 'yine');
    expect(r2).toEqual({ id: 'r1', alreadyReported: true });
    expect(prisma.flashcardReport.create).toHaveBeenCalledTimes(1);
    prisma.flashcard.findFirst.mockResolvedValue(null);
    await expect(svc.report(user, 'yok', 'kart yok')).rejects.toThrow('Kart bulunamadı');
  });

  it('ilerleme sıfırlama: kapsamdaki kartların review satırları silinir, açık oturum kapanır, favoriler dokunulmaz', async () => {
    const { svc, prisma } = setup({ cards: [CARD('c1'), CARD('c2')] });
    prisma.flashcardReview.deleteMany.mockResolvedValue({ count: 2 });
    const user = { id: 'u1', roles: [], isPremium: false } as never;
    const r = await svc.resetProgress(user, { topicId: 't1' });
    expect(r.reset).toBe(2);
    expect(r.scope.label).toBe('Temel Haklar');
    expect(prisma.flashcardReview.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u1', flashcardId: { in: ['c1', 'c2'] } },
    });
    expect(prisma.flashcardSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1', completedAt: null } }),
    );
    expect(prisma.flashcardBookmark.deleteMany).not.toHaveBeenCalled();
    expect(prisma.flashcardReviewEvent.findMany).not.toHaveBeenCalled();
  });
});

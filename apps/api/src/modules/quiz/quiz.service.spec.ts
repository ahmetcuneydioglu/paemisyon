import { BadRequestException } from '@nestjs/common';
import { QuizService } from './quiz.service';
import type { AuthenticatedUser } from '../auth/auth.types';

const premiumUser: AuthenticatedUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'aday@example.com',
  roles: ['user'],
  isPremium: true,
};

const VERSION_ID = '00000000-0000-0000-0000-000000000003';

function setup(selectedOptionExists = true, questionOrder: string[] | null = [VERSION_ID]) {
  const selectedId = '00000000-0000-0000-0000-000000000004';
  const correctId = '00000000-0000-0000-0000-000000000005';
  const prisma = {
    quizSession: {
      findFirst: jest.fn().mockResolvedValue({
        status: 'in_progress',
        mode: 'practice',
        startedAt: new Date(),
        plannedDurationSeconds: null,
        // Soru–oturum üyelik denetimi: sürüm bu sette olmalı (güvenlik).
        questionOrder,
        exam: null,
      }),
    },
    quizAnswer: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({}),
    },
    questionVersion: {
      findFirst: jest.fn().mockResolvedValue({
        explanation: 'Açıklama',
        sourceLabel: 'Kaynak',
        legalReferences: [{ citation: 'm. 1' }],
        question: {
          articleNo: '1',
          topic: { id: '00000000-0000-0000-0000-0000000000aa', name: 'Örnek Kanun' },
        },
        options: [
          { id: correctId, isCorrect: true },
          ...(selectedOptionExists ? [{ id: selectedId, isCorrect: false }] : []),
        ],
      }),
    },
    // İlgili madde metni (Doc 25 §4) — varsayılan: yayınlanmış metin yok.
    lawArticle: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
  };
  // Kaynak etiketi görünürlüğü artık tek noktadan (showQuestionSource) okunur;
  // varsayılanı KAPALI. Testte AÇIK tutulur ki alan gerçekten dolduruluyor mu
  // görülsün — kapalı hâli ayrı bir testle doğrulanır.
  const settings = {
    getBool: jest.fn().mockResolvedValue(true),
    showQuestionSource: jest.fn().mockResolvedValue(true),
  };
  const service = new QuizService(prisma as never, {} as never, {} as never, settings as never);
  return { service, prisma, settings, selectedId, correctId };
}

describe('QuizService.submitAnswer', () => {
  it('geri bildirim verisini kayıt öncesindeki tek paralel okuma grubunda hazırlar', async () => {
    const { service, prisma, selectedId, correctId } = setup();
    const questionId = '00000000-0000-0000-0000-000000000002';
    const versionId = '00000000-0000-0000-0000-000000000003';

    const result = await service.submitAnswer(premiumUser, '00000000-0000-0000-0000-000000000006', {
      questionId,
      questionVersionId: versionId,
      selectedOptionId: selectedId,
      timeSpentMs: 500,
    });

    expect(prisma.questionVersion.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: versionId, questionId } }),
    );
    expect(prisma.quizAnswer.upsert).toHaveBeenCalledTimes(1);
    expect(result).toEqual(
      expect.objectContaining({
        isCorrect: false,
        correctOptionId: correctId,
        explanation: 'Açıklama',
        source: 'Kaynak',
      }),
    );
  });

  // Kaynak etiketi HİÇBİR son kullanıcıya gösterilmez (kullanıcı kararı,
  // 4 Eylül 2026); yalnız panelde admin görür. İki kapı var ve ikisi de ayrı
  // ayrı tutmalı: panel anahtarı ve denemeye özel sabit gizleme.
  it('kaynak etiketi ayarı KAPALIYKEN alıştırmada da dönmez', async () => {
    const { service, settings } = setup();
    settings.showQuestionSource.mockResolvedValue(false);
    const result = (await service.submitAnswer(
      premiumUser,
      '00000000-0000-0000-0000-000000000006',
      {
        questionId: '00000000-0000-0000-0000-000000000002',
        questionVersionId: VERSION_ID,
        selectedOptionId: '00000000-0000-0000-0000-000000000004',
      },
    )) as { source: string | null; explanation: string | null };
    expect(result.source).toBeNull();
    // Açıklama gizlenmez — aday geri bildirimini görmeye devam eder.
    expect(result.explanation).toBe('Açıklama');
  });

  it('DENEMEDE ayar AÇIK olsa bile kaynak etiketi dönmez', async () => {
    const { service, prisma, settings } = setup();
    settings.showQuestionSource.mockResolvedValue(true);
    // Canlı cevap gösterimi AÇIK bir deneme: geri bildirim verilir ama etiket yok.
    prisma.quizSession.findFirst.mockResolvedValue({
      status: 'in_progress',
      mode: 'deneme',
      startedAt: new Date(),
      plannedDurationSeconds: null,
      questionOrder: [VERSION_ID],
      exam: { liveAnswerReveal: true },
    });
    const result = (await service.submitAnswer(
      premiumUser,
      '00000000-0000-0000-0000-000000000006',
      {
        questionId: '00000000-0000-0000-0000-000000000002',
        questionVersionId: VERSION_ID,
        selectedOptionId: '00000000-0000-0000-0000-000000000004',
      },
    )) as { source: string | null; explanation: string | null };
    expect(result.source).toBeNull();
    expect(result.explanation).toBe('Açıklama');
  });

  it('GÜVENLİK: oturuma ait olmayan sürüm reddedilir (cevap sızıntısı engeli)', async () => {
    // questionOrder BAŞKA bir sürümü içeriyor; POST edilen versionId yok.
    const { service } = setup(true, ['00000000-0000-0000-0000-0000000000ff']);
    await expect(
      service.submitAnswer(premiumUser, '00000000-0000-0000-0000-000000000006', {
        questionId: '00000000-0000-0000-0000-000000000002',
        questionVersionId: VERSION_ID,
        selectedOptionId: '00000000-0000-0000-0000-000000000004',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('GÜVENLİK: questionOrder null olan eski oturum denetimden muaf (kilitlenmez)', async () => {
    const { service, prisma } = setup(true, null);
    await service.submitAnswer(premiumUser, '00000000-0000-0000-0000-000000000006', {
      questionId: '00000000-0000-0000-0000-000000000002',
      questionVersionId: VERSION_ID,
      selectedOptionId: '00000000-0000-0000-0000-000000000004',
    });
    expect(prisma.quizAnswer.upsert).toHaveBeenCalledTimes(1);
  });

  it('yayınlanmış madde metnini relatedArticle.text ile döndürür (açıklama yanında)', async () => {
    const { service, prisma, selectedId } = setup();
    prisma.lawArticle.findFirst.mockResolvedValue({
      text: 'Madde 1 – resmî metin.',
      sourceName: 'mevzuat.gov.tr',
      sourceUrl: 'https://www.mevzuat.gov.tr/x',
      effectiveInfo: '5/7/2022 işlenmiş',
      lastVerifiedAt: new Date('2026-07-21T00:00:00Z'),
    });

    const result = (await service.submitAnswer(
      premiumUser,
      '00000000-0000-0000-0000-000000000006',
      {
        questionId: '00000000-0000-0000-0000-000000000002',
        questionVersionId: '00000000-0000-0000-0000-000000000003',
        selectedOptionId: selectedId,
      },
    )) as { relatedArticle: { text: { body: string; source: string } | null } };

    // Yalnız YAYINLANMIŞ metin sorgulanır.
    expect(prisma.lawArticle.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'published', articleNo: '1' }),
      }),
    );
    expect(result.relatedArticle.text?.body).toBe('Madde 1 – resmî metin.');
    expect(result.relatedArticle.text?.source).toBe('mevzuat.gov.tr');
  });

  it('metin yoksa relatedArticle.text null olur (künye yine döner)', async () => {
    const { service, selectedId } = setup(); // lawArticle.findFirst → null
    const result = (await service.submitAnswer(
      premiumUser,
      '00000000-0000-0000-0000-000000000006',
      {
        questionId: '00000000-0000-0000-0000-000000000002',
        questionVersionId: '00000000-0000-0000-0000-000000000003',
        selectedOptionId: selectedId,
      },
    )) as { relatedArticle: { no: string; text: unknown } };
    expect(result.relatedArticle.no).toBe('1');
    expect(result.relatedArticle.text).toBeNull();
  });

  it('başka bir soruya ait şıkkı kaydetmez', async () => {
    const { service, prisma, selectedId } = setup(false);

    await expect(
      service.submitAnswer(premiumUser, '00000000-0000-0000-0000-000000000006', {
        questionId: '00000000-0000-0000-0000-000000000002',
        questionVersionId: '00000000-0000-0000-0000-000000000003',
        selectedOptionId: selectedId,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.quizAnswer.upsert).not.toHaveBeenCalled();
  });
});

/**
 * Tazelik (kullanıcı talebi): "her seferinde farklı sorularla karşılaşması
 * gerekiyor". Havuz görülmüş/görülmemiş diye ayrılır; banka tükenirse en
 * ESKİ çözülen geri döner (en son çözülen en son).
 */
describe('QuizService.splitBySeen', () => {
  type Q = { id: string; currentVersionId: string | null; topicId: string };
  const q = (id: string): Q => ({ id, currentVersionId: `v-${id}`, topicId: 't1' });

  function service(seen: { questionId: string; at: string }[]) {
    const prisma = {
      quizAnswer: {
        groupBy: jest.fn().mockResolvedValue(
          seen.map((s) => ({ questionId: s.questionId, _max: { answeredAt: new Date(s.at) } })),
        ),
      },
    };
    return {
      svc: new QuizService(prisma as never, {} as never, {} as never, {} as never),
      prisma,
    };
  }

  it('hiç çözülmemiş havuzda hepsi taze sayılır', async () => {
    const { svc, prisma } = service([]);
    const r = await svc['splitBySeen']('u1', [q('a'), q('b')]);

    expect(r.unseen.map((x) => x.id)).toEqual(['a', 'b']);
    expect(r.seenOldestFirst).toHaveLength(0);
    // Boş sonuçta gereksiz sıralama/işlem yapılmaz.
    expect(prisma.quizAnswer.groupBy).toHaveBeenCalledTimes(1);
  });

  it('çözülenler ayrılır ve EN ESKİ çözülen başa gelir', async () => {
    const { svc } = service([
      { questionId: 'a', at: '2026-08-10T10:00:00Z' }, // daha eski
      { questionId: 'c', at: '2026-08-16T10:00:00Z' }, // dün
    ]);

    const r = await svc['splitBySeen']('u1', [q('a'), q('b'), q('c'), q('d')]);

    expect(r.unseen.map((x) => x.id)).toEqual(['b', 'd']);
    expect(r.seenOldestFirst.map((x) => x.id)).toEqual(['a', 'c']);
  });

  it('yalnız bu kullanıcının cevapları sayılır', async () => {
    const { svc, prisma } = service([]);
    await svc['splitBySeen']('u1', [q('a')]);

    expect(prisma.quizAnswer.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ session: { userId: 'u1' } }),
      }),
    );
  });
});

// ── Kişisel deneme freemium kapısı (Doc 46) ──
// Kişisel deneme mode='exam' olduğu için günlük kota muafiyetini devralıyor ve
// premium kapısı taşımıyordu: ücretsiz kullanıcı günde sınırsız kez 100'lük
// taze set çözebiliyordu. Kapı artık oturum BAŞLARKEN kurulur.

const freeUser: AuthenticatedUser = {
  id: '00000000-0000-0000-0000-0000000000f1',
  email: 'ucretsiz@example.com',
  roles: ['user'],
  isPremium: false,
};

const MODULE_ID = '00000000-0000-0000-0000-0000000000m1'.replace(/m/g, 'b');
const SECTION_ID = '00000000-0000-0000-0000-0000000000c1';
const COURSE_ID = '00000000-0000-0000-0000-0000000000d1';

function havuz(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `q-${i}`,
    topicId: `t-${i % 5}`,
    currentVersionId: `v-${i}`,
  }));
}

function setupPersonal(opts: {
  yarim?: {
    id: string;
    startedAt: Date;
    totalQuestions: number;
    plannedDurationSeconds: number | null;
    questionOrder: string[];
    answers: { questionId: string; selectedOptionId: string | null; isCorrect: boolean }[];
  } | null;
  bugunkuSayi?: number;
  planLimit?: number | null;
} = {}) {
  const rows = havuz(150);
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue({ preferredModuleId: MODULE_ID }) },
    plan: {
      findUnique: jest.fn().mockResolvedValue({
        personalExamDailyLimit: opts.planLimit === undefined ? 1 : opts.planLimit,
      }),
    },
    examSection: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: SECTION_ID,
          weightPercent: 100,
          sortOrder: 1,
          courses: [{ courseId: COURSE_ID }],
        },
      ]),
    },
    quizAnswer: { findMany: jest.fn().mockResolvedValue([]) },
    question: { findMany: jest.fn().mockResolvedValue(rows) },
    questionVersion: {
      findMany: jest.fn().mockImplementation(({ where }: { where: { id: { in: string[] } } }) =>
        Promise.resolve(
          where.id.in.map((id) => ({
            id,
            questionId: `q-${id.slice(2)}`,
            stem: 'Soru kökü',
            mediaUrl: null,
            options: [{ id: `o-${id}`, label: 'A', text: 'Şık' }],
          })),
        ),
      ),
    },
    quizSession: {
      findFirst: jest.fn().mockResolvedValue(opts.yarim ?? null),
      count: jest.fn().mockResolvedValue(opts.bugunkuSayi ?? 0),
      create: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: 'yeni-oturum', mode: data.mode, ...data }),
      ),
    },
  };
  const service = new QuizService(
    prisma as never,
    {} as never,
    {} as never,
    { getBool: jest.fn(), showQuestionSource: jest.fn() } as never,
  );
  return { service, prisma };
}

const KISISEL = { mode: 'exam', personalExam: true } as const;

describe('QuizService.startPersonalExam — freemium kapısı', () => {
  it('ücretsiz kullanıcı günlük hakkını kullandıysa REDDEDİLİR', async () => {
    const { service, prisma } = setupPersonal({ bugunkuSayi: 1 });

    await expect(
      service.startSession(freeUser, { ...KISISEL, questionCount: 25 } as never),
    ).rejects.toMatchObject({
      response: { code: 'PERSONAL_EXAM_LIMIT' },
    });
    expect(prisma.quizSession.create).not.toHaveBeenCalled();
  });

  it('premium kullanıcı aynı gün kaç kez açarsa açsın reddedilmez', async () => {
    const { service, prisma } = setupPersonal({ bugunkuSayi: 7 });

    const r = await service.startSession(premiumUser, {
      ...KISISEL,
      questionCount: 100,
    } as never);

    expect(r.questions).toHaveLength(100);
    expect(prisma.quizSession.create).toHaveBeenCalled();
    // Premium'da plan limiti hiç okunmaz — gereksiz sorgu yok.
    expect(prisma.plan.findUnique).not.toHaveBeenCalled();
  });

  it('ücretsiz kullanıcı 100 soru isterse 25 soruyla açılır (eski istemci bozulmaz)', async () => {
    const { service, prisma } = setupPersonal({ bugunkuSayi: 0 });

    const r = await service.startSession(freeUser, {
      ...KISISEL,
      questionCount: 100,
    } as never);

    expect(r.questions).toHaveLength(25);
    expect(prisma.quizSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ personalExam: true, totalQuestions: 25 }),
      }),
    );
  });

  it('açılan her kişisel deneme personalExam=true damgasıyla kaydedilir', async () => {
    const { service, prisma } = setupPersonal({});
    await service.startSession(premiumUser, { ...KISISEL, questionCount: 50 } as never);
    expect(prisma.quizSession.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ personalExam: true }) }),
    );
  });

  it('yarım kalan deneme YENİ hak saymaz — kaldığı yerden devam eder', async () => {
    const { service, prisma } = setupPersonal({
      bugunkuSayi: 1, // hak tükenmiş görünüyor…
      yarim: {
        id: 'yarim-oturum',
        startedAt: new Date(Date.now() - 60_000), // 1 dk önce
        totalQuestions: 25,
        plannedDurationSeconds: 25 * 75,
        questionOrder: Array.from({ length: 25 }, (_, i) => `v-${i}`),
        answers: [{ questionId: 'q-0', selectedOptionId: 'o-1', isCorrect: true }],
      },
    });

    // …ama devam eden oturum var: reddedilmez, aynı oturum döner.
    // (startSession birleşik dönüş tipi taşıyor; devam dalını daraltıyoruz.)
    const r = (await service.startSession(freeUser, {
      ...KISISEL,
      questionCount: 25,
    } as never)) as {
      sessionId: string;
      resumed: boolean;
      remainingSeconds: number;
      givenAnswers: unknown[];
    };

    expect(r.sessionId).toBe('yarim-oturum');
    expect(r.resumed).toBe(true);
    expect(r.givenAnswers).toHaveLength(1);
    expect(r.remainingSeconds).toBeLessThan(25 * 75);
    expect(prisma.quizSession.create).not.toHaveBeenCalled();
  });

  it('süresi dolmuş yarım oturum kapatılır ve hakkı GERİ VERMEZ (reroll kapalı)', async () => {
    const { service, prisma } = setupPersonal({
      bugunkuSayi: 1,
      yarim: {
        id: 'suresi-dolmus',
        startedAt: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 saat önce
        totalQuestions: 25,
        plannedDurationSeconds: 25 * 75,
        questionOrder: Array.from({ length: 25 }, (_, i) => `v-${i}`),
        answers: [],
      },
    });
    const kapat = jest
      .spyOn(service as unknown as { completeSession: () => Promise<unknown> }, 'completeSession')
      .mockResolvedValue({});

    await expect(
      service.startSession(freeUser, { ...KISISEL, questionCount: 25 } as never),
    ).rejects.toMatchObject({ response: { code: 'PERSONAL_EXAM_LIMIT' } });

    expect(kapat).toHaveBeenCalledWith(freeUser.id, 'suresi-dolmus');
    expect(prisma.quizSession.create).not.toHaveBeenCalled();
  });

  it('plan satırındaki limit okunur (panelden deploysuz ayarlanabilir)', async () => {
    const { service, prisma } = setupPersonal({ bugunkuSayi: 2, planLimit: 3 });

    const r = await service.startSession(freeUser, {
      ...KISISEL,
      questionCount: 25,
    } as never);

    expect(r.questions).toHaveLength(25);
    expect(prisma.plan.findUnique).toHaveBeenCalledWith({ where: { key: 'free' } });
  });
});

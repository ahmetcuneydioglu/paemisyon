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
  const settings = { getBool: jest.fn().mockResolvedValue(true) };
  const service = new QuizService(prisma as never, {} as never, {} as never, settings as never);
  return { service, prisma, selectedId, correctId };
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

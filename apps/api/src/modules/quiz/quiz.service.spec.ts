import { BadRequestException } from '@nestjs/common';
import { QuizService } from './quiz.service';
import type { AuthenticatedUser } from '../auth/auth.types';

const premiumUser: AuthenticatedUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'aday@example.com',
  roles: ['user'],
  isPremium: true,
};

function setup(selectedOptionExists = true) {
  const selectedId = '00000000-0000-0000-0000-000000000004';
  const correctId = '00000000-0000-0000-0000-000000000005';
  const prisma = {
    quizSession: {
      findFirst: jest.fn().mockResolvedValue({
        status: 'in_progress',
        mode: 'practice',
        startedAt: new Date(),
        plannedDurationSeconds: null,
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
        question: { articleNo: '1', topic: { name: 'Örnek Kanun' } },
        options: [
          { id: correctId, isCorrect: true },
          ...(selectedOptionExists ? [{ id: selectedId, isCorrect: false }] : []),
        ],
      }),
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

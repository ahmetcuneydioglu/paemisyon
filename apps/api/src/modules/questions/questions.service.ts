import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Difficulty } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { SuggestQuestionDto } from './dto/suggest-question.dto';

/**
 * Kullanıcı soru önerisi (Doc 18 §7 / eski soru-oner). Öneri DOĞRUDAN YAYINA
 * ÇIKMAZ — soru + v1 `in_review` olarak oluşur ve admin onay kuyruğuna düşer.
 * Suistimale karşı: günlük öneri limiti.
 */
@Injectable()
export class QuestionsService {
  private static readonly DAILY_SUGGEST_LIMIT = 20;

  constructor(private readonly prisma: PrismaService) {}

  /** Web için hedef seçtirmek: modül→ders→konu ağacı (premium bilgisi dahil). */
  async publicCatalog() {
    const modules = await this.prisma.module.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        courses: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            topics: {
              where: { deletedAt: null },
              orderBy: { sortOrder: 'asc' },
              select: { id: true, name: true },
            },
          },
        },
      },
    });
    return modules;
  }

  async suggest(user: AuthenticatedUser, dto: SuggestQuestionDto) {
    // Doğrulama: 2-5 şık, tam bir doğru.
    const correct = dto.options.filter((o) => o.isCorrect).length;
    if (correct !== 1) {
      throw new BadRequestException('Tam bir doğru şık işaretlenmeli.');
    }

    const topic = await this.prisma.topic.findFirst({
      where: { id: dto.topicId, deletedAt: null },
    });
    if (!topic) throw new NotFoundException('Konu bulunamadı.');

    // Günlük limit (suistimal önleme).
    const since = new Date(Date.now() - 24 * 3600 * 1000);
    const todayCount = await this.prisma.questionVersion.count({
      where: { authoredBy: user.id, createdAt: { gte: since } },
    });
    if (todayCount >= QuestionsService.DAILY_SUGGEST_LIMIT) {
      throw new ForbiddenException({
        code: 'SUGGEST_LIMIT_REACHED',
        message: 'Günlük soru önerme sınırına ulaştın. Yarın tekrar deneyebilirsin.',
      });
    }

    await this.prisma.$transaction(async (tx) => {
      const q = await tx.question.create({ data: { topicId: dto.topicId } });
      await tx.questionVersion.create({
        data: {
          questionId: q.id,
          versionNo: 1,
          stem: dto.stem.trim(),
          explanation: dto.explanation?.trim() || null,
          difficulty: (dto.difficulty ?? 'medium') as Difficulty,
          status: 'in_review', // onay kuyruğuna düşer — doğrudan yayın YOK
          authoredBy: user.id,
          options: {
            create: dto.options.map((o, i) => ({
              label: o.label,
              text: o.text.trim(),
              isCorrect: o.isCorrect,
              sortOrder: i,
            })),
          },
        },
      });
    });

    return { queued: true };
  }
}

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

  /** Web için hedef seçtirmek: sınav→ders→konu ağacı (Doc 21: MÜFREDAT üzerinden;
   *  dersler küresel olduğundan bölümler aracılığıyla bağlanır). Yanıt şekli
   *  korunur ({id,name,courses:[{id,name,topics:[{id,name}]}]}). */
  async publicCatalog() {
    const examTypes = await this.prisma.examType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        sections: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          select: {
            courses: {
              orderBy: { sortOrder: 'asc' },
              select: {
                course: {
                  select: {
                    id: true,
                    name: true,
                    deletedAt: true,
                    topics: {
                      where: { deletedAt: null },
                      orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
                      select: { id: true, name: true, parentId: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return examTypes.map((e) => {
      const seen = new Set<string>();
      const courses: { id: string; name: string; topics: { id: string; name: string }[] }[] = [];
      for (const s of e.sections) {
        for (const sc of s.courses) {
          const c = sc.course;
          if (c.deletedAt || seen.has(c.id)) continue;
          seen.add(c.id);
          // Alt konular "Konu › Alt Konu" olarak düzleştirilir (soru öner formu düz liste).
          const byId = new Map(c.topics.map((t) => [t.id, t.name]));
          courses.push({
            id: c.id,
            name: c.name,
            topics: c.topics.map((t) => ({
              id: t.id,
              name: t.parentId ? `${byId.get(t.parentId) ?? ''} › ${t.name}` : t.name,
            })),
          });
        }
      }
      return { id: e.id, name: e.name, courses };
    });
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

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

/// Yanlışlarım & favoriler (Doc 7 §4.6).
@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getWrongAnswers(userId: string) {
    const rows = await this.prisma.wrongAnswer.findMany({
      where: { userId, resolvedAt: null },
      orderBy: { lastWrongAt: 'desc' },
      take: 50,
    });
    const stems = await this.stems(rows.map((r) => r.questionId));
    return rows.map((r) => ({
      questionId: r.questionId,
      wrongCount: r.wrongCount,
      stem: stems.get(r.questionId)?.stem ?? null,
      topicName: stems.get(r.questionId)?.topicName ?? null,
    }));
  }

  async getBookmarks(userId: string) {
    const rows = await this.prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const stems = await this.stems(rows.map((r) => r.questionId));
    return rows.map((r) => ({
      questionId: r.questionId,
      stem: stems.get(r.questionId)?.stem ?? null,
      topicName: stems.get(r.questionId)?.topicName ?? null,
    }));
  }

  async addBookmark(userId: string, questionId: string) {
    await this.prisma.bookmark.upsert({
      where: { userId_questionId: { userId, questionId } },
      update: {},
      create: { userId, questionId },
    });
    return { bookmarked: true };
  }

  async removeBookmark(userId: string, questionId: string) {
    await this.prisma.bookmark.deleteMany({ where: { userId, questionId } });
    return { bookmarked: false };
  }

  /** Soru id'lerinden kök metin + konu adı (tek sorgu). */
  private async stems(ids: string[]) {
    if (ids.length === 0) return new Map<string, { stem: string | null; topicName: string | null }>();
    const questions = await this.prisma.question.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        currentVersion: { select: { stem: true } },
        topic: { select: { name: true } },
      },
    });
    return new Map(
      questions.map((q) => [
        q.id,
        { stem: q.currentVersion?.stem ?? null, topicName: q.topic?.name ?? null },
      ]),
    );
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { iptalSoruIdleri } from '../../common/iptal-soru';
import { tekrarKaydiFiltresi, yanlisTuruSoruFiltresi } from '../quiz/yanlis-havuzu';
import { gunBaslangici } from '../../common/gun';

/// Yanlışlarım & favoriler (Doc 7 §4.6).
@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getWrongAnswers(userId: string) {
    // İptal edilmiş soru defterde durmaz: kurumun geçersiz saydığı soruyu
    // "tekrar et" diye önümüze koymak yanlışı kullanıcıya mal etmek olur.
    const rows = await this.prisma.wrongAnswer.findMany({
      where: {
        userId,
        resolvedAt: null,
        questionId: { notIn: await iptalSoruIdleri(this.prisma) },
      },
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

  /**
   * Süresi gelen tekrar özeti (Doc 49 S1-A). Sayım ve örnek, tur havuzuyla aynı süzgeçten
   * (tek tanım); `nextDueAt` bugün boşsa bir sonraki vadeyi söyler. İstemci "N soru hazır /
   * sıradaki yarın" diyebilir; sıfır uydurulmaz.
   */
  async getDue(user: { id: string; isPremium: boolean }) {
    const now = Date.now();
    const profile = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { preferredModuleId: true },
    });
    const soruSuzgeci = yanlisTuruSoruFiltresi({
      isPremium: user.isPremium,
      preferredModuleId: profile?.preferredModuleId ?? null,
    });
    const due = await this.prisma.questionReview.findMany({
      where: tekrarKaydiFiltresi(user.id, user.isPremium, now),
      orderBy: { dueAt: 'asc' },
      select: { questionId: true, dueAt: true },
      take: 500,
    });
    const uygun = due.length
      ? await this.prisma.question.findMany({
          where: { id: { in: due.map((d) => d.questionId) }, ...soruSuzgeci },
          select: { id: true },
        })
      : [];
    const uygunSet = new Set(uygun.map((q) => q.id));
    const liste = due.filter((d) => uygunSet.has(d.questionId));
    const bugunBasi = gunBaslangici(new Date(now)).getTime();
    const dueToday = liste.filter((d) => d.dueAt.getTime() >= bugunBasi).length;
    const sample = liste.slice(0, 5);
    const stems = await this.stems(sample.map((s) => s.questionId));
    const next = liste.length
      ? null
      : await this.prisma.questionReview.findFirst({
          where: { userId: user.id, dueAt: { gt: new Date(now) } },
          orderBy: { dueAt: 'asc' },
          select: { dueAt: true },
        });
    return {
      count: liste.length,
      dueToday,
      nextDueAt: liste.length ? liste[0]!.dueAt.toISOString() : (next?.dueAt.toISOString() ?? null),
      sample: sample.map((s) => ({
        questionId: s.questionId,
        stem: stems.get(s.questionId)?.stem ?? null,
        topicName: stems.get(s.questionId)?.topicName ?? null,
        dueAt: s.dueAt.toISOString(),
      })),
    };
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
    if (ids.length === 0)
      return new Map<string, { stem: string | null; topicName: string | null }>();
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

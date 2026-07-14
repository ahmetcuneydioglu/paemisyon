import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

/// İçerik keşif okuması (Doc 7 §4.3): Modül → Ders → Konu.
@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  /// Modül listesi + kart bağlamı (Doc 20 hedef seçim ekranı):
  /// yayında soru sayısı, kullanıcının o alandaki çözüm/doğruluğu, hedef işareti.
  async getModules(userId: string) {
    const [modules, user, counts, progress] = await Promise.all([
      this.prisma.module.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, key: true, name: true, description: true, icon: true, sortOrder: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { preferredModuleId: true },
      }),
      // Yayındaki soru sayısı, modül bazında (Doc 6: yalnız current_version'lı).
      this.prisma.$queryRaw<{ module_id: string; cnt: number }[]>`
        SELECT c.module_id, COUNT(q.id)::int AS cnt
        FROM questions q
        JOIN topics t ON t.id = q.topic_id AND t.deleted_at IS NULL
        JOIN courses c ON c.id = t.course_id AND c.deleted_at IS NULL
        WHERE q.deleted_at IS NULL AND q.current_version_id IS NOT NULL
        GROUP BY c.module_id`,
      // Kullanıcının modüldeki toplam çözüm/doğrusu (konu ilerlemesinden).
      this.prisma.$queryRaw<{ module_id: string; solved: number; correct: number }[]>`
        SELECT c.module_id, SUM(utp.solved_count)::int AS solved, SUM(utp.correct_count)::int AS correct
        FROM user_topic_progress utp
        JOIN topics t ON t.id = utp.topic_id
        JOIN courses c ON c.id = t.course_id
        WHERE utp.user_id = ${userId}::uuid
        GROUP BY c.module_id`,
    ]);

    const countOf = new Map(counts.map((r) => [r.module_id, r.cnt]));
    const progressOf = new Map(progress.map((r) => [r.module_id, r]));
    return modules.map((m) => {
      const p = progressOf.get(m.id);
      return {
        ...m,
        questionCount: countOf.get(m.id) ?? 0,
        solvedCount: p?.solved ?? 0,
        accuracy:
          p && p.solved > 0 ? Math.round((p.correct / p.solved) * 100) : null,
        isPreferred: user?.preferredModuleId === m.id,
      };
    });
  }

  getCourses(moduleId: string) {
    return this.prisma.course.findMany({
      where: { moduleId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, sortOrder: true },
    });
  }

  getTopics(courseId: string) {
    return this.prisma.topic.findMany({
      where: { courseId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, sortOrder: true, isPremium: true },
    });
  }

  async getTopic(id: string) {
    const topic = await this.prisma.topic.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, name: true, isPremium: true, courseId: true },
    });
    if (!topic) throw new NotFoundException('Konu bulunamadı.');

    // Yalnızca yayındaki sürümü olan sorular sayılır (Doc 6).
    const questionCount = await this.prisma.question.count({
      where: { topicId: id, deletedAt: null, currentVersionId: { not: null } },
    });
    return { ...topic, questionCount };
  }
}

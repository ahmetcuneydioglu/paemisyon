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
      this.prisma.examType.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, key: true, name: true, description: true, icon: true, sortOrder: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { preferredModuleId: true },
      }),
      // Yayındaki soru sayısı, sınav türü bazında — MÜFREDAT üzerinden (Doc 21):
      // sections → section_courses → courses. Ortak ders iki sınavda da sayılır.
      this.prisma.$queryRaw<{ module_id: string; cnt: number }[]>`
        SELECT es.exam_type_id AS module_id, COUNT(DISTINCT q.id)::int AS cnt
        FROM questions q
        JOIN topics t ON t.id = q.topic_id AND t.deleted_at IS NULL
        JOIN courses c ON c.id = t.course_id AND c.deleted_at IS NULL
        JOIN exam_section_courses esc ON esc.course_id = c.id
        JOIN exam_sections es ON es.id = esc.section_id AND es.deleted_at IS NULL
        WHERE q.deleted_at IS NULL AND q.current_version_id IS NOT NULL
        GROUP BY es.exam_type_id`,
      // Kullanıcının sınav türündeki toplam çözüm/doğrusu (müfredat üzerinden).
      this.prisma.$queryRaw<{ module_id: string; solved: number; correct: number }[]>`
        SELECT es.exam_type_id AS module_id,
               SUM(utp.solved_count)::int AS solved, SUM(utp.correct_count)::int AS correct
        FROM user_topic_progress utp
        JOIN topics t ON t.id = utp.topic_id
        JOIN courses c ON c.id = t.course_id
        JOIN exam_section_courses esc ON esc.course_id = c.id
        JOIN exam_sections es ON es.id = esc.section_id AND es.deleted_at IS NULL
        WHERE utp.user_id = ${userId}::uuid
        GROUP BY es.exam_type_id`,
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

  /// Sınav türünün dersleri — MÜFREDAT bölümleri üzerinden (Doc 21).
  /// Yanıt şekli korunur ({id,name,sortOrder}: içerik dersi) + bölüm bağlamı
  /// eklenir (sectionName/weightPercent — istemciler ilerledikçe kullanır).
  async getCourses(moduleId: string) {
    const sections = await this.prisma.examSection.findMany({
      where: { examTypeId: moduleId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        courses: {
          orderBy: { sortOrder: 'asc' },
          include: { course: { select: { id: true, name: true, deletedAt: true } } },
        },
      },
    });
    // Düzleştir + tekilleştir (bir ders birden çok bölümde olabilir).
    const seen = new Set<string>();
    const out: {
      id: string;
      name: string;
      sortOrder: number;
      sectionName: string;
      weightPercent: number;
    }[] = [];
    let order = 0;
    for (const s of sections) {
      for (const sc of s.courses) {
        if (sc.course.deletedAt || seen.has(sc.course.id)) continue;
        seen.add(sc.course.id);
        out.push({
          id: sc.course.id,
          name: sc.course.name,
          sortOrder: ++order,
          sectionName: s.name,
          weightPercent: s.weightPercent,
        });
      }
    }
    return out;
  }

  /// Ders konuları — AĞAÇ (Doc 21) + KİŞİSEL KATMAN (Doc 25 wireframe 05):
  /// konu başına kullanıcının hakimiyeti + ders özeti (öğrenme merkezi).
  async getTopics(courseId: string, userId: string) {
    const [topics, progress, wrongCount] = await Promise.all([
      this.prisma.topic.findMany({
        where: { courseId, deletedAt: null, parentId: null },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          sortOrder: true,
          isPremium: true,
          children: {
            where: { deletedAt: null },
            orderBy: { sortOrder: 'asc' },
            select: { id: true, name: true, sortOrder: true, isPremium: true },
          },
        },
      }),
      this.prisma.userTopicProgress.findMany({
        where: { userId, topic: { courseId, deletedAt: null } },
        select: { topicId: true, solvedCount: true, correctCount: true, mastery: true },
      }),
      // WrongAnswer'da question ilişkisi yok (composite id) — join raw ile.
      this.prisma.$queryRaw<{ cnt: number }[]>`
        SELECT COUNT(*)::int AS cnt
        FROM wrong_answers wa
        JOIN questions q ON q.id = wa.question_id AND q.deleted_at IS NULL
        JOIN topics t ON t.id = q.topic_id AND t.deleted_at IS NULL
        WHERE wa.user_id = ${userId}::uuid
          AND wa.resolved_at IS NULL
          AND t.course_id = ${courseId}::uuid`,
    ]);
    const wrongCountValue = wrongCount[0]?.cnt ?? 0;

    const progressOf = new Map(progress.map((p) => [p.topicId, p]));
    const withProgress = <T extends { id: string }>(t: T) => {
      const p = progressOf.get(t.id);
      return {
        ...t,
        solvedCount: p?.solvedCount ?? 0,
        /** 0-100; hiç çözüm yoksa null (UI "yeni" gösterir, %0 değil). */
        mastery:
          p && p.solvedCount > 0 ? Math.round(Number(p.mastery) * 100) : null,
      };
    };

    const totalSolved = progress.reduce((s, p) => s + p.solvedCount, 0);
    const totalCorrect = progress.reduce((s, p) => s + p.correctCount, 0);
    return {
      topics: topics.map((t) => ({
        ...withProgress(t),
        children: t.children.map(withProgress),
      })),
      summary: {
        solvedCount: totalSolved,
        /** Ders hakimiyeti: doğru/çözülen (0-100); çözüm yoksa null. */
        mastery: totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : null,
        unresolvedWrongCount: wrongCountValue,
      },
    };
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

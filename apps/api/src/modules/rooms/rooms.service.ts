import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { haftaBasi } from '../../common/gun';
import { LAW_NAME_RE, slugify } from '../public/public.service';
import {
  band,
  dersKocCumlesi,
  enZayif,
  konuKocCumlesi,
  maddeAraligi,
  yuzde,
  type Band,
} from './rooms.logic';

type Satir = {
  id: string;
  name: string;
  solved: number;
  correct: number;
  accuracy: number | null;
  accuracyPct: number | null;
  band: Band;
  inPlanThisWeek: boolean;
  isPremium: boolean;
  /** Kilit kararı sunucuda: premium içerik && kullanıcı premium değil. */
  locked: boolean;
  isLaw: boolean;
  lawSlug: string | null;
};
/** İstemciye giden konu satırı: ham doğruluk/doğru sayısı dışarı çıkmaz (yüzde ve band yeter). */
const kamu = (r: Satir) => ({
  id: r.id,
  name: r.name,
  solved: r.solved,
  accuracyPct: r.accuracyPct,
  band: r.band,
  inPlanThisWeek: r.inPlanThisWeek,
  isPremium: r.isPremium,
  locked: r.locked,
  isLaw: r.isLaw,
  lawSlug: r.lawSlug,
});

/**
 * Ders odası ve konu odası (Doc 49/14): Kütüphane'de dersin ve konunun tek sayfası.
 * Veri ve cümleler sunucuda; istemci yalnız çizer. Mevcut tablolardan okunur, yeni tablo yok.
 */
@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async courseRoom(userId: string, courseId: string, isPremiumUser = false) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
      select: { id: true, name: true, icon: true },
    });
    if (!course) throw new NotFoundException('Ders bulunamadı');
    const buHafta = haftaBasi();
    const [topics, progress, wrongCount, favCount, legislation, profile, planItems] =
      await Promise.all([
        this.prisma.topic.findMany({
          where: { courseId, deletedAt: null, parentId: null },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            isPremium: true,
            children: {
              where: { deletedAt: null },
              orderBy: { sortOrder: 'asc' },
              select: { id: true, name: true, isPremium: true },
            },
          },
        }),
        this.prisma.userTopicProgress.findMany({
          where: { userId, topic: { courseId, deletedAt: null } },
          select: { topicId: true, solvedCount: true, correctCount: true },
        }),
        this.yanlisSayisi(userId, { courseId }),
        this.favoriSayisi(userId, { courseId }),
        this.prisma.legislation.findMany({
          where: { topic: { courseId, deletedAt: null }, status: 'published' },
          select: {
            slug: true,
            shortName: true,
            name: true,
            _count: { select: { articles: { where: { status: 'published' } } } },
          },
          orderBy: { sortOrder: 'asc' },
        }),
        this.prisma.user.findUnique({ where: { id: userId }, select: { preferredModuleId: true } }),
        this.prisma.studyPlanItem.findMany({
          where: {
            plan: { userId, status: 'active' },
            weekStart: buHafta,
            kind: 'topic',
            topic: { courseId },
          },
          select: { topicId: true },
        }),
      ]);
    const examWeight = profile?.preferredModuleId
      ? await this.prisma.examSection.findFirst({
          where: {
            examTypeId: profile.preferredModuleId,
            deletedAt: null,
            courses: { some: { courseId } },
          },
          orderBy: { weightPercent: 'desc' },
          select: { weightPercent: true },
        })
      : null;

    const prog = new Map(progress.map((p) => [p.topicId, p]));
    const planli = new Set(planItems.map((i) => i.topicId));
    const satir = (t: { id: string; name: string; isPremium: boolean }) => {
      const p = prog.get(t.id);
      const solved = p?.solvedCount ?? 0;
      const correct = p?.correctCount ?? 0;
      const accuracy = solved > 0 ? correct / solved : null;
      const isLaw = LAW_NAME_RE.test(t.name);
      return {
        id: t.id,
        name: t.name,
        solved,
        correct,
        accuracy,
        accuracyPct: yuzde(accuracy),
        band: band(solved, accuracy) as Band,
        inPlanThisWeek: planli.has(t.id),
        isPremium: t.isPremium,
        locked: t.isPremium && !isPremiumUser,
        isLaw,
        lawSlug: isLaw ? slugify(t.name) : null,
      };
    };
    const rows = topics.map((t) => ({ ...satir(t), children: t.children.map(satir) }));
    const hepsi = rows.flatMap((r) => [r, ...r.children]);
    const totalSolved = progress.reduce((s, p) => s + p.solvedCount, 0);
    const totalCorrect = progress.reduce((s, p) => s + p.correctCount, 0);
    const accuracy = totalSolved > 0 ? totalCorrect / totalSolved : null;
    const weakest = enZayif(
      hepsi.map((r) => ({
        topicId: r.id,
        name: r.name,
        solved: r.solved,
        correct: r.correct,
        accuracy: r.accuracy,
      })),
    );
    return {
      course: { id: course.id, name: course.name, icon: course.icon },
      summary: {
        solved: totalSolved,
        correct: totalCorrect,
        accuracyPct: yuzde(accuracy),
        band: band(totalSolved, accuracy),
        examWeightPercent: examWeight?.weightPercent ?? null,
        weakest: weakest
          ? { topicId: weakest.topicId, name: weakest.name, accuracyPct: yuzde(weakest.accuracy) }
          : null,
      },
      coach: dersKocCumlesi({
        solved: totalSolved,
        weakest,
        weakestInPlan: weakest ? planli.has(weakest.topicId) : false,
      }),
      topics: rows.map((r) => ({ ...kamu(r), children: r.children.map(kamu) })),
      tools: {
        wrongCount,
        favoriteCount: favCount,
        // Ana metin önce: madde sayısı çoktan aza (Anayasa Hukuku'nda 12 mevzuat var).
        legislation: [...legislation]
          .sort((a, b) => b._count.articles - a._count.articles)
          .map((l) => ({
            slug: l.slug,
            name: l.shortName ?? l.name,
            articleCount: l._count.articles,
          })),
      },
    };
  }

  async topicRoom(userId: string, topicId: string, isPremiumUser = false) {
    const topic = await this.prisma.topic.findFirst({
      where: { id: topicId, deletedAt: null },
      select: {
        id: true,
        name: true,
        isPremium: true,
        courseId: true,
        course: { select: { name: true } },
        legislation: { select: { slug: true, shortName: true, name: true, status: true } },
      },
    });
    if (!topic) throw new NotFoundException('Konu bulunamadı');
    const buHafta = haftaBasi();
    const [progress, wrongCount, favCount, son5, planItem, maddeler] = await Promise.all([
      this.prisma.userTopicProgress.findUnique({
        where: { userId_topicId: { userId, topicId } },
        select: { solvedCount: true, correctCount: true },
      }),
      this.yanlisSayisi(userId, { topicId }),
      this.favoriSayisi(userId, { topicId }),
      // QuizAnswer'da question ilişkisi yok — son 5 cevap raw join ile.
      this.prisma.$queryRaw<{ is_correct: boolean }[]>`
        SELECT qa.is_correct FROM quiz_answers qa
        JOIN quiz_sessions s ON s.id = qa.session_id AND s.user_id = ${userId}::uuid
        JOIN questions q ON q.id = qa.question_id AND q.topic_id = ${topicId}::uuid
        WHERE qa.is_correct IS NOT NULL
        ORDER BY qa.answered_at DESC LIMIT 5`,
      this.prisma.studyPlanItem.findFirst({
        where: { plan: { userId, status: 'active' }, weekStart: buHafta, kind: 'topic', topicId },
        select: { targetMinutes: true, doneMinutes: true, status: true },
      }),
      this.prisma.lawArticle.findMany({
        where: { topicId, status: 'published' },
        select: { articleNo: true },
      }),
    ]);
    const solved = progress?.solvedCount ?? 0;
    const correct = progress?.correctCount ?? 0;
    const accuracy = solved > 0 ? correct / solved : null;
    const inPlan = planItem != null;
    const isLaw = LAW_NAME_RE.test(topic.name);
    const leg =
      topic.legislation && topic.legislation.status === 'published' ? topic.legislation : null;
    return {
      topic: {
        id: topic.id,
        name: topic.name,
        courseId: topic.courseId,
        courseName: topic.course.name,
        isPremium: topic.isPremium,
        locked: topic.isPremium && !isPremiumUser,
      },
      summary: {
        solved,
        correct,
        accuracyPct: yuzde(accuracy),
        band: band(solved, accuracy),
        inPlanThisWeek: inPlan,
        planRemainingMinutes:
          planItem && planItem.status === 'pending'
            ? Math.max(0, planItem.targetMinutes - planItem.doneMinutes)
            : null,
      },
      coach: konuKocCumlesi({
        solved,
        accuracy,
        son5Dogru: son5.length ? son5.filter((a) => a.is_correct).length : null,
        son5Toplam: son5.length,
        inPlan,
      }),
      wrongCount,
      favoriteCount: favCount,
      legislation:
        leg || maddeler.length
          ? {
              slug: leg?.slug ?? (isLaw ? slugify(topic.name) : null),
              name: leg?.shortName ?? leg?.name ?? null,
              articleCount: maddeler.length,
              articleRange: maddeAraligi(maddeler.map((m) => m.articleNo)),
            }
          : null,
    };
  }

  /** Çözülmemiş yanlış sayısı — WrongAnswer'da question ilişkisi yok (composite id), raw join. */
  private async yanlisSayisi(userId: string, by: { courseId?: string; topicId?: string }) {
    const rows = by.topicId
      ? await this.prisma.$queryRaw<{ cnt: number }[]>`
          SELECT COUNT(*)::int AS cnt FROM wrong_answers wa
          JOIN questions q ON q.id = wa.question_id AND q.deleted_at IS NULL
          WHERE wa.user_id = ${userId}::uuid AND wa.resolved_at IS NULL AND q.topic_id = ${by.topicId}::uuid`
      : await this.prisma.$queryRaw<{ cnt: number }[]>`
          SELECT COUNT(*)::int AS cnt FROM wrong_answers wa
          JOIN questions q ON q.id = wa.question_id AND q.deleted_at IS NULL
          JOIN topics t ON t.id = q.topic_id AND t.deleted_at IS NULL
          WHERE wa.user_id = ${userId}::uuid AND wa.resolved_at IS NULL AND t.course_id = ${by.courseId}::uuid`;
    return rows[0]?.cnt ?? 0;
  }

  /** Favoriler = yer imleri (Bookmark; question ilişkisi yok → raw join), silinmiş soru hariç. */
  private async favoriSayisi(userId: string, by: { courseId?: string; topicId?: string }) {
    const rows = by.topicId
      ? await this.prisma.$queryRaw<{ cnt: number }[]>`
          SELECT COUNT(*)::int AS cnt FROM bookmarks b
          JOIN questions q ON q.id = b.question_id AND q.deleted_at IS NULL
          WHERE b.user_id = ${userId}::uuid AND q.topic_id = ${by.topicId}::uuid`
      : await this.prisma.$queryRaw<{ cnt: number }[]>`
          SELECT COUNT(*)::int AS cnt FROM bookmarks b
          JOIN questions q ON q.id = b.question_id AND q.deleted_at IS NULL
          JOIN topics t ON t.id = q.topic_id AND t.deleted_at IS NULL
          WHERE b.user_id = ${userId}::uuid AND t.course_id = ${by.courseId}::uuid`;
    return rows[0]?.cnt ?? 0;
  }
}

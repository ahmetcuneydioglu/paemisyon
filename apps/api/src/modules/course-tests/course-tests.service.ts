import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { IPTAL_EDILMEMIS } from '../../common/iptal-soru';
import {
  atamaPlani,
  bolumle,
  konuSirasi,
  siradaki,
  testDurumu,
  UCRETSIZ_TEST_SAYISI,
  type TestSatiri,
} from './course-tests.logic';

/** Servis edilebilir soru: silinmemiş, güncel sürümü yayında, çıkmış sınavda iptal edilmemiş. */
const YAYINDA = {
  deletedAt: null,
  currentVersionId: { not: null },
  currentVersion: { status: 'published' },
  ...IPTAL_EDILMEMIS,
} satisfies Prisma.QuestionWhereInput;

/**
 * Ders testleri (Doc 49/18): dersin yayındaki sorularından 20'şerlik SABİT setler.
 * Atama kararlıdır (soru bir kez atanır); kullanıcı ilerlemesi oturumlardan türetilir.
 */
@Injectable()
export class CourseTestsService {
  private readonly logger = new Logger(CourseTestsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Dersin atanmamış yayındaki sorularını testlere dağıtır. Ders başına danışma kilidi: cron ile
   * ilk dolum betiği aynı anda koşsa da numara/konum çakışmaz. Dönen: atanan soru sayısı.
   */
  async assignCourse(courseId: string): Promise<number> {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'course_tests:' + courseId}))`;
        const topics = await tx.topic.findMany({
          where: { courseId, deletedAt: null },
          select: { id: true, parentId: true, sortOrder: true },
        });
        const sira = konuSirasi(topics);
        const yeniler = await tx.question.findMany({
          where: { ...YAYINDA, topic: { courseId, deletedAt: null }, courseTest: null },
          select: { id: true, topicId: true, createdAt: true },
        });
        if (yeniler.length === 0) return 0;
        yeniler.sort(
          (a, b) =>
            (sira.get(a.topicId) ?? 1e9) - (sira.get(b.topicId) ?? 1e9) ||
            a.createdAt.getTime() - b.createdAt.getTime() ||
            a.id.localeCompare(b.id),
        );
        const konuOf = new Map(yeniler.map((q) => [q.id, q.topicId]));
        const son = await tx.courseTest.findFirst({
          where: { courseId },
          orderBy: { number: 'desc' },
          select: { id: true, number: true, _count: { select: { questions: true } } },
        });
        const plan = atamaPlani(
          son ? { number: son.number, count: son._count.questions } : null,
          yeniler.map((q) => q.id),
        );
        if (plan.sonaEkle && son) {
          await tx.courseTestQuestion.createMany({
            data: plan.sonaEkle.questionIds.map((questionId, i) => ({
              testId: son.id,
              questionId,
              position: plan.sonaEkle!.startPosition + i,
            })),
          });
        }
        for (const t of plan.yeniTestler) {
          const test = await tx.courseTest.create({
            data: { courseId, number: t.number, topicId: konuOf.get(t.questionIds[0]!) ?? null },
            select: { id: true },
          });
          await tx.courseTestQuestion.createMany({
            data: t.questionIds.map((questionId, position) => ({
              testId: test.id,
              questionId,
              position,
            })),
          });
        }
        return yeniler.length;
      },
      { timeout: 60_000 },
    );
  }

  /** Bütün dersler — yeni yayınlanan sorular ertesi sabah testlere girer. */
  @Cron('10 5 * * *', { timeZone: 'Europe/Istanbul' })
  async assignAll(): Promise<void> {
    const courses = await this.prisma.course.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
    });
    for (const c of courses) {
      try {
        const n = await this.assignCourse(c.id);
        if (n > 0) this.logger.log(`${c.name}: ${n} soru testlere atandı`);
      } catch (e) {
        this.logger.error(
          `${c.name}: test ataması düştü — ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  }

  /** Kullanıcının dersteki test satırları (durum türetmek için ham veri). */
  private async satirlar(
    userId: string,
    courseId: string,
    isPremium: boolean,
  ): Promise<TestSatiri[]> {
    const [tests, sorular, oturumlar] = await Promise.all([
      this.prisma.courseTest.findMany({
        where: { courseId },
        orderBy: { number: 'asc' },
        select: { id: true, number: true, topicId: true, topic: { select: { name: true } } },
      }),
      // Servis edilen soru sayısı: ücretsizde premium konu soruları Test 1'den süzülür.
      this.prisma.courseTestQuestion.findMany({
        where: {
          test: { courseId },
          question: { ...YAYINDA, ...(isPremium ? {} : { topic: { isPremium: false } }) },
        },
        select: { testId: true },
      }),
      this.prisma.quizSession.findMany({
        where: { userId, courseTest: { courseId }, status: { in: ['completed', 'in_progress'] } },
        orderBy: { startedAt: 'desc' },
        select: {
          id: true,
          courseTestId: true,
          status: true,
          score: true,
          totalQuestions: true,
          _count: { select: { answers: true } },
        },
      }),
    ]);
    const say = new Map<string, number>();
    for (const s of sorular) say.set(s.testId, (say.get(s.testId) ?? 0) + 1);
    const enIyi = new Map<string, number>();
    const yarim = new Map<string, TestSatiri['inProgress']>();
    for (const o of oturumlar) {
      const id = o.courseTestId!;
      if (o.status === 'completed') {
        const pct = Math.round(Number(o.score ?? 0));
        enIyi.set(id, Math.max(enIyi.get(id) ?? 0, pct));
      } else if (!yarim.has(id)) {
        yarim.set(id, { sessionId: o.id, answered: o._count.answers, total: o.totalQuestions });
      }
    }
    return tests.map((t) => ({
      id: t.id,
      number: t.number,
      topicId: t.topicId,
      topicName: t.topic?.name ?? null,
      questionCount: say.get(t.id) ?? 0,
      bestPct: enIyi.get(t.id) ?? null,
      inProgress: yarim.get(t.id) ?? null,
    }));
  }

  /** Testler ekranı (`GET /me/course-tests/:courseId`). */
  async overview(userId: string, courseId: string, isPremium: boolean) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!course) throw new NotFoundException('Ders bulunamadı');
    const [rows, toplam, gorulen] = await Promise.all([
      this.satirlar(userId, courseId, isPremium),
      this.prisma.question.count({ where: { ...YAYINDA, topic: { courseId, deletedAt: null } } }),
      // QuizAnswer'da question ilişkisi yok — ham birleşim.
      this.prisma.$queryRaw<{ n: number }[]>`
        SELECT COUNT(DISTINCT qa.question_id)::int AS n FROM quiz_answers qa
        JOIN quiz_sessions s ON s.id = qa.session_id AND s.user_id = ${userId}::uuid
        JOIN questions q ON q.id = qa.question_id AND q.deleted_at IS NULL
        JOIN topics t ON t.id = q.topic_id AND t.course_id = ${courseId}::uuid`,
    ]);
    const gorunur = rows.filter((r) => r.questionCount > 0);
    return {
      course,
      totalQuestions: toplam,
      seenQuestions: Math.min(gorulen[0]?.n ?? 0, toplam),
      testCount: gorunur.length,
      completedTests: gorunur.filter((r) => r.bestPct != null).length,
      /** Ücretsiz planda kaç test kilitli (premium şeridi metni). */
      lockedTests: isPremium ? 0 : Math.max(0, gorunur.length - UCRETSIZ_TEST_SAYISI),
      next: siradaki(gorunur, isPremium),
      sections: bolumle(gorunur, isPremium),
    };
  }

  /** Ders odası ve seçim sayfası özeti: test sayısı, tamamlanan, yarım testin numarası. */
  async roomSummary(userId: string, courseId: string, isPremium: boolean) {
    const rows = (await this.satirlar(userId, courseId, isPremium)).filter(
      (r) => r.questionCount > 0,
    );
    const yarim = rows.find((r) => testDurumu(r, isPremium) === 'progress');
    return {
      count: rows.length,
      completed: rows.filter((r) => r.bestPct != null).length,
      inProgressNumber: yarim?.number ?? null,
    };
  }

  /**
   * Testten tur için soru seti (QuizService.startSession): testin sabit sırası, servis edilebilir
   * sorular. Kilit kararı burada — ücretsizde Test 1 dışı 403, Test 1'de premium konu süzülür.
   */
  async sessionSet(courseTestId: string, isPremium: boolean) {
    const test = await this.prisma.courseTest.findUnique({
      where: { id: courseTestId },
      select: {
        id: true,
        number: true,
        courseId: true,
        course: { select: { name: true, deletedAt: true } },
      },
    });
    if (!test || test.course.deletedAt) throw new NotFoundException('Test bulunamadı.');
    if (!isPremium && test.number > UCRETSIZ_TEST_SAYISI) {
      throw new ForbiddenException({
        code: 'PREMIUM_REQUIRED',
        message: `Test ${test.number} Premium'da; ücretsiz planda Test 1 açık.`,
      });
    }
    const rows = await this.prisma.courseTestQuestion.findMany({
      where: {
        testId: test.id,
        question: { ...YAYINDA, ...(isPremium ? {} : { topic: { isPremium: false } }) },
      },
      orderBy: { position: 'asc' },
      select: { question: { select: { id: true, currentVersionId: true, topicId: true } } },
    });
    return {
      test: {
        id: test.id,
        number: test.number,
        courseId: test.courseId,
        courseName: test.course.name,
      },
      questions: rows.map((r) => r.question),
    };
  }
}

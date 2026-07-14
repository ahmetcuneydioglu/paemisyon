import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { AuditService } from '../audit.service';
import { UpsertExamDto } from '../dto/exam.dto';

/**
 * Deneme yönetimi (Doc 18 §8). Kurallar:
 *  - Soru seti yalnız TASLAK'ta düzenlenir; YAYINDA sürümler sabitlenir
 *    (soru sonradan güncellense de deneme/geçmiş bozulmaz).
 *  - Yayından kaldırma yalnız katılım YOKKEN; katılım varsa arşivlenir.
 *  - Editor taslak hazırlar; yayın/arşiv YALNIZ admin (controller'da).
 */
@Injectable()
export class AdminExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list() {
    const exams = await this.prisma.exam.findMany({
      where: { deletedAt: null },
      orderBy: [{ startAt: 'desc' }],
      include: { _count: { select: { questions: true, sessions: true } } },
    });
    return exams.map((e) => ({
      id: e.id,
      title: e.title,
      startAt: e.startAt,
      durationMinutes: e.durationMinutes,
      isPremium: e.isPremium,
      status: e.status,
      questionCount: e._count.questions,
      attemptCount: e._count.sessions,
    }));
  }

  async detail(id: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id, deletedAt: null },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
          include: {
            question: {
              select: {
                id: true,
                topic: { select: { name: true, course: { select: { name: true } } } },
                currentVersion: { select: { stem: true } },
              },
            },
            questionVersion: { select: { stem: true, versionNo: true } },
          },
        },
        _count: { select: { sessions: true } },
      },
    });
    if (!exam) throw new NotFoundException('Deneme bulunamadı.');
    return {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      startAt: exam.startAt,
      durationMinutes: exam.durationMinutes,
      isPremium: exam.isPremium,
      liveAnswerReveal: exam.liveAnswerReveal,
      questionsOpenAfterEnd: exam.questionsOpenAfterEnd,
      status: exam.status,
      attemptCount: exam._count.sessions,
      questions: exam.questions.map((q, i) => ({
        order: i + 1,
        questionId: q.questionId,
        // Taslakta güncel yayın kökü gösterilir; yayında SABİTLENMİŞ sürüm.
        stem:
          exam.status === 'draft'
            ? (q.question.currentVersion?.stem ?? q.questionVersion.stem)
            : q.questionVersion.stem,
        pinnedVersionNo: q.questionVersion.versionNo,
        topicName: q.question.topic.name,
        courseName: q.question.topic.course.name,
      })),
    };
  }

  async create(actor: AuthenticatedUser, dto: UpsertExamDto) {
    const exam = await this.prisma.exam.create({
      data: { ...this.mapDto(dto), status: 'draft', createdBy: actor.id },
    });
    await this.audit.log(actor, 'exam.create', 'exam', exam.id, { title: exam.title });
    return this.detail(exam.id);
  }

  async update(actor: AuthenticatedUser, id: string, dto: UpsertExamDto) {
    const exam = await this.exists(id);
    if (exam.status === 'archived') {
      throw new BadRequestException('Arşivlenmiş deneme düzenlenemez.');
    }
    await this.prisma.exam.update({ where: { id }, data: this.mapDto(dto) });
    await this.audit.log(actor, 'exam.update', 'exam', id, { title: dto.title });
    return this.detail(id);
  }

  /** Soru setini (sıralı) belirle — YALNIZ taslakta. */
  async setQuestions(actor: AuthenticatedUser, id: string, questionIds: string[]) {
    const exam = await this.exists(id);
    if (exam.status !== 'draft') {
      throw new BadRequestException('Soru seti yalnız taslak denemede düzenlenebilir.');
    }
    const unique = [...new Set(questionIds)];
    if (unique.length !== questionIds.length) {
      throw new BadRequestException('Soru listesi tekrar içeriyor.');
    }
    // Yalnız YAYINDA sorusu olanlar bağlanabilir (currentVersionId dolu).
    const questions = await this.prisma.question.findMany({
      where: { id: { in: unique }, deletedAt: null, currentVersionId: { not: null } },
      select: { id: true, currentVersionId: true },
    });
    const byId = new Map(questions.map((q) => [q.id, q]));
    const missing = unique.filter((qid) => !byId.has(qid));
    if (missing.length > 0) {
      throw new BadRequestException(
        `Şu sorular yayınlanmamış ya da bulunamadı: ${missing.length} adet.`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.examQuestion.deleteMany({ where: { examId: id } });
      if (unique.length > 0) {
        await tx.examQuestion.createMany({
          data: unique.map((qid, i) => ({
            examId: id,
            questionId: qid,
            questionVersionId: byId.get(qid)!.currentVersionId!,
            sortOrder: i,
          })),
        });
      }
    });
    await this.audit.log(actor, 'exam.set_questions', 'exam', id, { count: unique.length });
    return this.detail(id);
  }

  /** Yayınla: ≥1 soru şartı + sürümleri SABİTLE (Doc 18 §6). */
  async publish(actor: AuthenticatedUser, id: string) {
    const exam = await this.exists(id);
    if (exam.status === 'published') return this.detail(id); // idempotent
    const rows = await this.prisma.examQuestion.findMany({
      where: { examId: id },
      include: { question: { select: { currentVersionId: true } } },
    });
    if (rows.length === 0) {
      throw new BadRequestException('Yayın için en az 1 soru bağlanmalı.');
    }

    await this.prisma.$transaction(async (tx) => {
      // Sabitle: her sorunun ŞU ANKİ yayın sürümü kilitlenir.
      for (const r of rows) {
        if (r.question.currentVersionId && r.question.currentVersionId !== r.questionVersionId) {
          await tx.examQuestion.update({
            where: { examId_questionId: { examId: id, questionId: r.questionId } },
            data: { questionVersionId: r.question.currentVersionId },
          });
        }
      }
      await tx.exam.update({ where: { id }, data: { status: 'published' } });
    });
    await this.audit.log(actor, 'exam.publish', 'exam', id, {
      title: exam.title,
      questionCount: rows.length,
    });
    return this.detail(id);
  }

  /** Yayından kaldır: yalnız katılım yoksa (aksi halde arşivle). */
  async unpublish(actor: AuthenticatedUser, id: string) {
    const exam = await this.exists(id);
    const attempts = await this.prisma.quizSession.count({ where: { examId: id } });
    if (attempts > 0) {
      throw new BadRequestException(
        'Katılım almış deneme yayından kaldırılamaz — arşivleyebilirsin.',
      );
    }
    await this.prisma.exam.update({ where: { id }, data: { status: 'draft' } });
    await this.audit.log(actor, 'exam.unpublish', 'exam', id, { title: exam.title });
    return this.detail(id);
  }

  async archive(actor: AuthenticatedUser, id: string) {
    const exam = await this.exists(id);
    await this.prisma.exam.update({ where: { id }, data: { status: 'archived' } });
    await this.audit.log(actor, 'exam.archive', 'exam', id, { title: exam.title });
    return { archived: true };
  }

  /** Katılımcı sonuçları + özet. */
  async results(id: string) {
    await this.exists(id);
    const sessions = await this.prisma.quizSession.findMany({
      where: { examId: id, status: 'completed' },
      orderBy: [{ score: 'desc' }, { durationSeconds: 'asc' }],
      include: { user: { select: { displayName: true, email: true } } },
    });
    const inProgress = await this.prisma.quizSession.count({
      where: { examId: id, status: 'in_progress' },
    });
    const scores = sessions.map((s) => (s.score != null ? Number(s.score) : 0));
    return {
      summary: {
        completed: sessions.length,
        inProgress,
        avgScore: scores.length
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
          : null,
        maxScore: scores.length ? Math.max(...scores) : null,
      },
      participants: sessions.map((s, i) => ({
        rank: i + 1,
        displayName: s.user.displayName,
        email: s.user.email,
        score: s.score != null ? Number(s.score) : 0,
        correctCount: s.correctCount,
        wrongCount: s.wrongCount,
        blankCount: s.blankCount,
        durationSeconds: s.durationSeconds,
        completedAt: s.completedAt,
      })),
    };
  }

  private mapDto(dto: UpsertExamDto) {
    return {
      title: dto.title,
      description: dto.description ?? null,
      startAt: new Date(dto.startAt),
      durationMinutes: dto.durationMinutes,
      isPremium: dto.isPremium ?? false,
      liveAnswerReveal: dto.liveAnswerReveal ?? false,
      questionsOpenAfterEnd: dto.questionsOpenAfterEnd ?? true,
    };
  }

  private async exists(id: string) {
    const exam = await this.prisma.exam.findFirst({ where: { id, deletedAt: null } });
    if (!exam) throw new NotFoundException('Deneme bulunamadı.');
    return exam;
  }
}

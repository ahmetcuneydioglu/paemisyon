import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { AuditService } from '../audit.service';
import type { AuthenticatedUser } from '../../auth/auth.types';

/**
 * Çıkmış sınav yönetimi (Doc 36) — panel tarafı.
 *
 * Panel iki şeyi yönetir: dönemin yayın durumu ve hangi soruların public
 * sayfada tam metniyle görüneceği. Soruların kendisi normal soru yönetiminden
 * geçer; burada içerik düzenlenmez.
 */
@Injectable()
export class AdminPastExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list() {
    const sinavlar = await this.prisma.pastExam.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }],
      include: {
        questions: {
          select: {
            publicly: true,
            cancelled: true,
            question: { select: { currentVersion: { select: { status: true, explanation: true } } } },
          },
        },
      },
    });
    return sinavlar.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      institution: s.institution,
      term: s.term,
      heldOn: s.heldOn,
      kind: s.kind,
      status: s.status,
      questionCount: s.questionCount,
      /** Bankaya bağlı soru sayısı — `analiz` türünde 0'dır. */
      linked: s.questions.length,
      publicCount: s.questions.filter((q) => q.publicly).length,
      cancelledCount: s.questions.filter((q) => q.cancelled).length,
      /** Public sayfaya çıkmaya HAZIR soru: yayında ve açıklaması var. */
      readyCount: s.questions.filter(
        (q) => q.question.currentVersion?.status === 'published' && q.question.currentVersion?.explanation,
      ).length,
      /** Public işaretli ama henüz yayına girmemiş soru — sayfada görünmez. */
      publicNotLive: s.questions.filter(
        (q) => q.publicly && q.question.currentVersion?.status !== 'published',
      ).length,
    }));
  }

  async detail(id: string) {
    const s = await this.prisma.pastExam.findFirst({
      where: { id, deletedAt: null },
      include: {
        questions: {
          orderBy: { orderNo: 'asc' },
          include: {
            question: {
              select: {
                id: true,
                topic: { select: { name: true, course: { select: { name: true } } } },
                currentVersion: { select: { stem: true, status: true, explanation: true } },
              },
            },
          },
        },
      },
    });
    if (!s) throw new NotFoundException('Çıkmış sınav bulunamadı.');
    return {
      id: s.id,
      slug: s.slug,
      name: s.name,
      institution: s.institution,
      term: s.term,
      heldOn: s.heldOn,
      kind: s.kind,
      status: s.status,
      summary: s.summary,
      questionCount: s.questionCount,
      sortOrder: s.sortOrder,
      analysis: s.analysis,
      questions: s.questions.map((q) => ({
        questionId: q.question.id,
        orderNo: q.orderNo,
        cancelled: q.cancelled,
        publicly: q.publicly,
        course: q.question.topic.course.name,
        topic: q.question.topic.name,
        stem: q.question.currentVersion?.stem.slice(0, 160) ?? '',
        versionStatus: q.question.currentVersion?.status ?? null,
        hasExplanation: !!q.question.currentVersion?.explanation,
      })),
    };
  }

  /** Dönem üstverisi ve yayın durumu. Soru içeriği buradan DEĞİŞTİRİLEMEZ. */
  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: { name?: string; summary?: string | null; status?: 'draft' | 'published' | 'archived'; sortOrder?: number },
  ) {
    const mevcut = await this.prisma.pastExam.findFirst({ where: { id, deletedAt: null }, select: { slug: true } });
    if (!mevcut) throw new NotFoundException('Çıkmış sınav bulunamadı.');
    const sinav = await this.prisma.pastExam.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.summary !== undefined ? { summary: dto.summary } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });
    await this.audit.log(actor, 'past_exam.update', 'past_exam', id, { slug: mevcut.slug, ...dto });
    return sinav;
  }

  /** Sorunun public sayfada görünürlüğü / iptal işareti. */
  async updateQuestion(
    actor: AuthenticatedUser,
    id: string,
    questionId: string,
    dto: { publicly?: boolean; cancelled?: boolean },
  ) {
    const kayit = await this.prisma.pastExamQuestion.findUnique({
      where: { pastExamId_questionId: { pastExamId: id, questionId } },
      select: { orderNo: true },
    });
    if (!kayit) throw new NotFoundException('Soru bu sınava bağlı değil.');
    const guncel = await this.prisma.pastExamQuestion.update({
      where: { pastExamId_questionId: { pastExamId: id, questionId } },
      data: {
        ...(dto.publicly !== undefined ? { publicly: dto.publicly } : {}),
        ...(dto.cancelled !== undefined ? { cancelled: dto.cancelled } : {}),
      },
    });
    await this.audit.log(actor, 'past_exam.question_update', 'past_exam', id, {
      questionId,
      orderNo: kayit.orderNo,
      ...dto,
    });
    return guncel;
  }
}

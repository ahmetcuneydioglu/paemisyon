import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AuditService } from '../admin/audit.service';

/**
 * Soru hata bildirimi (eski question_reports'un sağlıklı hali).
 * Kullanıcı bildirir → panelde kuyruğa düşer → admin çözer/yok sayar.
 * İçerik kalite döngüsünün kullanıcı ayağı — özellikle eski içerik için kritik.
 */
@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Bildirim oluştur. Aynı kullanıcının aynı soruya AÇIK bildirimi varsa tekrarlamaz. */
  async create(userId: string, questionId: string, message: string) {
    const question = await this.prisma.question.findFirst({
      where: { id: questionId, deletedAt: null },
    });
    if (!question) throw new NotFoundException('Soru bulunamadı.');

    const existing = await this.prisma.questionReport.findFirst({
      where: { userId, questionId, status: 'open' },
    });
    if (existing) {
      return { id: existing.id, alreadyReported: true };
    }

    const report = await this.prisma.questionReport.create({
      data: { userId, questionId, message },
    });
    return { id: report.id, alreadyReported: false };
  }

  /** Panel listesi: bildirim + soru kökü + konu + bildiren. */
  async adminList(status: 'open' | 'resolved' | 'dismissed' = 'open', page = 1) {
    const pageSize = 20;
    const where = { status };
    const [items, total] = await Promise.all([
      this.prisma.questionReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { email: true } },
          question: {
            select: {
              id: true,
              topic: { select: { name: true, course: { select: { name: true } } } },
              currentVersion: { select: { stem: true } },
              versions: { orderBy: { versionNo: 'desc' }, take: 1, select: { stem: true } },
            },
          },
        },
      }),
      this.prisma.questionReport.count({ where }),
    ]);

    return {
      items: items.map((r) => ({
        id: r.id,
        questionId: r.question.id,
        stem: r.question.currentVersion?.stem ?? r.question.versions[0]?.stem ?? '(soru)',
        topicName: r.question.topic.name,
        courseName: r.question.topic.course.name,
        message: r.message,
        reporterEmail: r.user.email,
        status: r.status,
        createdAt: r.createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  /** Bildirimi kapat: çözüldü (içerik düzeltildi) ya da yok sayıldı. */
  async setStatus(actor: AuthenticatedUser, id: string, status: 'resolved' | 'dismissed') {
    const report = await this.prisma.questionReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Bildirim bulunamadı.');
    await this.prisma.questionReport.update({
      where: { id },
      data: { status, resolvedBy: actor.id, resolvedAt: new Date() },
    });
    await this.audit.log(actor, `report.${status}`, 'question', report.questionId, {
      reportId: id,
    });
    return { id, status };
  }
}

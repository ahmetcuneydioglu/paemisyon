import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';

/** Panel ana sayfası metrikleri (Doc 9 §5). Tek istekte özet. */
@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const since7d = new Date(Date.now() - 7 * 864e5);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [
      totalUsers,
      newUsers7d,
      activeSubscriptions,
      premiumUsers,
      questionTotals,
      pendingReview,
      activeToday,
      notifSessions7d,
      recentAudit,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { createdAt: { gte: since7d }, deletedAt: null } }),
      this.prisma.subscription.count({ where: { status: 'active' } }),
      this.prisma.entitlement.count({
        where: { isPremium: true, OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }] },
      }),
      // YALNIZ yaşayan soruların sürümleri — silinen soruların hayalet
      // sürümleri sayaçları şişirmesin (kuyruk/review-summary ile tutarlı).
      this.prisma.questionVersion.groupBy({
        by: ['status'],
        where: { question: { deletedAt: null } },
        _count: { _all: true },
      }),
      this.prisma.questionVersion.count({
        where: { status: 'in_review', question: { deletedAt: null } },
      }),
      this.prisma.dailyUsage.count({ where: { usageDate: today } }),
      // Bildirim ölçümü: son 7 günde bildirimden açılan seanslar.
      this.prisma.quizSession.count({
        where: { source: 'notif', startedAt: { gte: since7d } },
      }),
      this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
    ]);

    const byStatus: Record<string, number> = {};
    for (const g of questionTotals) byStatus[g.status] = g._count._all;

    return {
      users: { total: totalUsers, new7d: newUsers7d, activeToday },
      engagement: { notifSessions7d },
      revenue: { activeSubscriptions, premiumUsers },
      content: {
        questionVersions: byStatus, // draft/in_review/published/archived
        pendingReview,
      },
      recentActivity: recentAudit.map((a) => ({
        id: a.id,
        actorEmail: a.actorEmail,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        createdAt: a.createdAt,
      })),
    };
  }
}

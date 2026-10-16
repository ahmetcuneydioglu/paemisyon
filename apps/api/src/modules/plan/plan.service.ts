import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

/**
 * Haftalık plan (Doc 49 S1-E) — İSKELET. Üretim/revizyon algoritması F8'in kendi
 * belgesinde; burada yalnız okuma sözleşmesi erken netleşir: aktif plan yoksa
 * `{ plan: null }` (404 değil — istemci "plan yok" ekranını boş durumla çizer),
 * varsa plan + bu haftanın kalemleri.
 */
@Injectable()
export class PlanService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlan(userId: string, now: Date = new Date()) {
    const plan = await this.prisma.studyPlan.findFirst({
      where: { userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        examDate: true,
        weeklyMinutes: true,
        createdAt: true,
        revisedAt: true,
        items: {
          orderBy: [{ weekStart: 'asc' }, { targetMinutes: 'desc' }],
          select: {
            id: true,
            weekStart: true,
            topicId: true,
            topic: { select: { name: true } },
            targetQuestions: true,
            targetMinutes: true,
            doneQuestions: true,
            doneMinutes: true,
            status: true,
          },
        },
      },
    });
    if (!plan) return { plan: null };
    const buHafta = haftaBasi(now);
    const kalemler = plan.items.map((i) => ({
      id: i.id,
      weekStart: tarih(i.weekStart),
      topicId: i.topicId,
      topicName: i.topic.name,
      targetQuestions: i.targetQuestions,
      targetMinutes: i.targetMinutes,
      doneQuestions: i.doneQuestions,
      doneMinutes: i.doneMinutes,
      status: i.status,
    }));
    return {
      plan: {
        id: plan.id,
        examDate: plan.examDate ? tarih(plan.examDate) : null,
        weeklyMinutes: plan.weeklyMinutes,
        createdAt: plan.createdAt.toISOString(),
        revisedAt: plan.revisedAt?.toISOString() ?? null,
        currentWeekStart: tarih(buHafta),
        thisWeek: kalemler.filter((k) => k.weekStart === tarih(buHafta)),
        items: kalemler,
      },
    };
  }
}

/** Haftanın Pazartesi'si (UTC takvim günü) — plan kalemlerinin anahtarı. */
export function haftaBasi(t: Date): Date {
  const d = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()));
  const gun = (d.getUTCDay() + 6) % 7; // Pzt=0 … Paz=6
  d.setUTCDate(d.getUTCDate() - gun);
  return d;
}

function tarih(d: Date): string {
  return d.toISOString().slice(0, 10);
}

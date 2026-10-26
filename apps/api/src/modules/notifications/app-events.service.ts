import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

/** Üreticilerin yazdığı olay türleri (Doc 52 §4.5). Yeni tür eklerken buraya ve preset'lere bak. */
export const APP_EVENT_TYPES = [
  'session_completed',
  'daily_question_completed',
  'daily_goal_completed',
  'exam_submitted',
  'exam_abandoned',
  'exam_published',
  'exam_reminder_due',
  'exam_result_ready',
  'exam_net_updated',
  'user_registered',
  'onboarding_completed',
  'question_report_resolved',
  'badge_unlocked',
  'leaderboard_overtaken',
  'past_exam_published',
] as const;
export type AppEventType = (typeof APP_EVENT_TYPES)[number];

export type EmitInput = {
  entityType?: string | null;
  entityId?: string | null;
  payload?: Record<string, unknown>;
  occurredAt?: Date;
};

/**
 * Olay omurgası: servisler motoru tanımaz, yalnız olay yazar; otomasyon
 * değerlendiricisi tüketir. `emit` asla fırlatmaz — üretici iş akışı (seans
 * bitişi, yayın) bildirim yüzünden bozulmaz; hata loglanır.
 */
@Injectable()
export class AppEventsService {
  private readonly logger = new Logger(AppEventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async emit(eventType: AppEventType, userId: string, input: EmitInput = {}): Promise<void> {
    try {
      await this.prisma.appEvent.create({
        data: {
          eventType,
          userId,
          entityType: input.entityType ?? null,
          entityId: input.entityId ?? null,
          payload: (input.payload ?? {}) as Prisma.InputJsonValue,
          occurredAt: input.occurredAt ?? new Date(),
        },
      });
    } catch (e) {
      this.logger.warn(`Olay yazılamadı ${eventType}/${userId}: ${(e as Error).message}`);
    }
  }

  /** Aynı türden çok olay (deneme sonucu: bütün katılımcılar) tek ifadeyle. */
  async emitMany(
    eventType: AppEventType,
    rows: ({ userId: string } & EmitInput)[],
  ): Promise<number> {
    if (rows.length === 0) return 0;
    try {
      const r = await this.prisma.appEvent.createMany({
        data: rows.map((row) => ({
          eventType,
          userId: row.userId,
          entityType: row.entityType ?? null,
          entityId: row.entityId ?? null,
          payload: (row.payload ?? {}) as Prisma.InputJsonValue,
          occurredAt: row.occurredAt ?? new Date(),
        })),
      });
      return r.count;
    } catch (e) {
      this.logger.warn(`Olaylar yazılamadı ${eventType}: ${(e as Error).message}`);
      return 0;
    }
  }
}

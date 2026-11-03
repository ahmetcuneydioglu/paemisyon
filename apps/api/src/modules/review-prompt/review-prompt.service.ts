import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { SETTING_KEYS, SettingsService } from '../../infra/settings/settings.service';
import {
  REVIEW_PROMPT_DEFAULTS,
  evaluate,
  promptCopy,
  type ReviewMoment,
  type ReviewOutcome,
  type ReviewPlatform,
  type ReviewPromptCopy,
} from './review-prompt.logic';

/** İstemciye giden nesne: kural yok, yalnız gösterilecek metin ve bildirilecek id. */
export interface ReviewPromptPayload extends ReviewPromptCopy {
  id: string;
  moment: ReviewMoment;
}

export interface SessionForReview {
  sessionId: string;
  mode: string;
  totalQuestions: number;
  correctCount: number;
  earnedBadges: number;
  /** Haftalık denemede üst dilim; tur yolunda false. */
  weeklyTop?: boolean;
}

const DAY = 86_400_000;
const startOfUtcDay = (d: Date) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

/**
 * Doc 56: tur bitince "sorulsun mu?" kararı ve kaydı. Kural sunucuda; istemci
 * `reviewPrompt` nesnesini gösterir, `setOutcome` ile sonucu bildirir.
 * Hata turu bozmaz: her çağrı yutulur, null döner (kutlama kaçar, sonuç kaybolmaz).
 */
@Injectable()
export class ReviewPromptService {
  private readonly logger = new Logger(ReviewPromptService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async evaluateAfterSession(
    userId: string,
    platform: ReviewPlatform | null,
    session: SessionForReview,
  ): Promise<ReviewPromptPayload | null> {
    if (!platform) return null; // web ve başlıksız eski istemciler: sorgu bile yapma
    try {
      return await this.evaluateInner(userId, platform, session);
    } catch (e) {
      this.logger.warn(`review-prompt değerlendirilemedi ${userId}: ${(e as Error).message}`);
      return null;
    }
  }

  private async evaluateInner(
    userId: string,
    platform: ReviewPlatform,
    session: SessionForReview,
  ): Promise<ReviewPromptPayload | null> {
    const now = new Date();
    const [killSwitch, minGapDays, afterAcceptDays] = await Promise.all([
      this.settings.getBool(SETTING_KEYS.reviewPromptKillSwitch, false),
      this.settings.getInt(SETTING_KEYS.reviewPromptMinGapDays, REVIEW_PROMPT_DEFAULTS.minGapDays),
      this.settings.getInt(
        SETTING_KEYS.reviewPromptAfterAcceptDays,
        REVIEW_PROMPT_DEFAULTS.afterAcceptDays,
      ),
    ]);
    if (killSwitch) return null;

    const complaintSince = new Date(
      now.getTime() - REVIEW_PROMPT_DEFAULTS.complaintWindowDays * DAY,
    );
    const [user, lastPrompt, recentComplaints, best] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          createdAt: true,
          stats: { select: { totalSessions: true } },
          streak: { select: { currentStreak: true, lastActiveDate: true } },
        },
      }),
      this.prisma.reviewPrompt.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { outcome: true, createdAt: true },
      }),
      this.prisma.questionReport.count({ where: { userId, createdAt: { gte: complaintSince } } }),
      this.prisma.$queryRaw<{ best: number | null }[]>(Prisma.sql`
        SELECT MAX(correct_count::float / NULLIF(total_questions, 0)) AS best
        FROM quiz_sessions
        WHERE user_id = ${userId}::uuid AND status = 'completed'
          AND total_questions >= ${REVIEW_PROMPT_DEFAULTS.personalBestMinQuestions}
          AND id <> ${session.sessionId}::uuid
      `),
    ]);
    if (!user) return null;

    const last = user.streak?.lastActiveDate ?? null;
    const moment = evaluate({
      platform,
      killSwitch,
      now,
      userCreatedAt: user.createdAt,
      totalSessions: user.stats?.totalSessions ?? 0,
      lastPrompt: lastPrompt
        ? { outcome: lastPrompt.outcome as ReviewOutcome, createdAt: lastPrompt.createdAt }
        : null,
      recentComplaints,
      session: {
        mode: session.mode,
        totalQuestions: session.totalQuestions,
        correctCount: session.correctCount,
      },
      streak: {
        current: user.streak?.currentStreak ?? 0,
        activeToday: !!last && startOfUtcDay(last).getTime() === startOfUtcDay(now).getTime(),
      },
      previousBestPct: best[0]?.best != null ? Math.round(Number(best[0].best) * 100) : null,
      earnedBadges: session.earnedBadges,
      weeklyTop: session.weeklyTop ?? false,
      minGapDays,
      afterAcceptDays,
    });
    if (!moment) return null;

    // Yarış koruması: aynı kullanıcıya son `minGapDays` içinde satır yoksa yaz (tek SQL, atomik).
    const gapSince = new Date(now.getTime() - minGapDays * DAY);
    const rows = await this.prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      INSERT INTO review_prompts (user_id, platform, moment, outcome, session_id, updated_at)
      SELECT ${userId}::uuid, ${platform}, ${moment}, 'shown', ${session.sessionId}::uuid, NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM review_prompts WHERE user_id = ${userId}::uuid AND created_at >= ${gapSince}
      )
      RETURNING id
    `);
    const id = rows[0]?.id;
    if (!id) return null;
    return { id, moment, ...promptCopy(moment) };
  }

  /** İstemci sonucu bildirir; yalnız sahibi ve yalnız `shown` satırı değişir. */
  async setOutcome(userId: string, id: string, outcome: Exclude<ReviewOutcome, 'shown'>) {
    const r = await this.prisma.reviewPrompt.updateMany({
      where: { id, userId, outcome: 'shown' },
      data: { outcome },
    });
    if (r.count === 0) {
      const exists = await this.prisma.reviewPrompt.findFirst({
        where: { id, userId },
        select: { outcome: true },
      });
      if (!exists) throw new NotFoundException('İstem bulunamadı.');
      return { id, outcome: exists.outcome, changed: false }; // ikinci bildirim: idempotent
    }
    return { id, outcome, changed: true };
  }

  /** Admin özeti: platform × an × sonuç sayıları (son N gün). */
  async summary(days: number) {
    const since = new Date(Date.now() - days * DAY);
    const rows = await this.prisma.reviewPrompt.groupBy({
      by: ['platform', 'moment', 'outcome'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    });
    return {
      days,
      rows: rows.map((r) => ({
        platform: r.platform,
        moment: r.moment,
        outcome: r.outcome,
        count: r._count._all,
      })),
    };
  }
}

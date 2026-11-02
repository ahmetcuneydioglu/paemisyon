import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { HubPermanentError, HubSyncClient } from './hub-sync.client';
import { HUB_SYNC_CLIENT, HUB_SYNC_OPTIONS, type HubSyncOptions } from './hub-sync.tokens';

/**
 * Bir bildirim en çok bu kadar denenir; sonra panelde "iletilemedi" olarak durur, insan bakar.
 * Kalıcı ret (4xx: merkez soruyu PAEMİSYON'a göndermemiş, 422) ilk denemede bu sayıya çekilir.
 */
export const HUB_REPORT_MAX_TRIES = 5;

/**
 * PAEMİSYON'un sınıflandırması yoktur; kullanıcı serbest metin yazar. Merkez sözleşmesi
 * `reason_code` ister (≤100 karakter, serbest): tek kod, ayrıntı `description`'da.
 */
export const HUB_REPORT_REASON_CODE = 'user_report';

export type ForwardOutcome =
  'sent' | 'duplicate' | 'not-hub' | 'already' | 'failed' | 'inactive' | 'missing';

export interface ForwardResult {
  reportId: string;
  outcome: ForwardOutcome;
  /** Merkezin yanıtı: soru inceleme listesine düştü mü. */
  flagged?: boolean;
  error?: string;
}

/**
 * Soru bildirimlerinin Soru Merkezi'ne iletimi (Doc 55 §5, F3).
 *
 * Yalnız `hubQuestionId` dolu (merkezden gelen) sorular iletilir; dış kimlik bildirimin kendi
 * id'sidir, merkez aynı kimliği ikinci kez alırsa `created: false` döner — yeniden deneme güvenli.
 * Kişisel veri taşınmaz: ne kullanıcı kimliği ne e-posta; yalnız mesaj ve sorunun toplam çözüm
 * sayısı (merkezin eşiği oransal). İletim bildirimi oluşturmayı ASLA engellemez: hata satıra
 * yazılır, cron (`HubSyncService.tick`) ve `scripts/hub-sync.ts --reports` yeniden dener.
 * Adaptör kapalıyken (`HUB_SYNC_ENABLED` değil ya da anahtar yok) hiçbir şey yapmaz.
 */
@Injectable()
export class HubReportForwarder {
  private readonly logger = new Logger(HubReportForwarder.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(HUB_SYNC_CLIENT) private readonly client: HubSyncClient | null,
    @Optional()
    @Inject(HUB_SYNC_OPTIONS)
    private readonly options: HubSyncOptions = { enabled: false, cron: false },
  ) {}

  get active(): boolean {
    return Boolean(this.client) && this.options.enabled;
  }

  /** Tek bildirim (oluşturulur oluşturulmaz çağrılır; sonuç beklenmez). Hiç fırlatmaz. */
  async forward(reportId: string): Promise<ForwardResult> {
    if (!this.active) return { reportId, outcome: 'inactive' };
    const report = await this.prisma.questionReport.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        message: true,
        questionId: true,
        hubForwardedAt: true,
        hubForwardTries: true,
        question: { select: { hubQuestionId: true, hubCode: true } },
      },
    });
    if (!report) return { reportId, outcome: 'missing' };
    if (!report.question.hubQuestionId) return { reportId, outcome: 'not-hub' };
    if (report.hubForwardedAt) return { reportId, outcome: 'already' };

    const solveCount = await this.prisma.quizAnswer.count({
      where: { questionId: report.questionId },
    });
    try {
      const res = await this.client!.report({
        external_report_id: report.id,
        question_id: report.question.hubQuestionId,
        reason_code: HUB_REPORT_REASON_CODE,
        description: report.message.trim().slice(0, 2000) || null,
        solve_count: solveCount,
      });
      const body = (res.body ?? {}) as { reportId?: string; created?: boolean; flagged?: boolean };
      await this.prisma.questionReport.update({
        where: { id: report.id },
        data: {
          hubForwardedAt: new Date(),
          hubReportId: body.reportId ?? null,
          hubFlagged: body.flagged ?? null,
          hubForwardError: null,
          hubForwardTries: { increment: 1 },
        },
      });
      const outcome: ForwardOutcome = body.created === false ? 'duplicate' : 'sent';
      this.logger.log(
        `bildirim ${report.id} → ${report.question.hubCode ?? report.question.hubQuestionId}: ${outcome}${body.flagged ? ', merkez incelemeye aldı' : ''}`,
      );
      return { reportId: report.id, outcome, flagged: body.flagged };
    } catch (e) {
      // Anahtar mesajlarda yoktur (istemci garantisi); mesaj panelde görünür.
      const message = (e as Error).message.slice(0, 1000);
      const permanent = e instanceof HubPermanentError;
      await this.prisma.questionReport.update({
        where: { id: report.id },
        data: {
          hubForwardError: message,
          hubForwardTries: permanent ? HUB_REPORT_MAX_TRIES : { increment: 1 },
        },
      });
      this.logger.warn(
        `bildirim ${report.id} merkeze iletilemedi${permanent ? ' (kalıcı)' : ''}: ${message}`,
      );
      return { reportId: report.id, outcome: 'failed', error: message };
    }
  }

  /** İletilmemiş merkez-sorusu bildirimleri (deneme hakkı kalanlar), eskiden yeniye. */
  async forwardPending(
    limit = 50,
  ): Promise<{ sent: number; duplicate: number; failed: number; pending: number }> {
    const out = { sent: 0, duplicate: 0, failed: 0, pending: 0 };
    if (!this.active) return out;
    const rows = await this.prisma.questionReport.findMany({
      where: {
        hubForwardedAt: null,
        hubForwardTries: { lt: HUB_REPORT_MAX_TRIES },
        question: { hubQuestionId: { not: null } },
      },
      orderBy: { createdAt: 'asc' },
      take: Math.max(1, limit),
      select: { id: true },
    });
    for (const r of rows) {
      const result = await this.forward(r.id);
      if (result.outcome === 'sent') out.sent += 1;
      else if (result.outcome === 'duplicate') out.duplicate += 1;
      else if (result.outcome === 'failed') out.failed += 1;
    }
    out.pending = await this.prisma.questionReport.count({
      where: {
        hubForwardedAt: null,
        hubForwardTries: { lt: HUB_REPORT_MAX_TRIES },
        question: { hubQuestionId: { not: null } },
      },
    });
    return out;
  }
}

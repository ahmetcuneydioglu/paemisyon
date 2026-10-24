import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { QuizService } from './quiz.service';

/**
 * Deneme teslimi sonrası AĞIR iş kuyruğu (Doc 50 §5-3).
 *
 * completeSession denemede yalnız puanı yazar; ilerleme/seri/yanlış defteri/rozet
 * güncellemesi buraya düşer. Pazar 21:00 bitiş yığılmasında havuz (Supavisor 15)
 * tükenmesin diye SIRAYLA ve küçük partilerle işlenir. Başarısız iş 5 denemeye
 * kadar yeniden alınır; hata metni satırda kalır (panel/log için).
 */
@Injectable()
export class ExamFinalizeJobService {
  private readonly logger = new Logger(ExamFinalizeJobService.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly quiz: QuizService,
  ) {}

  @Cron('*/1 * * * *')
  async tick() {
    if (this.running) return; // aynı replikada üst üste binmesin
    this.running = true;
    try {
      await this.drain(50);
    } finally {
      this.running = false;
    }
  }

  async drain(limit: number) {
    const jobs = await this.prisma.examFinalizeJob.findMany({
      where: { processedAt: null, attempts: { lt: 5 } },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    if (jobs.length === 0) return 0;
    let ok = 0;
    for (const j of jobs) {
      try {
        await this.quiz.runFinalizeJob(j.userId, j.sessionId);
        await this.prisma.examFinalizeJob.update({
          where: { sessionId: j.sessionId },
          data: { processedAt: new Date(), attempts: { increment: 1 }, lastError: null },
        });
        ok++;
      } catch (e) {
        await this.prisma.examFinalizeJob.update({
          where: { sessionId: j.sessionId },
          data: { attempts: { increment: 1 }, lastError: (e as Error).message.slice(0, 500) },
        });
      }
    }
    this.logger.log(`Deneme teslim işi: ${ok}/${jobs.length}`);
    return ok;
  }
}

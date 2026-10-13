import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ProgressService } from '../progress/progress.service';
import { BAYAT_TUR_GUN, turuTerkEt } from './yarim-tur';

/** Bir koşuda en çok bu kadar tur kapatılır (birikim betikle eritildi — B-5). */
const KOSU_SINIRI = 500;

/**
 * Bayat yarım tur kapanışı (Doc 48 B-4). Her gün 05.00 TR (uygulama günü
 * 04.00'te döndükten sonra): son cevabı 7 günden eski alıştırma/yanlış/günlük
 * turları kapatır; çözülen cevaplar emek olarak ilerlemeye yazılır (tek aktif
 * tur ile aynı çekirdek, yarim-tur.ts). Böylece "yarım tur" ekranda haftalarca
 * asılı kalmaz ve yarıda kalan emek kaybolmaz.
 */
@Injectable()
export class YarimTurService {
  private readonly logger = new Logger(YarimTurService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly progress: ProgressService,
  ) {}

  @Cron('0 5 * * *', { timeZone: 'Europe/Istanbul' })
  async bayatTurlariKapat(): Promise<{ kapanan: number; cevap: number }> {
    const bayat = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT qs.id
      FROM quiz_sessions qs
      LEFT JOIN LATERAL (
        SELECT max(qa.answered_at) AS son FROM quiz_answers qa WHERE qa.session_id = qs.id
      ) a ON true
      WHERE qs.status = 'in_progress'
        AND qs.mode IN ('practice', 'review', 'daily')
        AND COALESCE(a.son, qs.started_at) < now() - make_interval(days => ${BAYAT_TUR_GUN})
      ORDER BY COALESCE(a.son, qs.started_at)
      LIMIT ${KOSU_SINIRI}`;
    let kapanan = 0;
    let cevap = 0;
    for (const { id } of bayat) {
      try {
        const r = await turuTerkEt(this.prisma, this.progress, id);
        if (r.kapandi) {
          kapanan += 1;
          cevap += r.cevap;
        }
      } catch (e) {
        // Tek turun hatası koşuyu durdurmaz; ertesi gün yeniden denenir.
        this.logger.warn(`Yarım tur kapatılamadı (${id}): ${(e as Error).message}`);
      }
    }
    if (kapanan > 0) this.logger.log(`Bayat yarım tur kapandı: ${kapanan} tur, ${cevap} cevap işlendi.`);
    return { kapanan, cevap };
  }
}

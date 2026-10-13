import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { haftaBasi } from '../../common/gun';

/**
 * Haftalık konu ustalığı fotoğrafı (Doc 19 §3.2). Her Pazartesi 04:30 (TR)
 * user_topic_progress'in o anki halini topic_mastery_snapshots'a kopyalar.
 * Trend kartı ("bu hafta %12 arttı") bu hafta ile geçen haftanın
 * fotoğraflarını karşılaştırır; ileride AI koç zaman serisi olarak okur.
 */
@Injectable()
export class SnapshotService {
  private readonly logger = new Logger(SnapshotService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Uygulama haftası Pazartesi TR 04.00'te döner (Doc 48 D2): 03.00'te çalışsaydı
  // fotoğraf ÖNCEKİ haftaya yazılırdı. 04.30 — sınırdan yarım saat sonra.
  @Cron('30 4 * * 1', { timeZone: 'Europe/Istanbul' })
  async weeklyCron() {
    const count = await this.captureWeek();
    this.logger.log(`Haftalık mastery fotoğrafı alındı: ${count} satır.`);
  }

  /**
   * Bu uygulama haftasının (Pazartesi TR 04.00 — common/gun.ts) fotoğrafını alır.
   * Tek SQL — kullanıcı başına döngü yok; tekrar çalıştırmak güvenli
   * (ON CONFLICT DO NOTHING: hafta içi ikinci çağrı ilk fotoğrafı ezmez).
   */
  async captureWeek(weekStart = haftaBasi()): Promise<number> {
    const inserted = await this.prisma.$executeRaw`
      INSERT INTO topic_mastery_snapshots (user_id, topic_id, week_start, mastery, solved)
      SELECT user_id, topic_id, ${weekStart}::date, mastery, solved_count
      FROM user_topic_progress
      ON CONFLICT (user_id, topic_id, week_start) DO NOTHING`;
    return inserted;
  }
}

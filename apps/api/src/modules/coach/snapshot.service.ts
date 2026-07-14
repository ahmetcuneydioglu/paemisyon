import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../infra/prisma/prisma.service';

/**
 * Haftalık konu ustalığı fotoğrafı (Doc 19 §3.2). Her Pazartesi 03:00 (TR)
 * user_topic_progress'in o anki halini topic_mastery_snapshots'a kopyalar.
 * Trend kartı ("bu hafta %12 arttı") bu hafta ile geçen haftanın
 * fotoğraflarını karşılaştırır; ileride AI koç zaman serisi olarak okur.
 */
@Injectable()
export class SnapshotService {
  private readonly logger = new Logger(SnapshotService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 3 * * 1', { timeZone: 'Europe/Istanbul' })
  async weeklyCron() {
    const count = await this.captureWeek();
    this.logger.log(`Haftalık mastery fotoğrafı alındı: ${count} satır.`);
  }

  /**
   * Bu haftanın (Pazartesi başlangıç, UTC gün) fotoğrafını alır.
   * Tek SQL — kullanıcı başına döngü yok; tekrar çalıştırmak güvenli
   * (ON CONFLICT DO NOTHING: hafta içi ikinci çağrı ilk fotoğrafı ezmez).
   */
  async captureWeek(weekStart = startOfUtcWeek(new Date())): Promise<number> {
    const inserted = await this.prisma.$executeRaw`
      INSERT INTO topic_mastery_snapshots (user_id, topic_id, week_start, mastery, solved)
      SELECT user_id, topic_id, ${weekStart}::date, mastery, solved_count
      FROM user_topic_progress
      ON CONFLICT (user_id, topic_id, week_start) DO NOTHING`;
    return inserted;
  }
}

/** Pazartesi başlangıçlı UTC hafta (coach.service ile aynı konvansiyon). */
export function startOfUtcWeek(d: Date): Date {
  const day = new Date(d);
  day.setUTCHours(0, 0, 0, 0);
  const offset = (day.getUTCDay() + 6) % 7; // Pzt=0 … Paz=6
  return new Date(day.getTime() - offset * 86_400_000);
}

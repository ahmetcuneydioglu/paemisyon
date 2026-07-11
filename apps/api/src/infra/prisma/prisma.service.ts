import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Tek Prisma bağlantı noktası. Repository katmanları buradan tüketir (Doc 3).
 * DB bağlantısı yoksa uygulama yine açılır; ilk sorguda hata verir — walking skeleton için kasıtlı.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('PostgreSQL bağlantısı kuruldu.');
    } catch (err) {
      this.logger.warn(
        `PostgreSQL bağlantısı kurulamadı (DATABASE_URL ayarlı mı?). Uygulama açık kalıyor. ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

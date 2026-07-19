import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /api/v1/health — walking skeleton doğrulama noktası.
   * Uygulamanın ayakta olduğunu ve DB'ye erişebildiğini raporlar.
   */
  @Get()
  async check() {
    let database: 'up' | 'down' = 'down';
    // GEÇİCİ TEŞHİS: iki ardışık SELECT 1 süresi. dbMs1≫dbMs2 → istek-başı
    // yeniden bağlanma; ikisi de yüksek+eşit → yavaş warm round-trip (ağ yolu).
    let dbMs1: number | null = null;
    let dbMs2: number | null = null;
    try {
      const t1 = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbMs1 = Date.now() - t1;
      const t2 = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbMs2 = Date.now() - t2;
      database = 'up';
    } catch {
      database = 'down';
    }

    return {
      status: 'ok',
      service: 'paemisyon-api',
      version: '0.0.1',
      database,
      dbMs1,
      dbMs2,
      timestamp: new Date().toISOString(),
    };
  }
}

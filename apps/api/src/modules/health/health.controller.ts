import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /api/v1/health — walking skeleton doğrulama noktası.
   * Uygulamanın ayakta olduğunu ve DB'ye erişebildiğini raporlar.
   */
  @Get()
  async check(@Req() req: Request) {
    let database: 'up' | 'down' = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'up';
    } catch {
      database = 'down';
    }

    return {
      status: 'ok',
      service: 'paemisyon-api',
      version: '0.0.1',
      database,
      // Vekil zinciri teşhisi: hız sınırının GERÇEK istemciyi sayıp saymadığı
      // ancak buradan görülür (Railway edge'i X-Forwarded-For'a kendi iç
      // adresini de ekliyor mu?). Yalnız isteği yapanın kendi bilgisi döner.
      client: { ip: req.ip, forwardedFor: req.headers['x-forwarded-for'] ?? null },
      timestamp: new Date().toISOString(),
    };
  }
}

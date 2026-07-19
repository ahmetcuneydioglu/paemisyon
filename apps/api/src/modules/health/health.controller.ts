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
      timestamp: new Date().toISOString(),
    };
  }
}

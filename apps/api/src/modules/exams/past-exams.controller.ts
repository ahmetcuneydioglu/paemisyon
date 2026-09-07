import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CikmisSinavService } from '../public/cikmis-sinav.service';
import { CalismaYanlisiDto } from './dto/calisma-yanlisi.dto';

/**
 * /api/v1/cikmis-sinavlar/:slug — çıkmış sınavın TAMAMI (Doc 36).
 *
 * Public uçta dönem başına 10 soru var; o sınır arama motoru ve dönüşüm için.
 * Hesabı olan kullanıcı sınavın tamamını görür — çalışma modu. Sınav gibi
 * çözmek isteyen `/quiz/sessions` (archiveExamId) yolunu kullanır.
 */
@Controller('cikmis-sinavlar')
@UseGuards(JwtAuthGuard)
export class PastExamsController {
  constructor(private readonly service: CikmisSinavService) {}

  @Get(':slug')
  detail(@CurrentUser() user: AuthenticatedUser, @Param('slug') slug: string) {
    return this.service.detailFull(slug, user);
  }

  /// Çalışma modunda verilen yanlış cevap → yanlış defteri (7 Eyl 2026).
  /// Kota harcamaz, puan/seri işlemez; doğruluğu SUNUCU belirler.
  @Post(':slug/calisma-yanlisi')
  calismaYanlisi(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
    @Body() dto: CalismaYanlisiDto,
  ) {
    return this.service.calismaYanlisi(user.id, slug, dto);
  }
}

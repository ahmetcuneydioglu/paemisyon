import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CikmisSinavService } from '../public/cikmis-sinav.service';

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
  detail(@Param('slug') slug: string) {
    return this.service.detailFull(slug);
  }
}

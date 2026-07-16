import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PublicService } from './public.service';

/// GET /api/v1/public/* — auth'suz SEO/funnel uçları (Doc 23).
/// Web'in public katmanı (ISR) bunları tüketir; kimlik gerektirmez.
@Controller('public')
export class PublicController {
  constructor(private readonly service: PublicService) {}

  @Get('question-of-day')
  questionOfDay() {
    return this.service.questionOfDay();
  }

  // Günün sorusunun cevabı — yalnız bugünkü soru için açılır (funnel istisnası).
  @Post('question-of-day/reveal')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  reveal(@Body() body: { versionId?: string; optionId?: string }) {
    return this.service.revealQuestionOfDay(body.versionId ?? '', body.optionId ?? '');
  }

  @Get('laws')
  laws() {
    return this.service.laws();
  }

  @Get('laws/:slug')
  law(@Param('slug') slug: string) {
    return this.service.lawBySlug(slug);
  }

  /** Madde detayı (Doc 25 §4). :no madde slug'ıdır: "16", "4-a", "ek-6". */
  @Get('laws/:slug/articles/:no')
  article(@Param('slug') slug: string, @Param('no') no: string) {
    return this.service.articleDetail(slug, no);
  }

  @Get('exam-types/:key')
  examTypeGuide(@Param('key') key: string) {
    return this.service.examTypeGuide(key);
  }
}

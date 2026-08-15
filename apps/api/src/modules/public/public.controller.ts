import { Body, Controller, Get, Header, Param, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MevzuatService } from './mevzuat.service';
import { PublicService } from './public.service';

// Public içerik yavaş değişir (admin-güdümlü). s-maxage aracı cache'lerin
// (CDN/proxy) yükü emmesini sağlar; stale-while-revalidate kesintisiz tazeler.
const CACHE_SLOW = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';
// Günün sorusu gün içinde sabit — tarayıcıda da kısa süre tutulabilir.
const CACHE_QOTD = 'public, max-age=120, s-maxage=1800, stale-while-revalidate=86400';

/// GET /api/v1/public/* — auth'suz SEO/funnel uçları (Doc 23).
/// Web'in public katmanı (ISR) bunları tüketir; kimlik gerektirmez.
@Controller('public')
export class PublicController {
  constructor(
    private readonly service: PublicService,
    private readonly mevzuat: MevzuatService,
  ) {}

  // ── Mevzuat Merkezi (Doc 29) ──
  @Get('mevzuat')
  @Header('Cache-Control', CACHE_SLOW)
  mevzuatList() {
    return this.mevzuat.list();
  }

  @Get('mevzuat/search')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300')
  mevzuatSearch(@Query('q') q?: string) {
    return this.mevzuat.search(q ?? '');
  }

  @Get('mevzuat/:slug')
  @Header('Cache-Control', CACHE_SLOW)
  mevzuatDetail(@Param('slug') slug: string) {
    return this.mevzuat.detail(slug);
  }

  @Get('mevzuat/:slug/oku')
  @Header('Cache-Control', CACHE_SLOW)
  mevzuatReader(@Param('slug') slug: string) {
    return this.mevzuat.reader(slug);
  }

  @Get('question-of-day')
  @Header('Cache-Control', CACHE_QOTD)
  questionOfDay() {
    return this.service.questionOfDay();
  }

  // Günün sorusunun cevabı — yalnız bugünkü soru için açılır (funnel istisnası).
  @Post('question-of-day/reveal')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  reveal(@Body() body: { versionId?: string; optionId?: string }) {
    return this.service.revealQuestionOfDay(body.versionId ?? '', body.optionId ?? '');
  }

  // Günün Quizi — girişsiz funnel: 10 cevapsız soru + tek-tek reveal (bugünün 10'u).
  @Get('daily-quiz')
  @Header('Cache-Control', CACHE_QOTD)
  dailyQuiz() {
    return this.service.dailyQuiz();
  }

  // Yerel bildirim tanıtımları (mobil Faz 1): önümüzdeki günlerin ilk soru özeti.
  @Get('daily-quiz/teasers')
  @Header('Cache-Control', CACHE_QOTD)
  dailyTeasers(@Query('days') days?: string) {
    return this.service.dailyTeasers(Number(days) || 5);
  }

  @Post('daily-quiz/reveal')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  revealDaily(@Body() body: { versionId?: string; optionId?: string }) {
    return this.service.revealDailyQuiz(body.versionId ?? '', body.optionId ?? '');
  }

  /** Fiyat + ücretsiz limit — pazarlama sayfaları sayıyı gömmesin diye (Doc 27). */
  @Get('pricing')
  @Header('Cache-Control', CACHE_SLOW)
  pricing() {
    return this.service.pricing();
  }

  @Get('laws')
  @Header('Cache-Control', CACHE_SLOW)
  laws() {
    return this.service.laws();
  }

  @Get('laws/:slug')
  @Header('Cache-Control', CACHE_SLOW)
  law(@Param('slug') slug: string) {
    return this.service.lawBySlug(slug);
  }

  /** Kanunu oku: tüm yayınlanmış maddeler, sırayla, tam metin (okuma katmanı). */
  @Get('laws/:slug/read')
  @Header('Cache-Control', CACHE_SLOW)
  lawReading(@Param('slug') slug: string) {
    return this.service.lawReading(slug);
  }

  /** Madde detayı (Doc 25 §4). :no madde slug'ıdır: "16", "4-a", "ek-6". */
  @Get('laws/:slug/articles/:no')
  @Header('Cache-Control', CACHE_SLOW)
  article(@Param('slug') slug: string, @Param('no') no: string) {
    return this.service.articleDetail(slug, no);
  }

  @Get('exam-types/:key')
  @Header('Cache-Control', CACHE_SLOW)
  examTypeGuide(@Param('key') key: string) {
    return this.service.examTypeGuide(key);
  }
}

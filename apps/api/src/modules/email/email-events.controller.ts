import { Controller, Header, HttpCode, Post, Req } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { EmailEventsService } from './email-events.service';

/**
 * SES → SNS → buraya. SNS gövdeyi text/plain gönderir; main.ts bu yol için
 * metin ayrıştırıcı takar. Yanıt 2xx olmazsa SNS yeniden dener; bu yüzden
 * doğrulanmış ama işlenemeyen olayda hata fırlatılır (SNS tekrar getirir),
 * doğrulanmayan mesajda 403 döner.
 */
@Controller('email')
export class EmailEventsController {
  constructor(private readonly events: EmailEventsService) {}

  @Post('ses-events')
  @SkipThrottle()
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  async sesEvents(@Req() req: Request) {
    return this.events.handleSns(req.body);
  }
}

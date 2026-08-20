import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { BillingService } from './billing.service';

/** Pub/Sub push zarfı: veri base64'tür ve İÇERİĞİNE GÜVENİLMEZ (bkz. servis). */
interface PubSubPush {
  message?: { data?: string; messageId?: string };
  subscription?: string;
}

/**
 * Google Play RTDN ucu — Pub/Sub push aboneliği çağırır, kullanıcı JWT'si YOK.
 *
 * Kimlik doğrulama: Pub/Sub push URL'sine gizli bir `token` sorgu parametresi
 * konur (GOOGLE_RTDN_SECRET). Ayrıca gövdeye ASLA güvenilmez: bildirimdeki
 * purchaseToken Google API'ye yeniden sorulur ve durum oradan türetilir.
 *
 * Play Console → Monetization setup → Real-time developer notifications:
 *   https://api.paemisyon.com/api/v1/billing/google/notifications?token=<secret>
 */
@Controller('billing/google')
export class GoogleNotificationsController {
  private readonly logger = new Logger(GoogleNotificationsController.name);

  constructor(private readonly billing: BillingService) {}

  @Post('notifications')
  @HttpCode(200)
  async notifications(@Query('token') token: string, @Body() body: PubSubPush) {
    // GÜVENLİK: gizli anahtar YOKSA uç KAPALIDIR (fail-closed). Eskiden
    // `if (secret && ...)` yazıyordu; env unutulunca kimlik doğrulaması
    // sessizce devre dışı kalıyor ve uç herkese açık hale geliyordu —
    // sahte bir "iade" bildirimi kullanıcının premium'unu düşürebilirdi.
    const secret = process.env.GOOGLE_RTDN_SECRET;
    if (!secret) {
      this.logger.error(
        'GOOGLE_RTDN_SECRET tanımsız — Play bildirimleri REDDEDİLİYOR. ' +
          'Env değişkenini ekleyin, yoksa abonelik durumu güncellenmez.',
      );
      throw new UnauthorizedException('Bildirim ucu yapılandırılmadı.');
    }
    if (token !== secret) {
      throw new UnauthorizedException('Geçersiz bildirim jetonu.');
    }
    const data = body?.message?.data;
    if (!data) {
      throw new BadRequestException('Pub/Sub mesajı boş.');
    }
    return this.billing.handleGoogleNotification(data);
  }
}

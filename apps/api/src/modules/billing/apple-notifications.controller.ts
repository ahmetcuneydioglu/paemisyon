import { BadRequestException, Body, Controller, HttpCode, Post } from '@nestjs/common';
import { BillingService } from './billing.service';

/**
 * App Store Server Notifications v2 ucu — Apple çağırır, kullanıcı JWT'si YOK.
 * Güvenlik gövdedeki signedPayload'ın Apple sertifika zincirine karşı
 * doğrulanmasıyla sağlanır (AppleVerifier). Geçersiz imza 4xx ile reddedilir.
 *
 * ASC yapılandırması: App Information → App Store Server Notifications →
 * Production/Sandbox URL: https://api.paemisyon.com/api/v1/billing/apple/notifications
 */
@Controller('billing/apple')
export class AppleNotificationsController {
  constructor(private readonly billing: BillingService) {}

  @Post('notifications')
  @HttpCode(200)
  async notifications(@Body() body: { signedPayload?: string }) {
    if (!body?.signedPayload || typeof body.signedPayload !== 'string') {
      throw new BadRequestException('signedPayload eksik.');
    }
    return this.billing.handleAppleNotification(body.signedPayload);
  }
}

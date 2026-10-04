import { Body, Controller, Get, Header, Param, Post, Put, Query, Redirect } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EmailCampaignsService } from './email-campaigns.service';
import { EmailContactsService } from './email-contacts.service';
import { EMAIL_CONFIG } from './email.config';
import { isTrackableUrl } from './email-render';
import { UpdatePreferencesDto } from './dto/email.dto';

/**
 * Oturumsuz uçlar: çıkış, tercih ve tıklama yönlendirmesi. Kimlik yalnız rastgele belirteçtir; yanıtlar
 * adresi maskeli verir, geçersiz belirteçte tek tip 404.
 */
@Controller('email')
export class EmailPublicController {
  constructor(
    private readonly contacts: EmailContactsService,
    private readonly campaigns: EmailCampaignsService,
  ) {}

  /**
   * Kampanya bağlantısı: tıklamayı kaydeder, hedefe 302 ile gönderir. Hedef yalnız
   * paemisyon.com ve marka hesapları (açık yönlendirici değil); liste dışı hedef siteye düşer.
   * Kayıt hatası yönlendirmeyi asla bozmaz.
   */
  @Get('c/:sendId')
  @Throttle({ default: { ttl: 60_000, limit: 120 } })
  @Header('Cache-Control', 'no-store')
  @Redirect()
  async click(@Param('sendId') sendId: string, @Query('u') u?: string) {
    if (!u || !isTrackableUrl(u)) return { url: EMAIL_CONFIG.publicBaseUrl, statusCode: 302 };
    await this.campaigns.recordClick(sendId, u).catch(() => undefined);
    return { url: u, statusCode: 302 };
  }

  /** RFC 8058 tek tık (Gmail/Yahoo "Abonelikten çık" düğmesi POST eder). */
  @Post('unsubscribe/:token')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Header('Cache-Control', 'no-store')
  oneClick(@Param('token') token: string, @Query('c') campaignId?: string) {
    return this.contacts.unsubscribeAll(token, 'one_click', campaignId || null);
  }

  /** Tek tık desteklemeyen istemci başlıktaki adresi GET ile açarsa tercih sayfasına gider. */
  @Get('unsubscribe/:token')
  @Redirect()
  openPreferences(@Param('token') token: string) {
    return { url: this.contacts.preferencesUrl(token), statusCode: 302 };
  }

  @Get('preferences/:token')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @Header('Cache-Control', 'no-store')
  preferences(@Param('token') token: string) {
    return this.contacts.preferences(token);
  }

  @Put('preferences/:token')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Header('Cache-Control', 'no-store')
  update(@Param('token') token: string, @Body() body: UpdatePreferencesDto) {
    return this.contacts.updatePreferences(token, body);
  }
}

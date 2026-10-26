import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { App, cert, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { NOTIFICATIONS_CONFIG, notificationsProvider } from './notifications.config';

export type PushMessage = {
  token: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  /** Mobil rota sözlüğü (data.route) — apps/app deep-links.ts çevirir. */
  route?: string | null;
  /** Web tıklama hedefi (tam yol); FCM webpush.fcmOptions.link. */
  webPath?: string | null;
  data?: Record<string, string>;
};

export type PushResult = {
  token: string;
  ok: boolean;
  messageId?: string;
  code?: string;
  permanent?: boolean;
};

/**
 * FCM istemcisi (Doc 52 §3). Gönderim YALNIZ DeliveryWorker'dan çağrılır;
 * üreticiler NotificationsService.enqueue kullanır. Kimlik:
 * FIREBASE_SERVICE_ACCOUNT_B64 (platform paneli). Env yoksa sessizce kapalı.
 * Geçersiz token (not-registered / invalid-argument) pasifleştirilir.
 */
@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private app: App | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
    if (!b64) {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT_B64 yok — push gönderimi devre dışı.');
      return;
    }
    try {
      const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
      this.app = initializeApp({ credential: cert(json) });
      this.logger.log(`FCM hazır (proje: ${json.project_id}).`);
    } catch (e) {
      this.logger.error(`Firebase kimliği çözülemedi: ${(e as Error).message}`);
    }
  }

  get enabled(): boolean {
    return this.app !== null || notificationsProvider() === 'console';
  }

  /** Web tıklama hedefi; `nid` ile web kabuğu `opened` olayını yazar (Doc 52 §9). */
  private webLink(webPath?: string | null, notificationId?: string): string {
    const taban = (process.env.WEB_BASE_URL ?? 'https://paemisyon.com').replace(/\/$/, '');
    const p = webPath && webPath.startsWith('/') && !webPath.startsWith('//') ? webPath : '/bugun';
    if (!notificationId) return `${taban}${p}`;
    return `${taban}${p}${p.includes('?') ? '&' : '?'}nid=${encodeURIComponent(notificationId)}`;
  }

  /** Cihaz token'ını kullanıcıya bağla (upsert — cihazda hesap değişirse taşınır).
   *  Aynı deviceId'nin eski token'ı pasifleşir (stale). */
  async registerToken(
    userId: string,
    token: string,
    platform: string,
    extra: { deviceId?: string; appVersion?: string } = {},
  ) {
    await this.prisma.pushToken.upsert({
      where: { token },
      update: {
        userId,
        platform,
        isActive: true,
        disabledReason: null,
        lastSeenAt: new Date(),
        ...(extra.deviceId ? { deviceId: extra.deviceId } : {}),
        ...(extra.appVersion ? { appVersion: extra.appVersion } : {}),
      },
      create: {
        token,
        userId,
        platform,
        deviceId: extra.deviceId ?? null,
        appVersion: extra.appVersion ?? null,
      },
    });
    if (extra.deviceId) {
      await this.prisma.pushToken.updateMany({
        where: { deviceId: extra.deviceId, token: { not: token }, isActive: true },
        data: { isActive: false, disabledReason: 'stale' },
      });
    }
    return { ok: true };
  }

  /** Çıkış: satır silinir (mevcut davranış; KVKK — cihaz hesaptan ayrılır). */
  async removeToken(userId: string, token: string) {
    await this.prisma.pushToken.deleteMany({ where: { token, userId } });
    return { ok: true };
  }

  /** Teslim satırları için toplu gönderim; 500'lük parçalar, sonuç satır sırasında. */
  async sendBatch(messages: PushMessage[]): Promise<PushResult[]> {
    if (messages.length === 0) return [];
    if (notificationsProvider() === 'console') {
      for (const m of messages)
        this.logger.log(`[console push] ${m.token.slice(0, 12)}… "${m.title}" — ${m.body}`);
      return messages.map((m) => ({ token: m.token, ok: true, messageId: 'console' }));
    }
    if (!this.app)
      return messages.map((m) => ({
        token: m.token,
        ok: false,
        code: 'not_configured',
        permanent: false,
      }));
    const out: PushResult[] = [];
    const dead: string[] = [];
    for (let i = 0; i < messages.length; i += NOTIFICATIONS_CONFIG.fcmChunk) {
      const chunk = messages.slice(i, i + NOTIFICATIONS_CONFIG.fcmChunk);
      const res = await getMessaging(this.app).sendEach(
        chunk.map((m) => ({
          token: m.token,
          notification: {
            title: m.title,
            body: m.body,
            ...(m.imageUrl ? { imageUrl: m.imageUrl } : {}),
          },
          data: { ...(m.data ?? {}), ...(m.route ? { route: m.route } : {}) },
          apns: { payload: { aps: { sound: 'default' } } },
          webpush: {
            fcmOptions: { link: this.webLink(m.webPath, m.data?.notificationId) },
            notification: { icon: '/apple-touch-icon.png' },
          },
        })),
      );
      res.responses.forEach((r, j) => {
        const code = r.error?.code ?? '';
        const permanent =
          code.includes('registration-token-not-registered') ||
          code.includes('invalid-argument') ||
          code.includes('sender-id-mismatch');
        if (!r.success && permanent) dead.push(chunk[j].token);
        out.push({
          token: chunk[j].token,
          ok: r.success,
          messageId: r.messageId,
          code: r.success ? undefined : code || 'unknown',
          permanent,
        });
      });
    }
    if (dead.length)
      await this.prisma.pushToken.updateMany({
        where: { token: { in: dead } },
        data: { isActive: false, disabledReason: 'not_registered', lastErrorAt: new Date() },
      });
    return out;
  }
}

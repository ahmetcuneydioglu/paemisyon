import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { App, cert, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { PrismaService } from '../../infra/prisma/prisma.service';

/**
 * FCM push göndericisi (Faz 2). Kimlik: FIREBASE_SERVICE_ACCOUNT_B64 env'i
 * (service-account JSON'unun base64'ü — yalnız platform paneline girilir).
 * Env yoksa servis SESSİZCE devre dışı kalır: token kaydı çalışır, gönderim
 * "yapılandırılmadı" hatası döner — uygulama/panel kırılmaz.
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
    return this.app !== null;
  }

  /** Cihaz token'ını kullanıcıya bağla (upsert — cihazda hesap değişirse taşınır). */
  async registerToken(userId: string, token: string, platform: string) {
    await this.prisma.pushToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { token, userId, platform },
    });
    return { ok: true };
  }

  async removeToken(userId: string, token: string) {
    // Yalnız kendi token'ını silebilir.
    await this.prisma.pushToken.deleteMany({ where: { token, userId } });
    return { ok: true };
  }

  /** Tek kullanıcının TÜM cihazlarına bildirim (kişiye özel metinle).
   *  Geçersiz token'lar silinir. */
  async sendToUser(
    userId: string,
    params: { title: string; body: string; route?: string },
  ) {
    if (!this.app) {
      return { ok: false, error: 'Push yapılandırılmadı (FIREBASE_SERVICE_ACCOUNT_B64).' };
    }
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId },
      select: { token: true },
    });
    if (tokens.length === 0) return { ok: true, sent: 0 };

    const res = await getMessaging(this.app).sendEachForMulticast({
      tokens: tokens.map((t) => t.token),
      notification: { title: params.title, body: params.body },
      data: params.route ? { route: params.route } : {},
      apns: { payload: { aps: { sound: 'default' } } },
    });
    const dead: string[] = [];
    res.responses.forEach((r, j) => {
      const code = r.error?.code ?? '';
      if (
        !r.success &&
        (code.includes('registration-token-not-registered') ||
          code.includes('invalid-argument'))
      ) {
        dead.push(tokens[j].token);
      }
    });
    if (dead.length > 0) {
      await this.prisma.pushToken.deleteMany({ where: { token: { in: dead } } });
    }
    return { ok: true, sent: res.successCount };
  }

  /** Tüm cihazlara bildirim. [data.route] mobilde derin bağlantıya çevrilir.
   *  Metinde {ad} geçerse her kullanıcının adıyla KİŞİSELLEŞTİRİLİR
   *  ("Merhaba Ahmet, günün quizini unutma"). Geçersiz token'lar silinir. */
  async sendToAll(params: {
    title: string;
    body: string;
    route?: string;
    /** 'inactive-today': yalnız BUGÜN hiç soru çözmemiş kullanıcılar
     *  (seri hatırlatması — işini bitirmiş kullanıcı rahatsız edilmez). */
    audience?: 'all' | 'inactive-today';
  }) {
    if (!this.app) {
      return { ok: false, error: 'Push yapılandırılmadı (FIREBASE_SERVICE_ACCOUNT_B64).' };
    }
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tokens = await this.prisma.pushToken.findMany({
      where:
        params.audience === 'inactive-today'
          ? {
              user: {
                quizSessions: {
                  none: { answers: { some: { answeredAt: { gte: today } } } },
                },
              },
            }
          : undefined,
      select: { token: true, user: { select: { displayName: true } } },
    });
    if (tokens.length === 0) return { ok: true, sent: 0, failed: 0 };

    const personalize = params.title.includes('{ad}') || params.body.includes('{ad}');
    const fill = (tpl: string, name: string) => tpl.replaceAll('{ad}', name);
    const firstName = (dn: string | null | undefined) =>
      (dn ?? '').trim().split(/\s+/)[0] || 'Aday';

    let sent = 0;
    const dead: string[] = [];
    const CHUNK = 500; // FCM istek sınırı (multicast ve sendEach için aynı)
    for (let i = 0; i < tokens.length; i += CHUNK) {
      const chunk = tokens.slice(i, i + CHUNK);
      const data: Record<string, string> = params.route ? { route: params.route } : {};
      const base = {
        data,
        apns: { payload: { aps: { sound: 'default' } } },
      };
      const res = personalize
        ? await getMessaging(this.app).sendEach(
            chunk.map((t) => ({
              token: t.token,
              notification: {
                title: fill(params.title, firstName(t.user.displayName)),
                body: fill(params.body, firstName(t.user.displayName)),
              },
              ...base,
            })),
          )
        : await getMessaging(this.app).sendEachForMulticast({
            tokens: chunk.map((t) => t.token),
            notification: { title: params.title, body: params.body },
            ...base,
          });
      res.responses.forEach((r: { success: boolean; error?: { code?: string } }, j: number) => {
        if (r.success) {
          sent++;
        } else {
          const code = r.error?.code ?? '';
          if (
            code.includes('registration-token-not-registered') ||
            code.includes('invalid-argument')
          ) {
            dead.push(chunk[j].token);
          }
        }
      });
    }
    if (dead.length > 0) {
      await this.prisma.pushToken.deleteMany({ where: { token: { in: dead } } });
    }
    this.logger.log(`Push: ${sent} gönderildi, ${dead.length} ölü token temizlendi.`);
    return { ok: true, sent, failed: tokens.length - sent, cleaned: dead.length };
  }
}

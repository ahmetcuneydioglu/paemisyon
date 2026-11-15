import { Injectable, Logger } from '@nestjs/common';
import { SignJWT, decodeJwt, importPKCS8 } from 'jose';

/**
 * Hesap silinirken "Apple ile Giriş" bağlantısını Apple tarafında da iptal eder
 * (App Store İnceleme Yönergeleri 5.1.1(v): Apple ile girişli hesap silinince token
 * iptal edilmeli). Supabase Apple yenileme jetonunu saklamadığı için istemci silme
 * anında taze bir yetki kodu (authorizationCode) alır; burada kod jetona çevrilip
 * iptal edilir.
 *
 * İptal EN İYİ ÇABADIR: başarısız olsa da hesap silinir (KVKK silme hakkı Apple'a
 * bağlanamaz); sonuç günlüğe ve yanıta yazılır.
 *
 * Ortam (Railway): APPLE_SIWA_KEY_ID + APPLE_SIWA_PRIVATE_KEY ("Sign in with Apple"
 * yetkili .p8; satır sonları \n olarak yazılabilir). Takım ve istemci kimliğinin
 * varsayılanı uygulamanınkidir (APPLE_SIWA_TEAM_ID, APPLE_SIWA_CLIENT_ID ile değişir).
 */
export type AppleRevokeResult = 'revoked' | 'skipped' | 'not_configured' | 'failed';

const APPLE_ISSUER = 'https://appleid.apple.com';
const DEFAULT_TEAM_ID = '3U4QPG9Q82';
const DEFAULT_CLIENT_ID = 'com.paemisyon.paemisyon';

@Injectable()
export class AppleRevokeService {
  private readonly logger = new Logger(AppleRevokeService.name);

  /** Testler ağ yerine sahte yanıt verir. */
  fetchImpl: typeof fetch = (...args) => fetch(...args);

  private config() {
    const keyId = process.env.APPLE_SIWA_KEY_ID?.trim();
    const privateKey = process.env.APPLE_SIWA_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
    if (!keyId || !privateKey) return null;
    return {
      keyId,
      privateKey,
      teamId: process.env.APPLE_SIWA_TEAM_ID?.trim() || DEFAULT_TEAM_ID,
      clientId: process.env.APPLE_SIWA_CLIENT_ID?.trim() || DEFAULT_CLIENT_ID,
    };
  }

  /** Apple'ın istemci sırrı: .p8 ile ES256 imzalı kısa ömürlü JWT. */
  private async clientSecret(c: NonNullable<ReturnType<AppleRevokeService['config']>>) {
    const key = await importPKCS8(c.privateKey, 'ES256');
    return new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: c.keyId })
      .setIssuer(c.teamId)
      .setSubject(c.clientId)
      .setAudience(APPLE_ISSUER)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(key);
  }

  private async post(path: string, body: Record<string, string>) {
    return this.fetchImpl(`${APPLE_ISSUER}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body).toString(),
    });
  }

  /**
   * @param authorizationCode istemcinin silme anında aldığı Apple yetki kodu
   * @param expectedSub hesabın Supabase'teki Apple kimliği (sub). Kod başka bir Apple
   *   kimliğine aitse (cihazda farklı Apple hesabı) iptal yapılmaz.
   */
  async revoke(authorizationCode: string, expectedSub: string | null): Promise<AppleRevokeResult> {
    const c = this.config();
    if (!c) {
      this.logger.warn(
        'Apple bağlantı iptali atlandı: APPLE_SIWA_KEY_ID/PRIVATE_KEY tanımlı değil.',
      );
      return 'not_configured';
    }
    try {
      const secret = await this.clientSecret(c);
      const tokenRes = await this.post('/auth/token', {
        client_id: c.clientId,
        client_secret: secret,
        code: authorizationCode,
        grant_type: 'authorization_code',
      });
      if (!tokenRes.ok) {
        this.logger.warn(
          `Apple yetki kodu çevrilemedi: ${tokenRes.status} ${await tokenRes.text()}`,
        );
        return 'failed';
      }
      const tokens = (await tokenRes.json()) as {
        refresh_token?: string;
        access_token?: string;
        id_token?: string;
      };

      const sub = tokens.id_token ? (decodeJwt(tokens.id_token).sub ?? null) : null;
      if (expectedSub && sub && sub !== expectedSub) {
        this.logger.warn(
          'Apple bağlantı iptali atlandı: yetki kodu hesabın Apple kimliğine ait değil.',
        );
        return 'skipped';
      }

      const token = tokens.refresh_token ?? tokens.access_token;
      if (!token) {
        this.logger.warn('Apple yanıtında iptal edilecek jeton yok.');
        return 'failed';
      }
      const revokeRes = await this.post('/auth/revoke', {
        client_id: c.clientId,
        client_secret: secret,
        token,
        token_type_hint: tokens.refresh_token ? 'refresh_token' : 'access_token',
      });
      if (!revokeRes.ok) {
        this.logger.warn(
          `Apple bağlantı iptali başarısız: ${revokeRes.status} ${await revokeRes.text()}`,
        );
        return 'failed';
      }
      return 'revoked';
    } catch (e) {
      this.logger.warn(
        `Apple bağlantı iptali hatası: ${e instanceof Error ? e.message : String(e)}`,
      );
      return 'failed';
    }
  }
}

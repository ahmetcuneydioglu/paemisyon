import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SignJWT, importPKCS8 } from 'jose';

/** Play satın almasından çıkarılan normalize alanlar (Apple ile aynı sözleşme). */
export interface VerifiedPlayPurchase {
  productId: string;
  /** Kalıcı kimlik: purchaseToken. Abonelik yenilemelerinde DEĞİŞMEZ. */
  purchaseToken: string;
  expiresDate: Date | null;
  /** İade/geri alma anı — doluysa erişim geri çekilmiştir. */
  revocationDate: Date | null;
  /** 'Production' | 'Test' — Apple verifier'ın environment alanıyla aynı rol. */
  environment: string;
  /** Abonelik mi tek seferlik ürün mü doğrulandı. */
  kind: 'subscription' | 'product';
}

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id?: string;
}

/**
 * Google Play satın alma doğrulaması (Doc 15 — Apple tarafının karşılığı).
 *
 * GÜVEN SUNUCUDA: istemciden gelen purchaseToken, Google Play Developer API'ye
 * sorularak doğrulanır; istemcinin ilettiği hiçbir alana (fiyat, süre, durum)
 * güvenilmez. Kimlik: GOOGLE_PLAY_SERVICE_ACCOUNT_B64 (base64 service account
 * JSON). Erişim jetonu JWT ile alınır — ek bağımlılık yok (jose zaten var).
 */
@Injectable()
export class GooglePlayVerifier {
  private readonly logger = new Logger(GooglePlayVerifier.name);
  private readonly packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.paemisyon.paemisyon';
  private account: ServiceAccount | null = null;
  private token: { value: string; expiresAt: number } | null = null;

  constructor() {
    const b64 = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_B64;
    if (!b64) {
      this.logger.warn(
        'GOOGLE_PLAY_SERVICE_ACCOUNT_B64 yok — Play satın alma doğrulaması devre dışı.',
      );
      return;
    }
    try {
      this.account = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) as ServiceAccount;
      this.logger.log(`Play doğrulayıcı hazır (${this.account.client_email}).`);
    } catch (e) {
      this.logger.error(`Play servis hesabı çözülemedi: ${(e as Error).message}`);
    }
  }

  get enabled(): boolean {
    return this.account !== null;
  }

  /** Servis hesabı JWT'siyle erişim jetonu al; süresi dolana dek önbellekte tut. */
  private async accessToken(): Promise<string> {
    if (!this.account) {
      // 401 DEĞİL: istemci 401'i oturum hatası sayıp kullanıcıyı çıkarır (15 Kas 2026 denetimi).
      throw new ServiceUnavailableException('Play doğrulaması yapılandırılmadı.');
    }
    // 60 sn emniyet payı: sınırda kalan jetonla istek atıp 401 yeme.
    if (this.token && this.token.expiresAt - 60_000 > Date.now()) {
      return this.token.value;
    }

    const key = await importPKCS8(this.account.private_key.replace(/\\n/g, '\n'), 'RS256');
    const now = Math.floor(Date.now() / 1000);
    const assertion = await new SignJWT({
      scope: 'https://www.googleapis.com/auth/androidpublisher',
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(this.account.client_email)
      .setAudience('https://oauth2.googleapis.com/token')
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(key);

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });
    if (!res.ok) {
      this.logger.error(`Play erişim jetonu alınamadı (${res.status}): ${await res.text()}`);
      throw new ServiceUnavailableException('Google Play doğrulaması geçici olarak yapılamıyor.');
    }
    const body = (await res.json()) as { access_token: string; expires_in: number };
    this.token = {
      value: body.access_token,
      expiresAt: Date.now() + body.expires_in * 1000,
    };
    return this.token.value;
  }

  private async call(path: string): Promise<Record<string, unknown>> {
    const res = await fetch(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${this.packageName}/${path}`,
      { headers: { Authorization: `Bearer ${await this.accessToken()}` } },
    );
    if (res.status === 404 || res.status === 400) {
      // Google, bilinmeyen/çürük token'a 404/400 döner: bu KALICI geçersizliktir.
      throw new BadRequestException('Satın alma Google Play tarafında bulunamadı.');
    }
    if (!res.ok) {
      // 401/403/429/5xx: bizim kimliğimiz ya da Google tarafı — satın alma geçersiz değil.
      // 503: istemci işlemi açık tutar ve yeniden dener (401 kullanıcıyı çıkarırdı).
      this.logger.error(`Play doğrulaması başarısız (${res.status}).`);
      throw new ServiceUnavailableException('Google Play doğrulaması geçici olarak yapılamıyor.');
    }
    return (await res.json()) as Record<string, unknown>;
  }

  /** Abonelik (subscriptionsv2): durum + bitiş tarihi lineItems'tan gelir. */
  async verifySubscription(purchaseToken: string): Promise<VerifiedPlayPurchase> {
    const d = await this.call(`purchases/subscriptionsv2/tokens/${purchaseToken}`);
    const state = String(d.subscriptionState ?? '');
    const items = (d.lineItems as { productId?: string; expiryTime?: string }[]) ?? [];
    // Birden çok satır olabilir (yükseltme anı); en GEÇ biten geçerlidir.
    const latest = items
      .map((i) => ({
        productId: i.productId ?? '',
        exp: i.expiryTime ? new Date(i.expiryTime) : null,
      }))
      .sort((a, b) => (b.exp?.getTime() ?? 0) - (a.exp?.getTime() ?? 0))[0];

    // Ödemesi henüz onaylanmamış abonelik premium AÇMAZ (15 Kas 2026 denetimi bulgu 4:
    // yalnız günlüğe yazılıyordu, bitiş yoksa "süresiz aktif" sayılıyordu). 409: istemci işlemi
    // kapatmaz; ödeme onaylanınca mağaza işlemi yeniden yollar.
    if (state === 'SUBSCRIPTION_STATE_PENDING') {
      throw new ConflictException(
        'Ödemen henüz onaylanmadı; onaylanınca premium kendiliğinden açılır.',
      );
    }

    // İptal edilmiş abonelik dönem sonuna kadar GEÇERLİDİR: erişim süre dolunca kapanır ve
    // bunu expiresDate taşır. İADE ayrı bir olaydır — RTDN'den voidedPurchase ile gelir.
    // Abonelikte bitiş tarihi YOKSA erişim yoktur: null, grant()'ta "süresiz" (ömürlük)
    // anlamına geldiği için burada "şimdi bitti"ye çevrilir.
    let expiresDate = latest?.exp ?? null;
    if (!expiresDate) {
      this.logger.warn(
        `Abonelikte bitiş tarihi yok (durum ${state}): ${purchaseToken.slice(0, 12)}…`,
      );
      expiresDate = new Date();
    }

    return {
      productId: latest?.productId ?? '',
      purchaseToken,
      expiresDate,
      revocationDate: null,
      environment: d.testPurchase != null ? 'Test' : 'Production',
      kind: 'subscription',
    };
  }

  /** Tek seferlik ürün (ömürlük): purchaseState 0=satın alındı, 1=iptal/iade, 2=beklemede. */
  async verifyProduct(productId: string, purchaseToken: string): Promise<VerifiedPlayPurchase> {
    const d = await this.call(`purchases/products/${productId}/tokens/${purchaseToken}`);
    const state = Number(d.purchaseState ?? 1);
    // Beklemedeki (ödenmemiş) ürün eskiden aktif ömürlük sayılıyordu (bulgu 4).
    if (state === 2) {
      throw new ConflictException(
        'Ödemen henüz onaylanmadı; onaylanınca premium kendiliğinden açılır.',
      );
    }
    return {
      productId,
      purchaseToken,
      expiresDate: null, // ömürlük: süresi yok
      // Yalnız 0 satın alınmıştır; 1 ve bilinmeyen değerler erişim vermez.
      revocationDate: state === 0 ? null : new Date(),
      environment: d.purchaseType === 0 ? 'Test' : 'Production',
      kind: 'product',
    };
  }
}

import { X509Certificate } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  Environment,
  SignedDataVerifier,
  VerificationException,
  VerificationStatus,
} from '@apple/app-store-server-library';
import { APPLE_ROOT_CA_G3_PEM } from './apple-root-ca-g3';

/** StoreKit 2 imzalı işleminden çıkarılan normalize alanlar (Doc 15). */
export interface VerifiedTransaction {
  productId: string;
  originalTransactionId: string;
  transactionId: string;
  expiresDate: Date | null;
  /** İade/geri alma tarihi — doluysa erişim geri çekilmiştir (REFUND/REVOKE). */
  revocationDate: Date | null;
  environment: string; // Production | Sandbox | Xcode | LocalTesting
  bundleId: string | null;
  type: string | null;
  /** Satın almada istemcinin verdiği hesap kimliği (uygulama kullanıcı id'si); 1.x işlemlerinde yok. */
  appAccountToken: string | null;
}

/** App Store Server Notification v2 gövdesi (imza doğrulandıktan sonra). */
export interface VerifiedNotification {
  notificationType: string;
  subtype: string | null;
  /** İşlem JWS'i — varsa verify() ile ayrıca doğrulanıp işlenir. */
  signedTransactionInfo: string | null;
}

/** Mağaza kaydı: com.paemisyon.paemisyon, App Store Connect uygulama kimliği 6802087692. */
const DEFAULT_BUNDLE_ID = 'com.paemisyon.paemisyon';
const DEFAULT_APP_APPLE_ID = 6802087692;

/**
 * Apple StoreKit 2 imzalı işlemini (JWS) doğrular — GÜVEN SUNUCUDA (Doc 8/15).
 *
 * Doğrulama Apple'ın resmî `@apple/app-store-server-library` SignedDataVerifier'ı ile yapılır
 * (15 Kas 2026, Fable denetimi bulgu 1): önceki elle yazılmış zincir denetimi yalnız
 * `X509Certificate.checkIssued` kullanıyordu; bu ad karşılaştırır, İMZA doğrulamaz. Sahte
 * anahtarla üretilmiş, issuer adı Apple ara sertifikasınınkiyle aynı bir leaf zinciri geçiyor
 * ve kalıcı premium açılabiliyordu. Kütüphane her halkanın imzasını doğrular, Apple OID'lerini
 * (leaf 1.2.840.113635.100.6.11.1, ara 1.2.840.113635.100.6.2.1) arar, kökü Apple Root CA
 * G3'e pinler, tarihleri işlemin imza anına göre denetler, bundleId ve ortamı eşleştirir.
 *
 * Sandbox (TestFlight / App Review) işlemleri BİLEREK kabul edilir; ortam başına ayrı
 * doğrulayıcı vardır ve imza her ikisinde de aynı sıkılıkta doğrulanır.
 *
 * Yerel Xcode StoreKit testi Apple köküne zincirlenemez; yalnız BILLING_TRUST_LOCAL_STOREKIT
 * açıkken ve production DIŞINDA kabul edilir.
 */
@Injectable()
export class AppleVerifier {
  private readonly logger = new Logger(AppleVerifier.name);
  private readonly bundleId: string;
  private readonly trustLocal: boolean;
  private readonly verifiers: Record<'Production' | 'Sandbox', SignedDataVerifier>;

  constructor() {
    // Bundle denetimi eskiden env boşsa sessizce kapanıyordu (bulgu 5); artık varsayılan
    // mağaza kaydıdır, env yalnız farklı bir kayıt için ezer.
    this.bundleId = process.env.BILLING_BUNDLE_ID || DEFAULT_BUNDLE_ID;
    const appAppleId = Number(process.env.BILLING_APP_APPLE_ID || DEFAULT_APP_APPLE_ID);

    const wantsLocal = process.env.BILLING_TRUST_LOCAL_STOREKIT === 'true';
    const isProd = process.env.NODE_ENV === 'production';
    if (wantsLocal && isProd) {
      this.logger.error(
        'BILLING_TRUST_LOCAL_STOREKIT production’da yok sayılıyor (imzasız işlem kabul edilmez).',
      );
    }
    this.trustLocal = wantsLocal && !isProd;

    const roots = AppleVerifier.rootCertificates();
    this.verifiers = {
      Production: new SignedDataVerifier(
        roots,
        false,
        Environment.PRODUCTION,
        this.bundleId,
        appAppleId,
      ),
      Sandbox: new SignedDataVerifier(roots, false, Environment.SANDBOX, this.bundleId, appAppleId),
    };
  }

  /** Güvenilen kökler (DER). Testler sahte kök vermek için bu statik yöntemi ezer. */
  static rootCertificates(): Buffer[] {
    return [new X509Certificate(APPLE_ROOT_CA_G3_PEM).raw];
  }

  decode(jws: string): { header: Record<string, unknown>; payload: Record<string, unknown> } {
    const parts = jws.split('.');
    if (parts.length !== 3) throw new BadRequestException('Geçersiz işlem verisi (JWS).');
    const seg = (s: string) =>
      JSON.parse(Buffer.from(s, 'base64url').toString('utf8')) as Record<string, unknown>;
    try {
      return { header: seg(parts[0]), payload: seg(parts[1]) };
    } catch {
      throw new BadRequestException('İşlem verisi çözülemedi.');
    }
  }

  async verify(jws: string): Promise<VerifiedTransaction> {
    // İmzasız okunan ortam yalnız HANGİ doğrulayıcının çalışacağını seçer; karar imzadan çıkar.
    const { payload } = this.decode(jws);
    const env = String(payload.environment ?? '');

    if (env === Environment.XCODE || env === Environment.LOCAL_TESTING) {
      this.assertLocalAllowed();
      return this.normalize(payload, env);
    }

    const decoded = await this.run(() => this.verifierFor(env).verifyAndDecodeTransaction(jws));
    return this.normalize(
      decoded as unknown as Record<string, unknown>,
      String(decoded.environment ?? env),
    );
  }

  /**
   * App Store Server Notification v2 zarfını (signedPayload JWS) doğrular.
   * Zarf da işlemlerle aynı Apple zincirine imzalıdır; içindeki
   * signedTransactionInfo AYRICA verify() ile doğrulanmalıdır.
   */
  async verifyNotification(signedPayload: string): Promise<VerifiedNotification> {
    const { payload } = this.decode(signedPayload);
    const data = (payload.data ?? payload.summary ?? {}) as Record<string, unknown>;
    const env = String(data.environment ?? '');

    let decoded: Record<string, unknown>;
    if (env === Environment.XCODE || env === Environment.LOCAL_TESTING) {
      this.assertLocalAllowed();
      decoded = payload;
    } else {
      decoded = (await this.run(() =>
        this.verifierFor(env).verifyAndDecodeNotification(signedPayload),
      )) as unknown as Record<string, unknown>;
    }
    const d = (decoded.data ?? {}) as Record<string, unknown>;
    return {
      notificationType: String(decoded.notificationType ?? ''),
      subtype: decoded.subtype ? String(decoded.subtype) : null,
      signedTransactionInfo: d.signedTransactionInfo ? String(d.signedTransactionInfo) : null,
    };
  }

  private verifierFor(env: string): SignedDataVerifier {
    // Bilinmeyen değer Production doğrulayıcısına düşer; orada ortam eşleşmesi reddeder.
    return env === Environment.SANDBOX ? this.verifiers.Sandbox : this.verifiers.Production;
  }

  private assertLocalAllowed() {
    if (!this.trustLocal) {
      throw new UnprocessableEntityException(
        'Yerel StoreKit işlemi kabul edilmiyor (BILLING_TRUST_LOCAL_STOREKIT kapalı).',
      );
    }
  }

  /**
   * Kütüphane hatalarını HTTP'ye eşler. 401 ASLA dönülmez: istemci 401'i oturum hatası sayıp
   * kullanıcıyı çıkarır (bulgu 3). Kalıcı ret 422 (istemci işlemi kapatır, Apple bildirimi
   * yeniden denemez); geçici arıza 503 (istemci işlemi açık tutar, Apple yeniden dener).
   */
  private async run<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      if (e instanceof VerificationException) {
        if (e.status === VerificationStatus.RETRYABLE_VERIFICATION_FAILURE) {
          throw new ServiceUnavailableException('Apple doğrulaması geçici olarak yapılamadı.');
        }
        this.logger.warn(`Apple imzası reddedildi: ${VerificationStatus[e.status]}`);
        const message =
          e.status === VerificationStatus.INVALID_APP_IDENTIFIER
            ? 'İşlem başka bir uygulamaya ait.'
            : e.status === VerificationStatus.INVALID_ENVIRONMENT
              ? 'İşlemin ortamı uyuşmuyor.'
              : 'İşlem imzası doğrulanamadı.';
        throw new UnprocessableEntityException(message);
      }
      throw e;
    }
  }

  private normalize(p: Record<string, unknown>, env: string): VerifiedTransaction {
    const num = (v: unknown) => (v == null ? null : Number(v));
    const exp = num(p.expiresDate);
    const revoked = num(p.revocationDate);
    return {
      productId: String(p.productId ?? ''),
      originalTransactionId: String(p.originalTransactionId ?? p.transactionId ?? ''),
      transactionId: String(p.transactionId ?? ''),
      expiresDate: exp ? new Date(exp) : null,
      revocationDate: revoked ? new Date(revoked) : null,
      environment: env,
      bundleId: p.bundleId ? String(p.bundleId) : null,
      type: p.type ? String(p.type) : null,
      appAccountToken: p.appAccountToken ? String(p.appAccountToken) : null,
    };
  }
}

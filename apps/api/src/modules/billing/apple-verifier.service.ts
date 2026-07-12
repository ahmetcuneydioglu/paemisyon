import { X509Certificate } from 'node:crypto';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { compactVerify, importX509 } from 'jose';
import { APPLE_ROOT_CA_G3_PEM } from './apple-root-ca-g3';

/** StoreKit 2 imzalı işleminden çıkarılan normalize alanlar (Doc 15). */
export interface VerifiedTransaction {
  productId: string;
  originalTransactionId: string;
  transactionId: string;
  expiresDate: Date | null;
  environment: string; // Production | Sandbox | Xcode | LocalTesting
  bundleId: string | null;
  type: string | null;
}

/**
 * Apple StoreKit 2 imzalı işlemini (JWS) doğrular — GÜVEN SUNUCUDA (Doc 8/15).
 * İstemciye asla güvenilmez: imza Apple'ın sertifika zincirine (Apple Root CA G3'e
 * pinlenmiş) karşı doğrulanır. Yerel Xcode StoreKit testi kök'e zincirlenemez;
 * yalnızca BILLING_TRUST_LOCAL_STOREKIT açıkken (dev) kabul edilir.
 */
@Injectable()
export class AppleVerifier {
  private readonly rootCert = new X509Certificate(APPLE_ROOT_CA_G3_PEM);
  private readonly bundleId = process.env.BILLING_BUNDLE_ID || null;
  private readonly trustLocal = process.env.BILLING_TRUST_LOCAL_STOREKIT === 'true';

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
    const { header, payload } = this.decode(jws);
    const env = String(payload.environment ?? '');
    const isLocal = env === 'Xcode' || env === 'LocalTesting';

    if (isLocal) {
      // Yerel test sertifikası Apple köküne zincirlenemez → imza doğrulanamaz.
      if (!this.trustLocal) {
        throw new UnauthorizedException(
          'Yerel StoreKit işlemi kabul edilmiyor (BILLING_TRUST_LOCAL_STOREKIT kapalı).',
        );
      }
    } else {
      await this.verifySignatureAndChain(jws, header);
      const txBundle = payload.bundleId ? String(payload.bundleId) : null;
      if (this.bundleId && txBundle && txBundle !== this.bundleId) {
        throw new UnauthorizedException('İşlem başka bir uygulamaya ait (bundleId uyuşmuyor).');
      }
    }

    return this.normalize(payload, env);
  }

  /** İmza + sertifika zinciri (Apple Root CA G3'e pinlenmiş) doğrulaması. */
  private async verifySignatureAndChain(jws: string, header: Record<string, unknown>) {
    const x5c = header.x5c;
    if (!Array.isArray(x5c) || x5c.length < 2) {
      throw new UnauthorizedException('İmza sertifika zinciri eksik.');
    }
    const chain = x5c.map((b64) => new X509Certificate(Buffer.from(String(b64), 'base64')));

    // Zincir içi bağlar: her sertifika bir üstü tarafından imzalanmış olmalı.
    for (let i = 0; i < chain.length - 1; i++) {
      if (!chain[i].checkIssued(chain[i + 1])) {
        throw new UnauthorizedException('Sertifika zinciri geçersiz.');
      }
    }

    // Zincirin tepesi PINLENMİŞ Apple Root CA G3 olmalı (ya kendisi ya onun imzaladığı).
    const top = chain[chain.length - 1];
    const topIsRoot = top.raw.equals(this.rootCert.raw);
    if (!topIsRoot && !top.checkIssued(this.rootCert)) {
      throw new UnauthorizedException('Zincir Apple Root CA G3\'e ulaşmıyor.');
    }

    // Geçerlilik tarihleri.
    const now = Date.now();
    for (const c of chain) {
      if (now < Date.parse(c.validFrom) || now > Date.parse(c.validTo)) {
        throw new UnauthorizedException('Sertifika süresi geçersiz.');
      }
    }

    // JWS imzası leaf sertifikanın açık anahtarıyla doğrulanmalı (atarsa geçersiz).
    const alg = typeof header.alg === 'string' ? header.alg : 'ES256';
    const key = await importX509(chain[0].toString(), alg);
    await compactVerify(jws, key);
  }

  private normalize(p: Record<string, unknown>, env: string): VerifiedTransaction {
    const num = (v: unknown) => (v == null ? null : Number(v));
    const exp = num(p.expiresDate);
    return {
      productId: String(p.productId ?? ''),
      originalTransactionId: String(p.originalTransactionId ?? p.transactionId ?? ''),
      transactionId: String(p.transactionId ?? ''),
      expiresDate: exp ? new Date(exp) : null,
      environment: env,
      bundleId: p.bundleId ? String(p.bundleId) : null,
      type: p.type ? String(p.type) : null,
    };
  }
}

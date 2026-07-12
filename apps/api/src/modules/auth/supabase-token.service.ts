import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

/**
 * Supabase Auth tarafından üretilen erişim token'ını doğrular (Doc 8).
 * Proje asimetrik ES256 kullanıyor → paylaşılan secret YOK; public JWKS ile doğrulanır.
 * Böylece hiçbir imza secret'ı sunucuda tutulmaz.
 */
@Injectable()
export class SupabaseTokenService {
  private readonly logger = new Logger(SupabaseTokenService.name);
  private readonly issuer: string | null;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet> | null;

  constructor(config: ConfigService) {
    const url = config.get<string>('SUPABASE_URL');
    if (url && url.length > 0) {
      this.issuer = `${url}/auth/v1`;
      this.jwks = createRemoteJWKSet(new URL(`${this.issuer}/.well-known/jwks.json`));
    } else {
      this.issuer = null;
      this.jwks = null;
      this.logger.warn('SUPABASE_URL ayarlı değil — token doğrulaması devre dışı.');
    }
  }

  async verify(token: string): Promise<JWTPayload> {
    if (!this.jwks || !this.issuer) {
      throw new UnauthorizedException('Kimlik doğrulama yapılandırılmamış.');
    }
    const { payload } = await jwtVerify(token, this.jwks, {
      issuer: this.issuer,
      audience: 'authenticated',
    });
    return payload;
  }
}

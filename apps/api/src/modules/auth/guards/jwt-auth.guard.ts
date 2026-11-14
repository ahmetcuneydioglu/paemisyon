import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { isInvalidTokenError } from '../auth-error';
import { SupabaseTokenService } from '../supabase-token.service';
import { UserSyncService } from '../user-sync.service';
import type { AuthenticatedUser } from '../auth.types';

/**
 * Geçerli Supabase erişim token'ı zorunlu kılar. Doğrular → app kullanıcısını yükler → req.user.
 * Yetki (rol/premium) kararları guard/service katmanında; token claim'ine körü körüne güvenilmez.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  constructor(
    private readonly tokens: SupabaseTokenService,
    private readonly userSync: UserSyncService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const header = request.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Kimlik doğrulaması gerekli.');
    }

    const token = header.slice('Bearer '.length);
    let claims: Awaited<ReturnType<SupabaseTokenService['verify']>>;
    try {
      claims = await this.tokens.verify(token);
    } catch (err) {
      // Bilinçli fırlatılan HTTP hataları (yapılandırma yok 401) aynen geçer.
      if (err instanceof HttpException) throw err;
      // Neden günlüğe düşer (token düşmez): geçersiz token ile JWKS arızası ayırt edilsin.
      const reason = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      if (isInvalidTokenError(err)) {
        this.logger.warn(`Token doğrulanamadı: ${reason}`);
        throw new UnauthorizedException('Oturum geçersiz veya süresi dolmuş.');
      }
      // JWKS'e erişilemedi / zaman aşımı: oturum sağlam, sunucu geçici olarak doğrulayamıyor.
      // 401 dönersek istemci kullanıcıyı çıkarır (15 Kas 2026 denetimi) → 503.
      this.logger.error(`Token doğrulaması geçici olarak yapılamadı: ${reason}`);
      throw new ServiceUnavailableException(
        'Kimlik doğrulaması geçici olarak yapılamıyor; biraz sonra yeniden dene.',
      );
    }

    try {
      request.user = await this.userSync.ensureUser(claims);
      return true;
    } catch (err) {
      // Bilinçli HTTP hataları (ACCOUNT_SUSPENDED 403, ACCOUNT_DELETED 401) aynen geçer.
      if (err instanceof HttpException) throw err;
      // Token geçerli; kullanıcı yüklenemedi = veritabanı/bağlantı havuzu arızası. Bu bir
      // oturum hatası DEĞİL: 401 dönmek havuz dolduğunda herkesi çıkış yaptırıyordu.
      this.logger.error(
        `Kullanıcı yüklenemedi: ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)}`,
      );
      throw new ServiceUnavailableException(
        'Sunucu geçici olarak yanıt veremiyor; biraz sonra yeniden dene.',
      );
    }
  }
}

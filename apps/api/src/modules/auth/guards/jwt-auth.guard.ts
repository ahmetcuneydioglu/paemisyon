import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseTokenService } from '../supabase-token.service';
import { UserSyncService } from '../user-sync.service';
import type { AuthenticatedUser } from '../auth.types';

/**
 * Geçerli Supabase erişim token'ı zorunlu kılar. Doğrular → app kullanıcısını yükler → req.user.
 * Yetki (rol/premium) kararları guard/service katmanında; token claim'ine körü körüne güvenilmez.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
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
    try {
      const claims = await this.tokens.verify(token);
      request.user = await this.userSync.ensureUser(claims);
      return true;
    } catch (err) {
      // Bilinçli fırlatılan HTTP hataları (ör. ACCOUNT_SUSPENDED 403) aynen geçer;
      // yalnızca beklenmeyen doğrulama hataları genel 401'e sarılır.
      if (err instanceof HttpException) throw err;
      throw new UnauthorizedException('Oturum geçersiz veya süresi dolmuş.');
    }
  }
}

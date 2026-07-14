import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseTokenService } from '../supabase-token.service';
import { UserSyncService } from '../user-sync.service';
import type { AuthenticatedUser } from '../auth.types';

/**
 * Opsiyonel kimlik: geçerli Bearer varsa req.user doldurulur, yoksa/geçersizse
 * istek MİSAFİR olarak sürer (asla reddetmez). Public listelerde "benim katılımım"
 * zenginleştirmesi için (Doc 18 §7 — GET /exams).
 */
@Injectable()
export class OptionalJwtGuard implements CanActivate {
  constructor(
    private readonly tokens: SupabaseTokenService,
    private readonly userSync: UserSyncService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const header = request.headers['authorization'];
    if (header?.startsWith('Bearer ')) {
      try {
        const claims = await this.tokens.verify(header.slice('Bearer '.length));
        request.user = await this.userSync.ensureUser(claims);
      } catch {
        // misafir olarak devam — public uçta geçersiz token hata değildir
      }
    }
    return true;
  }
}

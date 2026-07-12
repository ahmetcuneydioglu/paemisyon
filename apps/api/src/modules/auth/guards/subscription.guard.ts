import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth.types';

/**
 * Premium içerik kapısı (Doc 7 §3, Doc 8). Erişim kararı SUNUCUDA — entitlement'tan (req.user.isPremium).
 * İstemci asla "premium'um" diyemez. JwtAuthGuard'dan sonra çalışır.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    if (!request.user?.isPremium) {
      throw new ForbiddenException('Bu içerik premium aboneliğe özeldir.');
    }
    return true;
  }
}

import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { JWTPayload } from 'jose';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { isEntitlementActive } from '../billing/entitlement.util';
import type { AuthenticatedUser } from './auth.types';

/**
 * Lazy provisioning (Doc 8): Supabase'de doğrulanmış bir kullanıcı ilk kez API'ye
 * geldiğinde uygulama `users` satırını oluşturur, varsayılan 'user' rolü + entitlement atar.
 * App user id = Supabase auth uid (sub) — tek kaynak, ekstra eşleme yok.
 */
@Injectable()
export class UserSyncService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureUser(claims: JWTPayload): Promise<AuthenticatedUser> {
    const id = claims.sub;
    if (!id) {
      throw new Error('Token "sub" (kullanıcı id) içermiyor.');
    }

    // HIZLI YOL (yaygın durum): mevcut, rolü+entitlement'ı olan kullanıcı → TEK sorgu.
    const existing = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } }, entitlement: true },
    });
    if (existing) this.enforceStatus(existing.status);
    if (existing && existing.roles.length > 0 && existing.entitlement) {
      return {
        id,
        email: existing.email,
        roles: existing.roles.map((r) => r.role.key),
        isPremium: isEntitlementActive(existing.entitlement),
      };
    }

    // YAVAŞ YOL (ilk giriş / eksik backfill): oluştur + rol + entitlement.
    const email = (claims.email as string | undefined) ?? '';
    const emailVerified = claims.email_verified === true;

    const user =
      existing ??
      (await this.prisma.user.create({
        data: {
          id,
          email,
          displayName: email.includes('@') ? email.split('@')[0] : 'Kullanıcı',
          emailVerifiedAt: emailVerified ? new Date() : null,
        },
      }));

    let roles = existing?.roles.map((r) => r.role.key) ?? [];
    if (roles.length === 0) {
      const userRole = await this.prisma.role.findUnique({ where: { key: 'user' } });
      if (userRole) {
        await this.prisma.userRole.createMany({
          data: [{ userId: id, roleId: userRole.id }],
          skipDuplicates: true,
        });
        roles = ['user'];
      }
    }

    const entitlement =
      existing?.entitlement ??
      (await this.prisma.entitlement.upsert({
        where: { userId: id },
        update: {},
        create: { userId: id, isPremium: false },
      }));

    return { id, email: user.email, roles, isPremium: isEntitlementActive(entitlement) };
  }

  /** Askıya alınan/silinen hesap API'ye giremez (Doc 8/9). Supabase token'ı geçerli olsa bile. */
  private enforceStatus(status: string) {
    if (status === 'suspended') {
      throw new ForbiddenException({
        code: 'ACCOUNT_SUSPENDED',
        message: 'Hesabın askıya alındı. Destek ile iletişime geç.',
      });
    }
    if (status === 'deleted') {
      throw new UnauthorizedException({
        code: 'ACCOUNT_DELETED',
        message: 'Bu hesap silinmiş.',
      });
    }
  }
}

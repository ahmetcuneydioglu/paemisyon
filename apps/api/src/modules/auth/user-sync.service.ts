import { Injectable } from '@nestjs/common';
import type { JWTPayload } from 'jose';
import { PrismaService } from '../../infra/prisma/prisma.service';
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
    const email = (claims.email as string | undefined) ?? '';
    const emailVerified = claims.email_verified === true;

    // Kullanıcıyı oluştur/getir (profil her istekte ezilmez).
    const user = await this.prisma.user.upsert({
      where: { id },
      update: {},
      create: {
        id,
        email,
        displayName: email.includes('@') ? email.split('@')[0] : 'Kullanıcı',
        emailVerifiedAt: emailVerified ? new Date() : null,
      },
      include: { roles: { include: { role: true } }, entitlement: true },
    });

    // Varsayılan 'user' rolü (idempotent).
    let roles = user.roles.map((r) => r.role.key);
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

    // Entitlement (idempotent). Premium kararı burada okunur (SubscriptionGuard).
    const entitlement = await this.prisma.entitlement.upsert({
      where: { userId: id },
      update: {},
      create: { userId: id, isPremium: false },
    });

    return { id, email: user.email, roles, isPremium: entitlement.isPremium };
  }
}

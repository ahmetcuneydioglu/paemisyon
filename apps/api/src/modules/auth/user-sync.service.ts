import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { JWTPayload } from 'jose';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { isEntitlementActive } from '../billing/entitlement.util';
import type { AuthenticatedUser } from './auth.types';

/** Supabase metadata adını güvenli biçimde al; yoksa e-posta yerel kısmına düş. */
export function displayNameFromClaims(claims: JWTPayload, email: string): string {
  const metadata = claims.user_metadata;
  const raw =
    metadata && typeof metadata === 'object' && 'display_name' in metadata
      ? (metadata as { display_name?: unknown }).display_name
      : null;
  if (typeof raw === 'string' && raw.trim().length >= 2) return raw.trim().slice(0, 128);
  return email.includes('@') ? email.split('@')[0].slice(0, 128) : 'Kullanıcı';
}

/** Supabase yeni tokenlarda doğrulamayı user_metadata içinde taşır; eski tokenları da kabul et. */
export function emailVerifiedFromClaims(claims: JWTPayload): boolean {
  if (claims.email_verified === true) return true;
  const metadata = claims.user_metadata;
  return Boolean(
    metadata &&
    typeof metadata === 'object' &&
    'email_verified' in metadata &&
    (metadata as { email_verified?: unknown }).email_verified === true,
  );
}

/**
 * Lazy provisioning (Doc 8): Supabase'de doğrulanmış bir kullanıcı ilk kez API'ye
 * geldiğinde uygulama `users` satırını oluşturur, varsayılan 'user' rolü + entitlement atar.
 * App user id = Supabase auth uid (sub) — tek kaynak, ekstra eşleme yok.
 */
@Injectable()
export class UserSyncService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Kısa ömürlü bellek önbelleği: her istekte DB'ye gitmemek için (Frankfurt
   * RTT ~50ms × ilişki başına sorgu). Rol/premium/durum değişiklikleri en geç
   * TTL kadar gecikir; kritik yollar (askıya alma, KVKK silme, premium) cache'i
   * anında düşürür (invalidate).
   */
  private static readonly CACHE_TTL_MS = 60_000;
  private readonly cache = new Map<string, { user: AuthenticatedUser; expiresAt: number }>();

  /** Kullanıcıyla ilgili yetki verisi değiştiğinde çağır (anında yansısın). */
  invalidate(userId: string) {
    this.cache.delete(userId);
  }

  async ensureUser(claims: JWTPayload): Promise<AuthenticatedUser> {
    const id = claims.sub;
    if (!id) {
      throw new Error('Token "sub" (kullanıcı id) içermiyor.');
    }

    const cached = this.cache.get(id);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.user;
    }

    // HIZLI YOL (yaygın durum): mevcut, rolü+entitlement'ı olan kullanıcı → TEK sorgu.
    const existing = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } }, entitlement: true },
    });
    if (existing) this.enforceStatus(existing.status);
    if (existing && existing.roles.length > 0 && existing.entitlement) {
      const claimEmail = (claims.email as string | undefined) ?? existing.email;
      const verifiedNow = emailVerifiedFromClaims(claims);
      if ((verifiedNow && existing.emailVerifiedAt == null) || claimEmail !== existing.email) {
        await this.prisma.user.update({
          where: { id },
          data: {
            ...(verifiedNow && existing.emailVerifiedAt == null
              ? { emailVerifiedAt: new Date() }
              : {}),
            ...(claimEmail !== existing.email ? { email: claimEmail } : {}),
          },
        });
      }
      const user: AuthenticatedUser = {
        id,
        email: claimEmail,
        roles: existing.roles.map((r) => r.role.key),
        isPremium: isEntitlementActive(existing.entitlement),
      };
      this.cache.set(id, { user, expiresAt: Date.now() + UserSyncService.CACHE_TTL_MS });
      return user;
    }

    // YAVAŞ YOL (ilk giriş / eksik backfill): tek transaction + upsert.
    // Aynı kullanıcı için eşzamanlı ilk istekler unique ihlaline düşmez.
    const email = (claims.email as string | undefined) ?? '';
    const emailVerified = emailVerifiedFromClaims(claims);
    const provisioned = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { id },
        update: {
          ...(emailVerified ? { emailVerifiedAt: new Date() } : {}),
        },
        create: {
          id,
          email,
          displayName: displayNameFromClaims(claims, email),
          emailVerifiedAt: emailVerified ? new Date() : null,
        },
      });
      this.enforceStatus(user.status);

      let roleLinks = await tx.userRole.findMany({
        where: { userId: id },
        include: { role: true },
      });
      if (roleLinks.length === 0) {
        const userRole = await tx.role.findUnique({ where: { key: 'user' } });
        if (!userRole) throw new Error('Varsayılan kullanıcı rolü bulunamadı.');
        await tx.userRole.createMany({
          data: [{ userId: id, roleId: userRole.id }],
          skipDuplicates: true,
        });
        roleLinks = [{ userId: id, roleId: userRole.id, role: userRole }];
      }

      const entitlement = await tx.entitlement.upsert({
        where: { userId: id },
        update: {},
        create: { userId: id, isPremium: false },
      });
      return {
        id,
        email: user.email,
        roles: roleLinks.map((link) => link.role.key),
        isPremium: isEntitlementActive(entitlement),
      } satisfies AuthenticatedUser;
    });

    this.cache.set(id, {
      user: provisioned,
      expiresAt: Date.now() + UserSyncService.CACHE_TTL_MS,
    });
    return provisioned;
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

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { AuditService } from '../audit.service';
import { UserSyncService } from '../../auth/user-sync.service';

/**
 * Kullanıcı yönetimi (Doc 9 §5). Parola YOK (Supabase Auth'ta). Admin yalnızca:
 * arama/detay, askıya alma/aktifleştirme, manuel premium (destek/iade senaryosu).
 */
@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly userSync: UserSyncService,
  ) {}

  async list(params: { search?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(params.search
        ? {
            OR: [
              { email: { contains: params.search, mode: 'insensitive' } },
              { displayName: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          entitlement: { select: { isPremium: true, validUntil: true } },
          roles: { include: { role: { select: { key: true } } } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        status: u.status,
        roles: u.roles.map((r) => r.role.key),
        isPremium: u.entitlement?.isPremium ?? false,
        validUntil: u.entitlement?.validUntil ?? null,
        createdAt: u.createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  async detail(id: string) {
    const u = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        entitlement: true,
        roles: { include: { role: { select: { key: true } } } },
        stats: true,
        streak: true,
        subscriptions: { orderBy: { createdAt: 'desc' }, take: 10, include: { plan: { select: { key: true, name: true } } } },
      },
    });
    if (!u) throw new NotFoundException('Kullanıcı bulunamadı.');
    return {
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      status: u.status,
      roles: u.roles.map((r) => r.role.key),
      createdAt: u.createdAt,
      entitlement: u.entitlement,
      stats: u.stats,
      streak: u.streak,
      subscriptions: u.subscriptions.map((s) => ({
        id: s.id,
        plan: s.plan.key,
        provider: s.provider,
        status: s.status,
        currentPeriodEnd: s.currentPeriodEnd,
        createdAt: s.createdAt,
      })),
    };
  }

  /** Askıya al / aktifleştir. Kendini askıya alamazsın. */
  async setStatus(actor: AuthenticatedUser, id: string, status: 'active' | 'suspended') {
    if (actor.id === id) throw new BadRequestException('Kendi hesabının durumunu değiştiremezsin.');
    const u = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!u) throw new NotFoundException('Kullanıcı bulunamadı.');
    await this.prisma.user.update({ where: { id }, data: { status } });
    this.userSync.invalidate(id); // guard cache — anında yansısın
    await this.audit.log(actor, `user.${status === 'suspended' ? 'suspend' : 'activate'}`, 'user', id, {
      email: u.email,
    });
    return { id, status };
  }

  /** Manuel premium ver/geri al (destek, iade, promosyon). Kaynak: provider=manual. */
  async setPremium(actor: AuthenticatedUser, id: string, isPremium: boolean, validUntil?: string) {
    const u = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!u) throw new NotFoundException('Kullanıcı bulunamadı.');
    const until = validUntil ? new Date(validUntil) : null;
    if (isPremium && until && Number.isNaN(until.getTime())) {
      throw new BadRequestException('Geçersiz bitiş tarihi.');
    }

    await this.prisma.entitlement.upsert({
      where: { userId: id },
      update: { isPremium, validUntil: isPremium ? until : null, sourceSubscriptionId: null },
      create: { userId: id, isPremium, validUntil: isPremium ? until : null },
    });
    this.userSync.invalidate(id); // guard cache — anında yansısın
    await this.audit.log(actor, isPremium ? 'user.grant_premium' : 'user.revoke_premium', 'user', id, {
      email: u.email,
      validUntil: until?.toISOString() ?? null,
    });
    return { id, isPremium, validUntil: isPremium ? until : null };
  }
}

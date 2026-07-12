import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';

/**
 * Audit log (Doc 9 §6): her admin/editor işlemi iz bırakır — kim, neyi, ne zaman.
 * Yazma hatası ana işlemi DÜŞÜRMEZ (log kaybı < operasyon kaybı) ama konsola düşer.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    actor: AuthenticatedUser,
    action: string,
    entityType: string,
    entityId?: string | null,
    detail?: Prisma.InputJsonValue,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: actor.id,
          actorEmail: actor.email,
          action,
          entityType,
          entityId: entityId ?? null,
          detail,
        },
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[audit] yazılamadı:', action, e);
    }
  }

  /** Panel için salt-okur liste. */
  async list(page = 1, pageSize = 50) {
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count(),
    ]);
    return { items, total, page, pageSize };
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { maskEmail } from '../email/email-contacts.service';

/** Tester listesi (Doc 52 karar 11): e-postayla işaretlenir, aktif cihazları otomatik girer. */
@Injectable()
export class TestersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(unmasked = false) {
    const rows = await this.prisma.notificationTester.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            pushTokens: {
              where: { isActive: true },
              select: { platform: true, lastSeenAt: true, token: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => ({
      userId: r.userId,
      email: unmasked ? r.user.email : maskEmail(r.user.email),
      displayName: r.user.displayName,
      devices: r.user.pushTokens.map((t) => ({
        platform: t.platform,
        lastSeenAt: t.lastSeenAt,
        token: `${t.token.slice(0, 6)}…${t.token.slice(-4)}`,
      })),
      addedAt: r.createdAt,
    }));
  }

  async add(email: string, addedById: string) {
    const u = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true },
    });
    if (!u) throw new NotFoundException('Bu e-postayla kullanıcı yok.');
    await this.prisma.notificationTester.upsert({
      where: { userId: u.id },
      update: {},
      create: { userId: u.id, addedById },
    });
    return this.list();
  }

  async remove(userId: string) {
    const r = await this.prisma.notificationTester.deleteMany({ where: { userId } });
    if (r.count === 0) throw new BadRequestException('Tester değil.');
    return this.list();
  }

  async userIds(): Promise<string[]> {
    return (await this.prisma.notificationTester.findMany({ select: { userId: true } })).map(
      (t) => t.userId,
    );
  }
}

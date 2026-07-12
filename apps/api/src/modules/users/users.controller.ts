import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { UpdateProfileDto } from './dto/update-profile.dto';

/// GET/PATCH /api/v1/me — profil + entitlement (Doc 7 §4.2). Kimlik zorunlu.
@Controller('me')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async me(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { entitlement: true },
    });
    return {
      id: user.id,
      email: user.email,
      displayName: profile?.displayName,
      avatarUrl: profile?.avatarUrl,
      onboardingCompleted: profile?.onboardingCompletedAt != null,
      roles: user.roles,
      isPremium: user.isPremium,
      validUntil: profile?.entitlement?.validUntil ?? null,
    };
  }

  /// Home dashboard verisi (Doc 12 §4): tek istekte selam + istatistik + streak +
  /// bugünkü kullanım. Mobil açılışta 4 ayrı çağrı yerine bunu kullanır.
  @Get('dashboard')
  async dashboard(@CurrentUser() user: AuthenticatedUser) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [profile, stats, streak, usage, freePlan] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: user.id }, select: { displayName: true } }),
      this.prisma.userStats.findUnique({ where: { userId: user.id } }),
      this.prisma.streak.findUnique({ where: { userId: user.id } }),
      this.prisma.dailyUsage.findUnique({
        where: { userId_usageDate: { userId: user.id, usageDate: today } },
      }),
      this.prisma.plan.findUnique({ where: { key: 'free' } }),
    ]);

    const accuracy =
      stats && stats.totalSolved > 0
        ? Math.round((stats.totalCorrect / stats.totalSolved) * 100)
        : 0;

    return {
      displayName: profile?.displayName ?? null,
      isPremium: user.isPremium,
      streak: {
        current: streak?.currentStreak ?? 0,
        longest: streak?.longestStreak ?? 0,
      },
      today: {
        answered: usage?.questionsAnswered ?? 0,
        // premium'da limit yok (null) — UI sınırsız gösterir.
        dailyLimit: user.isPremium ? null : (freePlan?.dailyQuestionLimit ?? 15),
      },
      stats: {
        totalSolved: stats?.totalSolved ?? 0,
        totalSessions: stats?.totalSessions ?? 0,
        accuracy,
      },
    };
  }

  @Patch()
  async update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { displayName: dto.displayName, avatarUrl: dto.avatarUrl },
    });
    return {
      id: updated.id,
      displayName: updated.displayName,
      avatarUrl: updated.avatarUrl,
    };
  }
}

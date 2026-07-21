import { Body, Controller, Delete, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { UsersService } from './users.service';
import { FREE_DAILY_LIMIT_FALLBACK } from '../../common/plan.constants';

/// GET/PATCH /api/v1/me — profil + entitlement (Doc 7 §4.2). Kimlik zorunlu.
@Controller('me')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  @Get()
  async me(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { entitlement: true, preferredModule: { select: { id: true, name: true } } },
    });
    return {
      id: user.id,
      email: user.email,
      displayName: profile?.displayName,
      avatarUrl: profile?.avatarUrl,
      emailVerified: profile?.emailVerifiedAt != null,
      onboardingCompleted: profile?.onboardingCompletedAt != null,
      preferredModule: profile?.preferredModule ?? null,
      dailyGoal: profile?.dailyGoal ?? 20,
      targetExamDate: profile?.targetExamDate?.toISOString().slice(0, 10) ?? null,
      memberSince: profile?.createdAt?.toISOString() ?? null,
      roles: user.roles,
      isPremium: user.isPremium,
      validUntil: profile?.entitlement?.validUntil ?? null,
    };
  }

  /// Onboarding: hedef sınav seçimi (Doc 11 §2). İdempotent.
  @Post('onboarding')
  completeOnboarding(@CurrentUser() user: AuthenticatedUser, @Body() dto: CompleteOnboardingDto) {
    return this.users.completeOnboarding(user.id, dto);
  }

  /// KVKK hesap silme (App Store zorunluluğu). Geri alınamaz.
  @Delete()
  deleteAccount(@CurrentUser() user: AuthenticatedUser) {
    return this.users.deleteAccount(user);
  }

  /// Home dashboard verisi (Doc 12 §4): tek istekte selam + istatistik + streak +
  /// bugünkü kullanım. Mobil açılışta 4 ayrı çağrı yerine bunu kullanır.
  @Get('dashboard')
  async dashboard(@CurrentUser() user: AuthenticatedUser) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [profile, stats, streak, usage, freePlan, dailySession] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: user.id },
        select: {
          displayName: true,
          onboardingCompletedAt: true,
          preferredModule: { select: { id: true, name: true } },
        },
      }),
      this.prisma.userStats.findUnique({ where: { userId: user.id } }),
      this.prisma.streak.findUnique({ where: { userId: user.id } }),
      this.prisma.dailyUsage.findUnique({
        where: { userId_usageDate: { userId: user.id, usageDate: today } },
      }),
      this.prisma.plan.findUnique({ where: { key: 'free' } }),
      this.prisma.quizSession.findFirst({
        where: { userId: user.id, mode: 'daily', startedAt: { gte: today } },
        orderBy: { startedAt: 'desc' },
        select: { status: true },
      }),
    ]);

    const accuracy =
      stats && stats.totalSolved > 0
        ? Math.round((stats.totalCorrect / stats.totalSolved) * 100)
        : 0;

    return {
      displayName: profile?.displayName ?? null,
      onboardingCompleted: profile?.onboardingCompletedAt != null,
      preferredModule: profile?.preferredModule ?? null,
      isPremium: user.isPremium,
      streak: {
        current: streak?.currentStreak ?? 0,
        longest: streak?.longestStreak ?? 0,
      },
      today: {
        answered: usage?.questionsAnswered ?? 0,
        // premium'da limit yok (null) — UI sınırsız gösterir.
        dailyLimit: user.isPremium ? null : (freePlan?.dailyQuestionLimit ?? FREE_DAILY_LIMIT_FALLBACK),
      },
      daily: { playedToday: dailySession?.status === 'completed' },
      stats: {
        totalSolved: stats?.totalSolved ?? 0,
        totalSessions: stats?.totalSessions ?? 0,
        accuracy,
      },
    };
  }

  @Patch()
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }
}

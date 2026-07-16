import { Body, Controller, Delete, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { UsersService } from './users.service';

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
      onboardingCompleted: profile?.onboardingCompletedAt != null,
      preferredModule: profile?.preferredModule ?? null,
      roles: user.roles,
      isPremium: user.isPremium,
      validUntil: profile?.entitlement?.validUntil ?? null,
    };
  }

  /// Onboarding: hedef sınav seçimi (Doc 11 §2). İdempotent.
  @Post('onboarding')
  completeOnboarding(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CompleteOnboardingDto,
  ) {
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
        dailyLimit: user.isPremium ? null : (freePlan?.dailyQuestionLimit ?? 15),
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
  async update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: dto.displayName,
        avatarUrl: dto.avatarUrl,
        dailyGoal: dto.dailyGoal,
        // undefined = dokunma; null = temizle; "YYYY-MM-DD" = ayarla (@db.Date).
        targetExamDate:
          dto.targetExamDate === undefined
            ? undefined
            : dto.targetExamDate === null
              ? null
              : new Date(`${dto.targetExamDate}T00:00:00.000Z`),
      },
    });
    return {
      id: updated.id,
      displayName: updated.displayName,
      avatarUrl: updated.avatarUrl,
      dailyGoal: updated.dailyGoal,
      targetExamDate: updated.targetExamDate?.toISOString().slice(0, 10) ?? null,
    };
  }
}

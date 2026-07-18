import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ProgressService } from './progress.service';

/// GET /api/v1/progress/* — istatistik & ilerleme (Doc 7 §4.5). Kimlik zorunlu.
@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get('leaderboard')
  leaderboard(
    @CurrentUser() user: AuthenticatedUser,
    @Query('period') period?: string,
  ) {
    return this.progress.getLeaderboard(user.id, period === 'monthly' ? 'monthly' : 'daily');
  }

  @Get('summary')
  summary(@CurrentUser() user: AuthenticatedUser) {
    return this.progress.getSummary(user.id);
  }

  @Get('topics')
  topics(@CurrentUser() user: AuthenticatedUser) {
    return this.progress.getTopicProgress(user.id);
  }

  /// Günlük soru hacmi — Bugün nöbet çizelgesi (14) + Performans ısı takvimi (84).
  @Get('activity')
  activity(@CurrentUser() user: AuthenticatedUser, @Query('days') days?: string) {
    const n = Number.parseInt(days ?? '', 10);
    return this.progress.getActivity(user.id, Number.isFinite(n) ? Math.min(120, Math.max(1, n)) : 14);
  }

  @Get('history')
  history(@CurrentUser() user: AuthenticatedUser) {
    return this.progress.getHistory(user.id);
  }
}

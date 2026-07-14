import { Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ExamsService } from './exams.service';

/**
 * /api/v1/exams — randevulu canlı denemeler (Doc 18 §7).
 * Liste/sıralama/sorular public (misafir görebilir); başlatma ve sonuç kimlikli.
 * Cevap kaydetme/bitirme MEVCUT /quiz/sessions uçlarından yürür (tek motor).
 */
@Controller('exams')
export class ExamsController {
  constructor(private readonly exams: ExamsService) {}

  @Get()
  @UseGuards(OptionalJwtGuard)
  list(@CurrentUser() user?: AuthenticatedUser) {
    return this.exams.list(user);
  }

  @Get('attempts/mine')
  @UseGuards(JwtAuthGuard)
  myAttempts(@CurrentUser() user: AuthenticatedUser) {
    return this.exams.myAttempts(user);
  }

  @Get('attempts/:attemptId')
  @UseGuards(JwtAuthGuard)
  attempt(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
  ) {
    return this.exams.getAttempt(user, attemptId);
  }

  @Get(':id')
  @UseGuards(OptionalJwtGuard)
  detail(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user?: AuthenticatedUser) {
    return this.exams.detail(id, user);
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  start(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.exams.start(user, id);
  }

  @Get(':id/leaderboard')
  @UseGuards(OptionalJwtGuard)
  leaderboard(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user?: AuthenticatedUser) {
    return this.exams.leaderboard(id, user);
  }

  @Get(':id/questions')
  @UseGuards(OptionalJwtGuard)
  questions(@Param('id', ParseUUIDPipe) id: string) {
    return this.exams.browseQuestions(id);
  }
}

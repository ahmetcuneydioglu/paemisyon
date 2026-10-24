import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ExamsService } from './exams.service';
import { RemindExamDto, StartExamDto } from './dto/start-exam.dto';

/**
 * /api/v1/exams — denemeler (Doc 18 → Doc 50).
 * Liste/sıralama/sorular public (misafir görebilir); başlatma, sonuç, geçmiş kimlikli.
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

  /** Eski geçmiş listesi (Flutter): düz çözüm listesi, rol alanıyla. */
  @Get('attempts/mine')
  @UseGuards(JwtAuthGuard)
  myAttempts(@CurrentUser() user: AuthenticatedUser) {
    return this.exams.myAttempts(user);
  }

  /** Deneme geçmişi (Doc 50 M8): gruplu liste + net gelişimi (Premium). */
  @Get('history/mine')
  @UseGuards(JwtAuthGuard)
  history(@CurrentUser() user: AuthenticatedUser) {
    return this.exams.history(user);
  }

  @Get('attempts/:attemptId')
  @UseGuards(JwtAuthGuard)
  attempt(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
  ) {
    return this.exams.getAttempt(user, attemptId);
  }

  /** Cevap incelemesi listesi (Doc 50 M5): soru bazlı Türkiye oranı ve süre Premium. */
  @Get('attempts/:attemptId/review')
  @UseGuards(JwtAuthGuard)
  review(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
  ) {
    return this.exams.review(user, attemptId);
  }

  @Get('leaderboard/global')
  @UseGuards(OptionalJwtGuard)
  globalLeaderboard(@CurrentUser() user?: AuthenticatedUser) {
    return this.exams.globalLeaderboard(user);
  }

  @Get(':id')
  @UseGuards(OptionalJwtGuard)
  detail(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user?: AuthenticatedUser) {
    return this.exams.detail(id, user);
  }

  /** Canlı katılımcı nabzı: şu an sınavda olan (in_progress) kişi sayısı. */
  @Get(':id/presence')
  presence(@Param('id', ParseUUIDPipe) id: string) {
    return this.exams.presence(id);
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  start(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto?: StartExamDto,
  ) {
    return this.exams.start(user, id, dto?.role);
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

  @Get(':id/remind')
  @UseGuards(JwtAuthGuard)
  reminderStatus(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.exams.reminderStatus(user, id);
  }

  @Post(':id/remind')
  @UseGuards(JwtAuthGuard)
  remind(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RemindExamDto,
  ) {
    return this.exams.setReminder(user, id, dto.on);
  }
}

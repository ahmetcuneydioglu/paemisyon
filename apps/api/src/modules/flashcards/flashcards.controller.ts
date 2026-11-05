import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { FlashcardsService } from './flashcards.service';
import {
  FlashcardEventDto,
  FlashcardPreferencesDto,
  FlashcardScopeDto,
  ReportFlashcardDto,
  StartFlashcardSessionDto,
} from './dto/flashcards.dto';

/**
 * GET/POST /api/v1/me/flashcards/* — bilgi kartları (Doc 56). Kural sunucuda; bayrak kapalıyken
 * (panel › Ayarlar) uçlar 404 FLASHCARDS_DISABLED döner, admin ve beta rolleri görür.
 */
@Controller('me/flashcards')
@UseGuards(JwtAuthGuard)
export class FlashcardsController {
  constructor(private readonly flashcards: FlashcardsService) {}

  /** Kapsam özeti: mod sayımları, önerilen mod, günlük hedef, kaldığın yer. */
  @Get('overview')
  overview(@CurrentUser() user: AuthenticatedUser, @Query() scope: FlashcardScopeDto) {
    return this.flashcards.overview(user, scope);
  }

  /** Performans bloğu: kapsamsız sayımlar, ders dağılımı, son 7 gün, 30 günlük hatırlama oranı. */
  @Get('stats')
  stats(@CurrentUser() user: AuthenticatedUser) {
    return this.flashcards.stats(user);
  }

  @Post('sessions')
  start(@CurrentUser() user: AuthenticatedUser, @Body() dto: StartFlashcardSessionDto) {
    return this.flashcards.startSession(user, dto);
  }

  @Get('sessions/resume')
  resume(@CurrentUser() user: AuthenticatedUser) {
    return this.flashcards.resume(user);
  }

  @Post('sessions/:id/events')
  event(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FlashcardEventDto,
  ) {
    return this.flashcards.recordEvent(user, id, dto);
  }

  @Post('sessions/:id/events/:clientEventId/undo')
  undo(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('clientEventId', ParseUUIDPipe) clientEventId: string,
  ) {
    return this.flashcards.undoEvent(user, id, clientEventId);
  }

  @Post('sessions/:id/complete')
  complete(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.flashcards.completeSession(user, id);
  }

  /** Kart hata bildirimi (Doc 56 §3f); aynı karta açık bildirim varsa `alreadyReported`. */
  @Post(':id/report')
  report(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReportFlashcardDto,
  ) {
    return this.flashcards.report(user, id, dto.message);
  }

  @Get('bookmarks')
  bookmarks(@CurrentUser() user: AuthenticatedUser) {
    return this.flashcards.bookmarks(user);
  }

  @Post('bookmarks/:flashcardId')
  addBookmark(
    @CurrentUser() user: AuthenticatedUser,
    @Param('flashcardId', ParseUUIDPipe) flashcardId: string,
  ) {
    return this.flashcards.addBookmark(user, flashcardId);
  }

  @Delete('bookmarks/:flashcardId')
  removeBookmark(
    @CurrentUser() user: AuthenticatedUser,
    @Param('flashcardId', ParseUUIDPipe) flashcardId: string,
  ) {
    return this.flashcards.removeBookmark(user, flashcardId);
  }

  @Patch('preferences')
  preferences(@CurrentUser() user: AuthenticatedUser, @Body() dto: FlashcardPreferencesDto) {
    return this.flashcards.preferences(user, dto);
  }
}

import { Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ReviewService } from './review.service';

/// GET/POST/DELETE /api/v1/review/* — yanlışlarım & favoriler (Doc 7 §4.6).
@Controller('review')
@UseGuards(JwtAuthGuard)
export class ReviewController {
  constructor(private readonly review: ReviewService) {}

  @Get('wrong-answers')
  wrongAnswers(@CurrentUser() user: AuthenticatedUser) {
    return this.review.getWrongAnswers(user.id);
  }

  @Get('bookmarks')
  bookmarks(@CurrentUser() user: AuthenticatedUser) {
    return this.review.getBookmarks(user.id);
  }

  @Post('bookmarks/:questionId')
  add(@CurrentUser() user: AuthenticatedUser, @Param('questionId', ParseUUIDPipe) questionId: string) {
    return this.review.addBookmark(user.id, questionId);
  }

  @Delete('bookmarks/:questionId')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('questionId', ParseUUIDPipe) questionId: string) {
    return this.review.removeBookmark(user.id, questionId);
  }
}

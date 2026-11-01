import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { RoomsService } from './rooms.service';

/// Çalış ana ekranı, ders odası ve konu odası (Doc 49/14, 49/17). Kural ve cümle sunucuda.
@Controller('me')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  /** Çalış ana ekranı (Doc 49/17). */
  @Get('study')
  study(
    @CurrentUser() user: AuthenticatedUser,
    @Query('moduleId', new ParseUUIDPipe({ optional: true })) moduleId?: string,
  ) {
    return this.rooms.study(user.id, moduleId ?? null);
  }

  @Get('course-room/:courseId')
  courseRoom(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    return this.rooms.courseRoom(user.id, courseId, user.isPremium);
  }

  @Get('topic-room/:topicId')
  topicRoom(
    @CurrentUser() user: AuthenticatedUser,
    @Param('topicId', ParseUUIDPipe) topicId: string,
  ) {
    return this.rooms.topicRoom(user.id, topicId, user.isPremium);
  }
}

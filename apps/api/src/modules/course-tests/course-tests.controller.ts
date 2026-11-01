import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CourseTestsService } from './course-tests.service';

/// Ders testleri (Doc 49/18). Durum, kilit ve bölümleme sunucuda.
@Controller('me')
@UseGuards(JwtAuthGuard)
export class CourseTestsController {
  constructor(private readonly tests: CourseTestsService) {}

  @Get('course-tests/:courseId')
  overview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    return this.tests.overview(user.id, courseId, user.isPremium);
  }
}

import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ProgressService } from './progress.service';

/// GET /api/v1/progress/* — istatistik & ilerleme (Doc 7 §4.5). Kimlik zorunlu.
@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get('summary')
  summary(@CurrentUser() user: AuthenticatedUser) {
    return this.progress.getSummary(user.id);
  }

  @Get('topics')
  topics(@CurrentUser() user: AuthenticatedUser) {
    return this.progress.getTopicProgress(user.id);
  }

  @Get('history')
  history(@CurrentUser() user: AuthenticatedUser) {
    return this.progress.getHistory(user.id);
  }
}

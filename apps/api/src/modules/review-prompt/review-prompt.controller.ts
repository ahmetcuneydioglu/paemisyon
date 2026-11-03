import { Body, Controller, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { IsIn } from 'class-validator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ReviewPromptService } from './review-prompt.service';

export class ReviewPromptOutcomeDto {
  @IsIn(['accepted', 'dismissed']) outcome!: 'accepted' | 'dismissed';
}

/** /api/v1/me/review-prompts/:id — istemci sheet sonucunu bildirir (Doc 56 §5). */
@Controller('me/review-prompts')
@UseGuards(JwtAuthGuard)
export class ReviewPromptController {
  constructor(private readonly prompts: ReviewPromptService) {}

  @Patch(':id')
  outcome(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewPromptOutcomeDto,
  ) {
    return this.prompts.setOutcome(user.id, id, dto.outcome);
  }
}

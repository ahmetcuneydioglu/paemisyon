import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsUUID } from 'class-validator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AiExplainService } from './ai-explain.service';

class ExplainDto {
  @IsUUID()
  versionId!: string;

  @IsUUID()
  chosenOptionId!: string;
}

/// AI koç uçları (Doc 24 §4 Faz 2). Auth zorunlu; free günde 3 hak.
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly service: AiExplainService) {}

  @Post('explain')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  explain(@CurrentUser() user: AuthenticatedUser, @Body() dto: ExplainDto) {
    return this.service.explain(user, dto.versionId, dto.chosenOptionId);
  }
}

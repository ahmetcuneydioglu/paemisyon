import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { PlanService } from './plan.service';

/// Haftalık plan okuma iskeleti (Doc 49 S1-E §2). Yazma uçları F8'de.
@Controller('me')
@UseGuards(JwtAuthGuard)
export class PlanController {
  constructor(private readonly plan: PlanService) {}

  @Get('plan')
  getPlan(@CurrentUser() user: AuthenticatedUser) {
    return this.plan.getPlan(user.id);
  }
}

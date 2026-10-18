import { Body, Controller, Delete, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { PlanService } from './plan.service';
import { UpsertPlanDto } from './dto/plan.dto';

/// Haftalık plan (Doc 49/12 F8-A §4). Kural sunucuda; istemci yalnız gösterir.
@Controller('me')
@UseGuards(JwtAuthGuard)
export class PlanController {
  constructor(private readonly plan: PlanService) {}

  @Get('plan')
  getPlan(@CurrentUser() user: AuthenticatedUser) {
    return this.plan.getPlan(user.id, user.isPremium);
  }

  /** Kurma ekranı ön değerleri: önerilen haftalık süre, hedef tarih, sınav türü. */
  @Get('plan/defaults')
  defaults(@CurrentUser() user: AuthenticatedUser) {
    return this.plan.onDegerler(user.id);
  }

  @Post('plan')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertPlanDto) {
    return this.plan.createPlan(user, dto);
  }

  @Patch('plan')
  revise(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertPlanDto) {
    return this.plan.revisePlan(user, dto);
  }

  @Delete('plan')
  archive(@CurrentUser() user: AuthenticatedUser) {
    return this.plan.archivePlan(user.id);
  }
}

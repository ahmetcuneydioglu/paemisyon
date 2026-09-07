import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { AdminPlansService } from './admin-plans.service';
import { UpdatePlanDto } from '../dto/plan.dto';

/**
 * /api/v1/admin/plans — fiyat ve günlük soru limiti (7 Eyl 2026).
 *
 * Yalnız ADMIN: fiyat ve ücretsiz katmanın sınırı ürünün ticari çekirdeği;
 * editör içeriği yönetir, ticareti değil.
 */
@Controller('admin/plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminPlansController {
  constructor(private readonly service: AdminPlansService) {}

  @Get()
  list() {
    return this.service.list();
  }

  /// Limit düşürmenin BUGÜNE etkisi — panel kaydetmeden önce sorar.
  @Get('limit-etkisi')
  limitEtkisi(@Query('limit', ParseIntPipe) limit: number) {
    return this.service.limitEtkisi(limit);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.service.update(user, id, dto);
  }
}

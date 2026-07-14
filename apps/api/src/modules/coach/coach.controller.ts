import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CoachService } from './coach.service';

/// GET /api/v1/me/coach — Home'un tek isteği (Doc 19 §3). Kimlik zorunlu.
/// Mevcut /me/dashboard geriye uyum için kalır (İlerlemem + eski istemciler).
@Controller('me')
@UseGuards(JwtAuthGuard)
export class CoachController {
  constructor(private readonly coach: CoachService) {}

  @Get('coach')
  brief(@CurrentUser() user: AuthenticatedUser) {
    return this.coach.brief(user);
  }
}

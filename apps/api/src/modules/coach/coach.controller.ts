import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { BadgeService } from './badge.service';
import { CoachService } from './coach.service';
import { SetFocusDto } from './dto/set-focus.dto';

/// GET /api/v1/me/coach — Home'un tek isteği (Doc 19 §3). Kimlik zorunlu.
/// Mevcut /me/dashboard geriye uyum için kalır (İlerlemem + eski istemciler).
@Controller('me')
@UseGuards(JwtAuthGuard)
export class CoachController {
  constructor(
    private readonly coach: CoachService,
    private readonly badgeService: BadgeService,
  ) {}

  @Get('coach')
  brief(@CurrentUser() user: AuthenticatedUser) {
    return this.coach.brief(user);
  }

  /// Günün odağı (Doc 48 A5): "konuyu sen seç, soruları koç seçsin". Geçici —
  /// ertesi gün koça döner. Yanıt brief.focus ile aynı şekil.
  @Put('focus')
  setFocus(@CurrentUser() user: AuthenticatedUser, @Body() dto: SetFocusDto) {
    return this.coach.setFocus(user, dto);
  }

  @Get('badges')
  badges(@CurrentUser() user: AuthenticatedUser) {
    return this.badgeService.listForUser(user.id);
  }
}

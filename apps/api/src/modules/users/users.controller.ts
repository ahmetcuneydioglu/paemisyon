import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { UpdateProfileDto } from './dto/update-profile.dto';

/// GET/PATCH /api/v1/me — profil + entitlement (Doc 7 §4.2). Kimlik zorunlu.
@Controller('me')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async me(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { entitlement: true },
    });
    return {
      id: user.id,
      email: user.email,
      displayName: profile?.displayName,
      avatarUrl: profile?.avatarUrl,
      onboardingCompleted: profile?.onboardingCompletedAt != null,
      roles: user.roles,
      isPremium: user.isPremium,
      validUntil: profile?.entitlement?.validUntil ?? null,
    };
  }

  @Patch()
  async update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { displayName: dto.displayName, avatarUrl: dto.avatarUrl },
    });
    return {
      id: updated.id,
      displayName: updated.displayName,
      avatarUrl: updated.avatarUrl,
    };
  }
}

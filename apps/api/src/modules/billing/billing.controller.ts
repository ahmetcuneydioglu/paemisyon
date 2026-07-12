import { BadRequestException, Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { BillingService } from './billing.service';
import { VerifyPurchaseDto } from './dto/verify-purchase.dto';

/** /api/v1/billing — planlar + satın alma doğrulama (Doc 7/15). Kimlik zorunlu. */
@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('plans')
  plans() {
    return this.billing.purchasablePlans();
  }

  @Post('verify')
  verify(@CurrentUser() user: AuthenticatedUser, @Body() dto: VerifyPurchaseDto) {
    if (dto.platform !== 'apple') {
      // Google Play doğrulaması Android sprintinde eklenecek.
      throw new BadRequestException('Şu an yalnızca Apple StoreKit destekleniyor.');
    }
    return this.billing.verifyApple(user.id, dto.transactionJws);
  }
}

import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { AppleVerifier } from './apple-verifier.service';

/** Abonelik/ödeme (Doc 15). Prisma + Auth global; guard'lar import'suz kullanılır. */
@Module({
  controllers: [BillingController],
  providers: [BillingService, AppleVerifier],
})
export class BillingModule {}

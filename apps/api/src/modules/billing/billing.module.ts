import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { AppleNotificationsController } from './apple-notifications.controller';
import { GoogleNotificationsController } from './google-notifications.controller';
import { BillingService } from './billing.service';
import { AppleVerifier } from './apple-verifier.service';
import { GooglePlayVerifier } from './google-play-verifier.service';

/** Abonelik/ödeme (Doc 15). Prisma + Auth global; guard'lar import'suz kullanılır. */
@Module({
  controllers: [
    BillingController,
    AppleNotificationsController,
    GoogleNotificationsController,
  ],
  providers: [BillingService, AppleVerifier, GooglePlayVerifier],
})
export class BillingModule {}

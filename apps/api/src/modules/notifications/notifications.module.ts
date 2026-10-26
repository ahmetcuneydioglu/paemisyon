import { Global, Module } from '@nestjs/common';
import { AuditService } from '../admin/audit.service';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { AppEventsService } from './app-events.service';
import { AudienceService } from './audience.service';
import { AutomationsService } from './automations.service';
import { CampaignsService } from './campaigns.service';
import { DecisionService } from './decision.service';
import { DeliveryWorker } from './delivery.worker';
import { EmailChannelService } from './email-channel.service';
import { LeaderboardNudgeService } from './leaderboard-nudge.service';
import { NotificationsAdminController } from './notifications-admin.controller';
import { NotificationsMeController } from './notifications-me.controller';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { RollupService } from './rollup.service';
import { TestersService } from './testers.service';

/**
 * Bildirim Merkezi (Doc 52): tek giriş noktası NotificationsService.enqueue.
 * Global: deneme, sıralama ve admin modülleri enjekte eder.
 */
@Global()
@Module({
  imports: [AuthModule, EmailModule],
  controllers: [NotificationsMeController, NotificationsAdminController],
  providers: [
    PushService,
    DecisionService,
    NotificationsService,
    AudienceService,
    EmailChannelService,
    TestersService,
    CampaignsService,
    DeliveryWorker,
    RollupService,
    LeaderboardNudgeService,
    AppEventsService,
    AutomationsService,
    AuditService,
  ],
  exports: [
    PushService,
    NotificationsService,
    CampaignsService,
    AudienceService,
    LeaderboardNudgeService,
    AppEventsService,
    AutomationsService,
  ],
})
export class NotificationsModule {}

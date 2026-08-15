import { Global, Module } from '@nestjs/common';
import { LeaderboardNudgeService } from './leaderboard-nudge.service';
import { PushService } from './push.service';

/** Push altyapısı (Faz 2) — global: me/admin controller'ları enjekte eder. */
@Global()
@Module({
  providers: [PushService, LeaderboardNudgeService],
  exports: [PushService, LeaderboardNudgeService],
})
export class NotificationsModule {}

import { Module } from '@nestjs/common';
import { CoachModule } from '../coach/coach.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DuelController } from './duel.controller';
import { DuelEngineService } from './duel-engine.service';
import { DuelQuestionsService } from './duel-questions.service';
import { DuelRealtimeService } from './duel-realtime.service';
import { DuelSweeperService } from './duel-sweeper.service';
import { DuelService } from './duel.service';

/// Doc 59: Düello ve çok oyunculu salon — otorite sunucuda, Realtime yalnız taşıyıcı.
@Module({
  imports: [CoachModule, NotificationsModule], // rozet verme; davet bildirimi (yalnız enqueue)
  controllers: [DuelController],
  providers: [
    DuelService,
    DuelEngineService,
    DuelQuestionsService,
    DuelRealtimeService,
    DuelSweeperService,
  ],
  exports: [DuelEngineService],
})
export class DuelModule {}

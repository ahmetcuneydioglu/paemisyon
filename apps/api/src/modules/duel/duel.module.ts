import { Module } from '@nestjs/common';
import { DuelController } from './duel.controller';
import { DuelEngineService } from './duel-engine.service';
import { DuelQuestionsService } from './duel-questions.service';
import { DuelRealtimeService } from './duel-realtime.service';
import { DuelSweeperService } from './duel-sweeper.service';
import { DuelService } from './duel.service';

/// Doc 59: Düello ve çok oyunculu salon — otorite sunucuda, Realtime yalnız taşıyıcı.
@Module({
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

import { Module } from '@nestjs/common';
import { BadgeService } from './badge.service';
import { CoachController } from './coach.controller';
import { CoachService } from './coach.service';
import { SnapshotService } from './snapshot.service';
import { PlanModule } from '../plan/plan.module';

/// Kişisel Koç (Doc 19) — kural motoru + GET /me/coach + rozet verme +
/// haftalık mastery fotoğrafı. BadgeService quiz tamamlanınca çağrılır.
@Module({
  imports: [PlanModule], // brief.plan + plan kartları (F8-A)
  controllers: [CoachController],
  providers: [CoachService, BadgeService, SnapshotService],
  exports: [CoachService, BadgeService],
})
export class CoachModule {}

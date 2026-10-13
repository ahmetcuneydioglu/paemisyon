import { Module } from '@nestjs/common';
import { CoachModule } from '../coach/coach.module';
import { ProgressModule } from '../progress/progress.module';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { YarimTurService } from './yarim-tur.service';

@Module({
  imports: [ProgressModule, CoachModule], // BadgeService: quiz bitince rozet kontrolü
  controllers: [QuizController],
  providers: [QuizService, YarimTurService], // YarimTurService: bayat tur cron'u (Doc 48 B-4)
  exports: [QuizService], // ExamsModule denemelerde aynı motoru kullanır (Doc 18)
})
export class QuizModule {}

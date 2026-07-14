import { Module } from '@nestjs/common';
import { CoachModule } from '../coach/coach.module';
import { ProgressModule } from '../progress/progress.module';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';

@Module({
  imports: [ProgressModule, CoachModule], // BadgeService: quiz bitince rozet kontrolü
  controllers: [QuizController],
  providers: [QuizService],
  exports: [QuizService], // ExamsModule denemelerde aynı motoru kullanır (Doc 18)
})
export class QuizModule {}

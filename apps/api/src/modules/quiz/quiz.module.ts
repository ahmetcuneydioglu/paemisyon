import { Module } from '@nestjs/common';
import { CoachModule } from '../coach/coach.module';
import { PlanModule } from '../plan/plan.module';
import { CourseTestsModule } from '../course-tests/course-tests.module';
import { ProgressModule } from '../progress/progress.module';
import { ReviewPromptModule } from '../review-prompt/review-prompt.module';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { YarimTurService } from './yarim-tur.service';
import { ExamFinalizeJobService } from './exam-finalize-job.service';

@Module({
  imports: [ProgressModule, CoachModule, PlanModule, CourseTestsModule, ReviewPromptModule], // PlanService: cevap → haftalık plan kalemi (F8-A) // BadgeService: quiz bitince rozet kontrolü
  controllers: [QuizController],
  providers: [QuizService, YarimTurService, ExamFinalizeJobService], // ExamFinalizeJobService: deneme teslim kuyruğu (Doc 50 §5-3) // YarimTurService: bayat tur cron'u (Doc 48 B-4)
  exports: [QuizService], // ExamsModule denemelerde aynı motoru kullanır (Doc 18)
})
export class QuizModule {}

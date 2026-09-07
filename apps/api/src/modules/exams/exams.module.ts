import { Module } from '@nestjs/common';
import { QuizModule } from '../quiz/quiz.module';
import { PublicModule } from '../public/public.module';
import { ExamsController } from './exams.controller';
import { PastExamsController } from './past-exams.controller';
import { ExamsService } from './exams.service';

/** Randevulu canlı denemeler (Doc 18). Cevap/bitirme motoru QuizModule'den. */
@Module({
  imports: [QuizModule, PublicModule],
  controllers: [ExamsController, PastExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}

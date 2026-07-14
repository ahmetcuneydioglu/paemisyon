import { Module } from '@nestjs/common';
import { QuizModule } from '../quiz/quiz.module';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';

/** Randevulu canlı denemeler (Doc 18). Cevap/bitirme motoru QuizModule'den. */
@Module({
  imports: [QuizModule],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}

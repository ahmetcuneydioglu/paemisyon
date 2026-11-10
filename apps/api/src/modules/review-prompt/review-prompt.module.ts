import { Module } from '@nestjs/common';
import { ReviewPromptController } from './review-prompt.controller';
import { ReviewPromptService } from './review-prompt.service';

/// Doc 57: mağaza değerlendirme istemi — karar sunucuda, istemci yalnız gösterir.
@Module({
  controllers: [ReviewPromptController],
  providers: [ReviewPromptService],
  exports: [ReviewPromptService], // QuizModule tur bitişinde, ExamsModule haftalık sonuçta kullanır
})
export class ReviewPromptModule {}

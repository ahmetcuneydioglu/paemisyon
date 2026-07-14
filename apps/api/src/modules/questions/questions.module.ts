import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';

/**
 * Kullanıcıya açık soru işlemleri (Doc 18 §7 — soru önerisi).
 * Admin soru yönetimi ayrı (AdminModule); bu modül son-kullanıcı içindir.
 */
@Module({
  controllers: [QuestionsController],
  providers: [QuestionsService],
})
export class QuestionsModule {}

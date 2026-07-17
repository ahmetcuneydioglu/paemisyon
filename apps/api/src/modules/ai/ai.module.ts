import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiExplainService } from './ai-explain.service';

/// AI koç modülü (Doc 24 §4 Faz 2): yanlış açıklaması — önbellek-önce.
@Module({
  controllers: [AiController],
  providers: [AiExplainService],
})
export class AiModule {}

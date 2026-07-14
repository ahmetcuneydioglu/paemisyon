import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { QuestionsService } from './questions.service';
import { SuggestQuestionDto } from './dto/suggest-question.dto';

/** /api/v1/questions — kullanıcıya açık soru işlemleri (öneri). */
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questions: QuestionsService) {}

  /** Soru önerisi için modül→ders→konu ağacı (public — form hedefi seçtirir). */
  @Get('catalog')
  catalog() {
    return this.questions.publicCatalog();
  }

  /** Soru öner — onay kuyruğuna düşer. Rate limit: dakikada 5 (spam koruması). */
  @Post('suggest')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  suggest(@CurrentUser() user: AuthenticatedUser, @Body() dto: SuggestQuestionDto) {
    return this.questions.suggest(user, dto);
  }
}

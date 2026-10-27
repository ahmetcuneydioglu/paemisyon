import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { SummariesService } from './summaries.service';

/**
 * Konu özetleri — public okuma (Doc 53 §6). Girişliyse ilerleme ve kilit kullanıcıya göre
 * hesaplanır; bu yüzden paylaşımlı cache YOK (private, kısa). SEO sayfası web tarafında ISR ile
 * misafir yanıtını önbellekler.
 */
@Controller('public/summaries')
export class PublicSummariesController {
  constructor(private readonly summaries: SummariesService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400')
  listAll() {
    return this.summaries.listAllPublished();
  }

  @Get('topic/:topicId')
  @UseGuards(OptionalJwtGuard)
  @Header('Cache-Control', 'private, max-age=60')
  listForTopic(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.summaries.listForTopic(topicId, user ?? null);
  }

  @Get(':slug')
  @UseGuards(OptionalJwtGuard)
  @Header('Cache-Control', 'private, max-age=60')
  unit(@Param('slug') slug: string, @CurrentUser() user?: AuthenticatedUser) {
    return this.summaries.getUnit(slug, user ?? null);
  }
}

/** Kullanıcının özet ilerlemesi (ReadingProgress'in ünite eşi). */
@Controller('me/summaries')
@UseGuards(JwtAuthGuard)
export class MeSummariesController {
  constructor(private readonly summaries: SummariesService) {}

  @Post('progress')
  saveProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { slug?: string; lastBlockIndex?: number; completed?: boolean },
  ) {
    return this.summaries.saveProgress(user, body);
  }

  @Get('progress')
  myProgress(@CurrentUser() user: AuthenticatedUser) {
    return this.summaries.myProgress(user);
  }
}

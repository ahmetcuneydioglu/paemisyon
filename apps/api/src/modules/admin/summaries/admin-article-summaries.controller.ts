import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/auth.types';
import type { ArticleSummaryJson } from '../../summaries/madde-ozeti-dogrulayici';
import {
  AdminArticleSummariesService,
  type UpdateArticleSummaryDto,
} from './admin-article-summaries.service';

/**
 * /admin/article-summaries — Madde Özetleri paneli (Doc 54).
 * RBAC: editor içe aktarır, düzenler, doğrulama durumu işaretler; admin yayınlar, yayından alır, siler.
 */
@Controller('admin/article-summaries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminArticleSummariesController {
  constructor(private readonly svc: AdminArticleSummariesService) {}

  @Get('laws')
  @Roles('admin', 'editor')
  laws() {
    return this.svc.laws();
  }

  @Get('stale')
  @Roles('admin', 'editor')
  stale() {
    return this.svc.staleQueue();
  }

  @Get('law/:slug')
  @Roles('admin', 'editor')
  list(@Param('slug') slug: string) {
    return this.svc.list(slug);
  }

  @Post('import')
  @Roles('admin', 'editor')
  import(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() body: ArticleSummaryJson | ArticleSummaryJson[],
    @Query('replace') replace?: string,
  ) {
    const items = Array.isArray(body) ? body : [body];
    if (
      items.length === 0 ||
      items.some((s) => !s || typeof s !== 'object' || !('articleNo' in s))
    ) {
      throw new BadRequestException('Gövde madde özeti JSON (ya da listesi) olmalı.');
    }
    const r = replace === '1' || replace === 'true';
    return Promise.all(items.map((s) => this.svc.import(actor, s, r)));
  }

  @Get(':id')
  @Roles('admin', 'editor')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.detail(id);
  }

  @Patch(':id')
  @Roles('admin', 'editor')
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateArticleSummaryDto,
  ) {
    return this.svc.update(actor, id, dto ?? {});
  }

  @Post(':id/verification')
  @Roles('admin', 'editor')
  verification(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status?: 'pending_review' | 'verified' | 'needs_refresh' },
  ) {
    if (!body?.status || !['pending_review', 'verified', 'needs_refresh'].includes(body.status))
      throw new BadRequestException('status gerekli.');
    return this.svc.setVerification(actor, id, body.status);
  }

  @Post(':id/publish')
  @Roles('admin')
  publish(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.publish(actor, id);
  }

  @Post(':id/unpublish')
  @Roles('admin')
  unpublish(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.unpublish(actor, id);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(actor, id);
  }
}

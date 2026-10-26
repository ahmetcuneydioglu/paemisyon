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
import type { SummaryBlockType } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/auth.types';
import type { SummaryUnitJson } from '../../summaries/ozet-dogrulayici';
import { AdminSummariesService, type UpdateBlockDto, type UpdateUnitDto } from './admin-summaries.service';

/**
 * /admin/summaries — Konu Özetleri paneli (Doc 53 §4 adım 4–6, §6 admin).
 * RBAC: editor içe aktarır, düzenler, istatistik yeniler; admin yayınlar, yayından alır, siler.
 */
@Controller('admin/summaries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminSummariesController {
  constructor(private readonly summaries: AdminSummariesService) {}

  @Get()
  @Roles('admin', 'editor')
  list() {
    return this.summaries.list();
  }

  @Get('stale')
  @Roles('admin', 'editor')
  stale() {
    return this.summaries.staleQueue();
  }

  @Post('import')
  @Roles('admin', 'editor')
  import(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() body: SummaryUnitJson,
    @Query('replace') replace?: string,
  ) {
    if (!body || typeof body !== 'object' || !('unit' in body) || !('blocks' in body)) {
      throw new BadRequestException('Gövde { unit, blocks } biçiminde ünite JSON olmalı.');
    }
    return this.summaries.import(actor, body, replace === '1' || replace === 'true');
  }

  @Get(':id')
  @Roles('admin', 'editor')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.summaries.detail(id);
  }

  @Patch(':id')
  @Roles('admin', 'editor')
  update(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUnitDto) {
    return this.summaries.updateUnit(actor, id, dto ?? {});
  }

  @Post(':id/blocks')
  @Roles('admin', 'editor')
  addBlock(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBlockDto & { type: SummaryBlockType },
  ) {
    if (!dto?.type) throw new BadRequestException('Kart türü gerekli.');
    return this.summaries.addBlock(actor, id, dto);
  }

  @Post(':id/reorder')
  @Roles('admin', 'editor')
  reorder(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { blockIds?: string[] },
  ) {
    if (!Array.isArray(body?.blockIds)) throw new BadRequestException('blockIds gerekli.');
    return this.summaries.reorder(actor, id, body.blockIds);
  }

  @Post(':id/refresh-stats')
  @Roles('admin', 'editor')
  refreshStats(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.summaries.refreshStats(actor, id);
  }

  @Post(':id/publish')
  @Roles('admin')
  publish(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.summaries.publish(actor, id);
  }

  @Post(':id/unpublish')
  @Roles('admin')
  unpublish(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.summaries.unpublish(actor, id);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.summaries.remove(actor, id);
  }

  @Patch('blocks/:blockId')
  @Roles('admin', 'editor')
  updateBlock(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Body() dto: UpdateBlockDto,
  ) {
    return this.summaries.updateBlock(actor, blockId, dto ?? {});
  }

  @Post('blocks/:blockId/archive')
  @Roles('admin', 'editor')
  archiveBlock(@CurrentUser() actor: AuthenticatedUser, @Param('blockId', ParseUUIDPipe) blockId: string) {
    return this.summaries.archiveBlock(actor, blockId);
  }
}

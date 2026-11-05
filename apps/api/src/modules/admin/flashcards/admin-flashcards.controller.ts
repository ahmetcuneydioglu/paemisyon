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
import type { FlashcardDeckJson } from '../../flashcards/kart-dogrulayici';
import { AdminFlashcardsService } from './admin-flashcards.service';
import {
  CreateFlashcardDto,
  ListFlashcardsQueryDto,
  PublishManyDto,
  UpdateFlashcardDto,
  VerificationDto,
} from './dto/admin-flashcards.dto';

/**
 * /admin/flashcards — Bilgi Kartları paneli (Doc 56 §8.1).
 * RBAC: editor listeler, düzenler, oluşturur, içe aktarır, arşivler, mevzuat kontrolünü işaretler;
 * admin yayınlar, yayından alır, siler, toplu yayınlar.
 */
@Controller('admin/flashcards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminFlashcardsController {
  constructor(private readonly flashcards: AdminFlashcardsService) {}

  @Get()
  @Roles('admin', 'editor')
  list(@Query() q: ListFlashcardsQueryDto) {
    return this.flashcards.list(q);
  }

  @Get('stats')
  @Roles('admin', 'editor')
  stats() {
    return this.flashcards.stats();
  }

  @Get('stale')
  @Roles('admin', 'editor')
  stale() {
    return this.flashcards.staleQueue();
  }

  @Post('import')
  @Roles('admin', 'editor')
  import(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() body: FlashcardDeckJson,
    @Query('replace') replace?: string,
    @Query('dryRun') dryRun?: string,
  ) {
    if (!body || typeof body !== 'object' || !('deck' in body) || !('cards' in body))
      throw new BadRequestException('Gövde { deck, cards } biçiminde deste JSON olmalı.');
    return this.flashcards.import(actor, body, {
      replace: replace === '1' || replace === 'true',
      dryRun: dryRun === '1' || dryRun === 'true',
    });
  }

  @Post('publish-many')
  @Roles('admin')
  publishMany(@CurrentUser() actor: AuthenticatedUser, @Body() dto: PublishManyDto) {
    return this.flashcards.publishMany(actor, dto.ids);
  }

  @Post()
  @Roles('admin', 'editor')
  create(@CurrentUser() actor: AuthenticatedUser, @Body() dto: CreateFlashcardDto) {
    return this.flashcards.create(actor, dto);
  }

  @Get(':id')
  @Roles('admin', 'editor')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.flashcards.detail(id);
  }

  @Patch(':id')
  @Roles('admin', 'editor')
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFlashcardDto,
  ) {
    return this.flashcards.update(actor, id, dto ?? {});
  }

  @Post(':id/archive')
  @Roles('admin', 'editor')
  archive(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.flashcards.archive(actor, id);
  }

  @Post(':id/publish')
  @Roles('admin')
  publish(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.flashcards.publish(actor, id);
  }

  @Post(':id/unpublish')
  @Roles('admin')
  unpublish(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.flashcards.unpublish(actor, id);
  }

  @Post(':id/verification')
  @Roles('admin', 'editor')
  verification(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerificationDto,
  ) {
    return this.flashcards.setVerification(actor, id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.flashcards.remove(actor, id);
  }
}

import {
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
import { AdminExamsService } from './admin-exams.service';
import {
  AutofillExamDto,
  ExamAdjustmentDto,
  SetExamQuestionsDto,
  UpsertExamDto,
} from '../dto/exam.dto';
import { AdminExamAdjustmentsService } from './admin-exam-adjustments.service';

/**
 * /api/v1/admin/exams — Deneme yönetimi (Doc 18 §8).
 * Editor: taslak hazırlama; yayın/yayından-kaldırma/arşiv YALNIZ admin
 * (soru onayıyla aynı güvence — Doc 9 §4.3).
 */
@Controller('admin/exams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminExamsController {
  constructor(
    private readonly exams: AdminExamsService,
    private readonly adjustments: AdminExamAdjustmentsService,
  ) {}

  @Get()
  @Roles('admin', 'editor')
  list() {
    return this.exams.list();
  }

  @Get(':id')
  @Roles('admin', 'editor')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.exams.detail(id);
  }

  @Get(':id/results')
  @Roles('admin')
  results(@Param('id', ParseUUIDPipe) id: string) {
    return this.exams.results(id);
  }

  /** Yayın öncesi gözden geçirme: setteki soruların TAM içeriği + bayraklar. */
  @Get(':id/inceleme')
  @Roles('admin', 'editor')
  inceleme(@Param('id', ParseUUIDPipe) id: string) {
    return this.exams.inceleme(id);
  }

  /** Soruyu setten çıkar; ?yerine=1 ise aynı konudan/dersten yenisini koy. */
  @Delete(':id/questions/:questionId')
  @Roles('admin', 'editor')
  replaceQuestion(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Query('yerine') yerine?: string,
  ) {
    return this.exams.replaceQuestion(actor, id, questionId, yerine === '1');
  }

  @Post()
  @Roles('admin', 'editor')
  create(@CurrentUser() actor: AuthenticatedUser, @Body() dto: UpsertExamDto) {
    return this.exams.create(actor, dto);
  }

  @Patch(':id')
  @Roles('admin', 'editor')
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertExamDto,
  ) {
    return this.exams.update(actor, id, dto);
  }

  @Patch(':id/questions')
  @Roles('admin', 'editor')
  setQuestions(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetExamQuestionsDto,
  ) {
    return this.exams.setQuestions(actor, id, dto.questionIds);
  }

  @Post(':id/autofill')
  @Roles('admin', 'editor')
  autofill(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AutofillExamDto,
  ) {
    return this.exams.autofill(
      actor,
      id,
      dto.moduleId,
      dto.questionCount,
      dto.onlyMissing === true,
    );
  }

  /** Yayın ön kontrolü (Doc 50 A4): engeller + uyarılar + dağılım. */
  @Get(':id/publish-check')
  @Roles('admin', 'editor')
  publishCheck(@Param('id', ParseUUIDPipe) id: string) {
    return this.exams.publishCheck(id);
  }

  /** İstatistik (Figma A-istatistik): özet, net dağılımı, soru analizi. */
  @Get(':id/stats')
  @Roles('admin', 'editor')
  stats(@Param('id', ParseUUIDPipe) id: string) {
    return this.adjustments.stats(id);
  }

  @Get(':id/adjustments')
  @Roles('admin', 'editor')
  adjustmentsList(@Param('id', ParseUUIDPipe) id: string) {
    return this.adjustments.list(id);
  }

  @Post(':id/adjustments/preview')
  @Roles('admin')
  adjustmentPreview(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ExamAdjustmentDto) {
    return this.adjustments.preview(id, dto);
  }

  /** Soru iptali (Doc 50 §2.3): yeniden puanlama + sıralama + bildirim. */
  @Post(':id/adjustments')
  @Roles('admin')
  adjustmentApply(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExamAdjustmentDto,
  ) {
    return this.adjustments.apply(actor, id, dto);
  }

  @Post(':id/adjustments/:adjustmentId/revert')
  @Roles('admin')
  adjustmentRevert(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('adjustmentId', ParseUUIDPipe) adjustmentId: string,
  ) {
    return this.adjustments.revert(actor, id, adjustmentId);
  }

  @Post(':id/publish')
  @Roles('admin')
  publish(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('announce') announce?: boolean,
  ) {
    return this.exams.publish(actor, id, announce === true);
  }

  @Post(':id/unpublish')
  @Roles('admin')
  unpublish(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.exams.unpublish(actor, id);
  }

  @Post(':id/archive')
  @Roles('admin')
  archive(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.exams.archive(actor, id);
  }
}

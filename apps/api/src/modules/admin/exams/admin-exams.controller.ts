import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { AdminExamsService } from './admin-exams.service';
import { SetExamQuestionsDto, UpsertExamDto } from '../dto/exam.dto';

/**
 * /api/v1/admin/exams — Deneme yönetimi (Doc 18 §8).
 * Editor: taslak hazırlama; yayın/yayından-kaldırma/arşiv YALNIZ admin
 * (soru onayıyla aynı güvence — Doc 9 §4.3).
 */
@Controller('admin/exams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminExamsController {
  constructor(private readonly exams: AdminExamsService) {}

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

  @Post(':id/publish')
  @Roles('admin')
  publish(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.exams.publish(actor, id);
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

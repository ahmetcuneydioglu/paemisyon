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
import type { ContentStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AdminDashboardService } from './dashboard/admin-dashboard.service';
import { AdminCatalogService } from './catalog/admin-catalog.service';
import { AdminQuestionsService } from './questions/admin-questions.service';
import { AdminUsersService } from './users/admin-users.service';
import { AuditService } from './audit.service';
import { UpsertQuestionDto } from './dto/upsert-question.dto';
import { UpsertCourseDto, UpsertTopicDto } from './dto/catalog.dto';

/**
 * /api/v1/admin — panel API'si (Doc 9). RBAC (Doc 8):
 *  - editor: yalnızca içerik (katalog + soru taslak/inceleme).
 *  - admin: her şey (onay, kullanıcı, gelir, audit).
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    private readonly dashboard: AdminDashboardService,
    private readonly catalog: AdminCatalogService,
    private readonly questions: AdminQuestionsService,
    private readonly users: AdminUsersService,
    private readonly audit: AuditService,
  ) {}

  // ── Dashboard ──
  @Get('dashboard')
  @Roles('admin', 'editor')
  overview() {
    return this.dashboard.overview();
  }

  // ── Katalog (içerik ağacı) ──
  @Get('catalog/tree')
  @Roles('admin', 'editor')
  tree() {
    return this.catalog.tree();
  }

  @Post('catalog/courses')
  @Roles('admin', 'editor')
  createCourse(@CurrentUser() actor: AuthenticatedUser, @Body() dto: UpsertCourseDto) {
    return this.catalog.createCourse(actor, dto);
  }

  @Patch('catalog/courses/:id')
  @Roles('admin', 'editor')
  updateCourse(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertCourseDto,
  ) {
    return this.catalog.updateCourse(actor, id, dto);
  }

  @Delete('catalog/courses/:id')
  @Roles('admin')
  deleteCourse(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.deleteCourse(actor, id);
  }

  @Post('catalog/topics')
  @Roles('admin', 'editor')
  createTopic(@CurrentUser() actor: AuthenticatedUser, @Body() dto: UpsertTopicDto) {
    return this.catalog.createTopic(actor, dto);
  }

  @Patch('catalog/topics/:id')
  @Roles('admin', 'editor')
  updateTopic(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertTopicDto,
  ) {
    return this.catalog.updateTopic(actor, id, dto);
  }

  @Delete('catalog/topics/:id')
  @Roles('admin')
  deleteTopic(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.deleteTopic(actor, id);
  }

  // ── Sorular (sürümlü editoryal akış) ──
  @Get('questions')
  @Roles('admin', 'editor')
  listQuestions(
    @Query('status') status?: ContentStatus,
    @Query('topicId') topicId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
  ) {
    return this.questions.list({
      status,
      topicId,
      search,
      page: page ? Number(page) : undefined,
    });
  }

  @Get('questions/:id')
  @Roles('admin', 'editor')
  questionDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.questions.detail(id);
  }

  @Post('questions')
  @Roles('admin', 'editor')
  createQuestion(@CurrentUser() actor: AuthenticatedUser, @Body() dto: UpsertQuestionDto) {
    return this.questions.create(actor, dto);
  }

  @Patch('questions/:id')
  @Roles('admin', 'editor')
  updateQuestion(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertQuestionDto,
  ) {
    return this.questions.update(actor, id, dto);
  }

  @Post('questions/:id/submit')
  @Roles('admin', 'editor')
  submitQuestion(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.questions.submitForReview(actor, id);
  }

  // Onay/ret YALNIZCA admin — mevzuat güvencesi (Doc 9 §4.3).
  @Post('questions/:id/approve')
  @Roles('admin')
  approveQuestion(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.questions.approve(actor, id);
  }

  @Post('questions/:id/reject')
  @Roles('admin')
  rejectQuestion(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('note') note?: string,
  ) {
    return this.questions.reject(actor, id, note);
  }

  @Post('questions/:id/archive')
  @Roles('admin')
  archiveQuestion(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.questions.archive(actor, id);
  }

  // ── Kullanıcılar (yalnızca admin — editor kullanıcı verisi göremez) ──
  @Get('users')
  @Roles('admin')
  listUsers(@Query('search') search?: string, @Query('page') page?: string) {
    return this.users.list({ search, page: page ? Number(page) : undefined });
  }

  @Get('users/:id')
  @Roles('admin')
  userDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.detail(id);
  }

  @Post('users/:id/status')
  @Roles('admin')
  setUserStatus(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: 'active' | 'suspended',
  ) {
    return this.users.setStatus(actor, id, status);
  }

  @Post('users/:id/premium')
  @Roles('admin')
  setUserPremium(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isPremium') isPremium: boolean,
    @Body('validUntil') validUntil?: string,
  ) {
    return this.users.setPremium(actor, id, isPremium, validUntil);
  }

  // ── Audit log (yalnızca admin) ──
  @Get('audit')
  @Roles('admin')
  auditList(@Query('page') page?: string) {
    return this.audit.list(page ? Number(page) : 1);
  }
}

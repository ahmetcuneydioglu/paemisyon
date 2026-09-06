import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { AdminPastExamsService } from './admin-past-exams.service';
import { UpdatePastExamDto, UpdatePastExamQuestionDto } from '../dto/past-exam.dto';

/**
 * /api/v1/admin/past-exams — Çıkmış sınav vitrini (Doc 36).
 *
 * Editor görüntüler ve public görünürlüğü ayarlar; YAYINA ALMA yalnız admin
 * (soru onayı ve deneme yayınıyla aynı güvence — Doc 9 §4.3).
 */
@Controller('admin/past-exams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminPastExamsController {
  constructor(private readonly service: AdminPastExamsService) {}

  @Get()
  @Roles('admin', 'editor')
  list() {
    return this.service.list();
  }

  @Get(':id')
  @Roles('admin', 'editor')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.detail(id);
  }

  @Patch(':id')
  @Roles('admin')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePastExamDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Patch(':id/questions/:questionId')
  @Roles('admin', 'editor')
  updateQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() dto: UpdatePastExamQuestionDto,
  ) {
    return this.service.updateQuestion(user, id, questionId, dto);
  }
}

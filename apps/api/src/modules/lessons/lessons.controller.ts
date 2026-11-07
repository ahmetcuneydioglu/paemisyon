import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { LessonsService, type LessonImportInput } from './lessons.service';

/** Konu anlatımı — public okuma (Doc 57). Girişliyse ilerleme ve kilit kullanıcıya göre: paylaşımlı cache yok. */
@Controller('public/lessons')
export class PublicLessonsController {
  constructor(private readonly lessons: LessonsService) {}

  @Get('sections')
  @UseGuards(OptionalJwtGuard)
  @Header('Cache-Control', 'private, max-age=60')
  sections(
    @Query('topicId') topicId?: string,
    @Query('courseId') courseId?: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.lessons.sectionsFor(
      { topicId: topicId || undefined, courseId: courseId || undefined },
      user ?? null,
    );
  }

  @Get(':slug')
  @UseGuards(OptionalJwtGuard)
  @Header('Cache-Control', 'private, max-age=60')
  lesson(@Param('slug') slug: string, @CurrentUser() user?: AuthenticatedUser) {
    return this.lessons.getLesson(slug, user ?? null);
  }
}

@Controller('me/lessons')
@UseGuards(JwtAuthGuard)
export class MeLessonsController {
  constructor(private readonly lessons: LessonsService) {}

  @Post('progress')
  progress(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { slug?: string; offset?: number; read?: boolean },
  ) {
    return this.lessons.saveProgress(user, body);
  }
}

/** Asgari panel uçları (B aşamasında arayüz): liste, detay+doğrulama, içe aktar, yayınla, premium. */
@Controller('admin/lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminLessonsController {
  constructor(private readonly lessons: LessonsService) {}

  @Get()
  @Roles('admin', 'editor')
  list() {
    return this.lessons.adminList();
  }

  @Post('import')
  @Roles('admin', 'editor')
  import(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() body: LessonImportInput | LessonImportInput[],
  ) {
    const items = Array.isArray(body) ? body : [body];
    return Promise.all(items.map((i) => this.lessons.importLesson(i, actor.id)));
  }

  @Post('validate')
  @Roles('admin', 'editor')
  validate(@Body() body: LessonImportInput) {
    return this.lessons.validateForImport(body);
  }

  @Get(':id')
  @Roles('admin', 'editor')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.lessons.adminDetail(id);
  }

  @Post(':id/publish')
  @Roles('admin')
  publish(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.lessons.publish(actor, id);
  }

  @Post(':id/unpublish')
  @Roles('admin')
  unpublish(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.lessons.unpublish(actor, id);
  }

  @Post('sections/:id/premium')
  @Roles('admin')
  premium(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { isPremium?: boolean },
  ) {
    return this.lessons.setSectionPremium(actor, id, body?.isPremium === true);
  }
}

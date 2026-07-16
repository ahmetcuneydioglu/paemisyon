import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CatalogService } from './catalog.service';

/// GET /api/v1/catalog/* — içerik keşfi (Doc 7 §4.3). Kimlik zorunlu.
@Controller('catalog')
@UseGuards(JwtAuthGuard)
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('modules')
  modules(@CurrentUser() user: AuthenticatedUser) {
    return this.catalog.getModules(user.id);
  }

  @Get('modules/:id/courses')
  courses(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.getCourses(id);
  }

  @Get('courses/:id/topics')
  topics(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.catalog.getTopics(id, user.id);
  }

  @Get('topics/:id')
  topic(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.getTopic(id);
  }
}

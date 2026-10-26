import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import {
  InboxQueryDto,
  NotificationEventDto,
  UpdateUserSettingsDto,
} from './dto/notifications.dto';
import { NotificationsService } from './notifications.service';

/** /api/v1/me/notifications/* — aday kutusu, olaylar, tercihler (Doc 52 §10). */
@Controller('me/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsMeController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() q: InboxQueryDto) {
    return this.notifications.inbox(user.id, q);
  }

  @Get('unread-count')
  async unread(@CurrentUser() user: AuthenticatedUser) {
    return { count: await this.notifications.unreadCount(user.id) };
  }

  @Get('settings')
  settings(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.settings(user.id);
  }

  @Patch('settings')
  updateSettings(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateUserSettingsDto) {
    return this.notifications.updateSettings(user.id, dto);
  }

  @Post('read-all')
  readAll(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.readAll(user.id);
  }

  @Post(':id/read')
  read(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.notifications.markRead(user.id, id);
  }

  @Post(':id/events')
  event(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: NotificationEventDto,
  ) {
    return this.notifications.recordEvent(user.id, id, dto);
  }
}

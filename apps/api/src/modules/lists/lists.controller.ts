import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateListDto, UpdateListDto, UpsertNoteDto } from './dto/list.dto';
import { ListsService } from './lists.service';

/// Soru notu + kişisel listeler (Doc 49 S1-C §2). Hepsi girişli.
@Controller('me')
@UseGuards(JwtAuthGuard)
export class ListsController {
  constructor(private readonly lists: ListsService) {}

  @Get('questions/:id/note')
  getNote(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.lists.getNote(user.id, id);
  }

  @Put('questions/:id/note')
  putNote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertNoteDto,
  ) {
    return this.lists.putNote(user.id, id, dto.text);
  }

  @Delete('questions/:id/note')
  deleteNote(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.lists.deleteNote(user.id, id);
  }

  @Get('questions/:id/lists')
  listsOfQuestion(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.lists.listsOfQuestion(user.id, id);
  }

  @Get('lists')
  getLists(@CurrentUser() user: AuthenticatedUser) {
    return this.lists.getLists(user);
  }

  @Post('lists')
  createList(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateListDto) {
    return this.lists.createList(user, dto.name);
  }

  @Get('lists/:id')
  getList(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.lists.getList(user.id, id);
  }

  @Patch('lists/:id')
  updateList(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateListDto,
  ) {
    return this.lists.updateList(user.id, id, dto);
  }

  @Delete('lists/:id')
  deleteList(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.lists.deleteList(user.id, id);
  }

  @Post('lists/:id/items/:questionId')
  addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
  ) {
    return this.lists.addItem(user, id, questionId);
  }

  @Delete('lists/:id/items/:questionId')
  removeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
  ) {
    return this.lists.removeItem(user.id, id, questionId);
  }
}

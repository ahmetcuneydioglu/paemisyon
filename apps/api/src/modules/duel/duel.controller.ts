import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { DuelService } from './duel.service';

export class DuelScopeDto {
  @IsOptional() @IsIn(['mixed', 'course', 'topic']) scopeKind?: 'mixed' | 'course' | 'topic';
  @IsOptional() @IsUUID() scopeId?: string;
}

export class DuelRoomDto extends DuelScopeDto {
  @IsOptional() @IsString() @Length(3, 24) name?: string;
  @IsOptional() @IsBoolean() isPublic?: boolean;
  @IsOptional() @IsInt() questionCount?: number;
  @IsOptional() @IsInt() secondsPerQuestion?: number;
  @IsOptional() @IsInt() @Min(3) @Max(8) maxPlayers?: number;
}

export class DuelReadyDto {
  @IsBoolean() ready!: boolean;
}

export class DuelTargetDto {
  @IsUUID() userId!: string;
}

export class DuelJoinDto {
  @IsString() @Length(4, 16) code!: string;
}

export class DuelInviteDto extends DuelScopeDto {
  @IsUUID() toUserId!: string;
}

export class DuelRespondDto {
  @IsBoolean() accept!: boolean;
}

export class DuelAnswerDto {
  @IsInt() @Min(0) @Max(29) index!: number;
  @IsUUID() optionId!: string;
}

/**
 * /api/v1/me/duel — Düello (Doc 59). İstemci kural bilmez: hak, süre, puan ve sıralama
 * sunucudan gelir. Maç durumu yoklanabilir (`GET matches/:id`); Realtime yalnız hızlandırır.
 * Kötüye kullanıma açık uçlar (eşleşme, kod, davet) genel tavandan daha sıkı sınırlıdır.
 */
@Controller('me/duel')
@UseGuards(JwtAuthGuard)
export class DuelController {
  constructor(private readonly duel: DuelService) {}

  @Get()
  hub(@CurrentUser() user: AuthenticatedUser) {
    return this.duel.hub(user);
  }

  @Get('active')
  active(@CurrentUser() user: AuthenticatedUser) {
    return this.duel.active(user);
  }

  // ── Hızlı eşleşme
  @Post('queue')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 12 } })
  enqueue(@CurrentUser() user: AuthenticatedUser, @Body() dto: DuelScopeDto) {
    return this.duel.enqueue(user, dto.scopeKind, dto.scopeId);
  }

  @Get('queue')
  queueStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.duel.queueStatus(user);
  }

  @Delete('queue')
  cancelQueue(@CurrentUser() user: AuthenticatedUser) {
    return this.duel.cancelQueue(user);
  }

  // ── Kodla özel düello
  @Post('code')
  @Throttle({ default: { ttl: 60_000, limit: 6 } })
  createWithCode(@CurrentUser() user: AuthenticatedUser, @Body() dto: DuelScopeDto) {
    return this.duel.createWithCode(user, dto.scopeKind, dto.scopeId);
  }

  /** Kod denemesi sıkı sınırlı: 31^6 olasılık × dakikada 8 deneme = kaba kuvvet anlamsız. */
  @Post('join')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 8 } })
  join(@CurrentUser() user: AuthenticatedUser, @Body() dto: DuelJoinDto) {
    return this.duel.joinWithCode(user, dto.code);
  }

  // ── Davet
  @Get('invitations')
  invitations(@CurrentUser() user: AuthenticatedUser) {
    return this.duel.listInvitations(user);
  }

  @Post('invitations')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  invite(@CurrentUser() user: AuthenticatedUser, @Body() dto: DuelInviteDto) {
    return this.duel.invite(user, dto.toUserId, dto.scopeKind, dto.scopeId);
  }

  @Post('invitations/:id/respond')
  @HttpCode(200)
  respond(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DuelRespondDto,
  ) {
    return this.duel.respond(user, id, dto.accept);
  }

  @Delete('invitations/:id')
  cancelInvitation(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.duel.cancelInvitation(user, id);
  }

  // ── Salon
  @Get('rooms')
  openRooms(@CurrentUser() user: AuthenticatedUser) {
    return this.duel.openRooms(user);
  }

  @Post('rooms')
  @Throttle({ default: { ttl: 60_000, limit: 6 } })
  createRoom(@CurrentUser() user: AuthenticatedUser, @Body() dto: DuelRoomDto) {
    return this.duel.createRoom(user, dto);
  }

  @Post('rooms/quick')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 12 } })
  quickRoom(@CurrentUser() user: AuthenticatedUser) {
    return this.duel.quickRoom(user);
  }

  @Patch('rooms/:id')
  updateRoom(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DuelRoomDto,
  ) {
    return this.duel.updateRoom(user, id, dto);
  }

  @Post('rooms/:id/join')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 12 } })
  joinRoom(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.duel.joinRoom(user, id);
  }

  @Post('rooms/:id/ready')
  @HttpCode(200)
  ready(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DuelReadyDto,
  ) {
    return this.duel.ready(user, id, dto.ready);
  }

  @Post('rooms/:id/start')
  @HttpCode(200)
  start(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.duel.start(user, id);
  }

  @Post('rooms/:id/kick')
  @HttpCode(200)
  kick(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DuelTargetDto,
  ) {
    return this.duel.kick(user, id, dto.userId);
  }

  @Post('rooms/:id/invitations')
  @Throttle({ default: { ttl: 60_000, limit: 15 } })
  inviteToRoom(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DuelTargetDto,
  ) {
    return this.duel.inviteToRoom(user, id, dto.userId);
  }

  // ── Oyuncular, engel, sıralama
  @Get('players')
  @Throttle({ default: { ttl: 60_000, limit: 40 } })
  players(@CurrentUser() user: AuthenticatedUser, @Query('q') q?: string) {
    return this.duel.players(user, typeof q === 'string' ? q.slice(0, 40) : undefined);
  }

  @Get('blocks')
  blocks(@CurrentUser() user: AuthenticatedUser) {
    return this.duel.blocks(user);
  }

  @Post('blocks')
  @HttpCode(200)
  block(@CurrentUser() user: AuthenticatedUser, @Body() dto: DuelTargetDto) {
    return this.duel.block(user, dto.userId);
  }

  @Delete('blocks/:userId')
  unblock(@CurrentUser() user: AuthenticatedUser, @Param('userId', ParseUUIDPipe) userId: string) {
    return this.duel.unblock(user, userId);
  }

  @Get('leaderboard')
  leaderboard(
    @CurrentUser() user: AuthenticatedUser,
    @Query('mode') mode?: string,
    @Query('period') period?: string,
    @Query('scope') scope?: string,
  ) {
    return this.duel.leaderboard(
      user,
      mode === 'room' ? 'room' : 'duel',
      period === 'month' ? 'month' : period === 'all' ? 'all' : 'week',
      scope === 'all' ? 'all' : 'module',
    );
  }

  // ── Maç
  @Get('matches/:id')
  state(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.duel.state(user, id);
  }

  @Get('matches/:id/review')
  review(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.duel.review(user, id);
  }

  @Post('matches/:id/answers')
  @HttpCode(200)
  answer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DuelAnswerDto,
  ) {
    return this.duel.answer(user, id, dto.index, dto.optionId);
  }

  @Post('matches/:id/leave')
  @HttpCode(200)
  leave(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.duel.leave(user, id);
  }
}

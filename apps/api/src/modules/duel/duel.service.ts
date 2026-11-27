import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { gunBaslangici, haftaBaslangici } from '../../common/gun';
import { publicName } from '../../common/kisi-adi';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { SETTING_KEYS, SettingsService } from '../../infra/settings/settings.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import {
  DUEL_ENABLED_DEFAULT,
  DUEL_FREE_DAILY_LIMIT_DEFAULT,
  DUEL_RULES,
  duelAcik,
} from './duel.config';
import { DuelEngineService } from './duel-engine.service';
import { DuelQuestionsService, type DuelScope } from './duel-questions.service';
import { codeFromBytes, normalizeCode } from './duel.logic';

/** Tekil indeks ihlalini (yarışı veritabanı kazandı) anlaşılır bir 409'a çevirir. */
function tekilIhlal(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

/**
 * Düello giriş kapıları: merkez ekranı, hızlı eşleşme kuyruğu, kodla özel düello, davet.
 * Maçın kendisi `DuelEngineService`'te yaşar. Yetki (bayrak, premium, günlük hak, kurum)
 * her girişte SUNUCUDA doğrulanır; istemcinin gönderdiği hiçbir hak/puan bilgisine bakılmaz.
 */
@Injectable()
export class DuelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly engine: DuelEngineService,
    private readonly questions: DuelQuestionsService,
  ) {}

  // ── Yetki ────────────────────────────────────────────────────────────────

  private async assertEnabled(user: AuthenticatedUser): Promise<void> {
    const anahtar = await this.settings.getBool(SETTING_KEYS.duelEnabled, DUEL_ENABLED_DEFAULT);
    if (!duelAcik(anahtar, user.roles)) throw new NotFoundException('Düello henüz açık değil.');
  }

  private async moduleOf(userId: string): Promise<string> {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferredModuleId: true },
    });
    if (!u?.preferredModuleId) {
      throw new BadRequestException('Düello için önce hedef sınavını seç.');
    }
    return u.preferredModuleId;
  }

  private async daily(user: AuthenticatedUser, now: Date) {
    const limit = user.isPremium
      ? 0
      : await this.settings.getInt(SETTING_KEYS.duelFreeDailyLimit, DUEL_FREE_DAILY_LIMIT_DEFAULT);
    const used = await this.prisma.duelParticipant.count({
      where: { userId: user.id, match: { startedAt: { gte: gunBaslangici(now) } } },
    });
    // limit 0 = sınırsız (premium ya da panelden kapatılmış sınır)
    return { limit, used, remaining: limit === 0 ? null : Math.max(0, limit - used) };
  }

  /** Yeni maça girebilir mi? Modül kimliğini döner. */
  private async assertCanPlay(user: AuthenticatedUser, now: Date): Promise<string> {
    await this.assertEnabled(user);
    const moduleId = await this.moduleOf(user.id);
    const hak = await this.daily(user, now);
    if (hak.remaining === 0) {
      throw new ForbiddenException({
        code: 'duel_daily_limit',
        message: `Bugünkü ${hak.limit} ücretsiz maç hakkın doldu. Premium ile sınırsız oynarsın.`,
      });
    }
    return moduleId;
  }

  private async activeMatchId(userId: string): Promise<string | null> {
    const p = await this.prisma.duelParticipant.findFirst({
      where: { userId, active: true },
      select: { matchId: true },
    });
    return p?.matchId ?? null;
  }

  private parseScope(kind?: string, id?: string | null): DuelScope {
    if (!kind || kind === 'mixed') return { kind: 'mixed', id: null };
    if ((kind === 'course' || kind === 'topic') && id) return { kind, id };
    throw new BadRequestException('Geçersiz konu seçimi.');
  }

  // ── Merkez ───────────────────────────────────────────────────────────────

  /** Düello ana ekranı: hak, istatistik, aktif maç, bekleyen davetler, kurallar. */
  async hub(user: AuthenticatedUser, now: Date = new Date()) {
    await this.assertEnabled(user);
    await this.touch(user.id, now);
    // Önce aktif maç: süresi dolmuşsa burada kapanır, istatistik güncel okunur.
    const matchId = (await this.active(user))?.matchId ?? null;
    const [hak, stats, davetler] = await Promise.all([
      this.daily(user, now),
      this.prisma.duelStats.findUnique({ where: { userId: user.id } }),
      this.invitations(user.id, now),
    ]);
    const oynanan = stats ? stats.wins + stats.losses + stats.draws : 0;
    return {
      daily: { ...hak, isPremium: user.isPremium },
      activeMatchId: matchId,
      invitations: davetler,
      stats: {
        duels: stats?.duels ?? 0,
        wins: stats?.wins ?? 0,
        losses: stats?.losses ?? 0,
        draws: stats?.draws ?? 0,
        winRate: oynanan > 0 ? Math.round(((stats?.wins ?? 0) / oynanan) * 100) : null,
        currentStreak: stats?.currentStreak ?? 0,
        bestStreak: stats?.bestStreak ?? 0,
        rating: stats?.rating ?? DUEL_RULES.rating.start,
        rooms: stats?.rooms ?? 0,
        roomWins: stats?.roomWins ?? 0,
        roomRating: stats?.roomRating ?? DUEL_RULES.rating.start,
        correctTotal: stats?.correctTotal ?? 0,
        avgAnswerMs:
          stats && stats.answersTotal > 0
            ? Math.round(Number(stats.answerMsTotal) / stats.answersTotal)
            : null,
        xpEarned: stats?.xpEarned ?? 0,
      },
      rules: {
        duel: DUEL_RULES.duel,
        room: DUEL_RULES.room,
        xp: DUEL_RULES.xp,
        searchTimeoutMs: DUEL_RULES.queue.searchTimeoutMs,
      },
    };
  }

  /**
   * Yeniden bağlanma: süren maçın durumu. Okuma maçı sunucu saatine taşır; kimse bakmazken
   * bitmiş maç burada kapanır ve "aktif maç yok" döner (bayat kayıt oyuncuyu kilitlemez).
   */
  async active(user: AuthenticatedUser) {
    const matchId = await this.activeMatchId(user.id);
    if (!matchId) return null;
    const s = await this.engine.state(matchId, user.id);
    return s.phase === 'finished' || s.phase === 'cancelled' ? null : s;
  }

  // ── Hızlı eşleşme ────────────────────────────────────────────────────────

  /**
   * Kuyruğa girer ya da bekleyen uygun rakiple HEMEN eşleşir.
   *
   * Yarış koşulu: modül başına danışma kilidi (pg_advisory_xact_lock) eşleşme kararını
   * sıraya sokar — iki oyuncu aynı anda başlatırsa biri kuyruğa yazar, öteki onu bulur;
   * üç oyuncu aynı anda gelirse aynı rakip iki maça verilemez. Son kapı, katılımcı
   * tablosundaki "kullanıcı başına tek aktif maç" kısmi tekil indeksidir.
   */
  async enqueue(user: AuthenticatedUser, scopeKind?: string, scopeId?: string | null) {
    const now = new Date();
    const moduleId = await this.assertCanPlay(user, now);
    const scope = this.parseScope(scopeKind, scopeId);
    await this.questions.scopeLabel(moduleId, scope);

    const mevcut = (await this.active(user))?.matchId;
    if (mevcut) return { status: 'matched' as const, matchId: mevcut };

    // Soru seti kilit DIŞINDA seçilir (kilit kısa kalsın); yeterli soru yoksa burada 409 döner.
    const sorular = await this.questions.pick(moduleId, scope, DUEL_RULES.duel.questionCount);
    const stats = await this.prisma.duelStats.findUnique({
      where: { userId: user.id },
      select: { rating: true },
    });
    const rating = stats?.rating ?? DUEL_RULES.rating.start;

    let sonuc: { matchId: string; rakipId: string } | null;
    try {
      sonuc = await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'duel-queue:' + moduleId}))`;
        await tx.duelQueue.deleteMany({ where: { expiresAt: { lt: now } } });

        const aday = await tx.$queryRaw<{ user_id: string }[]>(Prisma.sql`
          SELECT q.user_id
          FROM duel_queue q
          WHERE q.module_id = ${moduleId}::uuid
            AND q.scope_kind = ${scope.kind}
            AND q.scope_id IS NOT DISTINCT FROM ${scope.id}::uuid
            AND q.user_id <> ${user.id}::uuid
            AND q.expires_at > ${now}
            AND NOT EXISTS (
              SELECT 1 FROM duel_participants p WHERE p.user_id = q.user_id AND p.active)
            AND NOT EXISTS (
              SELECT 1 FROM user_blocks b
              WHERE (b.blocker_id = q.user_id AND b.blocked_id = ${user.id}::uuid)
                 OR (b.blocker_id = ${user.id}::uuid AND b.blocked_id = q.user_id))
          ORDER BY abs(q.rating - ${rating}), q.enqueued_at
          LIMIT 1`);

        if (aday.length === 0) {
          const expiresAt = new Date(now.getTime() + DUEL_RULES.queue.heartbeatMs * 2);
          await tx.duelQueue.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              moduleId,
              scopeKind: scope.kind,
              scopeId: scope.id,
              rating,
              enqueuedAt: now,
              expiresAt,
            },
            update: {
              moduleId,
              scopeKind: scope.kind,
              scopeId: scope.id,
              rating,
              enqueuedAt: now,
              expiresAt,
            },
          });
          return null;
        }

        const rakipId = aday[0].user_id;
        const match = await this.engine.create(
          tx,
          {
            kind: 'duel',
            moduleId,
            scope,
            questions: sorular,
            secondsPerQuestion: DUEL_RULES.duel.secondsPerQuestion,
            maxPlayers: DUEL_RULES.duel.players,
            playerIds: [rakipId, user.id],
            startNow: true,
          },
          now,
        );
        return { matchId: match.id, rakipId };
      });
    } catch (err) {
      if (tekilIhlal(err)) throw new ConflictException('Zaten başka bir maçtasın.');
      throw err;
    }

    if (!sonuc) {
      return {
        status: 'searching' as const,
        since: now.toISOString(),
        timeoutAt: new Date(now.getTime() + DUEL_RULES.queue.searchTimeoutMs).toISOString(),
      };
    }
    await this.engine.notifyUsers([sonuc.rakipId, user.id], 'matched', { matchId: sonuc.matchId });
    return { status: 'matched' as const, matchId: sonuc.matchId };
  }

  /** Arama ekranının yoklaması: kaydı canlı tutar; eşleştiyse maçı, süre dolduysa bunu söyler. */
  async queueStatus(user: AuthenticatedUser) {
    const now = new Date();
    const matchId = (await this.active(user))?.matchId;
    if (matchId) return { status: 'matched' as const, matchId };
    const q = await this.prisma.duelQueue.findUnique({ where: { userId: user.id } });
    if (!q) return { status: 'idle' as const };
    const timeoutAt = new Date(q.enqueuedAt.getTime() + DUEL_RULES.queue.searchTimeoutMs);
    if (now >= timeoutAt) {
      await this.prisma.duelQueue.deleteMany({ where: { userId: user.id } });
      return { status: 'timeout' as const };
    }
    await this.prisma.duelQueue.updateMany({
      where: { userId: user.id },
      data: { expiresAt: new Date(now.getTime() + DUEL_RULES.queue.heartbeatMs * 2) },
    });
    return {
      status: 'searching' as const,
      since: q.enqueuedAt.toISOString(),
      timeoutAt: timeoutAt.toISOString(),
    };
  }

  async cancelQueue(user: AuthenticatedUser) {
    await this.prisma.duelQueue.deleteMany({ where: { userId: user.id } });
    return { status: 'idle' as const };
  }

  // ── Kodla özel düello ────────────────────────────────────────────────────

  async createWithCode(user: AuthenticatedUser, scopeKind?: string, scopeId?: string | null) {
    const now = new Date();
    const moduleId = await this.assertCanPlay(user, now);
    const scope = this.parseScope(scopeKind, scopeId);
    await this.questions.scopeLabel(moduleId, scope);
    const sorular = await this.questions.pick(moduleId, scope, DUEL_RULES.duel.questionCount);

    for (let deneme = 0; deneme < 4; deneme++) {
      const code = codeFromBytes(randomBytes(DUEL_RULES.code.length));
      try {
        const match = await this.prisma.$transaction((tx) =>
          this.engine.create(
            tx,
            {
              kind: 'duel',
              moduleId,
              scope,
              questions: sorular,
              secondsPerQuestion: DUEL_RULES.duel.secondsPerQuestion,
              maxPlayers: DUEL_RULES.duel.players,
              playerIds: [user.id],
              hostId: user.id,
              code,
              codeExpiresAt: new Date(now.getTime() + DUEL_RULES.code.ttlMs),
              startNow: false,
            },
            now,
          ),
        );
        return this.engine.state(match.id, user.id);
      } catch (err) {
        if (!tekilIhlal(err)) throw err;
        // kod çakışması ise yeniden dene; aktif maç ihlaliyse kullanıcıya söyle
        if (await this.activeMatchId(user.id)) {
          throw new ConflictException('Zaten başka bir maçtasın.');
        }
      }
    }
    throw new ConflictException('Kod üretilemedi, tekrar dene.');
  }

  /** Yanlış, süresi dolmuş ve kullanılmış kod AYNI cevabı alır (kod yoklamasına ipucu verilmez). */
  async joinWithCode(user: AuthenticatedUser, raw: string) {
    const now = new Date();
    const moduleId = await this.assertCanPlay(user, now);
    const code = normalizeCode(raw);
    const match =
      code.length === DUEL_RULES.code.length
        ? await this.prisma.duelMatch.findFirst({
            where: { code, phase: 'lobby', codeExpiresAt: { gt: now } },
            select: { id: true },
          })
        : null;
    if (!match) throw new NotFoundException('Kod geçersiz ya da süresi dolmuş.');
    try {
      return await this.engine.join(match.id, user.id, moduleId);
    } catch (err) {
      if (tekilIhlal(err)) throw new ConflictException('Zaten başka bir maçtasın.');
      throw err;
    }
  }

  // ── Davet ────────────────────────────────────────────────────────────────

  private async invitations(userId: string, now: Date) {
    const rows = await this.prisma.duelInvitation.findMany({
      where: {
        status: 'pending',
        expiresAt: { gt: now },
        OR: [{ toUserId: userId }, { fromUserId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        from: { select: { displayName: true, avatarUrl: true } },
        to: { select: { displayName: true, avatarUrl: true } },
      },
    });
    const gorunum = (r: (typeof rows)[number], gelen: boolean) => ({
      id: r.id,
      userId: gelen ? r.fromUserId : r.toUserId,
      name: publicName((gelen ? r.from : r.to).displayName),
      avatarUrl: (gelen ? r.from : r.to).avatarUrl,
      scope: { kind: r.scopeKind, id: r.scopeId },
      /** Doluysa salon davetidir: kabul edince o salonun bekleme odasına girilir. */
      roomId: r.matchId,
      expiresAt: r.expiresAt.toISOString(),
    });
    return {
      incoming: rows.filter((r) => r.toUserId === userId).map((r) => gorunum(r, true)),
      outgoing: rows.filter((r) => r.fromUserId === userId).map((r) => gorunum(r, false)),
    };
  }

  async listInvitations(user: AuthenticatedUser) {
    await this.assertEnabled(user);
    return this.invitations(user.id, new Date());
  }

  /** 1'e 1 düello daveti. Tekrarlı davet veritabanında reddedilir (çift başına tek bekleyen). */
  async invite(
    user: AuthenticatedUser,
    toUserId: string,
    scopeKind?: string,
    scopeId?: string | null,
  ) {
    const now = new Date();
    const moduleId = await this.assertCanPlay(user, now);
    if (toUserId === user.id) throw new BadRequestException('Kendine davet gönderemezsin.');
    const scope = this.parseScope(scopeKind, scopeId);
    await this.questions.scopeLabel(moduleId, scope);

    const hedef = await this.prisma.user.findFirst({
      where: { id: toUserId, deletedAt: null, status: 'active' },
      select: { preferredModuleId: true },
    });
    // Engel, başka kurum ve olmayan kullanıcı aynı cevabı alır: engellendiğini öğrenemez.
    const ulasilamaz = new ForbiddenException('Bu kişiye şu an davet gönderilemiyor.');
    if (!hedef || hedef.preferredModuleId !== moduleId) throw ulasilamaz;
    if (await this.engine.blocked(this.prisma, user.id, toUserId)) throw ulasilamaz;

    // Süresi geçmiş bekleyenler kapanır ki tekil indeks yeni davete yer açsın.
    await this.prisma.duelInvitation.updateMany({
      where: { status: 'pending', expiresAt: { lte: now }, fromUserId: user.id },
      data: { status: 'expired' },
    });
    const sonDakika = await this.prisma.duelInvitation.count({
      where: { fromUserId: user.id, createdAt: { gte: new Date(now.getTime() - 60_000) } },
    });
    if (sonDakika >= 6) throw new ConflictException('Çok fazla davet gönderdin. Biraz bekle.');

    let davet;
    try {
      davet = await this.prisma.duelInvitation.create({
        data: {
          fromUserId: user.id,
          toUserId,
          scopeKind: scope.kind,
          scopeId: scope.id,
          expiresAt: new Date(now.getTime() + DUEL_RULES.invite.ttlMs),
        },
      });
    } catch (err) {
      if (tekilIhlal(err)) throw new ConflictException('Bu kişiye bekleyen bir davetin var.');
      throw err;
    }
    await this.engine.notifyUsers([toUserId], 'invite', { invitationId: davet.id });
    return { id: davet.id, expiresAt: davet.expiresAt.toISOString() };
  }

  /** Daveti kabul et / reddet. Kabulde maç iki oyuncuyla geri sayımda kurulur. */
  async respond(user: AuthenticatedUser, invitationId: string, accept: boolean) {
    const now = new Date();
    const on = await this.prisma.duelInvitation.findUnique({ where: { id: invitationId } });
    if (!on || on.toUserId !== user.id) throw new NotFoundException('Davet bulunamadı.');

    if (!accept) {
      await this.prisma.duelInvitation.updateMany({
        where: { id: invitationId, status: 'pending' },
        data: { status: 'declined', respondedAt: now },
      });
      await this.engine.notifyUsers([on.fromUserId], 'invite_declined', { invitationId });
      return { status: 'declined' as const };
    }

    if (on.matchId) return this.respondRoomInvite(user, on.id, on.matchId, on.fromUserId, now);

    const moduleId = await this.assertCanPlay(user, now);
    const scope = this.parseScope(on.scopeKind, on.scopeId);
    const sorular = await this.questions.pick(moduleId, scope, DUEL_RULES.duel.questionCount);

    let matchId: string;
    try {
      matchId = await this.prisma.$transaction(async (tx) => {
        // Satır kilidi: aynı davete iki "kabul" isteği sıraya girer, ikincisi pending bulamaz.
        const kilitli = await tx.$queryRaw<{ status: string; expires_at: Date }[]>`
          SELECT status::text, expires_at FROM duel_invitations
          WHERE id = ${invitationId}::uuid FOR UPDATE`;
        if (kilitli[0]?.status !== 'pending')
          throw new ConflictException('Bu davet artık geçerli değil.');
        if (kilitli[0].expires_at <= now) {
          await tx.duelInvitation.update({
            where: { id: invitationId },
            data: { status: 'expired' },
          });
          return '';
        }
        const match = await this.engine.create(
          tx,
          {
            kind: 'duel',
            moduleId,
            scope,
            questions: sorular,
            secondsPerQuestion: DUEL_RULES.duel.secondsPerQuestion,
            maxPlayers: DUEL_RULES.duel.players,
            playerIds: [on.fromUserId, user.id],
            startNow: true,
          },
          now,
        );
        await tx.duelInvitation.update({
          where: { id: invitationId },
          data: { status: 'accepted', respondedAt: now, matchId: match.id },
        });
        return match.id;
      });
    } catch (err) {
      if (tekilIhlal(err)) {
        throw new ConflictException(
          'İkinizden biri şu an başka bir maçta. Biraz sonra tekrar dene.',
        );
      }
      throw err;
    }
    if (!matchId) throw new ConflictException('Davetin süresi doldu.');
    await this.engine.notifyUsers([on.fromUserId, user.id], 'matched', { matchId, invitationId });
    return { status: 'accepted' as const, matchId };
  }

  async cancelInvitation(user: AuthenticatedUser, invitationId: string) {
    const r = await this.prisma.duelInvitation.updateMany({
      where: { id: invitationId, fromUserId: user.id, status: 'pending' },
      data: { status: 'cancelled', respondedAt: new Date() },
    });
    if (r.count > 0) {
      const d = await this.prisma.duelInvitation.findUnique({
        where: { id: invitationId },
        select: { toUserId: true },
      });
      if (d) await this.engine.notifyUsers([d.toUserId], 'invite_cancelled', { invitationId });
    }
    return { cancelled: r.count > 0 };
  }

  // ── Salon ────────────────────────────────────────────────────────────────

  private roomOptions(dto: {
    questionCount?: number;
    secondsPerQuestion?: number;
    maxPlayers?: number;
  }) {
    const r = DUEL_RULES.room;
    const questionCount = dto.questionCount ?? r.quick.questionCount;
    const secondsPerQuestion = dto.secondsPerQuestion ?? r.quick.secondsPerQuestion;
    const maxPlayers = dto.maxPlayers ?? r.maxPlayers;
    if (!(r.questionCounts as readonly number[]).includes(questionCount)) {
      throw new BadRequestException(`Soru sayısı ${r.questionCounts.join(', ')} olabilir.`);
    }
    if (!(r.secondsOptions as readonly number[]).includes(secondsPerQuestion)) {
      throw new BadRequestException(`Süre ${r.secondsOptions.join(', ')} saniye olabilir.`);
    }
    if (!Number.isInteger(maxPlayers) || maxPlayers < r.minPlayers || maxPlayers > r.maxPlayers) {
      throw new BadRequestException(`Oyuncu sınırı ${r.minPlayers}–${r.maxPlayers} olabilir.`);
    }
    return { questionCount, secondsPerQuestion, maxPlayers };
  }

  private roomName(raw?: string): string {
    const ad = (raw ?? '').replace(/\s+/g, ' ').trim();
    if (ad.length < 3 || ad.length > 24)
      throw new BadRequestException('Salon adı 3–24 karakter olmalı.');
    return ad;
  }

  /** Lobi kurar ve tekil davet kodu atar (çakışırsa yeniden dener). */
  private async createLobby(
    userId: string,
    now: Date,
    build: (code: string, codeExpiresAt: Date) => Parameters<DuelEngineService['create']>[1],
    ttlMs: number,
  ): Promise<string> {
    for (let deneme = 0; deneme < 4; deneme++) {
      const code = codeFromBytes(randomBytes(DUEL_RULES.code.length));
      try {
        const match = await this.prisma.$transaction((tx) =>
          this.engine.create(tx, build(code, new Date(now.getTime() + ttlMs)), now),
        );
        return match.id;
      } catch (err) {
        if (!tekilIhlal(err)) throw err;
        if (await this.activeMatchId(userId))
          throw new ConflictException('Zaten başka bir maçtasın.');
      }
    }
    throw new ConflictException('Kod üretilemedi, tekrar dene.');
  }

  /** Salon kur, başkan ol. Kod herkese açık salonda da üretilir (paylaşmak için). */
  async createRoom(
    user: AuthenticatedUser,
    dto: {
      name?: string;
      isPublic?: boolean;
      scopeKind?: string;
      scopeId?: string | null;
      questionCount?: number;
      secondsPerQuestion?: number;
      maxPlayers?: number;
    },
  ) {
    const now = new Date();
    const moduleId = await this.assertCanPlay(user, now);
    const name = this.roomName(dto.name);
    const opt = this.roomOptions(dto);
    const scope = this.parseScope(dto.scopeKind, dto.scopeId);
    await this.questions.scopeLabel(moduleId, scope);
    const sorular = await this.questions.pick(moduleId, scope, opt.questionCount);
    const matchId = await this.createLobby(
      user.id,
      now,
      (code, codeExpiresAt) => ({
        kind: 'room',
        moduleId,
        scope,
        questions: sorular,
        secondsPerQuestion: opt.secondsPerQuestion,
        maxPlayers: opt.maxPlayers,
        playerIds: [user.id],
        hostId: user.id,
        name,
        isPublic: dto.isPublic ?? true,
        code,
        codeExpiresAt,
        startNow: false,
      }),
      DUEL_RULES.lobbyTtlMs,
    );
    return this.engine.state(matchId, user.id);
  }

  async updateRoom(
    user: AuthenticatedUser,
    matchId: string,
    dto: {
      name?: string;
      isPublic?: boolean;
      scopeKind?: string;
      scopeId?: string | null;
      questionCount?: number;
      secondsPerQuestion?: number;
      maxPlayers?: number;
    },
  ) {
    const moduleId = await this.moduleOf(user.id);
    const opt = this.roomOptions(dto);
    const scope = this.parseScope(dto.scopeKind, dto.scopeId);
    await this.questions.scopeLabel(moduleId, scope);
    const sorular = await this.questions.pick(moduleId, scope, opt.questionCount);
    await this.engine.reconfigure(matchId, user.id, {
      name: dto.name == null ? undefined : this.roomName(dto.name),
      isPublic: dto.isPublic,
      scope,
      secondsPerQuestion: opt.secondsPerQuestion,
      maxPlayers: opt.maxPlayers,
      questions: sorular,
    });
    return this.engine.state(matchId, user.id);
  }

  private async openRoomRows(moduleId: string, quickOnly: boolean) {
    const rows = await this.prisma.duelMatch.findMany({
      where: {
        kind: 'room',
        phase: 'lobby',
        isPublic: true,
        moduleId,
        ...(quickOnly ? { name: null } : {}),
      },
      orderBy: { createdAt: 'asc' },
      take: 30,
      select: {
        id: true,
        name: true,
        hostId: true,
        scopeKind: true,
        scopeId: true,
        questionCount: true,
        secondsPerQuestion: true,
        maxPlayers: true,
        _count: { select: { participants: { where: { leftAt: null, kickedAt: null } } } },
      },
    });
    return rows
      .map((r) => ({ ...r, players: r._count.participants }))
      .filter((r) => r.players > 0 && r.players < r.maxPlayers);
  }

  /** Kurumumdaki katılıma açık salonlar (dolu olanlar listelenmez). */
  async openRooms(user: AuthenticatedUser) {
    await this.assertEnabled(user);
    const moduleId = await this.moduleOf(user.id);
    const rows = await this.openRoomRows(moduleId, false);
    const dersIds = rows
      .filter((r) => r.scopeKind === 'course' && r.scopeId)
      .map((r) => r.scopeId!);
    const konuIds = rows.filter((r) => r.scopeKind === 'topic' && r.scopeId).map((r) => r.scopeId!);
    const [dersler, konular] = await Promise.all([
      this.prisma.course.findMany({
        where: { id: { in: dersIds } },
        select: { id: true, name: true },
      }),
      this.prisma.topic.findMany({
        where: { id: { in: konuIds } },
        select: { id: true, name: true },
      }),
    ]);
    const ad = new Map([...dersler, ...konular].map((x) => [x.id, x.name]));
    return rows.map((r) => ({
      matchId: r.id,
      name: r.name ?? 'Hızlı salon',
      players: r.players,
      maxPlayers: r.maxPlayers,
      scopeLabel: r.scopeId ? (ad.get(r.scopeId) ?? 'Karışık') : 'Karışık',
      questionCount: r.questionCount,
      secondsPerQuestion: r.secondsPerQuestion,
    }));
  }

  private async joinGuarded(user: AuthenticatedUser, matchId: string, moduleId: string) {
    try {
      return await this.engine.join(matchId, user.id, moduleId);
    } catch (err) {
      if (tekilIhlal(err)) throw new ConflictException('Zaten başka bir maçtasın.');
      throw err;
    }
  }

  async joinRoom(user: AuthenticatedUser, matchId: string) {
    const moduleId = await this.assertCanPlay(user, new Date());
    const m = await this.prisma.duelMatch.findUnique({
      where: { id: matchId },
      select: { kind: true, isPublic: true },
    });
    // Özel salona listeden girilmez: kod ya da davet gerekir.
    if (!m || m.kind !== 'room' || !m.isPublic) throw new NotFoundException('Salon bulunamadı.');
    return this.joinGuarded(user, matchId, moduleId);
  }

  /**
   * Hızlı salon: en dolu açık hızlı salona girer; yoksa yenisini açar. "Yoksa aç" kararı modül
   * başına danışma kilidi altındadır — aynı anda gelen iki oyuncu iki ayrı boş salon açmaz.
   */
  async quickRoom(user: AuthenticatedUser) {
    const now = new Date();
    const moduleId = await this.assertCanPlay(user, now);
    const mevcut = await this.active(user);
    if (mevcut) return mevcut;
    const q = DUEL_RULES.room.quick;
    const scope: DuelScope = { kind: 'mixed', id: null };
    const sorular = await this.questions.pick(moduleId, scope, q.questionCount);

    for (let tur = 0; tur < 3; tur++) {
      const adaylar = (await this.openRoomRows(moduleId, true)).sort(
        (a, b) => b.players - a.players,
      );
      for (const a of adaylar) {
        if (a.hostId && (await this.engine.blocked(this.prisma, user.id, a.hostId))) continue;
        try {
          return await this.joinGuarded(user, a.id, moduleId);
        } catch (err) {
          // dolmuş ya da başlamış: sıradaki adaya geç
          if (!(err instanceof ConflictException) || /başka bir maçtasın/.test(err.message))
            throw err;
        }
      }
      const code = codeFromBytes(randomBytes(DUEL_RULES.code.length));
      try {
        const yeni = await this.prisma.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'duel-room:' + moduleId}))`;
          const acik = await tx.duelMatch.count({
            where: { kind: 'room', phase: 'lobby', isPublic: true, moduleId, name: null },
          });
          if (acik > 0) return null; // biri az önce açtı: bir tur daha katılmayı dene
          return this.engine.create(
            tx,
            {
              kind: 'room',
              moduleId,
              scope,
              questions: sorular,
              secondsPerQuestion: q.secondsPerQuestion,
              maxPlayers: q.maxPlayers,
              playerIds: [user.id],
              hostId: user.id,
              isPublic: true,
              code,
              codeExpiresAt: new Date(now.getTime() + DUEL_RULES.lobbyTtlMs),
              startNow: false,
            },
            now,
          );
        });
        if (yeni) return this.engine.state(yeni.id, user.id);
      } catch (err) {
        if (!tekilIhlal(err)) throw err;
        if (await this.activeMatchId(user.id))
          throw new ConflictException('Zaten başka bir maçtasın.');
      }
    }
    throw new ConflictException('Uygun salon bulunamadı, tekrar dene.');
  }

  async ready(user: AuthenticatedUser, matchId: string, ready: boolean) {
    await this.engine.setReady(matchId, user.id, ready);
    return this.engine.state(matchId, user.id);
  }

  async start(user: AuthenticatedUser, matchId: string) {
    await this.engine.start(matchId, user.id);
    return this.engine.state(matchId, user.id);
  }

  async kick(user: AuthenticatedUser, matchId: string, targetId: string) {
    await this.engine.kick(matchId, user.id, targetId);
    return this.engine.state(matchId, user.id);
  }

  /** Salona davet: yalnız o salonun içindeki oyuncu, lobi açıkken gönderebilir. */
  async inviteToRoom(user: AuthenticatedUser, matchId: string, toUserId: string) {
    const now = new Date();
    await this.assertEnabled(user);
    if (toUserId === user.id) throw new BadRequestException('Kendine davet gönderemezsin.');
    const [match, ben, hedef] = await Promise.all([
      this.prisma.duelMatch.findUnique({ where: { id: matchId } }),
      this.prisma.duelParticipant.findUnique({
        where: { matchId_userId: { matchId, userId: user.id } },
      }),
      this.prisma.user.findFirst({
        where: { id: toUserId, deletedAt: null, status: 'active' },
        select: { preferredModuleId: true },
      }),
    ]);
    if (!match || match.kind !== 'room' || match.phase !== 'lobby') {
      throw new ConflictException('Bu salon artık davete açık değil.');
    }
    if (!ben || ben.leftAt || ben.kickedAt) throw new ForbiddenException('Bu salonda değilsin.');
    const ulasilamaz = new ForbiddenException('Bu kişiye şu an davet gönderilemiyor.');
    if (!hedef || hedef.preferredModuleId !== match.moduleId) throw ulasilamaz;
    if (await this.engine.blocked(this.prisma, user.id, toUserId)) throw ulasilamaz;
    await this.prisma.duelInvitation.updateMany({
      where: { status: 'pending', expiresAt: { lte: now }, fromUserId: user.id },
      data: { status: 'expired' },
    });
    const sonDakika = await this.prisma.duelInvitation.count({
      where: { fromUserId: user.id, createdAt: { gte: new Date(now.getTime() - 60_000) } },
    });
    if (sonDakika >= 10) throw new ConflictException('Çok fazla davet gönderdin. Biraz bekle.');
    try {
      const d = await this.prisma.duelInvitation.create({
        data: {
          fromUserId: user.id,
          toUserId,
          matchId,
          scopeKind: match.scopeKind,
          scopeId: match.scopeId,
          expiresAt: new Date(now.getTime() + DUEL_RULES.invite.ttlMs * 2),
        },
      });
      await this.engine.notifyUsers([toUserId], 'invite', { invitationId: d.id, roomId: matchId });
      return { id: d.id, expiresAt: d.expiresAt.toISOString() };
    } catch (err) {
      if (tekilIhlal(err)) throw new ConflictException('Bu kişiye bekleyen bir davetin var.');
      throw err;
    }
  }

  private async respondRoomInvite(
    user: AuthenticatedUser,
    invitationId: string,
    matchId: string,
    fromUserId: string,
    now: Date,
  ) {
    const moduleId = await this.assertCanPlay(user, now);
    const kapandi = await this.prisma.duelInvitation.updateMany({
      where: { id: invitationId, status: 'pending', expiresAt: { gt: now } },
      data: { status: 'accepted', respondedAt: now },
    });
    if (kapandi.count === 0) throw new ConflictException('Bu davet artık geçerli değil.');
    try {
      await this.joinGuarded(user, matchId, moduleId);
    } catch (err) {
      // salon dolmuş/başlamış: davet yanmış sayılmasın diye geri açılmaz, kullanıcıya nedeni söylenir
      await this.prisma.duelInvitation.update({
        where: { id: invitationId },
        data: { status: 'expired' },
      });
      throw err;
    }
    await this.engine.notifyUsers([fromUserId], 'invite_accepted', { invitationId, matchId });
    return { status: 'accepted' as const, matchId };
  }

  // ── Oyuncular: arama, çevrimiçi, engel ───────────────────────────────────

  /** Çevrimiçi sayılma penceresi: merkez ekranı açıkken istemci yarım dakikada bir yoklar. */
  private static readonly ONLINE_MS = 90_000;

  /** Merkez/arama çağrıları "buradayım" sinyalidir; en çok 30 sn'de bir yazılır. */
  private async touch(userId: string, now: Date) {
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        OR: [{ lastActiveAt: null }, { lastActiveAt: { lt: new Date(now.getTime() - 30_000) } }],
      },
      data: { lastActiveAt: now },
    });
  }

  /**
   * Aynı kurumdan oyuncular: `q` verilirse ada göre arama, verilmezse şu an çevrimiçi olanlar.
   * Engellediğim ve beni engelleyenler hiç görünmez. Ad kısaltılmış haliyle döner.
   */
  async players(user: AuthenticatedUser, q?: string) {
    await this.assertEnabled(user);
    const now = new Date();
    const moduleId = await this.moduleOf(user.id);
    await this.touch(user.id, now);
    const ara = (q ?? '').trim();
    if (ara && ara.length < 2) return { items: [], onlineCount: 0 };
    const esik = new Date(now.getTime() - DuelService.ONLINE_MS);
    const where: Prisma.UserWhereInput = {
      id: { not: user.id },
      deletedAt: null,
      status: 'active',
      preferredModuleId: moduleId,
      blocksGiven: { none: { blockedId: user.id } },
      blocksReceived: { none: { blockerId: user.id } },
    };
    const [rows, onlineCount] = await Promise.all([
      this.prisma.user.findMany({
        where: ara
          ? { ...where, displayName: { contains: ara, mode: 'insensitive' } }
          : { ...where, lastActiveAt: { gte: esik } },
        orderBy: [{ lastActiveAt: { sort: 'desc', nulls: 'last' } }],
        take: ara ? 20 : 30,
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          lastActiveAt: true,
          duelStats: { select: { rating: true, wins: true, losses: true, draws: true } },
          duelParticipations: { where: { active: true }, select: { matchId: true }, take: 1 },
        },
      }),
      this.prisma.user.count({ where: { ...where, lastActiveAt: { gte: esik } } }),
    ]);
    const bekleyen = new Set(
      (
        await this.prisma.duelInvitation.findMany({
          where: { fromUserId: user.id, status: 'pending', expiresAt: { gt: now } },
          select: { toUserId: true },
        })
      ).map((d) => d.toUserId),
    );
    return {
      onlineCount,
      items: rows.map((u) => {
        const oynanan = u.duelStats ? u.duelStats.wins + u.duelStats.losses + u.duelStats.draws : 0;
        return {
          userId: u.id,
          name: publicName(u.displayName),
          avatarUrl: u.avatarUrl,
          online: !!u.lastActiveAt && u.lastActiveAt >= esik,
          inMatch: u.duelParticipations.length > 0,
          invited: bekleyen.has(u.id),
          rating: u.duelStats?.rating ?? DUEL_RULES.rating.start,
          winRate: oynanan > 0 ? Math.round((u.duelStats!.wins / oynanan) * 100) : null,
        };
      }),
    };
  }

  async blocks(user: AuthenticatedUser) {
    const rows = await this.prisma.userBlock.findMany({
      where: { blockerId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { blocked: { select: { displayName: true, avatarUrl: true } } },
    });
    return rows.map((r) => ({
      userId: r.blockedId,
      name: publicName(r.blocked.displayName),
      avatarUrl: r.blocked.avatarUrl,
    }));
  }

  /** Engelle: bekleyen karşılıklı davetler de kapanır. */
  async block(user: AuthenticatedUser, targetId: string) {
    if (targetId === user.id) throw new BadRequestException('Kendini engelleyemezsin.');
    await this.prisma.userBlock.createMany({
      data: [{ blockerId: user.id, blockedId: targetId }],
      skipDuplicates: true,
    });
    await this.prisma.duelInvitation.updateMany({
      where: {
        status: 'pending',
        OR: [
          { fromUserId: user.id, toUserId: targetId },
          { fromUserId: targetId, toUserId: user.id },
        ],
      },
      data: { status: 'cancelled' },
    });
    return { blocked: true };
  }

  async unblock(user: AuthenticatedUser, targetId: string) {
    await this.prisma.userBlock.deleteMany({ where: { blockerId: user.id, blockedId: targetId } });
    return { blocked: false };
  }

  // ── Sıralama ─────────────────────────────────────────────────────────────

  /**
   * Düello sıralaması — tamamı SUNUCUDA, yalnız bitmiş maç kayıtlarından.
   * Tüm zamanlar: lig puanına göre. Haftalık/aylık: o dönemdeki galibiyet sayısına,
   * eşitlikte dönem içi net lig puanına göre. "Kurumum" yalnız kendi modülümün adayları.
   */
  async leaderboard(
    user: AuthenticatedUser,
    mode: 'duel' | 'room',
    period: 'week' | 'month' | 'all',
    scope: 'module' | 'all',
    now: Date = new Date(),
  ) {
    await this.assertEnabled(user);
    const moduleId = scope === 'module' ? await this.moduleOf(user.id) : null;
    const modul = moduleId
      ? Prisma.sql`AND u.preferred_module_id = ${moduleId}::uuid`
      : Prisma.empty;
    type Row = {
      user_id: string;
      display_name: string;
      avatar_url: string | null;
      points: number;
      wins: number;
      played: number;
    };
    let rows: Row[];
    if (period === 'all') {
      rows = await this.prisma.$queryRaw<Row[]>(
        mode === 'duel'
          ? Prisma.sql`
            SELECT s.user_id, u.display_name, u.avatar_url, s.rating AS points, s.wins, s.duels AS played
            FROM duel_stats s JOIN users u ON u.id = s.user_id AND u.deleted_at IS NULL
            WHERE s.duels > 0 ${modul}
            ORDER BY s.rating DESC, s.wins DESC, s.user_id LIMIT 500`
          : Prisma.sql`
            SELECT s.user_id, u.display_name, u.avatar_url, s.room_rating AS points,
                   s.room_wins AS wins, s.rooms AS played
            FROM duel_stats s JOIN users u ON u.id = s.user_id AND u.deleted_at IS NULL
            WHERE s.rooms > 0 ${modul}
            ORDER BY s.room_rating DESC, s.room_wins DESC, s.user_id LIMIT 500`,
      );
    } else {
      const from =
        period === 'week'
          ? haftaBaslangici(now)
          : gunBaslangici(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 12)));
      rows = await this.prisma.$queryRaw<Row[]>(Prisma.sql`
        SELECT p.user_id, u.display_name, u.avatar_url,
               COALESCE(SUM(p.rating_delta), 0)::int AS points,
               (COUNT(*) FILTER (WHERE p.outcome = 'win'))::int AS wins,
               COUNT(*)::int AS played
        FROM duel_participants p
        JOIN duel_matches m ON m.id = p.match_id AND m.kind = ${mode}::"DuelKind"
             AND m.phase = 'finished' AND m.finished_at >= ${from}
        JOIN users u ON u.id = p.user_id AND u.deleted_at IS NULL
        WHERE p.kicked_at IS NULL ${modul}
        GROUP BY p.user_id, u.display_name, u.avatar_url
        ORDER BY wins DESC, points DESC, played ASC, p.user_id LIMIT 500`);
    }
    const satir = (r: Row, i: number) => ({
      rank: i + 1,
      userId: r.user_id,
      name:
        r.user_id === user.id
          ? r.display_name.trim() || publicName(r.display_name)
          : publicName(r.display_name),
      avatarUrl: r.avatar_url,
      isMe: r.user_id === user.id,
      points: Number(r.points),
      wins: Number(r.wins),
      played: Number(r.played),
      winRate: Number(r.played) > 0 ? Math.round((Number(r.wins) / Number(r.played)) * 100) : null,
    });
    const hepsi = rows.map(satir);
    const benim = hepsi.find((r) => r.isMe) ?? null;
    const ust = benim && benim.rank > 1 ? hepsi[benim.rank - 2] : null;
    return {
      mode,
      period,
      scope,
      /** Sütun adı sunucudan: tüm zamanlarda lig puanı, dönemde net kazanç. */
      pointsLabel: period === 'all' ? (mode === 'duel' ? 'lig' : 'salon puanı') : 'net puan',
      total: hepsi.length,
      top: hepsi.slice(0, 50),
      me: benim,
      nextLine: !benim
        ? 'Bu dönemde maçın yok. Bir maç oyna, tabloda yerini al.'
        : !ust
          ? 'Zirvedesin.'
          : period === 'all'
            ? `Bir üst sıraya ${Math.max(1, ust.points - benim.points + 1)} puan`
            : ust.wins > benim.wins
              ? `Bir üst sıraya ${ust.wins - benim.wins} galibiyet`
              : 'Bir üst sırayla galibiyetin eşit; net puan belirliyor',
    };
  }

  review(user: AuthenticatedUser, matchId: string) {
    return this.engine.review(matchId, user.id);
  }

  // ── Maç ──────────────────────────────────────────────────────────────────

  state(user: AuthenticatedUser, matchId: string) {
    return this.engine.state(matchId, user.id);
  }

  answer(user: AuthenticatedUser, matchId: string, index: number, optionId: string) {
    return this.engine.answer(matchId, user.id, index, optionId);
  }

  async leave(user: AuthenticatedUser, matchId: string) {
    await this.engine.leave(matchId, user.id);
    return { left: true };
  }
}

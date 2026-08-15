import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { UsersService } from './users.service';
import { PushService } from '../notifications/push.service';
import { FREE_DAILY_LIMIT_FALLBACK } from '../../common/plan.constants';

/// GET/PATCH /api/v1/me — profil + entitlement (Doc 7 §4.2). Kimlik zorunlu.
@Controller('me')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly push: PushService,
  ) {}

  // ── Mevzuat Merkezi (Doc 29 §14): madde favorisi + okuma konumu ──

  /** Kaydedilen maddeler — mevzuat ana sayfası "Kaydedilenler" bölgesi. */
  @Get('article-bookmarks')
  async articleBookmarks(@CurrentUser() user: AuthenticatedUser) {
    const rows = await this.prisma.articleBookmark.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        article: {
          select: {
            id: true,
            articleNo: true,
            title: true,
            legislation: { select: { slug: true, shortName: true, name: true } },
          },
        },
      },
    });
    return {
      items: rows
        .filter((r) => r.article.legislation != null)
        .map((r) => ({
          articleId: r.article.id,
          no: r.article.articleNo,
          title: r.article.title,
          lawSlug: r.article.legislation!.slug,
          lawShort: r.article.legislation!.shortName ?? r.article.legislation!.name,
          createdAt: r.createdAt.toISOString(),
        })),
    };
  }

  /** Madde kaydet — (lawSlug, no) ile; istemci madde id bilmek zorunda değil. */
  @Post('article-bookmarks')
  async addArticleBookmark(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { lawSlug?: string; no?: string },
  ) {
    const article = await this.findArticle(body.lawSlug, body.no);
    if (!article) return { ok: false };
    await this.prisma.articleBookmark.upsert({
      where: { userId_lawArticleId: { userId: user.id, lawArticleId: article.id } },
      update: {},
      create: { userId: user.id, lawArticleId: article.id },
    });
    return { ok: true };
  }

  @Delete('article-bookmarks')
  async removeArticleBookmark(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { lawSlug?: string; no?: string },
  ) {
    const article = await this.findArticle(body.lawSlug, body.no);
    if (!article) return { ok: false };
    await this.prisma.articleBookmark.deleteMany({
      where: { userId: user.id, lawArticleId: article.id },
    });
    return { ok: true };
  }

  // ── Highlight + kişisel not (Doc 29 §17-18, P2) ──

  /** Kanunun tüm işaret ve notları — okuyucu açılışında tek istek. */
  @Get('article-annotations')
  async articleAnnotations(
    @CurrentUser() user: AuthenticatedUser,
    @Query('lawSlug') lawSlug?: string,
  ) {
    if (!lawSlug) return { highlights: [], notes: [] };
    const where = {
      userId: user.id,
      article: {
        legislation: { slug: lawSlug, deletedAt: null },
        deletedAt: null,
      },
    };
    const [highlights, notes] = await Promise.all([
      this.prisma.articleHighlight.findMany({
        where,
        select: {
          id: true,
          startOffset: true,
          endOffset: true,
          snippet: true,
          article: { select: { articleNo: true } },
        },
      }),
      this.prisma.articleNote.findMany({
        where,
        select: { text: true, article: { select: { articleNo: true } } },
      }),
    ]);
    return {
      highlights: highlights.map((h) => ({
        id: h.id,
        no: h.article.articleNo,
        startOffset: h.startOffset,
        endOffset: h.endOffset,
        snippet: h.snippet,
      })),
      notes: notes.map((n) => ({ no: n.article.articleNo, text: n.text })),
    };
  }

  @Post('article-highlights')
  async addHighlight(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      lawSlug?: string;
      no?: string;
      startOffset?: number;
      endOffset?: number;
      snippet?: string;
    },
  ) {
    const article = await this.findArticle(body.lawSlug, body.no);
    const snippet = body.snippet?.trim();
    if (
      !article ||
      !snippet ||
      typeof body.startOffset !== 'number' ||
      typeof body.endOffset !== 'number' ||
      body.endOffset <= body.startOffset
    ) {
      return { ok: false };
    }
    const row = await this.prisma.articleHighlight.create({
      data: {
        userId: user.id,
        lawArticleId: article.id,
        startOffset: Math.max(0, Math.floor(body.startOffset)),
        endOffset: Math.floor(body.endOffset),
        snippet: snippet.slice(0, 500),
      },
    });
    return { ok: true, id: row.id };
  }

  @Delete('article-highlights/:id')
  async removeHighlight(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.prisma.articleHighlight.deleteMany({
      where: { id, userId: user.id },
    });
    return { ok: true };
  }

  /** Madde notu upsert — boş metin notu siler. */
  @Put('article-notes')
  async putNote(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { lawSlug?: string; no?: string; text?: string },
  ) {
    const article = await this.findArticle(body.lawSlug, body.no);
    if (!article) return { ok: false };
    const text = body.text?.trim() ?? '';
    if (text.length === 0) {
      await this.prisma.articleNote.deleteMany({
        where: { userId: user.id, lawArticleId: article.id },
      });
      return { ok: true, deleted: true };
    }
    await this.prisma.articleNote.upsert({
      where: {
        userId_lawArticleId: { userId: user.id, lawArticleId: article.id },
      },
      update: { text: text.slice(0, 2000) },
      create: {
        userId: user.id,
        lawArticleId: article.id,
        text: text.slice(0, 2000),
      },
    });
    return { ok: true };
  }

  /** Okuma konumu: kanun başına tek satır upsert (kaldığın yerden devam). */
  @Post('reading-progress')
  async saveReadingProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { lawSlug?: string; no?: string },
  ) {
    if (!body.lawSlug || !body.no) return { ok: false };
    const leg = await this.prisma.legislation.findFirst({
      where: { slug: body.lawSlug, status: 'published', deletedAt: null },
      select: { id: true },
    });
    if (!leg) return { ok: false };
    await this.prisma.readingProgress.upsert({
      where: { userId_legislationId: { userId: user.id, legislationId: leg.id } },
      update: { articleNo: body.no.slice(0, 16) },
      create: { userId: user.id, legislationId: leg.id, articleNo: body.no.slice(0, 16) },
    });
    return { ok: true };
  }

  /** Son okunanlar + kaldığın yerden devam (ilk satır en güncel). */
  @Get('reading-progress')
  async readingProgress(@CurrentUser() user: AuthenticatedUser) {
    const rows = await this.prisma.readingProgress.findMany({
      where: { userId: user.id, legislation: { status: 'published', deletedAt: null } },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { legislation: { select: { slug: true, shortName: true, name: true } } },
    });
    return {
      items: rows.map((r) => ({
        lawSlug: r.legislation.slug,
        lawShort: r.legislation.shortName ?? r.legislation.name,
        lawName: r.legislation.name,
        no: r.articleNo,
        updatedAt: r.updatedAt.toISOString(),
      })),
    };
  }

  private findArticle(lawSlug?: string, no?: string) {
    if (!lawSlug || !no) return null;
    return this.prisma.lawArticle.findFirst({
      where: {
        legislation: { slug: lawSlug, status: 'published', deletedAt: null },
        articleNo: { equals: no, mode: 'insensitive' },
        status: 'published',
        deletedAt: null,
      },
      select: { id: true },
    });
  }

  // ── FCM cihaz token'ı (Faz 2 push) — kayıt/geri alma ──
  @Post('push-token')
  registerPushToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { token?: string; platform?: string },
  ) {
    if (!body.token) return { ok: false };
    return this.push.registerToken(
      user.id,
      body.token,
      body.platform === 'android' ? 'android' : 'ios',
    );
  }

  @Delete('push-token')
  removePushToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { token?: string },
  ) {
    if (!body.token) return { ok: false };
    return this.push.removeToken(user.id, body.token);
  }

  @Get()
  async me(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { entitlement: true, preferredModule: { select: { id: true, name: true } } },
    });
    return {
      id: user.id,
      email: user.email,
      displayName: profile?.displayName,
      avatarUrl: profile?.avatarUrl,
      emailVerified: profile?.emailVerifiedAt != null,
      onboardingCompleted: profile?.onboardingCompletedAt != null,
      preferredModule: profile?.preferredModule ?? null,
      dailyGoal: profile?.dailyGoal ?? 20,
      targetExamDate: profile?.targetExamDate?.toISOString().slice(0, 10) ?? null,
      memberSince: profile?.createdAt?.toISOString() ?? null,
      roles: user.roles,
      isPremium: user.isPremium,
      validUntil: profile?.entitlement?.validUntil ?? null,
    };
  }

  /// Onboarding: hedef sınav seçimi (Doc 11 §2). İdempotent.
  @Post('onboarding')
  completeOnboarding(@CurrentUser() user: AuthenticatedUser, @Body() dto: CompleteOnboardingDto) {
    return this.users.completeOnboarding(user.id, dto);
  }

  /// KVKK hesap silme (App Store zorunluluğu). Geri alınamaz.
  @Delete()
  deleteAccount(@CurrentUser() user: AuthenticatedUser) {
    return this.users.deleteAccount(user);
  }

  /// Home dashboard verisi (Doc 12 §4): tek istekte selam + istatistik + streak +
  /// bugünkü kullanım. Mobil açılışta 4 ayrı çağrı yerine bunu kullanır.
  @Get('dashboard')
  async dashboard(@CurrentUser() user: AuthenticatedUser) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [profile, stats, streak, usage, freePlan, dailySession] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: user.id },
        select: {
          displayName: true,
          onboardingCompletedAt: true,
          preferredModule: { select: { id: true, name: true } },
        },
      }),
      this.prisma.userStats.findUnique({ where: { userId: user.id } }),
      this.prisma.streak.findUnique({ where: { userId: user.id } }),
      this.prisma.dailyUsage.findUnique({
        where: { userId_usageDate: { userId: user.id, usageDate: today } },
      }),
      this.prisma.plan.findUnique({ where: { key: 'free' } }),
      this.prisma.quizSession.findFirst({
        where: { userId: user.id, mode: 'daily', startedAt: { gte: today } },
        orderBy: { startedAt: 'desc' },
        select: { status: true },
      }),
    ]);

    const accuracy =
      stats && stats.totalSolved > 0
        ? Math.round((stats.totalCorrect / stats.totalSolved) * 100)
        : 0;

    return {
      displayName: profile?.displayName ?? null,
      onboardingCompleted: profile?.onboardingCompletedAt != null,
      preferredModule: profile?.preferredModule ?? null,
      isPremium: user.isPremium,
      streak: {
        current: streak?.currentStreak ?? 0,
        longest: streak?.longestStreak ?? 0,
      },
      today: {
        answered: usage?.questionsAnswered ?? 0,
        // premium'da limit yok (null) — UI sınırsız gösterir.
        dailyLimit: user.isPremium ? null : (freePlan?.dailyQuestionLimit ?? FREE_DAILY_LIMIT_FALLBACK),
      },
      daily: { playedToday: dailySession?.status === 'completed' },
      stats: {
        totalSolved: stats?.totalSolved ?? 0,
        totalSessions: stats?.totalSessions ?? 0,
        accuracy,
      },
    };
  }

  @Patch()
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }
}

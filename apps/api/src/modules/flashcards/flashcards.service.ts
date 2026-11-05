import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { SettingsService } from '../../infra/settings/settings.service';
import { gunBaslangici } from '../../common/gun';
import type { AuthenticatedUser } from '../auth/auth.types';
import {
  GERI_AL_PENCERESI_MS,
  OTURUM_VARSAYILAN_KART,
  TAZE_OTURUM_MS,
  type FlashcardMode,
} from './flashcard.constants';
import {
  buildQueue,
  cardState,
  dailyDone,
  modeCounts,
  requeueAgain,
  sessionSummary,
  suggestedMode,
  type CardRef,
  type CardState,
  type ModeCounts,
  type ReviewRow,
} from './flashcards.logic';
import { kartSrsGuncelle } from './kart-srs';
import type {
  FlashcardEventDto,
  FlashcardPreferencesDto,
  FlashcardScopeDto,
  StartFlashcardSessionDto,
} from './dto/flashcards.dto';

/** İstemciye giden kart: kaynak etiketi (sourceLabel) ASLA burada değildir (4 Eyl 2026 kuralı). */
export interface PublicFlashcard {
  id: string;
  kind: 'qa' | 'cloze' | 'numeric' | 'trap';
  front: string;
  back: string;
  explanation: string | null;
  difficulty: number;
  topic: { id: string; name: string };
  unit: { slug: string; title: string } | null;
  /** Madde rozetleri (ArticlePeek): madde kamuya açıktır, kitap/sınav etiketi değildir. */
  articles: { no: string; title: string | null; legislationSlug: string | null }[];
  bookmarked: boolean;
  state: CardState;
}

/** Bayrak açık mı: panel anahtarı; kapalıyken yalnız admin ve beta görür (mobilAnasayfaV2 kalıbı). */
export function flashcardsAcik(anahtar: boolean, roles: readonly string[]): boolean {
  return anahtar || roles.includes('admin') || roles.includes('beta');
}

interface ResolvedScope {
  courseId: string | null;
  topicId: string | null;
  unitId: string | null;
  unitSlug: string | null;
  /** null = kapsam yok: kullanıcının erişebildiği tüm yayındaki kartlar (Kütüphane "Kart tekrarı"). */
  topicIds: string[] | null;
  label: string;
}

type CardRow = Prisma.FlashcardGetPayload<{
  select: {
    id: true;
    kind: true;
    front: true;
    back: true;
    explanation: true;
    difficulty: true;
    sortOrder: true;
    topic: { select: { id: true; name: true; isPremium: true } };
    summaryUnit: { select: { slug: true; title: true; isPremium: true } };
    articles: {
      select: {
        relation: true;
        lawArticle: {
          select: { articleNo: true; title: true; legislation: { select: { slug: true } } };
        };
      };
    };
  };
}>;

const CARD_SELECT = {
  id: true,
  kind: true,
  front: true,
  back: true,
  explanation: true,
  difficulty: true,
  sortOrder: true,
  topic: { select: { id: true, name: true, isPremium: true } },
  summaryUnit: { select: { slug: true, title: true, isPremium: true } },
  articles: {
    select: {
      relation: true,
      lawArticle: {
        select: { articleNo: true, title: true, legislation: { select: { slug: true } } },
      },
    },
  },
} satisfies Prisma.FlashcardSelect;

const toReviewRow = (r: {
  flashcardId: string;
  reps: number;
  lapses: number;
  intervalDays: number;
  dueAt: Date;
  lastRating: 'again' | 'known' | 'easy';
}): ReviewRow => ({
  flashcardId: r.flashcardId,
  reps: r.reps,
  lapses: r.lapses,
  intervalDays: r.intervalDays,
  dueAt: r.dueAt,
  lastRating: r.lastRating,
});

/** Geri al için saklanan önceki durum. */
interface PrevState {
  ease: number;
  intervalDays: number;
  reps: number;
  lapses: number;
  dueAt: string;
  lastReviewedAt: string;
  lastRating: 'again' | 'known' | 'easy';
  reviewCount: number;
  knownCount: number;
  againCount: number;
}

/**
 * Bilgi kartları (Doc 56). Kural sunucuda: kilit (içerik kapısı, karar 3), kuyruk sırası, öğrenme
 * durumu, günlük hedef, idempotent puanlama ve geri alma. Deste yok, kapsam var.
 */
@Injectable()
export class FlashcardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async enabledFor(user: Pick<AuthenticatedUser, 'roles'>): Promise<boolean> {
    return flashcardsAcik(await this.settings.flashcardsEnabled(), user.roles);
  }

  private async assertEnabled(user: AuthenticatedUser) {
    if (!(await this.enabledFor(user)))
      throw new NotFoundException({
        code: 'FLASHCARDS_DISABLED',
        message: 'Bilgi kartları henüz açık değil.',
      });
  }

  // ── Kapsam ──

  private async resolveScope(scope: FlashcardScopeDto): Promise<ResolvedScope> {
    if (scope.unitSlug) {
      const unit = await this.prisma.summaryUnit.findFirst({
        where: { slug: scope.unitSlug, deletedAt: null },
        select: {
          id: true,
          slug: true,
          title: true,
          topicId: true,
          topic: { select: { courseId: true } },
        },
      });
      if (!unit) throw new NotFoundException('Ünite bulunamadı');
      return {
        courseId: unit.topic.courseId,
        topicId: unit.topicId,
        unitId: unit.id,
        unitSlug: unit.slug,
        topicIds: [unit.topicId],
        label: unit.title,
      };
    }
    if (scope.topicId) {
      const topic = await this.prisma.topic.findFirst({
        where: { id: scope.topicId, deletedAt: null },
        select: {
          id: true,
          name: true,
          courseId: true,
          children: { where: { deletedAt: null }, select: { id: true } },
        },
      });
      if (!topic) throw new NotFoundException('Konu bulunamadı');
      return {
        courseId: topic.courseId,
        topicId: topic.id,
        unitId: null,
        unitSlug: null,
        topicIds: [topic.id, ...topic.children.map((c) => c.id)],
        label: topic.name,
      };
    }
    if (scope.courseId) {
      const course = await this.prisma.course.findFirst({
        where: { id: scope.courseId, deletedAt: null },
        select: {
          id: true,
          name: true,
          topics: { where: { deletedAt: null }, select: { id: true } },
        },
      });
      if (!course) throw new NotFoundException('Ders bulunamadı');
      return {
        courseId: course.id,
        topicId: null,
        unitId: null,
        unitSlug: null,
        topicIds: course.topics.map((t) => t.id),
        label: course.name,
      };
    }
    // Kapsamsız: Kütüphane "Kart tekrarı · N" (study_hub) ve bildirim derin bağlantısı; vade
    // sayımı `dueTotal` ile aynı kümeye bakar (tüm dersler). Kilitli kartlar yine sayılmaz.
    return {
      courseId: null,
      topicId: null,
      unitId: null,
      unitSlug: null,
      topicIds: null,
      label: 'Tüm kartlar',
    };
  }

  /** Kapsamdaki yayındaki kartlar + kullanıcının durumu. Kilit: ünitenin, yoksa konunun isPremium'u. */
  private async loadCards(userId: string, isPremium: boolean, s: ResolvedScope) {
    const cards = await this.prisma.flashcard.findMany({
      where: {
        ...(s.topicIds ? { topicId: { in: s.topicIds } } : { topic: { deletedAt: null } }),
        ...(s.unitId ? { summaryUnitId: s.unitId } : {}),
        status: 'published',
        deletedAt: null,
      },
      orderBy: [{ topicId: 'asc' }, { sortOrder: 'asc' }],
      select: CARD_SELECT,
    });
    const ids = cards.map((c) => c.id);
    const [reviews, bookmarks] = ids.length
      ? await Promise.all([
          this.prisma.flashcardReview.findMany({ where: { userId, flashcardId: { in: ids } } }),
          this.prisma.flashcardBookmark.findMany({
            where: { userId, flashcardId: { in: ids } },
            select: { flashcardId: true },
          }),
        ])
      : [[], []];
    const rById = new Map(reviews.map((r) => [r.flashcardId, toReviewRow(r)]));
    const bSet = new Set(bookmarks.map((b) => b.flashcardId));
    const refs: CardRef[] = cards.map((c, i) => ({
      id: c.id,
      sortOrder: i,
      locked: (c.summaryUnit?.isPremium ?? c.topic.isPremium) && !isPremium,
      bookmarked: bSet.has(c.id),
      review: rById.get(c.id) ?? null,
    }));
    return { cards, refs, rById, bSet };
  }

  private toPublic(
    c: CardRow,
    bookmarked: boolean,
    review: ReviewRow | null,
    now: Date,
  ): PublicFlashcard {
    return {
      id: c.id,
      kind: c.kind,
      front: c.front,
      back: c.back,
      explanation: c.explanation,
      difficulty: c.difficulty,
      topic: { id: c.topic.id, name: c.topic.name },
      unit: c.summaryUnit ? { slug: c.summaryUnit.slug, title: c.summaryUnit.title } : null,
      articles: [...c.articles]
        .sort((a, b) => (a.relation === 'primary' ? -1 : 0) - (b.relation === 'primary' ? -1 : 0))
        .map((a) => ({
          no: a.lawArticle.articleNo,
          title: a.lawArticle.title,
          legislationSlug: a.lawArticle.legislation?.slug ?? null,
        })),
      bookmarked,
      state: cardState(review, now),
    };
  }

  // ── Günlük hedef ──

  private async dailyGoal(userId: string, now: Date) {
    const [me, events] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { flashcardDailyGoal: true } }),
      this.prisma.flashcardReviewEvent.findMany({
        where: { userId, reviewedAt: { gte: gunBaslangici(now) } },
        select: { flashcardId: true, rating: true, undoneAt: true },
      }),
    ]);
    return { target: me?.flashcardDailyGoal ?? 20, done: dailyDone(events) };
  }

  // ── Uçlar ──

  async overview(user: AuthenticatedUser, scope: FlashcardScopeDto, now = new Date()) {
    await this.assertEnabled(user);
    const s = await this.resolveScope(scope);
    const [{ refs }, goal, resume] = await Promise.all([
      this.loadCards(user.id, user.isPremium, s),
      this.dailyGoal(user.id, now),
      this.activeSession(user.id, now),
    ]);
    const counts = modeCounts(refs, now);
    return {
      scope: {
        courseId: s.courseId,
        topicId: s.topicId,
        unitSlug: s.unitSlug,
        label: s.label,
      },
      counts,
      locked: counts.total === 0 && counts.locked > 0,
      suggestedMode: suggestedMode(counts),
      dailyGoal: goal,
      resume: resume
        ? {
            sessionId: resume.id,
            mode: resume.mode,
            remaining: resume.queue.length - resume.cursor,
          }
        : null,
    };
  }

  /** Taze yarım oturum (kaldığın yer); kalan kart yoksa null. */
  private async activeSession(userId: string, now: Date) {
    const s = await this.prisma.flashcardSession.findFirst({
      where: {
        userId,
        completedAt: null,
        lastActivityAt: { gte: new Date(now.getTime() - TAZE_OTURUM_MS) },
      },
      orderBy: { lastActivityAt: 'desc' },
    });
    return s && s.queue.length > s.cursor ? s : null;
  }

  async startSession(user: AuthenticatedUser, dto: StartFlashcardSessionDto, now = new Date()) {
    await this.assertEnabled(user);
    const s = await this.resolveScope(dto.scope);
    const { cards, refs, rById, bSet } = await this.loadCards(user.id, user.isPremium, s);
    const counts = modeCounts(refs, now);
    if (counts.total === 0 && counts.locked > 0)
      throw new ForbiddenException({
        code: 'PREMIUM_REQUIRED',
        message: 'Bu kapsamın bilgi kartları Premium ile açılır.',
      });
    const limit = dto.limit ?? OTURUM_VARSAYILAN_KART;
    // Yarım oturum varsa kapatılır: tek "kaldığın yer" olsun.
    await this.prisma.flashcardSession.updateMany({
      where: { userId: user.id, completedAt: null },
      data: { completedAt: now },
    });
    const seed = `${user.id}:${now.getTime()}`;
    const queue = buildQueue(refs, dto.mode, now, limit, seed);
    if (queue.length === 0)
      throw new NotFoundException({
        code: 'NO_CARDS',
        message: 'Bu modda çalışılacak kart yok.',
      });
    const session = await this.prisma.flashcardSession.create({
      data: {
        userId: user.id,
        mode: dto.mode,
        scope: { courseId: s.courseId, topicId: s.topicId, unitSlug: s.unitSlug },
        source: dto.source ?? null,
        queue,
        startedAt: now,
        lastActivityAt: now,
      },
      select: { id: true },
    });
    const byId = new Map(cards.map((c) => [c.id, c]));
    return {
      sessionId: session.id,
      mode: dto.mode as FlashcardMode,
      scope: { courseId: s.courseId, topicId: s.topicId, unitSlug: s.unitSlug, label: s.label },
      cards: queue.map((id) =>
        this.toPublic(byId.get(id)!, bSet.has(id), rById.get(id) ?? null, now),
      ),
      total: queue.length,
      counts,
    };
  }

  /** Kaldığın yer: kalan kartlar (cursor'dan itibaren) içerikle. */
  async resume(user: AuthenticatedUser, now = new Date()) {
    await this.assertEnabled(user);
    const s = await this.activeSession(user.id, now);
    if (!s) return null;
    const remaining = s.queue.slice(s.cursor);
    const ids = [...new Set(remaining)];
    const [cards, reviews, bookmarks] = await Promise.all([
      this.prisma.flashcard.findMany({
        where: { id: { in: ids }, status: 'published', deletedAt: null },
        select: CARD_SELECT,
      }),
      this.prisma.flashcardReview.findMany({
        where: { userId: user.id, flashcardId: { in: ids } },
      }),
      this.prisma.flashcardBookmark.findMany({
        where: { userId: user.id, flashcardId: { in: ids } },
        select: { flashcardId: true },
      }),
    ]);
    const byId = new Map(cards.map((c) => [c.id, c]));
    const rById = new Map(reviews.map((r) => [r.flashcardId, toReviewRow(r)]));
    const bSet = new Set(bookmarks.map((b) => b.flashcardId));
    const scope = s.scope as {
      courseId?: string | null;
      topicId?: string | null;
      unitSlug?: string | null;
    };
    return {
      sessionId: s.id,
      mode: s.mode as FlashcardMode,
      scope: {
        courseId: scope.courseId ?? null,
        topicId: scope.topicId ?? null,
        unitSlug: scope.unitSlug ?? null,
      },
      cursor: s.cursor,
      total: s.queue.length,
      // Yayından kalkan kart kuyruktan düşer (ilerleme durur, kart görünmez).
      cards: remaining
        .filter((id) => byId.has(id))
        .map((id) => this.toPublic(byId.get(id)!, bSet.has(id), rById.get(id) ?? null, now)),
    };
  }

  /**
   * Puanlama olayı — idempotent: aynı (userId, clientEventId) ikinci kez gelirse durum değişmez,
   * aynı yanıt döner. Tek transaction: olay + durum upsert + kuyruk/cursor.
   */
  async recordEvent(
    user: AuthenticatedUser,
    sessionId: string,
    dto: FlashcardEventDto,
    now = new Date(),
  ) {
    await this.assertEnabled(user);
    const result = await this.prisma.$transaction(async (tx) => {
      const mevcut = await tx.flashcardReviewEvent.findUnique({
        where: { userId_clientEventId: { userId: user.id, clientEventId: dto.clientEventId } },
        select: { flashcardId: true, undoneAt: true },
      });
      if (mevcut) {
        const r = await tx.flashcardReview.findUnique({
          where: { userId_flashcardId: { userId: user.id, flashcardId: mevcut.flashcardId } },
        });
        return {
          state: cardState(r ? toReviewRow(r) : null, now),
          idempotent: true,
          requeued: false,
        };
      }
      const session = await tx.flashcardSession.findFirst({
        where: { id: sessionId, userId: user.id },
      });
      if (!session) throw new NotFoundException('Oturum bulunamadı');
      if (session.completedAt)
        throw new ConflictException({ code: 'SESSION_COMPLETED', message: 'Oturum bitmiş.' });
      if (!session.queue.includes(dto.flashcardId))
        throw new BadRequestException('Kart bu oturumun kuyruğunda değil.');
      const [onceki, me] = await Promise.all([
        tx.flashcardReview.findUnique({
          where: { userId_flashcardId: { userId: user.id, flashcardId: dto.flashcardId } },
        }),
        tx.user.findUnique({ where: { id: user.id }, select: { targetExamDate: true } }),
      ]);
      const yeni = kartSrsGuncelle(
        onceki
          ? {
              ease: Number(onceki.ease),
              intervalDays: onceki.intervalDays,
              reps: onceki.reps,
              lapses: onceki.lapses,
            }
          : null,
        dto.rating,
        { now, examDate: me?.targetExamDate ?? null },
      );
      const prevState: PrevState | null = onceki
        ? {
            ease: Number(onceki.ease),
            intervalDays: onceki.intervalDays,
            reps: onceki.reps,
            lapses: onceki.lapses,
            dueAt: onceki.dueAt.toISOString(),
            lastReviewedAt: onceki.lastReviewedAt.toISOString(),
            lastRating: onceki.lastRating,
            reviewCount: onceki.reviewCount,
            knownCount: onceki.knownCount,
            againCount: onceki.againCount,
          }
        : null;
      const data = {
        ease: yeni.ease,
        intervalDays: yeni.intervalDays,
        reps: yeni.reps,
        lapses: yeni.lapses,
        dueAt: yeni.dueAt,
        lastReviewedAt: now,
        lastRating: dto.rating,
        reviewCount: (onceki?.reviewCount ?? 0) + 1,
        knownCount: (onceki?.knownCount ?? 0) + (dto.rating === 'again' ? 0 : 1),
        againCount: (onceki?.againCount ?? 0) + (dto.rating === 'again' ? 1 : 0),
      };
      const r = await tx.flashcardReview.upsert({
        where: { userId_flashcardId: { userId: user.id, flashcardId: dto.flashcardId } },
        update: data,
        create: { userId: user.id, flashcardId: dto.flashcardId, ...data },
      });
      await tx.flashcardReviewEvent.create({
        data: {
          userId: user.id,
          flashcardId: dto.flashcardId,
          sessionId: session.id,
          clientEventId: dto.clientEventId,
          rating: dto.rating,
          // Json? kolonu: ilk karşılaşmada DB null (geri alınca satır silinir).
          prevState: prevState ? (prevState as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
          timeSpentMs: dto.timeSpentMs ?? null,
          reviewedAt: now,
        },
      });
      const queue =
        dto.rating === 'again' ? requeueAgain(session.queue, dto.flashcardId) : [...session.queue];
      await tx.flashcardSession.update({
        where: { id: session.id },
        data: { queue, cursor: Math.min(session.cursor + 1, queue.length), lastActivityAt: now },
      });
      return {
        state: cardState(toReviewRow(r), now),
        idempotent: false,
        requeued: queue.length > session.queue.length,
        remaining: queue.length - Math.min(session.cursor + 1, queue.length),
      };
    });
    return { ...result, dailyGoal: await this.dailyGoal(user.id, now) };
  }

  /** Geri al: yalnız kartın SON olayı ve pencere içinde; önceki durum olaydan geri yüklenir. */
  async undoEvent(
    user: AuthenticatedUser,
    sessionId: string,
    clientEventId: string,
    now = new Date(),
  ) {
    await this.assertEnabled(user);
    return this.prisma.$transaction(async (tx) => {
      const ev = await tx.flashcardReviewEvent.findUnique({
        where: { userId_clientEventId: { userId: user.id, clientEventId } },
      });
      if (!ev || ev.sessionId !== sessionId) throw new NotFoundException('Olay bulunamadı');
      const current = async () => {
        const r = await tx.flashcardReview.findUnique({
          where: { userId_flashcardId: { userId: user.id, flashcardId: ev.flashcardId } },
        });
        return cardState(r ? toReviewRow(r) : null, now);
      };
      if (ev.undoneAt) return { state: await current(), idempotent: true };
      const son = await tx.flashcardReviewEvent.findFirst({
        where: { userId: user.id, flashcardId: ev.flashcardId, undoneAt: null },
        orderBy: [{ reviewedAt: 'desc' }, { id: 'desc' }],
        select: { id: true },
      });
      if (!son || son.id !== ev.id)
        throw new ConflictException({
          code: 'UNDO_NOT_LATEST',
          message: 'Bu kart için daha yeni bir puan var; yalnız son puan geri alınır.',
        });
      if (now.getTime() - ev.reviewedAt.getTime() > GERI_AL_PENCERESI_MS)
        throw new ConflictException({ code: 'UNDO_EXPIRED', message: 'Geri alma süresi geçti.' });
      const prev = ev.prevState as PrevState | null;
      if (!prev) {
        await tx.flashcardReview.deleteMany({
          where: { userId: user.id, flashcardId: ev.flashcardId },
        });
      } else {
        await tx.flashcardReview.update({
          where: { userId_flashcardId: { userId: user.id, flashcardId: ev.flashcardId } },
          data: {
            ease: prev.ease,
            intervalDays: prev.intervalDays,
            reps: prev.reps,
            lapses: prev.lapses,
            dueAt: new Date(prev.dueAt),
            lastReviewedAt: new Date(prev.lastReviewedAt),
            lastRating: prev.lastRating,
            reviewCount: prev.reviewCount,
            knownCount: prev.knownCount,
            againCount: prev.againCount,
          },
        });
      }
      await tx.flashcardReviewEvent.update({ where: { id: ev.id }, data: { undoneAt: now } });
      const session = await tx.flashcardSession.findFirst({
        where: { id: sessionId, userId: user.id },
      });
      if (session) {
        let queue = [...session.queue];
        // "Tekrar" ile sona eklenen kopya geri alınınca düşer.
        if (ev.rating === 'again' && queue.filter((id) => id === ev.flashcardId).length > 1) {
          const last = queue.lastIndexOf(ev.flashcardId);
          queue = [...queue.slice(0, last), ...queue.slice(last + 1)];
        }
        await tx.flashcardSession.update({
          where: { id: session.id },
          data: { queue, cursor: Math.max(0, session.cursor - 1), lastActivityAt: now },
        });
      }
      return { state: await current(), idempotent: false };
    });
  }

  async completeSession(user: AuthenticatedUser, sessionId: string, now = new Date()) {
    await this.assertEnabled(user);
    const session = await this.prisma.flashcardSession.findFirst({
      where: { id: sessionId, userId: user.id },
    });
    if (!session) throw new NotFoundException('Oturum bulunamadı');
    if (!session.completedAt)
      await this.prisma.flashcardSession.update({
        where: { id: session.id },
        data: { completedAt: now, lastActivityAt: now },
      });
    const [events, dueCount, nextDue, goal] = await Promise.all([
      this.prisma.flashcardReviewEvent.findMany({
        where: { sessionId: session.id },
        select: { flashcardId: true, rating: true, undoneAt: true },
      }),
      this.prisma.flashcardReview.count({ where: { userId: user.id, dueAt: { lte: now } } }),
      this.prisma.flashcardReview.findFirst({
        where: { userId: user.id, dueAt: { gt: now } },
        orderBy: { dueAt: 'asc' },
        select: { dueAt: true },
      }),
      this.dailyGoal(user.id, now),
    ]);
    return {
      sessionId: session.id,
      summary: sessionSummary(events),
      due: { count: dueCount, nextAt: nextDue?.dueAt.toISOString() ?? null },
      dailyGoal: goal,
    };
  }

  // ── Favoriler ──

  async bookmarks(user: AuthenticatedUser, now = new Date()) {
    await this.assertEnabled(user);
    const rows = await this.prisma.flashcardBookmark.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { flashcardId: true },
    });
    const ids = rows.map((r) => r.flashcardId);
    const [cards, reviews] = await Promise.all([
      this.prisma.flashcard.findMany({
        where: { id: { in: ids }, status: 'published', deletedAt: null },
        select: CARD_SELECT,
      }),
      this.prisma.flashcardReview.findMany({
        where: { userId: user.id, flashcardId: { in: ids } },
      }),
    ]);
    const byId = new Map(cards.map((c) => [c.id, c]));
    const rById = new Map(reviews.map((r) => [r.flashcardId, toReviewRow(r)]));
    return ids
      .filter((id) => byId.has(id))
      .map((id) => this.toPublic(byId.get(id)!, true, rById.get(id) ?? null, now));
  }

  async addBookmark(user: AuthenticatedUser, flashcardId: string) {
    await this.assertEnabled(user);
    const card = await this.prisma.flashcard.findFirst({
      where: { id: flashcardId, status: 'published', deletedAt: null },
      select: { id: true },
    });
    if (!card) throw new NotFoundException('Kart bulunamadı');
    await this.prisma.flashcardBookmark.upsert({
      where: { userId_flashcardId: { userId: user.id, flashcardId } },
      update: {},
      create: { userId: user.id, flashcardId },
    });
    return { bookmarked: true };
  }

  async removeBookmark(user: AuthenticatedUser, flashcardId: string) {
    await this.assertEnabled(user);
    await this.prisma.flashcardBookmark.deleteMany({ where: { userId: user.id, flashcardId } });
    return { bookmarked: false };
  }

  // ── Tercih ──

  async preferences(user: AuthenticatedUser, dto: FlashcardPreferencesDto, now = new Date()) {
    await this.assertEnabled(user);
    if (dto.dailyGoal != null)
      await this.prisma.user.update({
        where: { id: user.id },
        data: { flashcardDailyGoal: dto.dailyGoal },
      });
    return { dailyGoal: await this.dailyGoal(user.id, now) };
  }

  // ── Odalar için sayımlar (eklemeli alanlar) ──

  /**
   * Ders/konu odası sayımları: toplam ve konu başına {count, due, learned, locked}. Bayrak
   * kapalıyken oda servisi bunu ÇAĞIRMAZ (null döner); kartı olmayan konu 0 ile gelir.
   */
  async roomCounts(
    userId: string,
    isPremium: boolean,
    by: { courseId?: string; topicId?: string },
    now = new Date(),
  ): Promise<{ total: ModeCounts; byTopic: Map<string, ModeCounts> }> {
    const cards = await this.prisma.flashcard.findMany({
      where: {
        status: 'published',
        deletedAt: null,
        ...(by.topicId
          ? { topicId: by.topicId }
          : { topic: { courseId: by.courseId, deletedAt: null } }),
      },
      select: {
        id: true,
        topicId: true,
        sortOrder: true,
        topic: { select: { isPremium: true } },
        summaryUnit: { select: { isPremium: true } },
      },
    });
    const ids = cards.map((c) => c.id);
    const [reviews, bookmarks] = ids.length
      ? await Promise.all([
          this.prisma.flashcardReview.findMany({ where: { userId, flashcardId: { in: ids } } }),
          this.prisma.flashcardBookmark.findMany({
            where: { userId, flashcardId: { in: ids } },
            select: { flashcardId: true },
          }),
        ])
      : [[], []];
    const rById = new Map(reviews.map((r) => [r.flashcardId, toReviewRow(r)]));
    const bSet = new Set(bookmarks.map((b) => b.flashcardId));
    const refs = cards.map((c, i) => ({
      topicId: c.topicId,
      ref: {
        id: c.id,
        sortOrder: i,
        locked: (c.summaryUnit?.isPremium ?? c.topic.isPremium) && !isPremium,
        bookmarked: bSet.has(c.id),
        review: rById.get(c.id) ?? null,
      } satisfies CardRef,
    }));
    const byTopic = new Map<string, CardRef[]>();
    for (const r of refs)
      (byTopic.get(r.topicId) ?? byTopic.set(r.topicId, []).get(r.topicId)!).push(r.ref);
    return {
      total: modeCounts(
        refs.map((r) => r.ref),
        now,
      ),
      byTopic: new Map([...byTopic].map(([t, list]) => [t, modeCounts(list, now)])),
    };
  }

  /** Çalış ana ekranı: tüm derslerde vadesi gelen açık kart sayısı. */
  async dueTotal(userId: string, isPremium: boolean, now = new Date()): Promise<number> {
    const due = await this.prisma.flashcardReview.findMany({
      where: { userId, dueAt: { lte: now }, flashcard: { status: 'published', deletedAt: null } },
      select: {
        flashcard: {
          select: {
            topic: { select: { isPremium: true } },
            summaryUnit: { select: { isPremium: true } },
          },
        },
      },
    });
    if (isPremium) return due.length;
    return due.filter((d) => !(d.flashcard.summaryUnit?.isPremium ?? d.flashcard.topic.isPremium))
      .length;
  }
}

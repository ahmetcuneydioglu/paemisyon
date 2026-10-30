import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { SettingsService } from '../../infra/settings/settings.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { freezesLeft, liveStreak, weeklyFreezeAllowance } from '../progress/streak.logic';
import { computeRank, rankScore } from './rank.logic';
import { CoachBrief, CoachCard, CoachContext, CoachMode } from './coach.types';
import type { DailyFocusView, ExamInfo, Readiness } from './home-v2.types';
import type { SetFocusDto } from './dto/set-focus.dto';
import { buildReadiness } from './readiness.logic';
import { computeHomeV3 } from './bugun-v3.logic';
import { computeTodayTask, haftadaKalanGun, YarimTur } from './today-task.logic';
import { enGucluKonular } from '../../common/zayif-konu';
import { gunAnahtari, gunBaslangici, haftaBasi } from '../../common/gun';
import { haftaGunleri, type HaftaGunDurumu } from './hafta-gunleri';
import { yanlisKaydiFiltresi, yanlisTuruSoruFiltresi } from '../quiz/yanlis-havuzu';
import { coachRules, motivationRule } from './rules';
import { PlanService } from '../plan/plan.service';
import { SummariesService } from '../summaries/summaries.service';
import { hedefSinavTarihi } from './hedef-sinav';

export { hedefSinavTarihi };

/** Haftalık aktif gün hedefi (v1 sabit; ileride kullanıcı ayarı olabilir). */
const WEEKLY_GOAL_DAYS = 5;

/**
 * Kişisel Koç motoru (Doc 19). Akış: buildContext (tek Promise.all ile gerçek
 * veri) → kurallar (saf fonksiyonlar) → en önemli 4 kart + primaryAction.
 * AI-hazırlık: v2'de bu servisin kart üreticisi değişir, sözleşme değişmez.
 */
@Injectable()
export class CoachService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly plan: PlanService,
    private readonly summaries: SummariesService,
  ) {}

  /**
   * Günün odağı (Doc 48 A5; Doc 25 §5). Koç seçilirse satır silinir (varsayılan
   * zaten koç). Premium konu sessizce kabul edilmez — kapı açıkça söylenir
   * (seçili mevzuat turuyla aynı ilke).
   */
  async setFocus(user: AuthenticatedUser, dto: SetFocusDto): Promise<DailyFocusView> {
    if (dto.kind === 'coach') {
      await this.prisma.dailyFocus.deleteMany({ where: { userId: user.id } });
      return KOC_ODAGI;
    }
    let courseId: string | null = null;
    let topicId: string | null = null;
    let label: string | null = null;
    if (dto.kind === 'course') {
      if (!dto.courseId || dto.topicId) {
        throw new BadRequestException('Ders odağı için yalnız courseId verilir.');
      }
      const course = await this.prisma.course.findFirst({
        where: { id: dto.courseId, deletedAt: null },
        select: { id: true, name: true },
      });
      if (!course) throw new NotFoundException('Ders bulunamadı.');
      courseId = course.id;
      label = course.name;
    } else if (dto.kind === 'topic') {
      if (!dto.topicId) throw new BadRequestException('Konu odağı için topicId gerekir.');
      const topic = await this.prisma.topic.findFirst({
        where: { id: dto.topicId, deletedAt: null },
        select: { id: true, name: true, isPremium: true, courseId: true },
      });
      if (!topic) throw new NotFoundException('Konu bulunamadı.');
      if (topic.isPremium && !user.isPremium) {
        throw new ForbiddenException({
          code: 'PREMIUM_REQUIRED',
          message: 'Bu konu premium içeriktir.',
        });
      }
      topicId = topic.id;
      courseId = topic.courseId;
      label = topic.name;
    } else if (dto.courseId || dto.topicId) {
      throw new BadRequestException('Yanlışlarım odağı kimlik taşımaz.');
    }
    const data = { day: gunAnahtari(), kind: dto.kind, courseId, topicId };
    await this.prisma.dailyFocus.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
    });
    return { kind: dto.kind, courseId, topicId, label };
  }

  async brief(user: AuthenticatedUser): Promise<CoachBrief> {
    // Ayar okuması 60 sn bellek önbelleğinden — ek gidiş-dönüş yok.
    const homeV2Herkese = this.settings.mobilAnasayfaV2();
    const ctx = await this.buildContext(user);

    let cards: CoachCard[] = coachRules
      .map((rule) => rule(ctx))
      .filter((c): c is CoachCard => c != null)
      .sort((a, b) => b.priority - a.priority);

    // Geri dönüş kartı TEK BAŞINA gösterilir (Doc 19 kural 12):
    // uzun aradan dönen kullanıcıyı görev listesiyle boğma.
    const comeback = cards.find((c) => c.type === 'comeback');
    const aftermath = cards.find((c) => c.type === 'aftermath');
    const taper = cards.find((c) => c.type === 'taper');
    if (comeback) {
      cards = [comeback];
    } else if (aftermath) {
      // Sınav sonrası (Doc 24 §3): grind susar — sakin devir mesajı + (varsa)
      // canlı/bugünkü deneme kartı kalır (yeni bir denemeye çağrı meşru).
      cards = cards.filter(
        (c) =>
          c.type === 'aftermath' ||
          c.type === 'exam_live' ||
          c.type === 'exam_in_progress' ||
          c.type === 'exam_today',
      );
    } else if (taper) {
      // Taper (Doc 24 §1/son 3 gün): görev listesi bastırılır — yalnız sakin
      // güven mesajı + (varsa) canlı/bugünkü deneme kartı kalır.
      cards = cards.filter(
        (c) => c.type === 'taper' || c.type === 'exam_live' || c.type === 'exam_today',
      );
    } else if (cards.length === 0) {
      cards = [motivationRule(ctx)!]; // motivasyon her zaman kart döndürür
    } else {
      cards = cards.slice(0, 4);
    }

    const mode = deriveMode(ctx, cards);

    // Kampanya duyurusu (Doc 52 F2): `createInAppBanner` kampanyasının okunmamış kutu satırı,
    // hero'dan sonra destek kartı olarak. Okununca/kapatılınca düşer; süresi dolunca düşer.
    const banner = await this.announcementCard(user.id, ctx.now).catch(() => null);
    if (banner) cards.splice(Math.min(1, cards.length), 0, banner);

    const top = cards[0];
    const primaryAction: CoachBrief['primaryAction'] = top?.cta
      ? { type: top.type, ...top.cta }
      : { type: 'default', label: 'Çalışmaya başla', route: '/catalog' };

    const todayTask = computeTodayTask({
      now: ctx.now,
      trHour: ctx.trHour,
      goal: ctx.user.dailyGoal,
      answeredToday: ctx.answeredToday,
      totalSolved: ctx.stats.totalSolved,
      daysSinceLastActivity: ctx.daysSinceLastActivity,
      daysToExam: ctx.daysToExam,
      weekly: ctx.weekly,
      daysLeftInWeek: ctx.home.daysLeftInWeek,
      exams: { live: ctx.exams.live, todayUpcoming: ctx.exams.todayUpcoming },
      activeSession: ctx.home.activeSession,
      focus: ctx.home.focus,
      readiness: ctx.home.readiness,
      strongestTopic: ctx.home.strongestTopic,
      plan: ctx.plan ? { nextItem: ctx.plan.nextItem } : null,
    });
    // Doc 49/16 — Bugün v3: tek adım + rota + senin için (karar sunucuda).
    const rank = computeRank(rankScore(ctx.stats.totalSolved, ctx.activeDaysTotal));
    const homeV3Cekirdek = computeHomeV3({
      now: ctx.now,
      goal: ctx.user.dailyGoal,
      answeredToday: ctx.answeredToday,
      dailyQuizPlayed: ctx.dailyQuizPlayed,
      activeSession: ctx.home.activeSession,
      todayTask,
      weakestUnit: ctx.weakestUnit,
      readiness: ctx.home.readiness,
      exams: {
        live: ctx.exams.live,
        todayUpcoming: ctx.exams.todayUpcoming,
        nextUpcoming: ctx.exams.nextUpcoming,
      },
      plan: ctx.plan ? { items: ctx.plan.items } : null,
      todayTopicAnswered: ctx.home.todayTopicAnswered,
      reviewDoneToday: ctx.home.reviewDoneToday,
    });
    const homeV3 = {
      ...homeV3Cekirdek,
      week: {
        solved: ctx.volume.last7,
        activeDays: ctx.weekly.activeDays,
        goalDays: ctx.weekly.goalDays,
        rankName: rank.name,
      },
    };

    return {
      unitRecipe: ctx.weakestUnit,
      greeting: {
        displayName: ctx.user.displayName,
        isPremium: ctx.user.isPremium,
        onboardingCompleted: ctx.user.onboardingCompleted,
        preferredModuleName: ctx.user.preferredModuleName,
      },
      today: {
        goal: ctx.user.dailyGoal,
        answered: ctx.answeredToday,
        streak: {
          current: ctx.streak.current,
          longest: ctx.streak.longest,
          // Bayrak saatten bağımsız (UI ince uyarı gösterebilir);
          // kart (streak_risk) yalnız akşam tetiklenir.
          atRisk: ctx.streak.activeYesterday && ctx.answeredToday === 0,
          freezesLeft: ctx.streak.freezesLeft,
        },
      },
      primaryAction,
      mode,
      daysToExam: ctx.daysToExam,
      cards,
      stats: {
        totalSolved: ctx.stats.totalSolved,
        accuracy:
          ctx.stats.totalSolved > 0
            ? Math.round((ctx.stats.totalCorrect / ctx.stats.totalSolved) * 100)
            : 0,
        totalSessions: ctx.stats.totalSessions,
      },
      gamification: {
        nextBadge: ctx.nextBadge,
        rank,
        records: {
          bestNet: ctx.exams.bestNet,
          longestStreak: ctx.streak.longest,
          maxDailyQuestions: ctx.maxDailyQuestions,
        },
        weekly: { ...ctx.weekly, days: ctx.home.weekDays },
      },
      // Haftalık fotoğraf (Doc 27 wireframe 02) — Bugün sağ kolonu.
      weeklyPhoto: ctx.weeklyPhoto,
      flags: { homeV2: homeV2Acik(await homeV2Herkese, user.roles) },
      exam: ctx.home.exam,
      readiness: ctx.home.readiness,
      focus: ctx.home.focus,
      plan: ctx.plan,
      // Doc 48 A4 — görev kartı + eylem çubuğu: etiket ve davranış tek nesnede.
      todayTask,
      homeV3,
    };
  }

  // ── Bağlam: kuralların okuduğu TÜM gerçek veri tek seferde ──

  /**
   * Kuralların bağlamı + yeni anasayfanın (Doc 48) ham ekleri. `home` kurallara
   * GİRMEZ (CoachContext'e eklenmez — kural spec'leri onu elle kurar); yalnız
   * brief() yeni alanları kurarken okur.
   */
  private async announcementCard(userId: string, now: Date): Promise<CoachCard | null> {
    const n = await this.prisma.notification.findFirst({
      where: {
        userId,
        readAt: null,
        dismissedAt: null,
        scheduledAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        campaign: { is: { createInAppBanner: true } },
      },
      orderBy: { scheduledAt: 'desc' },
      select: {
        id: true,
        title: true,
        body: true,
        ctaLabel: true,
        route: true,
        webPath: true,
        imageUrl: true,
      },
    });
    if (!n) return null;
    return {
      type: 'announcement',
      priority: 0,
      title: n.title,
      body: n.body,
      cta: { label: n.ctaLabel ?? 'Aç', route: n.route ?? '' },
      meta: { notificationId: n.id, webPath: n.webPath, imageUrl: n.imageUrl },
    };
  }

  private async buildContext(user: AuthenticatedUser): Promise<CoachContext & { home: HomeRaw }> {
    const now = new Date();
    // Uygulama günü ve haftası TR 04.00'te döner (Doc 48 D2 — common/gun.ts):
    // sayaç, seri, odak ve haftalık gün aynı takvimi okur. Sınava kalan gün ve
    // "bugünkü deneme" ise TR TAKVİM günüdür (trDayKey/trDayDiff) — kasıtlı.
    const bugun = gunAnahtari(now);
    const weekStart = haftaBasi(now);
    const prevWeekStart = new Date(weekStart.getTime() - 7 * 86_400_000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 3_600_000);

    // Profil, hedef sınavı (kapsam) taşır: yanlış sayacı onu bekler ama
    // aşağıdaki sorgu turunu bekletmez (paralel zincir — ek gidiş-dönüş yok).
    const profileP = this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        displayName: true,
        dailyGoal: true,
        onboardingCompletedAt: true,
        targetExamDate: true,
        preferredModuleId: true,
        preferredModule: { select: { name: true, examDate: true } },
      },
    });
    // Yanlış turunun GERÇEKTE sunabileceği yanlış sayısı (Doc 48 A3): turla
    // aynı süzgeç (yanlis-havuzu.ts) — sayaç "4 yanlış" derken tur "kuyruk
    // temiz" diyemez (ücretsiz 7 gün, premium konu, hedef sınav kapsamı).
    const yanlisSayisiP = Promise.all([
      profileP,
      this.prisma.wrongAnswer.findMany({
        where: yanlisKaydiFiltresi(user.id, user.isPremium, now.getTime()),
        select: { questionId: true },
      }),
    ]).then(([p, wrongs]) =>
      wrongs.length === 0
        ? 0
        : this.prisma.question.count({
            where: {
              id: { in: wrongs.map((w) => w.questionId) },
              ...yanlisTuruSoruFiltresi({
                isPremium: user.isPremium,
                preferredModuleId: p?.preferredModuleId ?? null,
              }),
            },
          }),
    );

    const [
      profile,
      streak,
      todayUsage,
      stats,
      unresolvedWrongCount,
      moduleSections,
      exams,
      mySessions,
      denemeAgg,
      dailySession,
      badgeCatalog,
      earnedBadges,
      weeklyUsage,
      activeDaysTotal,
      maxDaily,
      snapshots,
      recentUsage,
      recentDeneme,
      cikmisSinavlar,
      cikmisCozumlerim,
      cikmisKartAcik,
      topicProgress,
      odakSatiri,
      yarimTurlar,
      planOzeti,
      bugunKonuCevaplari,
      bugunYanlisTuru,
    ] = await Promise.all([
      profileP,
      this.prisma.streak.findUnique({ where: { userId: user.id } }),
      this.prisma.dailyUsage.findUnique({
        where: { userId_usageDate: { userId: user.id, usageDate: bugun } },
      }),
      this.prisma.userStats.findUnique({ where: { userId: user.id } }),
      yanlisSayisiP,
      // Hedef sınavın bölümleri → dersleri, müfredat sırasıyla (hazırlık bloğu).
      // İlişkisel süzgeç: profil sonucunu beklemeden aynı turda çalışır.
      this.prisma.examSection.findMany({
        where: { deletedAt: null, examType: { preferredUsers: { some: { id: user.id } } } },
        orderBy: { sortOrder: 'asc' },
        select: {
          courses: {
            orderBy: { sortOrder: 'asc' },
            select: { course: { select: { id: true, name: true, icon: true, deletedAt: true } } },
          },
        },
      }),
      this.prisma.exam.findMany({
        // Çıkmış sınavın motor kaydı (Doc 36) randevulu deneme değildir: deneme
        // listesiyle aynı süzgeç (exams.service), yoksa yeni bağlanan bir dönem
        // 48 saat boyunca "Yeni deneme yayınlandı" kartı olarak görünürdü.
        where: { status: 'published', deletedAt: null, pastExam: null },
        orderBy: { startAt: 'desc' },
        take: 20,
        include: { _count: { select: { questions: true } } },
      }),
      this.prisma.quizSession.findMany({
        where: { userId: user.id, examId: { not: null } },
        select: { examId: true, status: true },
      }),
      this.prisma.quizSession.aggregate({
        where: { userId: user.id, mode: 'deneme', status: 'completed' },
        _count: { _all: true },
        _max: { score: true },
      }),
      this.prisma.quizSession.findFirst({
        where: { userId: user.id, mode: 'daily', startedAt: { gte: gunBaslangici(now) } },
        orderBy: { startedAt: 'desc' },
        select: { status: true },
      }),
      this.prisma.badge.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.userBadge.findMany({
        where: { userId: user.id },
        select: { badgeKey: true },
      }),
      this.prisma.dailyUsage.findMany({
        where: {
          userId: user.id,
          usageDate: { gte: weekStart },
          // Aktif gün = o gün en az 1 cevap (deneme dahil — Doc 48 A9).
          totalAnswered: { gt: 0 },
        },
        select: { usageDate: true },
      }),
      // Toplam aktif gün (rütbe puanı — Doc 24 §5).
      this.prisma.dailyUsage.count({
        where: { userId: user.id, totalAnswered: { gt: 0 } },
      }),
      this.prisma.dailyUsage.aggregate({
        where: { userId: user.id },
        _max: { totalAnswered: true },
      }),
      this.prisma.topicMasterySnapshot.findMany({
        where: { userId: user.id, weekStart: { in: [weekStart, prevWeekStart] } },
        include: { topic: { select: { course: { select: { name: true } } } } },
      }),
      // Tempo sinyali (slump_watch): son 14 günün günlük soru hacmi.
      this.prisma.dailyUsage.findMany({
        where: {
          userId: user.id,
          usageDate: { gte: new Date(bugun.getTime() - 14 * 86_400_000) },
        },
        select: { usageDate: true, totalAnswered: true },
      }),
      // Deneme sonrası (post_exam): son 48 saatte tamamlanmış randevulu deneme.
      this.prisma.quizSession.findFirst({
        where: {
          userId: user.id,
          mode: 'deneme',
          status: 'completed',
          completedAt: { gte: twoDaysAgo },
        },
        orderBy: { completedAt: 'desc' },
        select: { examId: true, wrongCount: true, exam: { select: { title: true } } },
      }),
      // Çıkmış sınavlar (Doc 36): yalnız motora bağlı resmî dönemler — analiz
      // dönemlerinde soru yok, çözülecek bir şey de yok.
      this.prisma.pastExam.findMany({
        where: {
          status: 'published',
          deletedAt: null,
          kind: 'resmi',
          examId: { not: null },
        },
        orderBy: [{ sortOrder: 'desc' }, { heldOn: 'desc' }],
        select: {
          slug: true,
          name: true,
          term: true,
          examId: true,
          questionCount: true,
          // `questionCount` elle girilen bir alan ve boş bırakılabiliyor
          // (PAEM 9'da NULL) — bağlı soru sayısı yedek. Public vitrin de aynı
          // yedeği kullanıyor; kart ondan farklı bir sayı söylememeli.
          _count: { select: { questions: true } },
        },
      }),
      // Arşivde çözdüklerim: çıkmış sınav oturumu `archiveExamId` taşır.
      this.prisma.quizSession.findMany({
        where: { userId: user.id, status: 'completed', archiveExamId: { not: null } },
        select: { archiveExamId: true },
      }),
      this.settings.coachCikmisSinavKarti(),
      // Konu birikimi — hazırlık bloğu ve zayıf konu (tek eşik, zayif-konu.ts).
      this.prisma.userTopicProgress.findMany({
        where: { userId: user.id, topic: { deletedAt: null } },
        select: {
          topicId: true,
          solvedCount: true,
          correctCount: true,
          topic: { select: { name: true, courseId: true, course: { select: { name: true } } } },
        },
      }),
      // Günün odağı (Doc 48 A5) — yalnız bugün yazıldıysa geçerli.
      this.prisma.dailyFocus.findUnique({
        where: { userId: user.id },
        include: {
          course: { select: { name: true, deletedAt: true } },
          topic: { select: { name: true, deletedAt: true } },
        },
      }),
      // Yarım alıştırma/tekrar/günlük turları (görev kartı — Doc 48 §4). Deneme
      // ve arşiv sınavı kendi kuralıyla yaşar (süreli), burada yok.
      this.prisma.quizSession.findMany({
        where: {
          userId: user.id,
          status: 'in_progress',
          mode: { in: ['practice', 'review', 'daily'] },
        },
        orderBy: { startedAt: 'desc' },
        take: 3,
        select: {
          id: true,
          mode: true,
          totalQuestions: true,
          startedAt: true,
          topicIds: true,
          topic: { select: { name: true } },
          course: { select: { name: true } },
          _count: { select: { answers: true } },
          answers: { orderBy: { answeredAt: 'desc' }, take: 1, select: { answeredAt: true } },
        },
      }),
      // Haftalık plan özeti (Doc 49/12 F8-A): kart + brief.plan; yoksa null.
      this.plan.ozet(user.id, now),
      // Bugün v3 rotası: bugün konu başına cevap (QuizAnswer'ın question ilişkisi yok → ham birleşim).
      this.prisma.$queryRaw<{ topic_id: string; n: bigint }[]>`
        SELECT q.topic_id, COUNT(*)::bigint AS n
        FROM quiz_answers a
        JOIN quiz_sessions s ON s.id = a.session_id
        JOIN questions q ON q.id = a.question_id
        WHERE s.user_id = ${user.id}::uuid AND a.answered_at >= ${gunBaslangici(now)}
        GROUP BY q.topic_id`,
      this.prisma.quizSession.findFirst({
        where: {
          userId: user.id,
          mode: 'review',
          status: 'completed',
          completedAt: { gte: gunBaslangici(now) },
        },
        select: { id: true },
      }),
    ]);

    // ── Deneme durumları ──
    const sessionOf = new Map(mySessions.map((s) => [s.examId!, s.status]));
    const endOf = (e: { startAt: Date; durationMinutes: number }) =>
      new Date(e.startAt.getTime() + e.durationMinutes * 60_000);

    const liveExam = exams.find((e) => e.startAt <= now && now < endOf(e));
    const todayUpcoming = exams.find(
      (e) => e.startAt > now && trDayKey(e.startAt) === trDayKey(now),
    );
    // Bugün v3: bugünden sonra, 7 gün içinde başlayacak ilk deneme (liste yeniden eskiye sıralı).
    const yediGun = new Date(now.getTime() + 7 * 86_400_000);
    const nextUpcoming =
      exams
        .filter(
          (e) => e.startAt > now && trDayKey(e.startAt) !== trDayKey(now) && e.startAt <= yediGun,
        )
        .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())[0] ?? null;
    const newPublished = exams.find(
      (e) =>
        e.createdAt >= twoDaysAgo &&
        !sessionOf.has(e.id) &&
        e.id !== liveExam?.id &&
        e.id !== todayUpcoming?.id, // aynı deneme iki kartta görünmesin
    );

    // Gösterilen seri = CANLI seri (kayıtlı değer yalnız tur bitince güncellenir).
    const freezeAllowance = weeklyFreezeAllowance(user.isPremium);
    const currentStreak = liveStreak(streak, bugun, freezeAllowance);

    // ── Sıradaki rozet: kazanılmamışlar içinde tamamlanmaya en yakın ──
    const earned = new Set(earnedBadges.map((b) => b.badgeKey));
    const totalSolved = stats?.totalSolved ?? 0;
    const accuracyPct =
      totalSolved > 0 ? Math.round(((stats?.totalCorrect ?? 0) / totalSolved) * 100) : 0;
    const progressOf = (kind: string): number => {
      switch (kind) {
        case 'streak':
          return currentStreak;
        case 'solved':
          return totalSolved;
        case 'exam':
          return denemeAgg._count._all;
        case 'accuracy':
          return totalSolved >= 100 ? accuracyPct : 0; // min 100 soru şartı
        default:
          return 0;
      }
    };
    let nextBadge: CoachContext['nextBadge'] = null;
    let bestRatio = -1;
    for (const b of badgeCatalog) {
      if (earned.has(b.key)) continue;
      const p = progressOf(b.kind);
      // Eşiği geçmiş ama henüz verilmemiş rozet "sıradaki" DEĞİLDİR —
      // verme kancası (Faz 3) onu user_badges'e taşır; "az kaldı" demek yanlış.
      if (p >= b.threshold) continue;
      const ratio = p / b.threshold;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        nextBadge = { key: b.key, name: b.name, progress: p, target: b.threshold };
      }
    }

    // ── Haftalık ders trendi: iki haftanın kurs bazlı ortalama mastery farkı ──
    const byCourseWeek = new Map<string, { cur: number[]; prev: number[] }>();
    for (const s of snapshots) {
      const name = s.topic.course.name;
      const bucket = byCourseWeek.get(name) ?? { cur: [], prev: [] };
      (s.weekStart.getTime() === weekStart.getTime() ? bucket.cur : bucket.prev).push(
        Number(s.mastery),
      );
      byCourseWeek.set(name, bucket);
    }
    let courseTrend: CoachContext['courseTrend'] = null;
    // Haftalık fotoğraf (Doc 27 wireframe 02): sıfır olmayan tüm ders değişimleri,
    // mutlak değere göre azalan — Bugün'de "Anayasa %12 ↑, CMK %4 ↓" kartı.
    const weeklyPhoto: { courseName: string; deltaPct: number }[] = [];
    for (const [courseName, w] of byCourseWeek) {
      if (w.cur.length === 0 || w.prev.length === 0) continue;
      const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
      const prev = avg(w.prev);
      if (prev <= 0) continue;
      const deltaPct = Math.round(((avg(w.cur) - prev) / prev) * 100);
      if (deltaPct !== 0) weeklyPhoto.push({ courseName, deltaPct });
      if (!courseTrend || Math.abs(deltaPct) > Math.abs(courseTrend.deltaPct)) {
        courseTrend = { courseName, deltaPct };
      }
    }
    weeklyPhoto.sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct));

    // ── Aktivite günleri (streak.lastActiveDate = @db.Date, UTC gün) ──
    const lastActive = streak?.lastActiveDate ?? null;
    const daysSince = lastActive
      ? Math.floor((bugun.getTime() - startOfUtcDay(lastActive).getTime()) / 86_400_000)
      : null;

    // ── Hazırlık (Doc 48 A3) — hedef sınavın dersleri + konu birikimi ──
    const hedefDersler = profile?.preferredModuleId
      ? [
          ...new Map(
            moduleSections
              .flatMap((s) => s.courses)
              .filter((sc) => sc.course.deletedAt == null)
              .map((sc) => [
                sc.course.id,
                { courseId: sc.course.id, name: sc.course.name, icon: sc.course.icon },
              ]),
          ).values(),
        ]
      : null;
    const readiness: Readiness = buildReadiness({
      courses: hedefDersler,
      progress: topicProgress.map((t) => ({
        topicId: t.topicId,
        topicName: t.topic.name,
        courseId: t.topic.courseId,
        courseName: t.topic.course.name,
        solved: t.solvedCount,
        correct: t.correctCount,
      })),
      weeklyPhoto,
      unresolvedWrongCount,
    });

    // Ünite reçetesi (Doc 53 F5-2): yalnız zayıf konu varsa, o konunun yayındaki üniteleri arasından.
    const weakestUnit = readiness.weakest[0]
      ? await this.summaries.recipeForTopic(user.id, readiness.weakest[0].topicId).catch(() => null)
      : null;

    // ── Günün odağı (Doc 48 A5): dünün odağı ya da silinmiş kapsam → koç ──
    const focus = odagiCoz(odakSatiri, bugun);

    // ── Görev kartı girdileri (Doc 48 A4) ──
    // En taze yarım tur: son cevaba göre (cevapsızsa başlangıca).
    const activeSession: YarimTur | null =
      yarimTurlar
        .map((s) => ({
          sessionId: s.id,
          mode: s.mode as YarimTur['mode'],
          total: s.totalQuestions,
          answered: s._count.answers,
          startedAt: s.startedAt,
          lastActivityAt: s.answers[0]?.answeredAt ?? s.startedAt,
          scopeName:
            s.mode === 'review'
              ? 'Yanlış turu'
              : s.mode === 'daily'
                ? 'Günün Quizi'
                : (s.topic?.name ??
                  s.course?.name ??
                  (s.topicIds.length > 0 ? `${s.topicIds.length} seçili mevzuat` : 'Koç turu')),
        }))
        .sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime())[0] ?? null;
    const enGuclu = enGucluKonular(
      topicProgress.map((t) => ({
        name: t.topic.name,
        solved: t.solvedCount,
        accuracy: t.solvedCount > 0 ? t.correctCount / t.solvedCount : 0,
      })),
      1,
    )[0];
    const daysLeftInWeek = haftadaKalanGun(bugun);

    // ── Sınava kalan TR takvim günü (exam_mode/taper — Doc 25 §3) ──
    // Kişisel tarih varsa o; yoksa hedef sınavın RESMÎ tarihi (Doc 48 A2 —
    // tarih girmeyen aday da geri sayımı ve sınav modunu görür).
    const hedef = hedefSinavTarihi(
      profile?.targetExamDate ?? null,
      profile?.preferredModule?.examDate ?? null,
      now,
    );
    const examDate = hedef.date;
    const daysToExam = examDate ? trDayDiff(now, examDate) : null;
    const exam: ExamInfo = {
      name: profile?.preferredModule?.name ?? null,
      date: examDate ? examDate.toISOString().slice(0, 10) : null,
      daysLeft: daysToExam != null && daysToExam >= 0 ? daysToExam : null,
      source: hedef.source,
    };

    // ── Tempo: son 7 gün vs önceki 7 gün soru hacmi (slump_watch) ──
    const sevenDaysAgo = bugun.getTime() - 7 * 86_400_000;
    let last7 = 0;
    let prev7 = 0;
    for (const u of recentUsage) {
      if (u.usageDate.getTime() >= sevenDaysAgo) last7 += u.totalAnswered;
      else prev7 += u.totalAnswered;
    }

    return {
      now,
      // Türkiye saati sabit UTC+3 (2016'dan beri DST yok).
      trHour: (now.getUTCHours() + 3) % 24,
      user: {
        id: user.id,
        displayName: profile?.displayName ?? null,
        dailyGoal: profile?.dailyGoal ?? 20,
        isPremium: user.isPremium,
        onboardingCompleted: profile?.onboardingCompletedAt != null,
        preferredModuleName: profile?.preferredModule?.name ?? null,
      },
      streak: {
        current: currentStreak,
        longest: streak?.longestStreak ?? 0,
        activeYesterday: daysSince === 1,
        freezesLeft: freezesLeft(streak, bugun, freezeAllowance),
      },
      // Bugün halkası: günün TÜM yeni cevapları (deneme dahil — Doc 48 A9).
      answeredToday: todayUsage?.totalAnswered ?? 0,
      stats: {
        totalSolved,
        totalCorrect: stats?.totalCorrect ?? 0,
        totalSessions: stats?.totalSessions ?? 0,
      },
      unresolvedWrongCount,
      // Koç kartı da hazırlık bloğuyla AYNI zayıf konuyu söyler (tek eşik, hedef
      // sınav kapsamı — Doc 48 A3).
      weakestTopic: readiness.weakest[0]
        ? {
            topicId: readiness.weakest[0].topicId,
            name: readiness.weakest[0].name,
            mastery: readiness.weakest[0].accuracy,
          }
        : null,
      weakestUnit,
      exams: {
        live: liveExam
          ? {
              id: liveExam.id,
              title: liveExam.title,
              endAt: endOf(liveExam),
              attempted: sessionOf.get(liveExam.id) === 'completed',
              inProgress: sessionOf.get(liveExam.id) === 'in_progress',
            }
          : null,
        todayUpcoming: todayUpcoming
          ? {
              id: todayUpcoming.id,
              title: todayUpcoming.title,
              startAt: todayUpcoming.startAt,
              questionCount: todayUpcoming._count.questions,
              durationMinutes: todayUpcoming.durationMinutes,
            }
          : null,
        nextUpcoming: nextUpcoming
          ? {
              id: nextUpcoming.id,
              title: nextUpcoming.title,
              startAt: nextUpcoming.startAt,
              questionCount: nextUpcoming._count.questions,
            }
          : null,
        newPublished: newPublished ? { id: newPublished.id, title: newPublished.title } : null,
        completedCount: denemeAgg._count._all,
        bestNet: denemeAgg._max.score != null ? Number(denemeAgg._max.score) : null,
      },
      cikmisSinavlar: {
        kartAcik: cikmisKartAcik,
        cozulebilirSayisi: cikmisSinavlar.length,
        toplamSoru: cikmisSinavlar.reduce((t, s) => t + (s.questionCount ?? s._count.questions), 0),
        cozulmemisEnYeni: (() => {
          const cozulen = new Set(cikmisCozumlerim.map((o) => o.archiveExamId));
          // Liste zaten yeniden eskiye sıralı; ilk çözülmemiş en yenisidir.
          const y = cikmisSinavlar.find((e) => !cozulen.has(e.examId));
          return y ? { slug: y.slug, ad: y.name, donem: y.term } : null;
        })(),
      },
      dailyQuizPlayed: dailySession?.status === 'completed',
      nextBadge,
      weekly: { activeDays: weeklyUsage.length, goalDays: WEEKLY_GOAL_DAYS },
      activeDaysTotal,
      maxDailyQuestions: maxDaily._max.totalAnswered ?? 0,
      courseTrend,
      weeklyPhoto,
      daysSinceLastActivity: daysSince,
      daysToExam: daysToExam != null && daysToExam >= 0 ? daysToExam : null,
      // Sınav geçtiyse (negatif fark) mutlak gün — aftermath penceresi (Doc 24 §3).
      daysSinceExam: daysToExam != null && daysToExam < 0 ? -daysToExam : null,
      recentDeneme: recentDeneme
        ? {
            examId: recentDeneme.examId,
            title: recentDeneme.exam?.title ?? 'Deneme',
            wrongCount: recentDeneme.wrongCount,
          }
        : null,
      volume: { last7, prev7 },
      plan: planOzeti,
      home: {
        exam,
        readiness,
        focus,
        activeSession,
        strongestTopic: enGuclu ? { name: enGuclu.name, accuracy: enGuclu.accuracy } : null,
        daysLeftInWeek,
        // 7 günlük nöbet çizelgesi (Doc 49/13 F9-B): kurallara girmez, Bugün çizer.
        weekDays: haftaGunleri(
          weeklyUsage.map((r) => r.usageDate),
          bugun,
          weekStart,
        ),
        todayTopicAnswered: Object.fromEntries(
          bugunKonuCevaplari.map((r) => [r.topic_id, Number(r.n)]),
        ),
        reviewDoneToday: bugunYanlisTuru != null,
      },
    };
  }
}

/** Yeni anasayfanın (Doc 48) bağlamdan gelen ham ekleri. */
interface HomeRaw {
  exam: ExamInfo;
  readiness: Readiness;
  focus: DailyFocusView;
  activeSession: YarimTur | null;
  strongestTopic: { name: string; accuracy: number } | null;
  daysLeftInWeek: number;
  weekDays: HaftaGunDurumu[];
  /** Bugün konu başına cevaplanan soru (rota "N soru" adımının tamamlanması). */
  todayTopicAnswered: Record<string, number>;
  /** Bugün tamamlanmış yanlış turu var mı (rota "Yanlış tekrarı" adımı). */
  reviewDoneToday: boolean;
}

/** Varsayılan odak: koç seçer (Doc 25 §5). */
const KOC_ODAGI: DailyFocusView = { kind: 'coach', courseId: null, topicId: null, label: null };

/**
 * Kayıtlı odağı bugüne göre çözer — SAF (test için export). Odak geçicidir:
 * başka günün kaydı ya da artık var olmayan kapsam koça döner.
 */
export function odagiCoz(
  row: {
    day: Date;
    kind: DailyFocusView['kind'];
    courseId: string | null;
    topicId: string | null;
    course: { name: string; deletedAt: Date | null } | null;
    topic: { name: string; deletedAt: Date | null } | null;
  } | null,
  bugun: Date,
): DailyFocusView {
  if (!row || startOfUtcDay(row.day).getTime() !== bugun.getTime()) return KOC_ODAGI;
  if (row.kind === 'topic') {
    if (!row.topic || row.topic.deletedAt) return KOC_ODAGI;
    return { kind: 'topic', courseId: row.courseId, topicId: row.topicId, label: row.topic.name };
  }
  if (row.kind === 'course') {
    if (!row.course || row.course.deletedAt) return KOC_ODAGI;
    return { kind: 'course', courseId: row.courseId, topicId: null, label: row.course.name };
  }
  if (row.kind === 'wrongs') return { kind: 'wrongs', courseId: null, topicId: null, label: null };
  return KOC_ODAGI;
}

/**
 * Durum makinesi etiketi (Doc 25 §3). Öncelik: comeback > taper > exam_day >
 * aftermath > onboarding > post_exam > streak_risk > exam_mode > slump_watch >
 * normal. Kart bilgisinden türetilir — istemci kural bilmez, sahneyi bu etikete
 * göre kurar. Not: aftermath/taper/exam_mode aynı anda tetiklenemez — sınav
 * geçince daysToExam null olur. (Test için export.)
 */
export function deriveMode(ctx: CoachContext, cards: CoachCard[]): CoachMode {
  const has = (t: CoachCard['type']) => cards.some((c) => c.type === t);
  if (has('comeback')) return 'comeback';
  if (has('taper')) return 'taper';
  if (has('exam_live') || has('exam_in_progress') || has('exam_today')) return 'exam_day';
  if (has('aftermath')) return 'aftermath';
  if (has('onboarding')) return 'onboarding';
  if (has('post_exam')) return 'post_exam';
  if (has('streak_risk')) return 'streak_risk';
  if (has('exam_mode')) return 'exam_mode';
  if (has('slump_watch')) return 'slump_watch';
  return 'normal';
}

// ── Tarih yardımcıları (UTC gün konvansiyonu — dashboard ile aynı) ──

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

/** Türkiye günü anahtarı (UTC+3 sabit) — "bugün başlayacak" karşılaştırması. */
function trDayKey(d: Date): string {
  return new Date(d.getTime() + 3 * 3_600_000).toISOString().slice(0, 10);
}

/** İki an arasındaki TR takvim günü farkı (target - now, tam gün). */
function trDayDiff(now: Date, target: Date): number {
  const day = (d: Date) => Math.floor((d.getTime() + 3 * 3_600_000) / 86_400_000);
  return day(target) - day(now);
}

/**
 * Yeni anasayfa açık mı (Doc 48): panel anahtarı açıksa herkes, kapalıyken
 * yalnız admin ve beta rolü (önce dar grup, sonra herkes — 14 Eki 2026 kararı).
 * Beta rolü panel erişimi vermez; ön erişim için ayrı tutulur.
 */
export function homeV2Acik(herkeseAcik: boolean, roles: readonly string[]): boolean {
  return herkeseAcik || roles.includes('admin') || roles.includes('beta');
}

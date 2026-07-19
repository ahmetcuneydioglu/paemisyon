import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { SETTING_KEYS, SettingsService } from '../../infra/settings/settings.service';
import { BadgeService } from '../coach/badge.service';
import { ProgressService } from '../progress/progress.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { mixQuota, pickMix, pickTopicBalanced } from './session-mix.logic';
import { dailyQuestionPoolWhere, pickDailyIds } from '../../common/daily-select.logic';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { articleSlug, slugify } from '../public/public.service';

/** Kanun konusu tespiti (public.service ile aynı desen). */
const LAW_NAME_RE = /sayılı|kanun|yönetmeli|khk|mevzuat/i;

/**
 * Quiz motoru (Doc 10 §2.5). Çekirdek ilke: değerlendirme ve skorlama SUNUCUDA;
 * exam modunda doğru cevap istemciye hiç gönderilmez (Doc 7 §3).
 */
@Injectable()
export class QuizService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progress: ProgressService,
    private readonly badges: BadgeService,
    private readonly settings: SettingsService,
  ) {}

  /** Oturum başlat: konudan rastgele yayında sorular → exam-güvenli (cevapsız) döner. */
  /** Sınav süresi: soru başına 75 sn (polis sınavı temposu). */
  private static readonly EXAM_SECONDS_PER_QUESTION = 75;
  /** Süre aşımı toleransı (ağ gecikmesi için). */
  private static readonly EXAM_GRACE_SECONDS = 30;

  async startSession(user: AuthenticatedUser, dto: StartSessionDto) {
    const userId = user.id;
    const count = dto.questionCount ?? 10;

    // Günün sorusu: kapsamsız özel akış (deterministik, günde 1 hak).
    if (dto.mode === 'daily') {
      if (dto.topicId != null || dto.courseId != null) {
        throw new BadRequestException('Günün sorusu kapsam almaz (topicId/courseId verilmez).');
      }
      return this.startDailySession(userId);
    }

    // Kapsam kuralları (Doc 25 §5 — Odak modeli):
    // exam: konu VEYA ders zorunlu (süre havuza göre kurulur).
    // practice: konu / ders / KAPSAMSIZ (karışık — İlk Devriye ve koç seansı).
    if (dto.topicId != null && dto.courseId != null) {
      throw new BadRequestException('topicId ve courseId birlikte verilemez.');
    }
    if (dto.mode === 'exam' && dto.topicId == null && dto.courseId == null) {
      throw new BadRequestException('Deneme için topicId veya courseId verilmeli.');
    }
    if (dto.mode === 'review' && (dto.topicId != null || dto.courseId != null)) {
      throw new BadRequestException('Yanlış tekrarı kapsam almaz (topicId/courseId verilmez).');
    }
    if (
      dto.fromBookmarks &&
      (dto.mode !== 'practice' || dto.topicId != null || dto.courseId != null)
    ) {
      throw new BadRequestException('Favori reçetesi yalnız kapsamsız practice modunda çalışır.');
    }

    // Premium kapısı SUNUCUDA (Doc 8). Guard isPremium'u zaten hesapladı — ekstra sorgu yok.
    const isPremiumUser = user.isPremium;

    let poolWhere;
    if (dto.topicId != null) {
      const topic = await this.prisma.topic.findFirst({
        where: { id: dto.topicId, deletedAt: null },
        select: { isPremium: true },
      });
      if (!topic) throw new NotFoundException('Konu bulunamadı.');
      if (topic.isPremium && !isPremiumUser) {
        throw new ForbiddenException({
          code: 'PREMIUM_REQUIRED',
          message: 'Bu konu premium içeriktir.',
        });
      }
      poolWhere = {
        topicId: dto.topicId,
        deletedAt: null,
        currentVersionId: { not: null },
        // Madde Atlası: maddeden seans — havuz tek maddeye daralır.
        ...(dto.articleNo ? { articleNo: dto.articleNo } : {}),
      };
    } else if (dto.courseId != null) {
      // Ders geneli: dersin konularından karışık havuz; free kullanıcıya
      // premium konuların soruları dahil edilmez (sızdırma yok).
      poolWhere = {
        deletedAt: null,
        currentVersionId: { not: null },
        topic: {
          courseId: dto.courseId,
          deletedAt: null,
          ...(isPremiumUser ? {} : { isPremium: false }),
        },
      };
    } else {
      // Kapsamsız karışık (İlk Devriye / koç seansı): tüm MÜFREDAT havuzu —
      // yalnız bir sınav bölümüne bağlı derslerin konuları (Doc 21).
      poolWhere = {
        deletedAt: null,
        currentVersionId: { not: null },
        topic: {
          deletedAt: null,
          ...(isPremiumUser ? {} : { isPremium: false }),
          course: {
            deletedAt: null,
            sections: { some: { section: { deletedAt: null } } },
          },
        },
      };
    }

    let chosen: { id: string; currentVersionId: string | null; topicId: string }[];
    if (dto.mode === 'review') {
      // Yanlış tekrarı reçetesi (Doc 24 §11): free = son 7 günün yanlışları,
      // premium = süresiz tekrar hafızası. En eski yanlış önce (unutma eğrisi).
      const since = isPremiumUser ? undefined : new Date(Date.now() - 7 * 86_400_000);
      const wrongs = await this.prisma.wrongAnswer.findMany({
        where: { userId, resolvedAt: null, ...(since ? { lastWrongAt: { gte: since } } : {}) },
        orderBy: { lastWrongAt: 'asc' },
        select: { questionId: true },
      });
      const questions = await this.prisma.question.findMany({
        where: {
          id: { in: wrongs.map((w) => w.questionId) },
          deletedAt: null,
          currentVersionId: { not: null },
          ...(isPremiumUser ? {} : { topic: { isPremium: false } }),
        },
        select: { id: true, currentVersionId: true, topicId: true },
      });
      const orderOf = new Map(wrongs.map((w, i) => [w.questionId, i]));
      const pool = [...questions].sort(
        (a, b) => (orderOf.get(a.id) ?? 0) - (orderOf.get(b.id) ?? 0),
      );
      if (pool.length === 0) {
        throw new NotFoundException('Tekrar edilecek yanlışın yok — kuyruk temiz. 🎉');
      }
      chosen = pool.slice(0, count);
    } else if (dto.fromBookmarks) {
      // Favori reçetesi (Doc 25 §2): havuz = kullanıcının yer imleri, en yeni önce.
      const marks = await this.prisma.bookmark.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { questionId: true },
      });
      const questions = await this.prisma.question.findMany({
        where: {
          id: { in: marks.map((m) => m.questionId) },
          deletedAt: null,
          currentVersionId: { not: null },
          ...(isPremiumUser ? {} : { topic: { isPremium: false } }),
        },
        select: { id: true, currentVersionId: true, topicId: true },
      });
      const orderOf = new Map(marks.map((m, i) => [m.questionId, i]));
      const pool = [...questions].sort(
        (a, b) => (orderOf.get(a.id) ?? 0) - (orderOf.get(b.id) ?? 0),
      );
      if (pool.length === 0) {
        throw new NotFoundException('Favorine eklediğin çözülebilir soru yok.');
      }
      chosen = pool.slice(0, count);
    } else {
      const pool = await this.prisma.question.findMany({
        where: poolWhere,
        select: { id: true, currentVersionId: true, topicId: true },
      });
      if (pool.length === 0) {
        throw new NotFoundException(
          dto.topicId != null
            ? 'Bu konuda yayında soru yok.'
            : dto.courseId != null
              ? 'Bu derste yayında soru yok.'
              : 'Yayında soru yok.',
        );
      }

      // Kapsamsız practice = KOÇ SEANSI (Doc 25 §5): karışım motoru reçete kurar.
      // Ders kapsamı = konular arasında dengeli tur; tek konu havuzu baskılamaz.
      // Tek konu ve deneme oturumları rastgele seçime devam eder.
      chosen =
        dto.mode === 'practice' && dto.topicId == null && dto.courseId == null
          ? await this.pickCoachMix(userId, pool, count)
          : dto.mode === 'practice' && dto.courseId != null
            ? pickTopicBalanced(pool, count, (items) => this.shuffle(items))
            : this.shuffle(pool).slice(0, count);
    }
    const versions = await this.prisma.questionVersion.findMany({
      where: { id: { in: chosen.map((q) => q.currentVersionId!) } },
      select: {
        id: true,
        questionId: true,
        stem: true,
        mediaUrl: true,
        options: {
          select: { id: true, label: true, text: true }, // is_correct/explanation YOK
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    const byId = new Map(versions.map((v) => [v.id, v]));

    // Deneme sınavında planlı süre — sunucu aşımı reddeder (submitAnswer).
    const plannedDurationSeconds =
      dto.mode === 'exam' ? chosen.length * QuizService.EXAM_SECONDS_PER_QUESTION : null;

    const session = await this.prisma.quizSession.create({
      data: {
        userId,
        mode: dto.mode,
        topicId: dto.topicId ?? null,
        courseId: dto.courseId ?? null,
        totalQuestions: chosen.length,
        plannedDurationSeconds,
        // Devam için soru sırası (Doc 27 §2.4): sürüm id dizisi.
        questionOrder: chosen.map((q) => q.currentVersionId!),
      },
    });

    const questions = chosen.map((q) => {
      const v = byId.get(q.currentVersionId!)!;
      return {
        questionId: v.questionId,
        versionId: v.id,
        stem: v.stem,
        mediaUrl: v.mediaUrl,
        options: v.options,
      };
    });

    return {
      sessionId: session.id,
      mode: session.mode,
      plannedDurationSeconds,
      questions,
    };
  }

  // ── Günün Quizi (Doc 13 V1 — eski daily_quiz'in modern hali) ──
  // 10 karışık soru, PAEM MÜFREDATININ tamamından (Doc 21: bölümlere bağlı
  // dersler); günde 1 hak; herkese aynı set (tarih tohumlu → adil liderlik).
  // Seçim mantığı common/daily-select.logic'te — public "Günün Quizi" ile ortak.
  private async startDailySession(userId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const existing = await this.prisma.quizSession.findFirst({
      where: { userId, mode: 'daily', startedAt: { gte: today } },
      orderBy: { startedAt: 'desc' },
    });
    if (existing?.status === 'completed') {
      throw new ConflictException({
        code: 'DAILY_ALREADY_PLAYED',
        message: 'Günün quizini bugün zaten çözdün. Yarın yenisi seni bekliyor! 🌅',
      });
    }

    const questions = await this.pickDailyQuestions();
    // Yarım kalan oturum → aynı oturum + aynı (deterministik) sorularla devam.
    const session =
      existing ??
      (await this.prisma.quizSession.create({
        data: {
          userId,
          mode: 'daily',
          totalQuestions: questions.length,
          questionOrder: questions.map((q) => q.versionId),
        },
      }));
    return {
      sessionId: session.id,
      mode: 'daily' as const,
      plannedDurationSeconds: null,
      questions,
    };
  }

  private async pickDailyQuestions() {
    // Havuz: PAEM müfredatına (bölümler→dersler) bağlı, yayında, premium
    // OLMAYAN sorular (Doc 21 — ders adı hardcode'u kaldırıldı).
    const pool = await this.prisma.question.findMany({
      where: dailyQuestionPoolWhere(),
      select: { id: true, currentVersionId: true },
      orderBy: { id: 'asc' }, // deterministik taban sıra
    });
    if (pool.length === 0) {
      throw new NotFoundException(
        'Günün quizi için PAEM müfredatında yayında soru yok. Panelden onaylaman gerekebilir.',
      );
    }

    // Tarih tohumlu örneklem — herkes o gün aynı 10 soruyu görür (adil liderlik).
    const dateKey = new Date().toISOString().slice(0, 10);
    const chosen = pickDailyIds(pool, dateKey);

    const versions = await this.prisma.questionVersion.findMany({
      where: { id: { in: chosen.map((q) => q.currentVersionId!) } },
      select: {
        id: true,
        questionId: true,
        stem: true,
        mediaUrl: true,
        options: {
          select: { id: true, label: true, text: true }, // is_correct/explanation YOK
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    const byId = new Map(versions.map((v) => [v.id, v]));
    // chosen sırasını koru (deterministik).
    return chosen.map((q) => {
      const v = byId.get(q.currentVersionId!)!;
      return {
        questionId: v.questionId,
        versionId: v.id,
        stem: v.stem,
        mediaUrl: v.mediaUrl,
        options: v.options,
      };
    });
  }

  /** Günün sorusu durumu (Home kartı): bugün oynandı mı, doğru muydu? */
  async getDailyStatus(userId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const session = await this.prisma.quizSession.findFirst({
      where: { userId, mode: 'daily', startedAt: { gte: today } },
      orderBy: { startedAt: 'desc' },
      select: { status: true, correctCount: true },
    });
    return {
      playedToday: session?.status === 'completed',
      correct: session?.status === 'completed' ? session.correctCount > 0 : null,
    };
  }

  /** Tek cevap gönder (idempotent). Sunucu değerlendirir; freemium limiti sunucuda. */
  async submitAnswer(user: AuthenticatedUser, sessionId: string, dto: SubmitAnswerDto) {
    const userId = user.id;
    // Cevap doğrulama + açıklama verisini ilk paralel okuma grubunda hazırla.
    // Eskiden kayıt tamamlandıktan sonra version/question/settings için ikinci
    // bir okuma turu daha yapılıyordu; şık geri bildiriminin kritik yolundaydı.
    const [session, existing, version, showSource] = await Promise.all([
      this.prisma.quizSession.findFirst({
        where: { id: sessionId, userId },
        select: {
          status: true,
          mode: true,
          startedAt: true,
          plannedDurationSeconds: true,
          exam: { select: { liveAnswerReveal: true } },
        },
      }),
      this.prisma.quizAnswer.findUnique({
        where: { sessionId_questionId: { sessionId, questionId: dto.questionId } },
      }),
      this.prisma.questionVersion.findFirst({
        where: { id: dto.questionVersionId, questionId: dto.questionId },
        select: {
          explanation: true,
          sourceLabel: true,
          legalReferences: { select: { citation: true }, take: 1 },
          question: {
            select: { articleNo: true, topic: { select: { name: true } } },
          },
          options: {
            where: {
              OR: [
                { isCorrect: true },
                ...(dto.selectedOptionId ? [{ id: dto.selectedOptionId }] : []),
              ],
            },
            select: { id: true, isCorrect: true },
          },
        },
      }),
      this.settings.getBool(SETTING_KEYS.showQuestionSource, true),
    ]);
    if (!session) throw new NotFoundException('Oturum bulunamadı.');
    if (session.status !== 'in_progress') {
      throw new BadRequestException('Oturum tamamlanmış.');
    }
    if (!version) {
      throw new BadRequestException('Soru bu oturumdaki sürümle eşleşmiyor.');
    }
    if (
      dto.selectedOptionId != null &&
      !version.options.some((option) => option.id === dto.selectedOptionId)
    ) {
      throw new BadRequestException('Seçilen şık bu soruya ait değil.');
    }
    // Deneme sınavında süre SUNUCUDA denetlenir — istemci saati manipüle edilemez.
    if (session.plannedDurationSeconds != null) {
      const deadline =
        session.startedAt.getTime() +
        (session.plannedDurationSeconds + QuizService.EXAM_GRACE_SECONDS) * 1000;
      if (Date.now() > deadline) {
        throw new ForbiddenException({
          code: 'EXAM_TIME_OVER',
          message: 'Sınav süresi doldu. Kalan sorular boş sayılır.',
        });
      }
    }

    // Yeni soru → freemium günlük limit (re-answer sayılmaz).
    if (!existing) {
      await this.enforceDailyLimit(user);
    }
    const correct = version.options.find((option) => option.isCorrect);
    const isCorrect = dto.selectedOptionId != null && dto.selectedOptionId === correct?.id;

    await this.prisma.quizAnswer.upsert({
      where: { sessionId_questionId: { sessionId, questionId: dto.questionId } },
      update: {
        questionVersionId: dto.questionVersionId,
        selectedOptionId: dto.selectedOptionId ?? null,
        isCorrect,
        timeSpentMs: dto.timeSpentMs ?? null,
      },
      create: {
        sessionId,
        questionId: dto.questionId,
        questionVersionId: dto.questionVersionId,
        selectedOptionId: dto.selectedOptionId ?? null,
        isCorrect,
        timeSpentMs: dto.timeSpentMs ?? null,
      },
    });

    // exam modunda doğru cevap SIZDIRILMAZ.
    if (session.mode === 'exam') {
      return { recorded: true };
    }
    // deneme: pencere açıkken anahtar SIZDIRILMAZ — yalnız liveAnswerReveal
    // açık denemelerde practice-gibi anlık geri bildirim (Doc 18 karar 5,
    // varsayılan KAPALI; eski sistemin anahtar-sızdırma açığı taşınmaz).
    if (session.mode === 'deneme') {
      if (!session.exam?.liveAnswerReveal) {
        return { recorded: true };
      }
    }

    // practice: ilk okuma grubunda hazırlanan anlık geri bildirim + açıklama.
    const question = version.question;
    let relatedArticle: { lawSlug: string; no: string; slug: string } | null = null;
    if (question?.articleNo && question.topic && LAW_NAME_RE.test(question.topic.name)) {
      relatedArticle = {
        lawSlug: slugify(question.topic.name),
        no: question.articleNo,
        slug: articleSlug(question.articleNo),
      };
    }

    return {
      isCorrect,
      correctOptionId: correct?.id ?? null,
      explanation: version?.explanation ?? null,
      legalReference: version?.legalReferences[0]?.citation ?? null,
      relatedArticle,
      source: showSource ? (version?.sourceLabel ?? null) : null,
    };
  }

  /** Oturumu bitir: skor + doğru/yanlış/boş (sunucuda hesaplanır). */
  async completeSession(userId: string, sessionId: string) {
    const session = await this.prisma.quizSession.findFirst({
      where: { id: sessionId, userId },
      include: { answers: true },
    });
    if (!session) throw new NotFoundException('Oturum bulunamadı.');

    // İDEMPOTENT: bitmiş oturuma ikinci çağrı istatistikleri ÇİFT SAYMAZ —
    // saklanan sonuç aynen döner (deneme finalize yarışları için kritik, Doc 18).
    if (session.status === 'completed') {
      return {
        sessionId,
        mode: session.mode,
        totalQuestions: session.totalQuestions,
        correctCount: session.correctCount,
        wrongCount: session.wrongCount,
        blankCount: session.blankCount,
        score: session.score != null ? Number(session.score) : 0,
        durationSeconds: session.durationSeconds ?? 0,
        plannedDurationSeconds: session.plannedDurationSeconds,
        topicBreakdown: null,
        earnedBadges: [],
      };
    }

    const correctCount = session.answers.filter((a) => a.isCorrect === true).length;
    const wrongCount = session.answers.filter(
      (a) => a.isCorrect === false && a.selectedOptionId != null,
    ).length;
    const blankCount = session.totalQuestions - correctCount - wrongCount;
    // Puan: deneme = NET (doğru − yanlış/4, polis sınavı kuralı — Doc 18 karar 3);
    // diğer modlar = yüzde (mevcut davranış).
    const score =
      session.mode === 'deneme'
        ? correctCount - wrongCount / 4
        : session.totalQuestions > 0
          ? (correctCount / session.totalQuestions) * 100
          : 0;
    const durationSeconds = Math.max(
      0,
      Math.round((Date.now() - session.startedAt.getTime()) / 1000),
    );

    await this.prisma.quizSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        correctCount,
        wrongCount,
        blankCount,
        score,
        durationSeconds,
      },
    });

    // İlerleme/istatistik/streak/yanlışlar güncelle (Doc 6/7).
    await this.progress.recordSessionCompletion(userId, {
      topicId: session.topicId,
      correctCount,
      wrongCount,
      answers: session.answers.map((a) => ({
        questionId: a.questionId,
        isCorrect: a.isCorrect,
        selectedOptionId: a.selectedOptionId,
      })),
    });

    // Rozet kontrolü (Doc 19): stats/streak TAZEyken. Hata oturumu bozmasın —
    // rozet bir sonraki tamamlamada telafi edilir (checkAndAward idempotent).
    let earnedBadges: Awaited<ReturnType<BadgeService['checkAndAward']>> = [];
    try {
      earnedBadges = await this.badges.checkAndAward(userId);
    } catch {
      /* sessiz: kutlama kaçar ama sonuç kaybolmaz */
    }

    // Konu karnesi: çok-konulu oturumlarda (ders denemesi, karışık koç seansı,
    // İlk Devriye) konu bazında doğru/toplam kırılımı (Doc 12 §7, Doc 24 Gün 0).
    let topicBreakdown:
      { topicId: string; topicName: string; correct: number; total: number }[] | null = null;
    if (session.topicId == null && session.answers.length > 0) {
      const qids = session.answers.map((a) => a.questionId);
      const qTopics = await this.prisma.question.findMany({
        where: { id: { in: qids } },
        select: { id: true, topic: { select: { id: true, name: true } } },
      });
      const topicOf = new Map(qTopics.map((q) => [q.id, q.topic]));
      const acc = new Map<
        string,
        { topicId: string; topicName: string; correct: number; total: number }
      >();
      for (const a of session.answers) {
        const t = topicOf.get(a.questionId);
        if (!t) continue;
        const cur = acc.get(t.id) ?? { topicId: t.id, topicName: t.name, correct: 0, total: 0 };
        cur.total++;
        if (a.isCorrect === true) cur.correct++;
        acc.set(t.id, cur);
      }
      topicBreakdown = [...acc.values()].sort((a, b) => b.total - a.total);
    }

    return {
      sessionId,
      mode: session.mode,
      totalQuestions: session.totalQuestions,
      correctCount,
      wrongCount,
      blankCount,
      score: Math.round(score * 100) / 100,
      durationSeconds,
      plannedDurationSeconds: session.plannedDurationSeconds,
      topicBreakdown,
      // Yeni kazanılan rozetler — istemci kutlama gösterir (Doc 19).
      earnedBadges,
    };
  }

  /**
   * Devam eden seans çapası (Doc 27 §2.4, Doc 25 §7 emniyet 3): kullanıcının
   * en son yarım kalan çalışma oturumu. Deneme (randevulu) hariç — onun kendi
   * devam akışı var (exams/start).
   */
  async getActiveSession(userId: string) {
    const session = await this.prisma.quizSession.findFirst({
      where: { userId, status: 'in_progress', mode: { in: ['practice', 'review', 'daily'] } },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        mode: true,
        totalQuestions: true,
        startedAt: true,
        questionOrder: true,
        topic: { select: { name: true } },
        course: { select: { name: true } },
        _count: { select: { answers: true } },
      },
    });
    if (!session) return null;
    return {
      sessionId: session.id,
      mode: session.mode,
      totalQuestions: session.totalQuestions,
      answeredCount: session._count.answers,
      startedAt: session.startedAt,
      scopeName: session.topic?.name ?? session.course?.name ?? null,
      // Eski oturumlarda soru sırası yok → gerçek devam mümkün değil; istemci
      // 'bitir ve sonucu gör' yolunu sunar.
      resumable: Array.isArray(session.questionOrder) && session.questionOrder.length > 0,
    };
  }

  /** Yarım oturumu kaldığı yerden aç: aynı soru seti + verilen cevaplar. */
  async resumeSession(userId: string, sessionId: string) {
    const session = await this.prisma.quizSession.findFirst({
      where: { id: sessionId, userId },
      select: {
        id: true,
        mode: true,
        status: true,
        questionOrder: true,
        answers: { select: { questionId: true, selectedOptionId: true, isCorrect: true } },
      },
    });
    if (!session) throw new NotFoundException('Oturum bulunamadı.');
    if (session.status !== 'in_progress') {
      throw new BadRequestException('Oturum tamamlanmış — devam edilemez.');
    }
    const order = session.questionOrder;
    if (!Array.isArray(order) || order.length === 0) {
      throw new BadRequestException('Bu oturumun soru sırası kayıtlı değil (eski oturum).');
    }
    const versionIds = order as string[];
    const versions = await this.prisma.questionVersion.findMany({
      where: { id: { in: versionIds } },
      select: {
        id: true,
        questionId: true,
        stem: true,
        mediaUrl: true,
        options: {
          select: { id: true, label: true, text: true }, // anahtar SIZMAZ
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    const byId = new Map(versions.map((v) => [v.id, v]));
    return {
      sessionId: session.id,
      mode: session.mode,
      questions: versionIds
        .map((vid) => byId.get(vid))
        .filter((v): v is NonNullable<typeof v> => v != null)
        .map((v) => ({
          questionId: v.questionId,
          versionId: v.id,
          stem: v.stem,
          mediaUrl: v.mediaUrl,
          options: v.options,
        })),
      givenAnswers: session.answers,
    };
  }

  /** Oturum durumu (kaldığı yerden devam için). */
  async getSession(userId: string, sessionId: string) {
    const session = await this.prisma.quizSession.findFirst({
      where: { id: sessionId, userId },
      select: {
        id: true,
        mode: true,
        status: true,
        totalQuestions: true,
        answers: { select: { questionId: true, selectedOptionId: true } },
      },
    });
    if (!session) throw new NotFoundException('Oturum bulunamadı.');
    return session;
  }

  /** Ücretsiz plan limiti — 60 sn bellek önbelleği (admin değişikliği ≤60 sn'de yansır). */
  private planLimitCache: { limit: number; expiresAt: number } | null = null;

  private async freeDailyLimit(): Promise<number> {
    if (this.planLimitCache && this.planLimitCache.expiresAt > Date.now()) {
      return this.planLimitCache.limit;
    }
    const freePlan = await this.prisma.plan.findUnique({ where: { key: 'free' } });
    const limit = freePlan?.dailyQuestionLimit ?? 15;
    this.planLimitCache = { limit, expiresAt: Date.now() + 60_000 };
    return limit;
  }

  private async enforceDailyLimit(user: AuthenticatedUser) {
    if (user.isPremium) return; // guard hesapladı — sınırsız

    const limit = await this.freeDailyLimit(); // çoğunlukla bellek, 0 sorgu
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // TEK atomik sorgu: satır yoksa aç, limiti aşmadıysa artır; aşıldıysa satır dönmez.
    const rows = await this.prisma.$queryRaw<{ questions_answered: number }[]>`
      INSERT INTO daily_usage (user_id, usage_date, questions_answered, daily_limit)
      VALUES (${user.id}::uuid, ${today}::date, 1, ${limit})
      ON CONFLICT (user_id, usage_date) DO UPDATE
        SET questions_answered = daily_usage.questions_answered + 1
        WHERE daily_usage.questions_answered < ${limit}
      RETURNING questions_answered`;
    if (rows.length === 0) {
      throw new ForbiddenException({
        code: 'DAILY_LIMIT_REACHED',
        message: `Bugünkü ücretsiz soru hakkın (${limit}) doldu. Sınırsız için Premium'a geç.`,
      });
    }
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /**
   * Koç seansı karışımı (Doc 24 §9, Doc 25 §5 — saf mantık session-mix.logic).
   * Kullanıcı verisi 3 sorguyla toplanır; sınava ≤30 gün kala reçete tersine
   * döner (yeni konu durur, yanlış turu ağırlaşır).
   */
  private async pickCoachMix(
    userId: string,
    pool: { id: string; currentVersionId: string | null; topicId: string }[],
    count: number,
  ): Promise<{ id: string; currentVersionId: string | null; topicId: string }[]> {
    const [wrongs, progress, profile] = await Promise.all([
      this.prisma.wrongAnswer.findMany({
        where: { userId, resolvedAt: null },
        orderBy: { lastWrongAt: 'desc' },
        take: 100,
        select: { questionId: true },
      }),
      this.prisma.userTopicProgress.findMany({
        where: { userId },
        select: { topicId: true, solvedCount: true, mastery: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { targetExamDate: true },
      }),
    ]);

    const examMode =
      profile?.targetExamDate != null &&
      trDayDiffQuiz(new Date(), profile.targetExamDate) <= 30 &&
      trDayDiffQuiz(new Date(), profile.targetExamDate) >= 0;

    // Zayıf: yeterli veri (≥5 çözüm) + mastery < 0.6, en zayıf 5 konu.
    const weakTopicIds = new Set(
      progress
        .filter((p) => p.solvedCount >= 5 && Number(p.mastery) < 0.6)
        .sort((a, b) => Number(a.mastery) - Number(b.mastery))
        .slice(0, 5)
        .map((p) => p.topicId),
    );
    // Çok çalışılmış: ≥15 çözüm — "yeni" dilimi bunlardan kaçınır.
    const heavyTopicIds = new Set(
      progress.filter((p) => p.solvedCount >= 15).map((p) => p.topicId),
    );

    return pickMix(
      count,
      {
        pool,
        wrongIds: new Set(wrongs.map((w) => w.questionId)),
        weakTopicIds,
        heavyTopicIds,
      },
      mixQuota(count, examMode),
      (a) => this.shuffle(a),
    );
  }
}

/** TR takvim günü farkı (coach.service ile aynı konvansiyon). */
function trDayDiffQuiz(now: Date, target: Date): number {
  const day = (d: Date) => Math.floor((d.getTime() + 3 * 3_600_000) / 86_400_000);
  return day(target) - day(now);
}

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { QuizService } from '../quiz/quiz.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import {
  RANKING_MIN_SAMPLE,
  mean,
  median,
  percentileBand,
  rankWithTies,
  rankingName,
} from './exam-scoring.logic';
import {
  type AttemptRole,
  type ExamWindow,
  type MyAttemptSummary,
  availabilityOf,
  canStartOfficial,
  canStartPractice,
  deadlineFor,
  examEndAt,
  isPastDeadline,
  legacyStateOf,
  listOrder,
  myStateOf,
  resultLocked,
} from './exam-state.logic';

export type ExamState = 'upcoming' | 'active' | 'ended';

type ExamRow = Prisma.ExamGetPayload<{ include: { _count: { select: { questions: true } } } }>;

/** Cevapsız soru yükü (oynatıcı) — yayın anında pakete de bu yazılır. */
export interface PackQuestion {
  order: number;
  questionId: string;
  versionId: string;
  stem: string;
  mediaUrl: string | null;
  options: { id: string; label: string; text: string }[];
  /** Ders adı (oynatıcı rozeti); paket JSON'unda yoksa null. */
  course?: string | null;
}

/**
 * Denemeler V2 (Doc 50). Eski randevulu modelin (Doc 18) üstüne:
 *  - yayın modu: serbest (tarih bağımsız) / takvimli (pencere; kapanınca sıralama donar)
 *  - çözüm rolü: resmî (sıralamaya giren tek çözüm) / tekrar (pratik, tekrarlanabilir)
 *  - mutlak son tarih + 10 sn ağ payı; süre dolumu TESLİMDİR
 *  - sonuç tek fonksiyondan (quiz.completeSession → scoreAttempt), soru iptali dahil
 * TÜM kurallar sunucuda — istemciler yalnız tüketir.
 */
@Injectable()
export class ExamsService {
  private readonly logger = new Logger(ExamsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly quiz: QuizService,
    private readonly notifications: NotificationsService,
  ) {}

  private window(e: {
    publishMode: 'serbest' | 'takvimli';
    startAt: Date;
    endAt: Date | null;
    durationMinutes: number;
    practiceAfterEnd: boolean;
  }): ExamWindow {
    return {
      publishMode: e.publishMode,
      startAt: e.startAt,
      endAt: e.endAt,
      durationMinutes: e.durationMinutes,
      practiceAfterEnd: e.practiceAfterEnd,
    };
  }

  /** Eski istemciler için: takvimli pencere kapanışı / serbestte arşiv tarihi ya da başlangıç+süre. */
  private legacyEndAt(e: ExamWindow): Date {
    return examEndAt(e) ?? new Date(e.startAt.getTime() + e.durationMinutes * 60_000);
  }

  // ── Liste (public; kullanıcı varsa kendi katılımıyla zenginleşir) ──
  /**
   * Yayındaki denemeler. Çıkmış sınavların (Doc 36) motor kayıtları listede
   * GÖRÜNMEZ (`cikmisSinavlarDahil` yalnız `detail` için).
   *
   * Görünürlük: serbest deneme yayın anından (`startAt`) önce görünmez; arşiv
   * tarihi geçmiş serbest deneme yalnız çözümü olan adaya görünür. Takvimli
   * deneme her zaman listelenir (yaklaşan hero'su buradan beslenir).
   */
  async list(user?: AuthenticatedUser, cikmisSinavlarDahil = false) {
    const now = new Date();
    const exams = await this.prisma.exam.findMany({
      where: {
        status: 'published',
        deletedAt: null,
        ...(cikmisSinavlarDahil ? {} : { pastExam: null }),
      },
      orderBy: [{ startAt: 'desc' }],
      take: 60,
      include: { _count: { select: { questions: true } } },
    });
    const ids = exams.map((e) => e.id);

    // Katılım = RESMÎ tamamlanmış çözüm; ortalama net de onlardan.
    const stats = await this.prisma.quizSession.groupBy({
      by: ['examId'],
      where: { examId: { in: ids }, status: 'completed', attemptRole: 'official' },
      _count: { _all: true },
      _avg: { score: true },
    });
    const statOf = new Map(stats.map((s) => [s.examId, s]));

    const mine = user
      ? await this.prisma.quizSession.findMany({
          where: { userId: user.id, examId: { in: ids }, status: { not: 'abandoned' } },
          orderBy: [{ startedAt: 'desc' }],
          select: {
            id: true,
            examId: true,
            status: true,
            attemptRole: true,
            score: true,
            correctCount: true,
            wrongCount: true,
            blankCount: true,
            completedAt: true,
            deadlineAt: true,
            _count: { select: { answers: true } },
          },
        })
      : [];
    const mineOf = new Map<string, typeof mine>();
    for (const m of mine) {
      if (!m.examId) continue;
      const arr = mineOf.get(m.examId) ?? [];
      arr.push(m);
      mineOf.set(m.examId, arr);
    }
    // Resmî sıram (donmuş tablo ya da canlı) — kartta "1.203 kişide 245.".
    const rankRows = user
      ? await this.prisma.examRanking.findMany({
          where: { userId: user.id, examId: { in: ids } },
          select: { examId: true, rank: true },
        })
      : [];
    const rankOf = new Map(rankRows.map((r) => [r.examId, r.rank]));

    const items = exams
      .map((e) => this.listItem(e, now, mineOf.get(e.id) ?? [], statOf.get(e.id), rankOf.get(e.id)))
      .filter((it) => {
        // Serbest: yayın anından önce görünmez; arşiv tarihi geçtiyse yalnız çözümü olana.
        if (it.publishMode === 'serbest') {
          if (it.availability === 'upcoming') return false;
          if (it.availability === 'closed' && it.myState === 'new') return false;
        }
        return true;
      });
    items.sort(
      (a, b) =>
        listOrder(a.availability, a.myState) - listOrder(b.availability, b.myState) ||
        +new Date(b.startAt) - +new Date(a.startAt),
    );
    return items;
  }

  private listItem(
    e: ExamRow,
    now: Date,
    mine: {
      id: string;
      status: 'in_progress' | 'completed' | 'abandoned';
      attemptRole: AttemptRole | null;
      score: Prisma.Decimal | null;
      correctCount: number;
      wrongCount: number;
      blankCount: number;
      completedAt: Date | null;
      deadlineAt: Date | null;
      _count: { answers: number };
    }[],
    stat?: { _count: { _all: number }; _avg: { score: Prisma.Decimal | null } },
    rank?: number,
  ) {
    const w = this.window(e);
    const official = mine.find((m) => m.attemptRole === 'official') ?? null;
    const practices = mine.filter((m) => m.attemptRole === 'practice');
    const activePractice = practices.find((p) => p.status === 'in_progress') ?? null;
    const active = official?.status === 'in_progress' ? official : activePractice;
    const my: MyAttemptSummary = {
      officialStatus:
        official?.status === 'completed' || official?.status === 'in_progress'
          ? official.status
          : null,
      practiceInProgress: activePractice != null,
    };
    const availability = availabilityOf(w, now);
    const myState = myStateOf(my);
    const participantCount = stat?._count._all ?? 0;
    const lockedResult = official?.status === 'completed' && resultLocked(w, 'official', now);
    // En iyi tekrar çözüm (6 Eylül 2026 dersi: "en son" boş oturumu gösterirdi).
    const bestPractice = [...practices]
      .filter((p) => p.status === 'completed')
      .sort((a, b) => b.correctCount - a.correctCount || +b.completedAt! - +a.completedAt!)[0];
    const lastPractice = practices.find((p) => p.status === 'completed') ?? null;

    return {
      id: e.id,
      title: e.title,
      description: e.description,
      startAt: e.startAt,
      endAt: this.legacyEndAt(w),
      durationMinutes: e.durationMinutes,
      questionCount: e._count.questions,
      isPremium: e.isPremium,
      questionsOpenAfterEnd: e.questionsOpenAfterEnd,
      /** Eski alan (Flutter): bitince çözülebilir mi — artık practiceAfterEnd. */
      archiveOpenAfterEnd: e.practiceAfterEnd,
      state: legacyStateOf(w, now) as ExamState,
      participantCount,
      avgScore: stat?._avg.score != null ? Math.round(Number(stat._avg.score) * 100) / 100 : null,
      /** Eski alan: resmî katılım. */
      myAttempt: official ? { id: official.id, status: official.status } : null,
      /** Eski alan: en iyi tekrar çözüm ("arşiv sonucum"). */
      myArchiveAttempt: bestPractice
        ? {
            id: bestPractice.id,
            status: 'completed' as const,
            correctCount: bestPractice.correctCount,
            wrongCount: bestPractice.wrongCount,
            blankCount: bestPractice.blankCount,
            completedAt: bestPractice.completedAt,
          }
        : null,

      // ── Doc 50 alanları ──
      publishMode: e.publishMode,
      difficulty: e.difficulty,
      examTypeId: e.examTypeId,
      liveAnswerReveal: e.liveAnswerReveal,
      practiceAfterEnd: e.practiceAfterEnd,
      availability,
      myState,
      canStartOfficial: canStartOfficial(w, my, now),
      canStartPractice: canStartPractice(w, my, now),
      my: {
        official: official
          ? {
              attemptId: official.id,
              status: official.status,
              resultLocked: lockedResult,
              score: !lockedResult && official.score != null ? Number(official.score) : null,
              correct: lockedResult ? null : official.correctCount,
              wrong: lockedResult ? null : official.wrongCount,
              blank: lockedResult ? null : official.blankCount,
              rank: lockedResult ? null : (rank ?? null),
              total: participantCount,
              completedAt: official.completedAt,
            }
          : null,
        active: active
          ? {
              attemptId: active.id,
              role: active.attemptRole,
              deadlineAt: active.deadlineAt,
              answered: active._count.answers,
            }
          : null,
        practiceCount: practices.filter((p) => p.status === 'completed').length,
        lastPractice: lastPractice
          ? {
              attemptId: lastPractice.id,
              score: lastPractice.score != null ? Number(lastPractice.score) : null,
              completedAt: lastPractice.completedAt,
            }
          : null,
      },
    };
  }

  async detail(examId: string, user?: AuthenticatedUser) {
    // Çıkmış sınavlar listede gizli ama tekil olarak açılabilir olmalı.
    const list = await this.list(user, true);
    const found = list.find((e) => e.id === examId);
    if (!found) throw new NotFoundException('Deneme bulunamadı.');
    // Kurallar ekranı için ders dağılımı (Doc 50 M2): sınav türünün bölüm
    // ağırlıkları × soru sayısı, en-büyük-kalan yuvarlamasıyla. Sınav türü
    // yoksa boş liste — istemci satırı çizmez.
    return {
      ...found,
      distribution: await this.distributionFor(found.examTypeId, found.questionCount),
    };
  }

  private async distributionFor(examTypeId: string | null, questionCount: number) {
    if (!examTypeId || questionCount <= 0)
      return [] as { name: string; count: number; weightPercent: number }[];
    const sections = await this.prisma.examSection.findMany({
      where: { examTypeId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      select: { name: true, weightPercent: true },
    });
    const sum = sections.reduce((a, s) => a + s.weightPercent, 0);
    if (sections.length === 0 || sum <= 0) return [];
    const exact = sections.map((s) => (s.weightPercent / sum) * questionCount);
    const base = exact.map((x) => Math.floor(x));
    let left = questionCount - base.reduce((a, b) => a + b, 0);
    const order = exact
      .map((x, i) => ({ i, frac: x - Math.floor(x) }))
      .sort((p, q) => q.frac - p.frac);
    for (const { i } of order) {
      if (left <= 0) break;
      base[i]++;
      left--;
    }
    return sections.map((s, i) => ({
      name: s.name,
      count: base[i],
      weightPercent: s.weightPercent,
    }));
  }

  /** Canlı nabız: sınavda ŞU AN olan + bitirmiş (resmî) kişi sayısı. Kimliksiz. */
  async presence(examId: string) {
    const [active, completed] = await Promise.all([
      this.prisma.quizSession.count({ where: { examId, status: 'in_progress' } }),
      this.prisma.quizSession.count({
        where: { examId, status: 'completed', attemptRole: 'official' },
      }),
    ]);
    return { active, completed };
  }

  // ── Başlat / devam et (Doc 50 §3) ──
  /**
   * `role` verilmezse RESMÎ çözüm istenir; resmî çözüm zaten varsa 409
   * EXAM_ALREADY_TAKEN döner (eski istemciyle uyumlu — Flutter bu kodla sonuca
   * gider). Yeni istemci kurallar ekranından `role: 'practice'` ile tekrar çözüm açar.
   */
  async start(user: AuthenticatedUser, examId: string, requestedRole?: AttemptRole) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, status: 'published', deletedAt: null },
      include: { pastExam: { select: { isPremium: true } } },
    });
    if (!exam) throw new NotFoundException('Deneme bulunamadı.');
    const now = new Date();
    const w = this.window(exam);
    const availability = availabilityOf(w, now);

    if (availability === 'upcoming') {
      throw new ConflictException({
        code: 'EXAM_NOT_STARTED',
        message:
          exam.publishMode === 'takvimli' ? 'Sınav henüz başlamadı.' : 'Deneme henüz yayımlanmadı.',
        details: { startAt: exam.startAt },
      });
    }
    if ((exam.isPremium || exam.pastExam?.isPremium) && !user.isPremium) {
      throw new ForbiddenException({
        code: 'PREMIUM_REQUIRED',
        message: 'Bu deneme premium üyelere özeldir.',
      });
    }

    const sessions = await this.prisma.quizSession.findMany({
      where: { userId: user.id, examId, status: { not: 'abandoned' } },
      orderBy: [{ startedAt: 'desc' }],
      select: {
        id: true,
        status: true,
        attemptRole: true,
        deadlineAt: true,
        startedAt: true,
        plannedDurationSeconds: true,
        questionOrder: true,
      },
    });
    let official = sessions.find((s) => s.attemptRole === 'official') ?? null;
    let activePractice =
      sessions.find((s) => s.attemptRole === 'practice' && s.status === 'in_progress') ?? null;

    // Süresi dolmuş yarım oturumlar önce TESLİM edilir (süre dolumu teslimdir).
    for (const s of [official, activePractice]) {
      if (s && s.status === 'in_progress') {
        const dl =
          s.deadlineAt ?? new Date(s.startedAt.getTime() + (s.plannedDurationSeconds ?? 0) * 1000);
        if (isPastDeadline(dl, now)) {
          await this.quiz.completeSession(user.id, s.id, 'timeout');
          if (s === official) official = { ...s, status: 'completed' };
          else activePractice = null;
        }
      }
    }

    const my: MyAttemptSummary = {
      officialStatus:
        official?.status === 'completed' || official?.status === 'in_progress'
          ? official.status
          : null,
      practiceInProgress: activePractice != null,
    };

    // Devam: yarım resmî çözüm her zaman öncelikli.
    if (official?.status === 'in_progress' && requestedRole !== 'practice') {
      return this.resumePayload(exam, official.id, 'official', now);
    }
    if (official?.status === 'in_progress' && requestedRole === 'practice') {
      throw new ConflictException({
        code: 'OFFICIAL_IN_PROGRESS',
        message: 'Tekrar çözüm, resmî çözüm bittikten sonra açılır.',
        details: { attemptId: official.id },
      });
    }

    let role: AttemptRole = requestedRole ?? 'official';
    if (role === 'official' && official?.status === 'completed') {
      // Pencere kapanmış ve pratik kapalıysa da aynı kod; aday sonucuna gider.
      throw new ConflictException({
        code: 'EXAM_ALREADY_TAKEN',
        message: 'Bu denemeyi çözdün; tekrar çözüm sıralamayı etkilemez.',
        details: { attemptId: official.id, canStartPractice: canStartPractice(w, my, now) },
      });
    }
    if (role === 'official' && availability === 'closed') {
      // Kapanmış denemede resmî çözüm açılmaz; pratik açıksa oraya düşülür.
      if (canStartPractice(w, my, now)) role = 'practice';
      else {
        throw new ConflictException({
          code: 'EXAM_CLOSED',
          message:
            exam.publishMode === 'takvimli'
              ? 'Sınav süresi doldu.'
              : 'Bu deneme artık yeni çözüme kapalı.',
        });
      }
    }
    if (role === 'practice') {
      if (activePractice) return this.resumePayload(exam, activePractice.id, 'practice', now);
      if (!canStartPractice(w, my, now)) {
        throw new ConflictException({
          code:
            my.officialStatus == null && availability === 'open' ? 'OFFICIAL_FIRST' : 'EXAM_CLOSED',
          message:
            my.officialStatus == null && availability === 'open'
              ? 'Önce resmî çözümünü yap; tekrar çözüm sonra açılır.'
              : 'Bu deneme tekrar çözüme kapalı.',
        });
      }
    }
    if (role === 'official' && !canStartOfficial(w, my, now)) {
      throw new ConflictException({
        code: 'EXAM_CLOSED',
        message: 'Bu deneme yeni çözüme kapalı.',
      });
    }

    const questions = await this.packQuestions(exam.id, exam.questionPack);
    if (questions.length === 0) {
      throw new ConflictException({ code: 'EXAM_EMPTY', message: 'Denemeye soru bağlanmamış.' });
    }

    const deadlineAt = deadlineFor(w, role, now);
    const plannedDurationSeconds = Math.max(
      1,
      Math.floor((deadlineAt.getTime() - now.getTime()) / 1000),
    );
    let session: { id: string };
    try {
      session = await this.prisma.quizSession.create({
        data: {
          userId: user.id,
          mode: 'deneme',
          examId,
          attemptRole: role,
          totalQuestions: questions.length,
          // Cevaplanabilir sürümler SUNUCUDA sabitlenir (anahtar şişirmesi kapalı).
          questionOrder: questions.map((q) => q.versionId),
          plannedDurationSeconds,
          deadlineAt,
        },
        select: { id: true },
      });
    } catch {
      // Kısmi tekil indeks yarışı (eşzamanlı ikinci resmî istek) → mevcut oturuma düş.
      const existing = await this.prisma.quizSession.findFirst({
        where: { userId: user.id, examId, attemptRole: 'official', status: { not: 'abandoned' } },
        select: { id: true },
      });
      if (!existing)
        throw new ConflictException({ code: 'EXAM_START_FAILED', message: 'Oturum açılamadı.' });
      return this.resumePayload(exam, existing.id, 'official', now);
    }

    return {
      sessionId: session.id,
      examId,
      title: exam.title,
      mode: 'deneme' as const,
      role,
      resumed: false,
      publishMode: exam.publishMode,
      endsAt: deadlineAt,
      deadlineAt,
      serverNow: now,
      plannedDurationSeconds,
      remainingSeconds: plannedDurationSeconds,
      liveAnswerReveal: exam.liveAnswerReveal || role === 'practice',
      questions,
      givenAnswers: [] as {
        questionId: string;
        selectedOptionId: string | null;
        flagged: boolean;
      }[],
    };
  }

  private async resumePayload(
    exam: {
      id: string;
      title: string;
      publishMode: 'serbest' | 'takvimli';
      liveAnswerReveal: boolean;
      questionPack: Prisma.JsonValue | null;
    },
    sessionId: string,
    role: AttemptRole,
    now: Date,
  ) {
    const s = await this.prisma.quizSession.findUniqueOrThrow({
      where: { id: sessionId },
      select: {
        deadlineAt: true,
        startedAt: true,
        plannedDurationSeconds: true,
        questionOrder: true,
        answers: { select: { questionId: true, selectedOptionId: true, flagged: true } },
      },
    });
    const deadlineAt =
      s.deadlineAt ?? new Date(s.startedAt.getTime() + (s.plannedDurationSeconds ?? 0) * 1000);
    const questions = await this.packQuestions(exam.id, exam.questionPack);
    return {
      sessionId,
      examId: exam.id,
      title: exam.title,
      mode: 'deneme' as const,
      role,
      resumed: true,
      publishMode: exam.publishMode,
      endsAt: deadlineAt,
      deadlineAt,
      serverNow: now,
      plannedDurationSeconds: Math.max(
        1,
        Math.floor((deadlineAt.getTime() - s.startedAt.getTime()) / 1000),
      ),
      remainingSeconds: Math.max(0, Math.floor((deadlineAt.getTime() - now.getTime()) / 1000)),
      liveAnswerReveal: exam.liveAnswerReveal || role === 'practice',
      questions,
      // Devam senaryosu: verilmiş cevaplar da döner (yenileme/cihaz değişimi güvenli).
      givenAnswers: s.answers,
    };
  }

  /** Soru paketi (Doc 50 §5-1): yayında üretilmiş cevapsız yük; yoksa DB'den. */
  private async packQuestions(
    examId: string,
    pack: Prisma.JsonValue | null,
  ): Promise<PackQuestion[]> {
    const base =
      Array.isArray(pack) && pack.length > 0
        ? (pack as unknown as PackQuestion[])
        : ((await this.examQuestions(examId, { withAnswers: false })) as PackQuestion[]);
    // Ders adı oynatıcı rozetinde (Figma M3); paket JSON'unda yok, soru kimliğinden bulunur.
    const courseOf = await this.courseOf(base.map((q) => q.questionId));
    return base.map((q) => ({ ...q, course: courseOf.get(q.questionId) ?? null }));
  }

  /** Soru → ders adı (konunun dersi). Tek sorgu, en fazla paket boyu kadar id. */
  private async courseOf(questionIds: string[]): Promise<Map<string, string | null>> {
    if (questionIds.length === 0) return new Map();
    const rows = await this.prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, topic: { select: { course: { select: { name: true } } } } },
    });
    return new Map(rows.map((r) => [r.id, r.topic?.course?.name ?? null]));
  }

  /** Yayında çağrılır (admin): paket üretir ve saklar. */
  async buildQuestionPack(examId: string) {
    const questions = await this.examQuestions(examId, { withAnswers: false });
    await this.prisma.exam.update({
      where: { id: examId },
      data: {
        questionPack: questions as unknown as Prisma.InputJsonValue,
        questionPackBuiltAt: new Date(),
      },
    });
    return questions.length;
  }

  // ── Sonuç (Doc 50 §2.4) ──
  async getAttempt(user: AuthenticatedUser, attemptId: string) {
    const session = await this.prisma.quizSession.findFirst({
      where: {
        id: attemptId,
        userId: user.id,
        OR: [{ examId: { not: null } }, { archiveExamId: { not: null } }, { personalExam: true }],
      },
      include: { exam: true, archiveExam: true },
    });
    const kisisel = session?.personalExam === true && !session.exam && !session.archiveExam;
    const examRow = session?.exam ?? session?.archiveExam ?? null;
    if (!session || (!examRow && !kisisel)) throw new NotFoundException('Katılım bulunamadı.');
    const now = new Date();

    // Çıkmış sınav (archiveExamId) ve kişisel deneme: pencere yok.
    const role: AttemptRole = session.attemptRole ?? (session.examId ? 'official' : 'practice');
    const w = examRow && session.examId ? this.window(examRow) : null;
    const locked = w ? resultLocked(w, role, now) : false;

    if (session.status === 'in_progress') {
      const dl =
        session.deadlineAt ??
        new Date(session.startedAt.getTime() + (session.plannedDurationSeconds ?? 0) * 1000);
      if (!isPastDeadline(dl, now)) {
        throw new ConflictException({
          code: 'EXAM_IN_PROGRESS',
          message: 'Sınav devam ediyor.',
          details: { examId: session.examId, attemptId: session.id, deadlineAt: dl },
        });
      }
      await this.quiz.completeSession(user.id, session.id, 'timeout'); // tembel finalize
    }

    const fresh = await this.prisma.quizSession.findUniqueOrThrow({ where: { id: session.id } });
    const examMeta = examRow
      ? {
          id: examRow.id,
          title: examRow.title,
          startAt: examRow.startAt,
          durationMinutes: examRow.durationMinutes,
        }
      : {
          id: session.id,
          title: 'Kişisel Deneme',
          startAt: session.startedAt,
          durationMinutes: Math.max(1, Math.round((session.plannedDurationSeconds ?? 0) / 60)),
        };
    const base = {
      attemptId: session.id,
      /** Eski alan: sıralamaya girmeyen çözüm. */
      isArchive: role === 'practice' || session.archiveExamId != null,
      isPersonal: kisisel,
      role,
      publishMode: examRow?.publishMode ?? null,
      personal: kisisel,
      closedReason: fresh.closedReason,
      exam: examMeta,
      startedAt: fresh.startedAt,
      completedAt: fresh.completedAt,
      durationSeconds: fresh.durationSeconds,
      totalQuestions: fresh.totalQuestions,
    };

    // Takvimli resmî çözüm: pencere kapanana kadar sonuç KİLİTLİ (Figma M4-d).
    if (locked) {
      const answered = await this.prisma.quizAnswer.count({
        where: { sessionId: session.id, selectedOptionId: { not: null } },
      });
      return {
        ...base,
        resultLocked: true,
        resultAt: examEndAt(w!),
        answeredCount: answered,
        blankCount: fresh.totalQuestions - answered,
        correctCount: null,
        wrongCount: null,
        score: null,
        rank: null,
        courses: [],
        turkey: null,
        weakTopics: [],
        topicBreakdown: [],
        timing: [],
        review: [],
        scoreUpdate: null,
      };
    }

    const answers = await this.prisma.quizAnswer.findMany({
      where: { sessionId: session.id },
      select: {
        questionId: true,
        selectedOptionId: true,
        isCorrect: true,
        timeSpentMs: true,
        flagged: true,
      },
    });
    const answerOf = new Map(answers.map((a) => [a.questionId, a]));
    const adjustments = session.examId ? await this.activeAdjustments(session.examId) : new Map();

    // KAYNAK ETİKETİ GÖSTERİLMEZ (4 Eylül 2026 kararı): yalnız açıklama.
    const sorular = kisisel
      ? await this.sessionQuestions(session.questionOrder)
      : await this.examQuestions(examMeta.id, { withAnswers: true });
    const review = sorular.map((q) => ({
      ...q,
      source: null,
      selectedOptionId: answerOf.get(q.questionId)?.selectedOptionId ?? null,
      flagged: answerOf.get(q.questionId)?.flagged ?? false,
      adjustment: adjustments.get(q.questionId) ?? null,
    }));

    // Konu ve DERS kırılımı. Ders = sınav türünün müfredat bölümü (ExamSection);
    // resmî tablo sırasıyla, sabit (Doc 50 §2.4).
    const qMeta = await this.prisma.question.findMany({
      where: { id: { in: review.map((q) => q.questionId) } },
      select: {
        id: true,
        topic: {
          select: { id: true, name: true, courseId: true, course: { select: { name: true } } },
        },
      },
    });
    const metaOf = new Map(qMeta.map((q) => [q.id, q.topic]));
    const statusOf = (qid: string): 'correct' | 'wrong' | 'blank' => {
      const a = answerOf.get(qid);
      if (a?.isCorrect === true) return 'correct';
      if (a?.selectedOptionId != null) return 'wrong';
      return 'blank';
    };

    const byTopic = new Map<
      string,
      {
        topicId: string;
        topicName: string;
        correct: number;
        wrong: number;
        blank: number;
        total: number;
      }
    >();
    for (const q of review) {
      const t = metaOf.get(q.questionId);
      if (!t) continue;
      const b = byTopic.get(t.id) ?? {
        topicId: t.id,
        topicName: t.name,
        correct: 0,
        wrong: 0,
        blank: 0,
        total: 0,
      };
      b.total++;
      b[statusOf(q.questionId)]++;
      byTopic.set(t.id, b);
    }
    const topicBreakdown = [...byTopic.values()].sort(
      (a, b) => b.wrong + b.blank - (a.wrong + a.blank) || b.total - a.total,
    );
    const weakTopics = topicBreakdown.filter((t) => t.wrong + t.blank > 0).slice(0, 5);

    const examTypeId =
      examRow?.examTypeId ??
      (
        await this.prisma.user.findUnique({
          where: { id: user.id },
          select: { preferredModuleId: true },
        })
      )?.preferredModuleId ??
      null;
    const courses = await this.courseBreakdown(
      examTypeId,
      review.map((q) => ({
        courseId: metaOf.get(q.questionId)?.courseId ?? null,
        status: statusOf(q.questionId),
      })),
    );

    const timing = review.map((q) => ({
      order: q.order,
      timeSpentMs: answerOf.get(q.questionId)?.timeSpentMs ?? null,
      status: statusOf(q.questionId),
    }));

    // Sıra ve Türkiye kıyası yalnız RESMÎ deneme çözümünde.
    let rank: {
      available: boolean;
      rank: number | null;
      total: number;
      percentile: number | null;
      reason?: string;
    } | null = null;
    let turkey: {
      locked: boolean;
      sample: number;
      minSample: number;
      mean: number | null;
      median: number | null;
      diff: number | null;
    } | null = null;
    if (session.examId && role === 'official' && !kisisel) {
      const ranked = await this.rankedRows(session.examId, examRow!);
      const me = ranked.rows.find((r) => r.row.key === user.id) ?? null;
      const total = ranked.rows.length;
      rank = {
        available: total >= RANKING_MIN_SAMPLE,
        rank: total >= RANKING_MIN_SAMPLE && me ? me.rank : null,
        total,
        percentile: total >= RANKING_MIN_SAMPLE && me ? percentileBand(me.rank, total) : null,
        reason: total >= RANKING_MIN_SAMPLE ? undefined : 'min_sample',
      };
      const scores = ranked.rows.map((r) => r.row.score);
      const myScore = fresh.score != null ? Number(fresh.score) : null;
      turkey = {
        locked: !user.isPremium,
        sample: total,
        minSample: RANKING_MIN_SAMPLE,
        mean: user.isPremium && total >= RANKING_MIN_SAMPLE ? mean(scores) : null,
        median: user.isPremium && total >= RANKING_MIN_SAMPLE ? median(scores) : null,
        diff:
          user.isPremium && total >= RANKING_MIN_SAMPLE && myScore != null && mean(scores) != null
            ? Math.round((myScore - mean(scores)!) * 100) / 100
            : null,
      };
    }

    return {
      ...base,
      resultLocked: false,
      resultAt: null,
      correctCount: fresh.correctCount,
      wrongCount: fresh.wrongCount,
      blankCount: fresh.blankCount,
      score: fresh.score != null ? Number(fresh.score) : null, // NET
      rank,
      courses,
      turkey,
      weakTopics,
      scoreUpdate:
        fresh.previousScore != null && fresh.scoreUpdatedAt != null
          ? {
              from: Number(fresh.previousScore),
              to: Number(fresh.score ?? 0),
              at: fresh.scoreUpdatedAt,
            }
          : null,
      topicBreakdown,
      timing,
      // İnceleme ayrıntısı (Figma M5): ders ve konu adı, dayanak atfı. Kaynak etiketi yok.
      review: review.map((q) => ({
        ...q,
        course: metaOf.get(q.questionId)?.course?.name ?? null,
        topic: metaOf.get(q.questionId)?.name ?? null,
      })),
    };
  }

  /** Geri alınmamış soru iptalleri: soru id → eylem. */
  async activeAdjustments(examId: string) {
    const rows = await this.prisma.examQuestionAdjustment.findMany({
      where: { examId, revertedAt: null },
      select: { questionId: true, action: true },
    });
    return new Map(rows.map((r) => [r.questionId, r.action]));
  }

  /** Ders dağılımı: sınav türünün müfredat bölümleri, resmî sırayla; bölümsüz soru "Diğer". */
  private async courseBreakdown(
    examTypeId: string | null,
    rows: { courseId: string | null; status: 'correct' | 'wrong' | 'blank' }[],
  ) {
    const sections = examTypeId
      ? await this.prisma.examSection.findMany({
          where: { examTypeId, deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          select: { id: true, name: true, courses: { select: { courseId: true } } },
        })
      : [];
    const sectionOfCourse = new Map<string, string>();
    for (const s of sections)
      for (const c of s.courses)
        if (!sectionOfCourse.has(c.courseId)) sectionOfCourse.set(c.courseId, s.id);
    const acc = new Map(
      sections.map((s) => [
        s.id,
        { sectionId: s.id, name: s.name, total: 0, correct: 0, wrong: 0, blank: 0 },
      ]),
    );
    const other = {
      sectionId: null as string | null,
      name: 'Diğer',
      total: 0,
      correct: 0,
      wrong: 0,
      blank: 0,
    };
    for (const r of rows) {
      const sid = r.courseId ? sectionOfCourse.get(r.courseId) : undefined;
      const b = sid ? acc.get(sid)! : other;
      b.total++;
      b[r.status]++;
    }
    const out: {
      sectionId: string | null;
      name: string;
      total: number;
      correct: number;
      wrong: number;
      blank: number;
    }[] = [...acc.values()];
    if (other.total > 0) out.push(other);
    return out;
  }

  // ── İnceleme listesi (Doc 50 §3): soru bazlı Türkiye oranı ve süre Premium ──
  async review(user: AuthenticatedUser, attemptId: string) {
    const result = await this.getAttempt(user, attemptId);
    if (result.resultLocked) {
      throw new ConflictException({
        code: 'RESULT_LOCKED',
        message: 'Sonuçlar pencere kapanınca açıklanır.',
        details: { resultAt: result.resultAt },
      });
    }
    const examId = result.role && !result.isPersonal ? result.exam.id : null;
    const timing = result.timing as {
      order: number;
      timeSpentMs: number | null;
      status: 'correct' | 'wrong' | 'blank';
    }[];
    const reviewRows = result.review as {
      order: number;
      questionId: string;
      flagged: boolean;
      selectedOptionId: string | null;
      options: { id: string; isCorrect?: boolean }[];
      adjustment: 'credit_all' | 'exclude' | null;
    }[];
    const qids = reviewRows.map((q) => q.questionId);
    const meta = await this.prisma.question.findMany({
      where: { id: { in: qids } },
      select: { id: true, topic: { select: { name: true, course: { select: { name: true } } } } },
    });
    const metaOf = new Map(meta.map((m) => [m.id, m.topic]));

    // Türkiye oranı: bu denemenin RESMÎ tamamlanmış çözümlerinde doğru oranı ve ortalama süre.
    let rateOf = new Map<string, { rate: number; avgMs: number | null }>();
    let majority = 0;
    if (examId && user.isPremium) {
      const rows = await this.prisma.$queryRaw<
        { question_id: string; n: number; ok: number; avg_ms: number | null }[]
      >`
        SELECT qa.question_id, COUNT(*)::int AS n,
               SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END)::int AS ok,
               AVG(qa.time_spent_ms)::float AS avg_ms
        FROM quiz_answers qa
        JOIN quiz_sessions qs ON qs.id = qa.session_id
        WHERE qs.exam_id = ${examId}::uuid AND qs.status = 'completed' AND qs.attempt_role = 'official'
        GROUP BY qa.question_id`;
      rateOf = new Map(
        rows.map((r) => [
          r.question_id,
          {
            rate: r.n > 0 ? Math.round((r.ok / r.n) * 100) : 0,
            avgMs: r.avg_ms != null ? Math.round(r.avg_ms) : null,
          },
        ]),
      );
    }
    const items = reviewRows.map((q) => {
      const tm = timing.find((t) => t.order === q.order);
      const status = tm?.status ?? 'blank';
      const tr = rateOf.get(q.questionId) ?? null;
      const missedMajority = tr != null && tr.rate >= 70 && status !== 'correct';
      if (missedMajority) majority++;
      const t = metaOf.get(q.questionId);
      return {
        no: q.order,
        questionId: q.questionId,
        course: t?.course.name ?? null,
        topic: t?.name ?? null,
        status,
        flagged: q.flagged,
        selectedOptionId: q.selectedOptionId,
        correctOptionId: q.options.find((o) => o.isCorrect)?.id ?? null,
        seconds: tm?.timeSpentMs != null ? Math.round(tm.timeSpentMs / 1000) : null,
        turkeyRate: tr?.rate ?? null,
        avgSeconds: tr?.avgMs != null ? Math.round(tr.avgMs / 1000) : null,
        missedMajority,
        adjustment: q.adjustment,
      };
    });
    return {
      attemptId,
      locked: !user.isPremium,
      majorityMissed: user.isPremium ? majority : null,
      items,
    };
  }

  // ── Sıralama (Doc 50 §2.3): serbest canlı, takvimli donmuş ──
  private async rankedRows(
    examId: string,
    exam: { publishMode: 'serbest' | 'takvimli'; rankingsComputedAt: Date | null },
  ) {
    if (exam.publishMode === 'takvimli' && exam.rankingsComputedAt) {
      const rows = await this.prisma.examRanking.findMany({
        where: { examId },
        orderBy: { rank: 'asc' },
        include: { user: { select: { displayName: true, deletedAt: true } } },
      });
      return {
        frozen: true,
        rows: rows
          .filter((r) => r.user.deletedAt == null)
          .map((r) => ({
            rank: r.rank,
            row: {
              key: r.userId,
              score: Number(r.score),
              wrongCount: r.wrongCount,
              durationSeconds: r.durationSeconds,
              submittedAt: r.submittedAt,
              sessionId: r.sessionId,
              displayName: r.user.displayName,
              correctCount: null as number | null,
              blankCount: null as number | null,
            },
          })),
      };
    }
    const sessions = await this.prisma.quizSession.findMany({
      where: { examId, status: 'completed', attemptRole: 'official' },
      include: { user: { select: { displayName: true, deletedAt: true } } },
    });
    const rows = rankWithTies(
      sessions
        .filter((s) => s.user.deletedAt == null)
        .map((s) => ({
          key: s.userId,
          score: s.score != null ? Number(s.score) : 0,
          wrongCount: s.wrongCount,
          durationSeconds: s.durationSeconds ?? 0,
          submittedAt: s.completedAt ?? s.startedAt,
          sessionId: s.id,
          displayName: s.user.displayName,
          correctCount: s.correctCount as number | null,
          blankCount: s.blankCount as number | null,
        })),
    );
    return { frozen: false, rows };
  }

  async leaderboard(examId: string, user?: AuthenticatedUser) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, status: 'published', deletedAt: null },
    });
    if (!exam) throw new NotFoundException('Deneme bulunamadı.');
    const w = this.window(exam);
    const endAt = this.legacyEndAt(w);
    if (exam.publishMode === 'takvimli' && availabilityOf(w, new Date()) !== 'closed') {
      return {
        available: false,
        reason: 'result_pending' as const,
        endAt,
        frozenAt: null,
        participantCount: 0,
        top: [],
        me: null,
      };
    }
    const ranked = await this.rankedRows(examId, exam);
    const total = ranked.rows.length;
    if (total < RANKING_MIN_SAMPLE) {
      return {
        available: false,
        reason: 'min_sample' as const,
        endAt,
        frozenAt: exam.rankingsComputedAt,
        participantCount: total,
        minSample: RANKING_MIN_SAMPLE,
        top: [],
        me: null,
      };
    }
    const rows = ranked.rows.map((r) => ({
      rank: r.rank,
      name: rankingName(r.row.displayName),
      displayName: r.row.displayName,
      score: r.row.score,
      wrongCount: r.row.wrongCount,
      correctCount: r.row.correctCount,
      blankCount: r.row.blankCount,
      durationSeconds: r.row.durationSeconds,
      isMe: user ? r.row.key === user.id : false,
    }));
    const me = rows.find((r) => r.isMe) ?? null;
    return {
      available: true,
      reason: undefined,
      endAt,
      frozenAt: exam.rankingsComputedAt,
      participantCount: total,
      top: rows.slice(0, 100),
      me: me ? { ...me, percentile: percentileBand(me.rank, total) } : null,
    };
  }

  /** Takvimli pencere kapanınca sıralamayı DONDURUR (tek sorgu, idempotent). */
  async freezeRankings(examId: string) {
    const exam = await this.prisma.exam.findUniqueOrThrow({ where: { id: examId } });
    const live = await this.rankedRows(examId, {
      publishMode: 'serbest',
      rankingsComputedAt: null,
    });
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.examRanking.deleteMany({ where: { examId } });
      if (live.rows.length > 0) {
        await tx.examRanking.createMany({
          data: live.rows.map((r) => ({
            examId,
            userId: r.row.key,
            sessionId: r.row.sessionId,
            rank: r.rank,
            score: r.row.score,
            wrongCount: r.row.wrongCount,
            durationSeconds: r.row.durationSeconds,
            submittedAt: r.row.submittedAt,
            computedAt: now,
          })),
        });
      }
      await tx.exam.update({ where: { id: examId }, data: { rankingsComputedAt: now } });
    });
    this.logger.log(`Sıralama donduruldu: ${exam.title} (${live.rows.length} resmî çözüm)`);
    return live.rows.length;
  }

  // ── Geçmişim (Doc 50 §3) ──
  async myAttempts(user: AuthenticatedUser) {
    const sessions = await this.prisma.quizSession.findMany({
      where: { userId: user.id, examId: { not: null }, status: { not: 'abandoned' } },
      orderBy: { startedAt: 'desc' },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            startAt: true,
            durationMinutes: true,
            publishMode: true,
          },
        },
      },
    });
    return sessions.map((s) => ({
      attemptId: s.id,
      exam: s.exam,
      role: s.attemptRole,
      status: s.status,
      closedReason: s.closedReason,
      correctCount: s.correctCount,
      wrongCount: s.wrongCount,
      blankCount: s.blankCount,
      score: s.score != null ? Number(s.score) : null,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
    }));
  }

  async history(user: AuthenticatedUser) {
    const now = new Date();
    const sessions = await this.prisma.quizSession.findMany({
      where: {
        userId: user.id,
        status: 'completed',
        OR: [{ examId: { not: null }, mode: 'deneme' }, { personalExam: true }],
      },
      orderBy: { completedAt: 'desc' },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            publishMode: true,
            startAt: true,
            endAt: true,
            durationMinutes: true,
            practiceAfterEnd: true,
            rankingsComputedAt: true,
            pastExam: { select: { id: true } },
          },
        },
      },
    });
    // Sıra: dondurulmuş tablo varsa oradan; yoksa (serbest, ya da pencere kapanmış ama henüz
    // dondurulmamış takvimli) lider tablosuyla aynı canlı hesap. En az örnek kuralı ortak.
    const rankOf = new Map<string, number | null>();
    const examsToRank = new Map<string, NonNullable<(typeof sessions)[number]['exam']>>();
    for (const s of sessions) {
      if (!s.exam || s.attemptRole !== 'official' || s.exam.pastExam) continue;
      if (resultLocked(this.window(s.exam), 'official', now)) continue;
      examsToRank.set(s.exam.id, s.exam);
    }
    for (const exam of examsToRank.values()) {
      const ranked = await this.rankedRows(exam.id, exam);
      if (ranked.rows.length < RANKING_MIN_SAMPLE) {
        rankOf.set(exam.id, null);
        continue;
      }
      rankOf.set(exam.id, ranked.rows.find((r) => r.row.key === user.id)?.rank ?? null);
    }
    const item = (s: (typeof sessions)[number]) => {
      const locked =
        s.exam && s.attemptRole === 'official'
          ? resultLocked(this.window(s.exam), 'official', now)
          : false;
      return {
        attemptId: s.id,
        examId: s.examId,
        title: s.exam?.title ?? `Kişisel deneme · ${s.totalQuestions} soru`,
        publishMode: s.exam?.publishMode ?? null,
        role: s.personalExam ? 'personal' : s.attemptRole,
        completedAt: s.completedAt,
        closedReason: s.closedReason,
        resultLocked: locked,
        resultAt: locked && s.exam ? examEndAt(this.window(s.exam)) : null,
        score: locked ? null : s.score != null ? Number(s.score) : null,
        rank: locked ? null : (rankOf.get(s.examId ?? '') ?? null),
        totalQuestions: s.totalQuestions,
      };
    };
    const denemeler = sessions.filter(
      (s) => s.exam && !s.exam.pastExam && s.exam.publishMode === 'serbest',
    );
    const haftalik = sessions.filter(
      (s) => s.exam && !s.exam.pastExam && s.exam.publishMode === 'takvimli',
    );
    const kisisel = sessions.filter((s) => s.personalExam && !s.exam);
    const official = sessions
      .filter(
        (s) =>
          s.exam &&
          !s.exam.pastExam &&
          s.attemptRole === 'official' &&
          !resultLocked(this.window(s.exam), 'official', now),
      )
      .slice(0, 6)
      .reverse();
    const trendPoints = official.map((s) => ({
      attemptId: s.id,
      at: s.completedAt,
      score: s.score != null ? Number(s.score) : 0,
      title: s.exam!.title,
    }));
    const scores = trendPoints.map((p) => p.score);
    return {
      trend: {
        locked: !user.isPremium,
        points: user.isPremium ? trendPoints : [],
        mean: user.isPremium ? mean(scores) : null,
        best: user.isPremium && scores.length ? Math.max(...scores) : null,
        delta:
          user.isPremium && scores.length >= 2
            ? Math.round((scores[scores.length - 1] - scores[0]) * 100) / 100
            : null,
      },
      denemeler: denemeler.map(item),
      haftalik: haftalik.map(item),
      kisisel: kisisel.map(item),
    };
  }

  // ── Hatırlatma (Doc 50 §2.3) ──
  async setReminder(user: AuthenticatedUser, examId: string, on: boolean) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, status: 'published', deletedAt: null },
    });
    if (!exam) throw new NotFoundException('Deneme bulunamadı.');
    if (!on) {
      await this.prisma.examReminder.deleteMany({
        where: {
          examId,
          userId: user.id,
          kind: { in: ['day_before', 'hour_before'] },
          sentAt: null,
        },
      });
      return { reminding: false };
    }
    if (exam.publishMode !== 'takvimli' || !exam.remindEnabled || exam.startAt <= new Date()) {
      throw new ConflictException({
        code: 'REMINDER_UNAVAILABLE',
        message: 'Bu deneme için hatırlatma yok.',
      });
    }
    for (const kind of ['day_before', 'hour_before'] as const) {
      await this.prisma.examReminder.upsert({
        where: { examId_userId_kind: { examId, userId: user.id, kind } },
        update: {},
        create: { examId, userId: user.id, kind },
      });
    }
    return { reminding: true };
  }

  async reminderStatus(user: AuthenticatedUser, examId: string) {
    const n = await this.prisma.examReminder.count({
      where: { examId, userId: user.id, kind: 'day_before' },
    });
    return { reminding: n > 0 };
  }

  // ── Cron'lar ──
  /**
   * Süresi dolmuş oturumlar SUNUCUDA teslim edilir (her dakika; süre dolumu
   * teslimdir, iptal değil). Sırayla: pooler bağlantısı dar (Supabase havuzu
   * prod ile ortak), bitişteki yığılmada paralel finalize havuzu tüketirdi.
   */
  @Cron('*/1 * * * *')
  async finalizeExpiredAttempts() {
    const graceMs = 10_000;
    const cutoff = new Date(Date.now() - graceMs);
    const stale = await this.prisma.$queryRaw<{ id: string; user_id: string }[]>`
      SELECT qs.id, qs.user_id
      FROM quiz_sessions qs
      WHERE qs.status = 'in_progress'
        AND (qs.exam_id IS NOT NULL OR qs.archive_exam_id IS NOT NULL)
        AND (qs.deadline_at IS NOT NULL OR qs.planned_duration_seconds IS NOT NULL)
        AND COALESCE(qs.deadline_at, qs.started_at + make_interval(secs => qs.planned_duration_seconds)) < ${cutoff}
      LIMIT 500`;
    if (stale.length === 0) return;
    let ok = 0;
    for (const row of stale) {
      try {
        await this.quiz.completeSession(row.user_id, row.id, 'timeout');
        ok++;
      } catch (e) {
        this.logger.warn(`Katılım kapatılamadı ${row.id}: ${(e as Error).message}`);
      }
    }
    this.logger.log(`Süresi dolan oturum teslim edildi: ${ok}/${stale.length}`);
  }

  /**
   * Takvimli pencere kapanışı: sıralamayı dondur, "sonuç açıklandı" bildir.
   * Yalnız son 7 günde kapanan pencereler: Doc 50 öncesi eski denemeler
   * dondurulmaz (sıralamaları canlı sorgudan okunmaya devam eder) ve kimseye
   * yıllar önceki deneme için bildirim gitmez.
   */
  @Cron('*/1 * * * *')
  async closeWindows() {
    const now = new Date();
    const exams = await this.prisma.exam.findMany({
      where: {
        status: 'published',
        deletedAt: null,
        publishMode: 'takvimli',
        rankingsComputedAt: null,
        endAt: {
          lt: new Date(now.getTime() - 15_000),
          gte: new Date(now.getTime() - 7 * 86_400_000),
        },
        pastExam: null,
      },
      select: { id: true, title: true, remindEnabled: true },
    });
    for (const e of exams) {
      try {
        // Önce açık oturumlar teslim edilsin (finalize cron'uyla yarışırsa idempotent).
        const open = await this.prisma.quizSession.findMany({
          where: { examId: e.id, status: 'in_progress' },
          select: { id: true, userId: true },
        });
        for (const s of open)
          await this.quiz.completeSession(s.userId, s.id, 'timeout').catch(() => undefined);
        await this.freezeRankings(e.id);
        if (e.remindEnabled) {
          const participants = await this.prisma.quizSession.findMany({
            where: { examId: e.id, attemptRole: 'official', status: 'completed' },
            select: { userId: true, id: true },
          });
          for (const p of participants) {
            const already = await this.prisma.examReminder.findUnique({
              where: {
                examId_userId_kind: { examId: e.id, userId: p.userId, kind: 'result_ready' },
              },
            });
            if (already?.sentAt) continue;
            await this.notifications
              .enqueue({
                userId: p.userId,
                category: 'exam',
                priority: 'normal',
                title: 'Sonucun açıklandı',
                body: `${e.title}: netin ve sıran hazır.`,
                deepLink: { target: 'exam_result', params: { sessionId: p.id } },
                channels: ['push', 'inbox'],
                dedupeKey: `exam:${e.id}:result_ready`,
                conversionEvent: 'exam_review',
                respectQuietHours: false,
              })
              .catch((err) =>
                this.logger.warn(`Sonuç bildirimi ${p.id}: ${(err as Error).message}`),
              );
            await this.prisma.examReminder.upsert({
              where: {
                examId_userId_kind: { examId: e.id, userId: p.userId, kind: 'result_ready' },
              },
              update: { sentAt: new Date() },
              create: { examId: e.id, userId: p.userId, kind: 'result_ready', sentAt: new Date() },
            });
          }
        }
      } catch (err) {
        this.logger.warn(`Pencere kapatılamadı ${e.id}: ${(err as Error).message}`);
      }
    }
  }

  /** Hatırlatmalar: 1 gün ve 1 saat önce (takvimli, remindEnabled). */
  @Cron('*/5 * * * *')
  async sendReminders() {
    const now = Date.now();
    const windows: { kind: 'day_before' | 'hour_before'; maxMs: number; label: string }[] = [
      { kind: 'day_before', maxMs: 24 * 3600_000, label: 'yarın' },
      { kind: 'hour_before', maxMs: 3600_000, label: '1 saat sonra' },
    ];
    for (const wnd of windows) {
      const due = await this.prisma.examReminder.findMany({
        where: {
          kind: wnd.kind,
          sentAt: null,
          exam: {
            status: 'published',
            deletedAt: null,
            remindEnabled: true,
            publishMode: 'takvimli',
            startAt: { gt: new Date(now), lte: new Date(now + wnd.maxMs) },
          },
        },
        include: { exam: { select: { title: true, startAt: true } } },
        take: 500,
      });
      for (const r of due) {
        const saat = new Intl.DateTimeFormat('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Istanbul',
        }).format(r.exam.startAt);
        await this.notifications
          .enqueue({
            userId: r.userId,
            category: 'exam',
            priority: wnd.kind === 'hour_before' ? 'high' : 'normal',
            title: `${r.exam.title} ${wnd.label} ${saat}'de`,
            body: '150 dakika kesintisiz zaman ayır; sınav bitene kadar giriş açık.',
            deepLink: { target: 'exam', params: { examId: r.examId } },
            channels: wnd.kind === 'day_before' ? ['push', 'inbox', 'email'] : ['push', 'inbox'],
            dedupeKey: `exam:${r.examId}:${wnd.kind}`,
            ttlHours: wnd.kind === 'hour_before' ? 1 : 24,
            respectQuietHours: wnd.kind !== 'hour_before',
          })
          .catch(() => undefined);
        await this.prisma.examReminder.update({
          where: { examId_userId_kind: { examId: r.examId, userId: r.userId, kind: r.kind } },
          data: { sentAt: new Date() },
        });
      }
    }
  }

  // ── Sınav sonrası serbest soru görüntüleme (cevapsız) ──
  async browseQuestions(examId: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, status: 'published', deletedAt: null },
    });
    if (!exam) throw new NotFoundException('Deneme bulunamadı.');
    if (!exam.questionsOpenAfterEnd || availabilityOf(this.window(exam)) !== 'closed') {
      throw new ForbiddenException({
        code: 'QUESTIONS_NOT_OPEN',
        message: 'Bu denemenin soruları görüntülemeye açık değil.',
      });
    }
    return {
      examId,
      title: exam.title,
      questions: await this.examQuestions(examId, { withAnswers: false }),
    };
  }

  // ── Genel liderlik (eski lider-tablosu): resmî çözümlerin ortalaması ──
  async globalLeaderboard(user?: AuthenticatedUser) {
    const rows = await this.prisma.$queryRaw<
      {
        user_id: string;
        display_name: string;
        avatar_url: string | null;
        avg_score: number;
        attempts: number;
        total_correct: number;
      }[]
    >`
      SELECT qs.user_id, u.display_name, u.avatar_url,
             AVG(qs.score)::float AS avg_score,
             COUNT(*)::int AS attempts,
             SUM(qs.correct_count)::int AS total_correct
      FROM quiz_sessions qs
      JOIN users u ON u.id = qs.user_id AND u.deleted_at IS NULL
      JOIN exams e ON e.id = qs.exam_id AND e.deleted_at IS NULL
      WHERE qs.mode = 'deneme' AND qs.status = 'completed' AND qs.attempt_role = 'official'
      GROUP BY qs.user_id, u.display_name, u.avatar_url
      ORDER BY avg_score DESC, attempts DESC`;
    const ranked = rows.map((r, i) => ({
      rank: i + 1,
      displayName: r.display_name,
      name: rankingName(r.display_name),
      avatarUrl: r.avatar_url,
      avgScore: Math.round(r.avg_score * 100) / 100,
      attempts: r.attempts,
      totalCorrect: r.total_correct,
      isMe: user ? r.user_id === user.id : false,
    }));
    const me = ranked.find((x) => x.isMe) ?? null;
    return { top: ranked.slice(0, 100), me, participantCount: ranked.length };
  }

  // ── Yardımcı: sabitlenmiş sürümlerden soru yükü ──
  private async sessionQuestions(questionOrder: unknown) {
    const ids = Array.isArray(questionOrder) ? (questionOrder as string[]) : [];
    if (ids.length === 0) return [];
    const versions = await this.prisma.questionVersion.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        questionId: true,
        stem: true,
        mediaUrl: true,
        explanation: true,
        sourceLabel: true,
        options: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, label: true, text: true, isCorrect: true },
        },
      },
    });
    const byId = new Map(versions.map((v) => [v.id, v]));
    return ids.flatMap((id, i) => {
      const v = byId.get(id);
      if (!v) return [];
      return [
        {
          order: i + 1,
          questionId: v.questionId,
          versionId: v.id,
          stem: v.stem,
          mediaUrl: v.mediaUrl,
          explanation: v.explanation ?? null,
          source: v.sourceLabel ?? null,
          options: v.options,
        },
      ];
    });
  }

  async examQuestions(examId: string, opts: { withAnswers: boolean }) {
    const rows = await this.prisma.examQuestion.findMany({
      where: { examId },
      orderBy: { sortOrder: 'asc' },
      include: {
        questionVersion: {
          select: {
            id: true,
            questionId: true,
            stem: true,
            mediaUrl: true,
            explanation: opts.withAnswers,
            sourceLabel: opts.withAnswers,
            legalReferences: opts.withAnswers ? { select: { citation: true }, take: 1 } : false,
            options: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, label: true, text: true, isCorrect: opts.withAnswers },
            },
          },
        },
      },
    });
    return rows.map((r, i) => ({
      order: i + 1,
      questionId: r.questionId,
      versionId: r.questionVersionId,
      stem: r.questionVersion.stem,
      mediaUrl: r.questionVersion.mediaUrl,
      explanation: opts.withAnswers
        ? ((r.questionVersion as { explanation?: string | null }).explanation ?? null)
        : undefined,
      source: opts.withAnswers
        ? ((r.questionVersion as { sourceLabel?: string | null }).sourceLabel ?? null)
        : undefined,
      legalReference: opts.withAnswers
        ? ((r.questionVersion as { legalReferences?: { citation: string }[] }).legalReferences?.[0]
            ?.citation ?? null)
        : undefined,
      options: r.questionVersion.options,
    }));
  }
}

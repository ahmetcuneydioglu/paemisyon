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
// Ağırlıklı kota + konu-dengeli seçim admin autofill ile ORTAK saf mantık.
import {
  allocateQuota,
  pickSectionQuestions,
  type CandidateQuestion,
} from '../admin/exams/exam-autofill.logic';
import { dailyQuestionPoolWhere, pickDailyIds } from '../../common/daily-select.logic';
import { FREE_DAILY_LIMIT_FALLBACK } from '../../common/plan.constants';
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

    // Arşiv denemesi (Doc 18 devamı): biten denemenin SABİTLENMİŞ seti,
    // pratik olarak — resmî sıralamaya girmez, tekrarlanabilir.
    if (dto.archiveExamId != null) {
      if (dto.mode !== 'exam' || dto.topicId != null || dto.courseId != null) {
        throw new BadRequestException(
          'Arşiv denemesi yalnız mode=exam ile ve kapsamsız başlatılır.',
        );
      }
      return this.startArchiveExam(user, dto.archiveExamId);
    }

    // Kişisel deneme: hedef sınavın müfredat ağırlıklarıyla, süreli set.
    if (dto.personalExam === true) {
      if (dto.mode !== 'exam' || dto.topicId != null || dto.courseId != null) {
        throw new BadRequestException(
          'Kişisel deneme yalnız mode=exam ile ve kapsamsız başlatılır.',
        );
      }
      return this.startPersonalExam(user, dto.questionCount ?? 100);
    }

    // Tek soruluk bildirim turu (Faz 2): panelden gönderilen push'un
    // hedefi. Practice kurallarıyla çalışır — cevap SONRASI açıklama görünür,
    // istatistiklere normal işlenir; anahtar önceden sızmaz.
    if (dto.questionId != null) {
      return this.startSingleQuestion(userId, dto.questionId, dto.source);
    }

    // Günün sorusu: kapsamsız özel akış (deterministik, günde 1 hak).
    if (dto.mode === 'daily') {
      if (dto.topicId != null || dto.courseId != null) {
        throw new BadRequestException('Günün sorusu kapsam almaz (topicId/courseId verilmez).');
      }
      return this.startDailySession(userId, dto.source);
    }

    // Kapsam kuralları (Doc 25 §5 — Odak modeli):
    // exam: konu VEYA ders zorunlu (süre havuza göre kurulur).
    // practice: konu / ders / KAPSAMSIZ (karışık — İlk Devriye ve koç turu).
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

    // HEDEF SINAV KAPSAMI (kullanıcı isteği: PAEM hedefleyene Misyon konusu
    // gelmesin): kapsamsız koç turu ve yanlış tekrarı, kullanıcının hedef
    // sınavının (preferredModule) müfredatıyla sınırlanır. Hedef seçilmemişse
    // eski davranış (tüm müfredat). Kütüphaneden BİLİNÇLİ konu/ders seçimi
    // filtrelenmez — kullanıcı ne istediğini biliyor.
    const needsModuleScope =
      dto.mode === 'review' || (dto.topicId == null && dto.courseId == null);
    const preferredModuleId = needsModuleScope
      ? (
          await this.prisma.user.findUnique({
            where: { id: userId },
            select: { preferredModuleId: true },
          })
        )?.preferredModuleId ?? null
      : null;
    const moduleSection = preferredModuleId
      ? { deletedAt: null, examTypeId: preferredModuleId }
      : { deletedAt: null };

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
        // Madde Atlası: maddeden tur — havuz tek maddeye daralır.
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
      // Kapsamsız karışık (İlk Devriye / koç turu): tüm MÜFREDAT havuzu —
      // yalnız bir sınav bölümüne bağlı derslerin konuları (Doc 21).
      poolWhere = {
        deletedAt: null,
        currentVersionId: { not: null },
        topic: {
          deletedAt: null,
          ...(isPremiumUser ? {} : { isPremium: false }),
          course: {
            deletedAt: null,
            sections: { some: { section: moduleSection } },
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
          topic: {
            ...(isPremiumUser ? {} : { isPremium: false }),
            ...(preferredModuleId
              ? { course: { sections: { some: { section: moduleSection } } } }
              : {}),
          },
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

      // TAZELİK (kullanıcı talebi): art arda turlarda aynı sorular gelmesin.
      // Havuz "hiç görülmemiş" ve "görülmüş" diye ayrılır; seçim önce
      // görülmemişten yapılır. Deneme (exam) hariç: onun seti kendi kuralıyla
      // kurulur ve tekrar çözülebilir olması kasıtlıdır.
      const fresh =
        dto.mode === 'exam' ? null : await this.splitBySeen(userId, pool);

      // Kapsamsız practice = KOÇ SEANSI (Doc 25 §5): karışım motoru reçete kurar.
      // Ders kapsamı = konular arasında dengeli tur; tek konu havuzu baskılamaz.
      // Tek konu ve deneme oturumları rastgele seçime devam eder.
      if (dto.mode === 'practice' && dto.topicId == null && dto.courseId == null) {
        // Koç turunun "yanlış turu" dilimi görülmüş sorulara muhtaç:
        // havuzu daraltmak reçeteyi bozar, yalnız yeterli taze varsa daraltılır.
        const coachPool =
          fresh && fresh.unseen.length >= count ? fresh.unseen : pool;
        chosen = await this.pickCoachMix(userId, coachPool, count);
      } else if (dto.mode === 'practice' && dto.courseId != null) {
        const balancePool =
          fresh && fresh.unseen.length >= count ? fresh.unseen : pool;
        chosen = pickTopicBalanced(balancePool, count, (items) =>
          this.shuffle(items),
        );
      } else if (fresh) {
        // Önce görülmemişler; yetmezse en ESKİ görülenlerle tamamlanır
        // (en son çözülen soru en son geri gelir).
        chosen = this.shuffle(fresh.unseen).slice(0, count);
        if (chosen.length < count) {
          chosen = [...chosen, ...fresh.seenOldestFirst.slice(0, count - chosen.length)];
        }
      } else {
        chosen = this.shuffle(pool).slice(0, count);
      }
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

  /**
   * Kişisel deneme (Doc 18 devamı — "bana özel deneme"): randevu beklemeden,
   * kullanıcının HEDEF sınavının bölüm ağırlıklarına (ExamSection.weightPercent)
   * göre kurulmuş, süreli, gerçek formatta set. Resmî sıralamaya girmez
   * (examId yok, mode=exam). Kullanıcının GÖRMEDİĞİ sorular önceliklidir;
   * free kullanıcıya premium konu soruları dahil edilmez.
   */
  private async startPersonalExam(user: AuthenticatedUser, count: number) {
    const profile = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { preferredModuleId: true },
    });
    if (!profile?.preferredModuleId) {
      throw new BadRequestException(
        'Kişisel deneme için önce hedef sınavını seç (Profil → Ayarlar).',
      );
    }

    const sections = await this.prisma.examSection.findMany({
      where: { examTypeId: profile.preferredModuleId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: { courses: { select: { courseId: true } } },
    });
    if (sections.length === 0) {
      throw new NotFoundException('Hedef sınavın müfredatı henüz tanımlı değil.');
    }

    // Kullanıcının daha önce cevapladığı sorular — görmediği soru önceliklidir.
    const seenRows = await this.prisma.quizAnswer.findMany({
      where: { session: { userId: user.id } },
      select: { questionId: true },
      distinct: ['questionId'],
    });
    const seen = new Set(seenRows.map((r) => r.questionId));

    const claimed = new Set<string>();
    const pools = await Promise.all(
      sections.map(async (s) => {
        const courseIds = s.courses.map((c) => c.courseId);
        if (courseIds.length === 0)
          return { section: s, candidates: [] as CandidateQuestion[] };
        const rows = await this.prisma.question.findMany({
          where: {
            deletedAt: null,
            currentVersionId: { not: null },
            topic: {
              courseId: { in: courseIds },
              deletedAt: null,
              ...(user.isPremium ? {} : { isPremium: false }),
            },
          },
          select: { id: true, topicId: true, currentVersionId: true },
        });
        return {
          section: s,
          candidates: rows.map((r) => ({
            questionId: r.id,
            usageCount: seen.has(r.id) ? 1 : 0,
            topicId: r.topicId,
          })),
          versionOf: new Map(rows.map((r) => [r.id, r.currentVersionId!])),
        };
      }),
    );
    // Ders paylaşan bölümlerde aynı soru iki kez seçilmesin.
    for (const p of pools) {
      p.candidates = p.candidates.filter((c) => {
        if (claimed.has(c.questionId)) return false;
        claimed.add(c.questionId);
        return true;
      });
    }

    const quota = allocateQuota(
      pools.map((p) => ({
        sectionId: p.section.id,
        weight: p.section.weightPercent,
        available: p.candidates.length,
      })),
      count,
    );
    const chosenIds: { questionId: string; versionId: string }[] = [];
    for (const p of pools) {
      const picked = pickSectionQuestions(
        p.candidates,
        quota.get(p.section.id) ?? 0,
      );
      for (const id of picked) {
        const v = (p as { versionOf?: Map<string, string> }).versionOf?.get(id);
        if (v) chosenIds.push({ questionId: id, versionId: v });
      }
    }
    if (chosenIds.length === 0) {
      throw new NotFoundException('Hedef sınavın derslerinde yayında soru yok.');
    }

    const versions = await this.prisma.questionVersion.findMany({
      where: { id: { in: chosenIds.map((c) => c.versionId) } },
      select: {
        id: true,
        questionId: true,
        stem: true,
        mediaUrl: true,
        options: {
          select: { id: true, label: true, text: true }, // anahtar sızmaz
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    const byId = new Map(versions.map((v) => [v.id, v]));

    const plannedDurationSeconds =
      chosenIds.length * QuizService.EXAM_SECONDS_PER_QUESTION;
    const session = await this.prisma.quizSession.create({
      data: {
        userId: user.id,
        mode: 'exam',
        totalQuestions: chosenIds.length,
        plannedDurationSeconds,
        questionOrder: chosenIds.map((c) => c.versionId),
      },
    });

    return {
      sessionId: session.id,
      mode: session.mode,
      plannedDurationSeconds,
      questions: chosenIds.map((c) => {
        const v = byId.get(c.versionId)!;
        return {
          questionId: v.questionId,
          versionId: v.id,
          stem: v.stem,
          mediaUrl: v.mediaUrl,
          options: v.options,
        };
      }),
    };
  }

  /**
   * Arşiv denemesi oturumu: pencere KAPANMIŞ, yayındaki denemenin yayın
   * anında sabitlenmiş soru seti — orijinal sırada, planlı süreli (mode=exam).
   * examId oturuma YAZILMAZ: canlı katılım tekilliği (userId, examId) ve
   * genel liderlik (mode='deneme') bilerek dışarıda kalır.
   */
  private async startArchiveExam(user: AuthenticatedUser, examId: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, status: 'published', deletedAt: null },
    });
    if (!exam) throw new NotFoundException('Deneme bulunamadı.');
    const endAt = new Date(exam.startAt.getTime() + exam.durationMinutes * 60_000);
    if (new Date() < endAt) {
      throw new BadRequestException(
        'Bu deneme henüz arşivde değil — canlı pencere sürüyor, oradan katıl.',
      );
    }
    if (exam.isPremium && !user.isPremium) {
      throw new ForbiddenException({
        code: 'PREMIUM_REQUIRED',
        message: 'Bu deneme premium üyelere özeldir.',
      });
    }

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
            options: {
              select: { id: true, label: true, text: true }, // anahtar sızmaz
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });
    if (rows.length === 0) throw new NotFoundException('Denemenin soru seti boş.');

    const plannedDurationSeconds = exam.durationMinutes * 60;
    const session = await this.prisma.quizSession.create({
      data: {
        userId: user.id,
        mode: 'exam',
        totalQuestions: rows.length,
        plannedDurationSeconds,
        questionOrder: rows.map((r) => r.questionVersion.id),
      },
    });

    return {
      sessionId: session.id,
      mode: session.mode,
      plannedDurationSeconds,
      questions: rows.map((r) => ({
        questionId: r.questionVersion.questionId,
        versionId: r.questionVersion.id,
        stem: r.questionVersion.stem,
        mediaUrl: r.questionVersion.mediaUrl,
        options: r.questionVersion.options,
      })),
    };
  }

  // ── Günün Quizi (Doc 13 V1 — eski daily_quiz'in modern hali) ──
  // 10 karışık soru, PAEM MÜFREDATININ tamamından (Doc 21: bölümlere bağlı
  // dersler); günde 1 hak; herkese aynı set (tarih tohumlu → adil liderlik).
  // Seçim mantığı common/daily-select.logic'te — public "Günün Quizi" ile ortak.
  private async startDailySession(userId: string, source?: string) {
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

    // Yarım kalan oturum → sorular oturumda SAKLANAN sıradan servis edilir.
    // (Tarih tohumu deterministik olsa da HAVUZ gün içinde değişebilir —
    // yeni soru yayınlanınca aynı tohum farklı set üretir; taze seçim
    // yapılsaydı ekrandaki sorular oturumun questionOrder'ıyla çelişir ve
    // cevaplar üyelik denetimine takılırdı. Canlıda yaşandı.)
    const existingOrder =
      existing != null && Array.isArray(existing.questionOrder)
        ? (existing.questionOrder as string[])
        : null;
    const questions =
      existingOrder != null && existingOrder.length > 0
        ? await this.questionsFromVersionIds(existingOrder)
        : await this.pickDailyQuestions();

    const session =
      existing ??
      (await this.prisma.quizSession.create({
        data: {
          userId,
          mode: 'daily',
          totalQuestions: questions.length,
          questionOrder: questions.map((q) => q.versionId),
          source,
        },
      }));
    return {
      sessionId: session.id,
      mode: 'daily' as const,
      plannedDurationSeconds: null,
      questions,
    };
  }

  /** Tek soruluk tur (bildirim derin bağlantısı): yayındaki soru practice
   *  kurallarıyla açılır — çöz → anlık geri bildirim + açıklama. */
  private async startSingleQuestion(userId: string, questionId: string, source?: string) {
    const q = await this.prisma.question.findFirst({
      where: { id: questionId, deletedAt: null, currentVersionId: { not: null } },
      select: { id: true, topicId: true, currentVersionId: true },
    });
    if (!q) throw new NotFoundException('Soru bulunamadı ya da yayında değil.');
    const questions = await this.questionsFromVersionIds([q.currentVersionId!]);
    const session = await this.prisma.quizSession.create({
      data: {
        userId,
        mode: 'practice',
        topicId: q.topicId,
        totalQuestions: 1,
        questionOrder: [q.currentVersionId!],
        source,
      },
    });
    return {
      sessionId: session.id,
      mode: 'practice' as const,
      plannedDurationSeconds: null,
      questions,
    };
  }

  /** Saklanan questionOrder'daki sürümleri, sırayı koruyarak soru listesine
   *  çevirir (resume ile aynı seçim — anahtar SIZMAZ). */
  private async questionsFromVersionIds(versionIds: string[]) {
    const versions = await this.prisma.questionVersion.findMany({
      where: { id: { in: versionIds } },
      select: {
        id: true,
        questionId: true,
        stem: true,
        mediaUrl: true,
        options: {
          select: { id: true, label: true, text: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    const byId = new Map(versions.map((v) => [v.id, v]));
    return versionIds
      .map((vid) => byId.get(vid))
      .filter((v): v is NonNullable<typeof v> => v != null)
      .map((v) => ({
        questionId: v.questionId,
        versionId: v.id,
        stem: v.stem,
        mediaUrl: v.mediaUrl,
        options: v.options,
      }));
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
          // Soru–oturum üyelik denetimi (güvenlik): yalnız bu oturuma
          // ATANMIŞ sürümler cevaplanabilir. Aksi halde bir practice oturumuna
          // canlı denemenin versionId'leri POST edilip cevap anahtarı +
          // açıklama sızdırılabiliyordu (tüm soru bankası dahil).
          questionOrder: true,
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
            select: { articleNo: true, topic: { select: { id: true, name: true } } },
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
    // Üyelik denetimi: sürüm gerçekten bu oturumun soru setinde mi? (Güvenlik —
    // cevap anahtarı sızıntısını kapatır; questionOrder start/resume'da sabit.)
    // questionOrder null olan ESKİ oturumlar denetimden muaf (kilitlenmesin);
    // yeni oturumların hepsinde dolu.
    const order = session.questionOrder;
    if (
      Array.isArray(order) &&
      order.length > 0 &&
      !(order as string[]).includes(dto.questionVersionId)
    ) {
      throw new BadRequestException('Soru bu oturuma ait değil.');
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

    // Geri bildirim verilecek mi? exam: asla; deneme: yalnız liveAnswerReveal
    // açık denemelerde (Doc 18 karar 5, varsayılan KAPALI — pencere açıkken
    // anahtar SIZDIRILMAZ).
    const givesFeedback =
      session.mode !== 'exam' &&
      !(session.mode === 'deneme' && !session.exam?.liveAnswerReveal);
    const question = version.question;
    const needsArticle =
      givesFeedback &&
      question?.articleNo != null &&
      question.topic != null &&
      LAW_NAME_RE.test(question.topic.name);

    // PERFORMANS: madde metni okuması kayıtla PARALEL — kritik yolda bir
    // pooler gidiş-dönüşü (~60ms) eksilir. Yalnız YAYINLANMIŞ metin sızar.
    const [, law] = await Promise.all([
      this.prisma.quizAnswer.upsert({
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
      }),
      needsArticle
        ? this.prisma.lawArticle.findFirst({
            where: {
              topicId: question!.topic!.id,
              articleNo: question!.articleNo!,
              status: 'published',
              deletedAt: null,
            },
            select: {
              text: true,
              sourceName: true,
              sourceUrl: true,
              effectiveInfo: true,
              lastVerifiedAt: true,
            },
          })
        : Promise.resolve(null),
    ]);

    if (!givesFeedback) {
      return { recorded: true };
    }
    let relatedArticle: {
      lawSlug: string;
      no: string;
      slug: string;
      /** Yayınlanmış resmî madde metni (Doc 25 §4) — çözdükten sonra açıklama
       *  yanında gösterilir. Metin yoksa (girilmemiş/taslak) null. */
      text: {
        body: string;
        source: string;
        sourceUrl: string | null;
        effectiveInfo: string | null;
        verifiedAt: string | null;
      } | null;
    } | null = null;
    if (needsArticle) {
      relatedArticle = {
        lawSlug: slugify(question!.topic!.name),
        no: question!.articleNo!,
        slug: articleSlug(question!.articleNo!),
        text: law
          ? {
              body: law.text,
              source: law.sourceName,
              sourceUrl: law.sourceUrl,
              effectiveInfo: law.effectiveInfo,
              verifiedAt: law.lastVerifiedAt?.toISOString() ?? null,
            }
          : null,
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

    // Yalnız oturumun soru setindeki cevaplar sayılır (savunma derinliği —
    // submitAnswer üyelik denetimiyle birlikte skor/XP/liderlik şişirmesini
    // engeller; eski/kirli veri de totalQuestions'ı aşamaz). questionOrder
    // null olan eski oturumlarda tüm cevaplar geçerli sayılır.
    const order = session.questionOrder;
    const orderSet =
      Array.isArray(order) && order.length > 0 ? new Set(order as string[]) : null;
    const validAnswers = orderSet
      ? session.answers.filter((a) => orderSet.has(a.questionVersionId))
      : session.answers;
    const correctCount = Math.min(
      validAnswers.filter((a) => a.isCorrect === true).length,
      session.totalQuestions,
    );
    const wrongCount = Math.min(
      validAnswers.filter((a) => a.isCorrect === false && a.selectedOptionId != null)
        .length,
      session.totalQuestions - correctCount,
    );
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
    // PERFORMANS: rozet ve konu-karnesi okumaları birbirinden bağımsız —
    // paralel koşar (kritik yoldan bir gidiş-dönüş daha eksilir).
    const needsBreakdown = session.topicId == null && session.answers.length > 0;
    const [earnedBadges, qTopics] = await Promise.all([
      this.badges.checkAndAward(userId).catch(
        () => [] as Awaited<ReturnType<BadgeService['checkAndAward']>>,
        /* sessiz: kutlama kaçar ama sonuç kaybolmaz */
      ),
      needsBreakdown
        ? this.prisma.question.findMany({
            where: { id: { in: session.answers.map((a) => a.questionId) } },
            select: { id: true, topic: { select: { id: true, name: true } } },
          })
        : Promise.resolve(null),
    ]);

    // Konu karnesi: çok-konulu oturumlarda (ders denemesi, karışık koç turu,
    // İlk Devriye) konu bazında doğru/toplam kırılımı (Doc 12 §7, Doc 24 Gün 0).
    let topicBreakdown:
      { topicId: string; topicName: string; correct: number; total: number }[] | null = null;
    if (qTopics) {
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
   * Devam eden tur çapası (Doc 27 §2.4, Doc 25 §7 emniyet 3): kullanıcının
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
    const limit = freePlan?.dailyQuestionLimit ?? FREE_DAILY_LIMIT_FALLBACK;
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
   * Havuzu "hiç çözülmemiş" ve "çözülmüş" diye ayırır (tazelik).
   *
   * Çözülmüşler EN ESKİ ÇÖZÜLEN ÖNCE sıralanır: banka tükenince geri dönen
   * sorular en uzun süredir görülmeyenler olur — hem tekrar hissi azalır hem
   * unutma eğrisine denk gelir. Sadece bu kullanıcının cevapları sayılır.
   */
  private async splitBySeen<
    T extends { id: string; currentVersionId: string | null; topicId: string },
  >(
    userId: string,
    pool: T[],
  ): Promise<{ unseen: T[]; seenOldestFirst: T[] }> {
    const seen = await this.prisma.quizAnswer.groupBy({
      by: ['questionId'],
      where: { questionId: { in: pool.map((q) => q.id) }, session: { userId } },
      _max: { answeredAt: true },
    });
    if (seen.length === 0) return { unseen: pool, seenOldestFirst: [] };

    const lastSeen = new Map(
      seen.map((s) => [s.questionId, s._max.answeredAt?.getTime() ?? 0]),
    );
    const unseen: T[] = [];
    const seenItems: T[] = [];
    for (const q of pool) {
      (lastSeen.has(q.id) ? seenItems : unseen).push(q);
    }
    seenItems.sort((a, b) => (lastSeen.get(a.id) ?? 0) - (lastSeen.get(b.id) ?? 0));
    return { unseen, seenOldestFirst: seenItems };
  }

  /**
   * Koç turu karışımı (Doc 24 §9, Doc 25 §5 — saf mantık session-mix.logic).
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

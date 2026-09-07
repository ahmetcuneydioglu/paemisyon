import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { AuditService } from '../audit.service';
import type { AuthenticatedUser } from '../../auth/auth.types';

/**
 * Çıkmış sınav yönetimi (Doc 36) — panel tarafı.
 *
 * Panel iki şeyi yönetir: dönemin yayın durumu ve hangi soruların public
 * sayfada tam metniyle görüneceği. Soruların kendisi normal soru yönetiminden
 * geçer; burada içerik düzenlenmez.
 */
/**
 * "Bu dönem uygulamada çözülebilir mi, değilse NEDEN?" (Doc 36 §7.2).
 *
 * Panelde açıkça yazılması gerekiyor: "yayına aldım ama uygulamada
 * çözülemiyor" sorusunun cevabı dört ayrı yerde saklıydı (tür, yayın durumu,
 * soru sürümleri, motor bağı) ve kimse hepsini akılda tutamaz.
 */
export function cozulebilirlikHesapla(s: {
  kind: string;
  status: string;
  examId: string | null;
  questions: {
    cancelled: boolean;
    question: { currentVersion: { status: string } | null };
  }[];
}) {
  const yayindaSoru = s.questions.filter(
    (q) => !q.cancelled && q.question.currentVersion?.status === 'published',
  ).length;
  const engeller: string[] = [];
  if (s.kind !== 'resmi') {
    engeller.push(
      'Tür "konu analizi" — bu dönemin soruları yok, yalnız dağılım yayımlanır.',
    );
  }
  if (s.status !== 'published') engeller.push('Dönem yayına alınmamış.');
  if (yayindaSoru === 0) engeller.push('Yayına alınmış (onaylanmış) sorusu yok.');
  if (!s.examId) {
    engeller.push(
      'Deneme motoruna bağlı değil — "Sınav gibi çöz" için gerekli. Aşağıdaki düğmeyle bağlanır.',
    );
  }
  return {
    cozulebilir: engeller.length === 0,
    /** Motora bağlanabilir mi (düğme etkin mi)? */
    motoraBaglanabilir: s.kind === 'resmi' && !s.examId && yayindaSoru > 0,
    yayindaSoru,
    iptalSoru: s.questions.filter((q) => q.cancelled).length,
    engeller,
  };
}

/** quiz.service'teki EXAM_SECONDS_PER_QUESTION ile aynı ölçü. */
const SANIYE_SORU = 75;

@Injectable()
export class AdminPastExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list() {
    const sinavlar = await this.prisma.pastExam.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }],
      include: {
        questions: {
          select: {
            publicly: true,
            cancelled: true,
            question: { select: { currentVersion: { select: { status: true, explanation: true } } } },
          },
        },
      },
    });
    return sinavlar.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      institution: s.institution,
      term: s.term,
      heldOn: s.heldOn,
      kind: s.kind,
      status: s.status,
      isPremium: s.isPremium,
      questionCount: s.questionCount,
      /** Bankaya bağlı soru sayısı — `analiz` türünde 0'dır. */
      linked: s.questions.length,
      publicCount: s.questions.filter((q) => q.publicly).length,
      cancelledCount: s.questions.filter((q) => q.cancelled).length,
      /** Public sayfaya çıkmaya HAZIR soru: yayında ve açıklaması var. */
      readyCount: s.questions.filter(
        (q) => q.question.currentVersion?.status === 'published' && q.question.currentVersion?.explanation,
      ).length,
      /** Public işaretli ama henüz yayına girmemiş soru — sayfada görünmez. */
      publicNotLive: s.questions.filter(
        (q) => q.publicly && q.question.currentVersion?.status !== 'published',
      ).length,
    }));
  }

  async detail(id: string) {
    const s = await this.prisma.pastExam.findFirst({
      where: { id, deletedAt: null },
      include: {
        questions: {
          orderBy: { orderNo: 'asc' },
          include: {
            question: {
              select: {
                id: true,
                topic: { select: { name: true, course: { select: { name: true } } } },
                currentVersion: { select: { stem: true, status: true, explanation: true } },
              },
            },
          },
        },
      },
    });
    if (!s) throw new NotFoundException('Çıkmış sınav bulunamadı.');
    return {
      id: s.id,
      cozulebilirlik: cozulebilirlikHesapla(s),
      slug: s.slug,
      name: s.name,
      institution: s.institution,
      term: s.term,
      heldOn: s.heldOn,
      kind: s.kind,
      status: s.status,
      examId: s.examId,
      isPremium: s.isPremium,
      summary: s.summary,
      questionCount: s.questionCount,
      sortOrder: s.sortOrder,
      analysis: s.analysis,
      questions: s.questions.map((q) => ({
        questionId: q.question.id,
        orderNo: q.orderNo,
        cancelled: q.cancelled,
        publicly: q.publicly,
        course: q.question.topic.course.name,
        topic: q.question.topic.name,
        stem: q.question.currentVersion?.stem.slice(0, 160) ?? '',
        versionStatus: q.question.currentVersion?.status ?? null,
        hasExplanation: !!q.question.currentVersion?.explanation,
      })),
    };
  }

  /**
   * "Bu dönem uygulamada çözülebilir mi, değilse NEDEN?" (Doc 36 §7.2).
   *
   * Panelde açıkça yazılması gerekiyor: "yayına aldım ama uygulamada
   * çözülemiyor" sorusunun cevabı dört ayrı yerde saklıydı (tür, yayın
   * durumu, soru sürümleri, motor bağı) ve kimse hepsini akılda tutamaz.
   */

  /**
   * Dönemi deneme motoruna bağlar — "Sınav gibi çöz" bundan sonra çalışır.
   *
   * Mevcut arşiv akışı istenen semantiği zaten taşıyor: sabit set, süreli,
   * tekrarlanabilir, resmî sıralamaya girmez. Tek gereken dönem için bir
   * `Exam` kaydı ve sabitlenmiş soru sürümleri.
   *
   * Süre uygulamanın kendi ölçüsünden türetilir (soru başına 75 sn) — resmî
   * süreyi bilmiyoruz, uydurmuyoruz. İPTAL edilen sorular sete GİRMEZ:
   * puanlanmayan soruyu puanlamak adayın netini yanlış hesaplamak olur.
   *
   * (Aynı iş `scripts/cikmis-sinav-motora-bagla.ts` ile de yapılabilir;
   * mantık burada tek kaynaktan yürüsün diye panele taşındı.)
   */
  async motoraBagla(actor: AuthenticatedUser, id: string) {
    const sinav = await this.prisma.pastExam.findFirst({
      where: { id, deletedAt: null },
      include: {
        questions: {
          orderBy: { orderNo: 'asc' },
          include: {
            question: {
              select: {
                currentVersionId: true,
                currentVersion: { select: { status: true } },
              },
            },
          },
        },
      },
    });
    if (!sinav) throw new NotFoundException('Çıkmış sınav bulunamadı.');
    if (sinav.kind !== 'resmi') {
      throw new BadRequestException('Yalnız resmî sınavlar motora bağlanır.');
    }
    if (sinav.examId) {
      throw new BadRequestException('Bu dönem zaten motora bağlı.');
    }

    const set = sinav.questions.filter(
      (q) =>
        !q.cancelled &&
        q.question.currentVersionId != null &&
        q.question.currentVersion?.status === 'published',
    );
    if (set.length === 0) {
      throw new BadRequestException(
        'Sette yayına alınmış soru yok — önce soruları onayla.',
      );
    }
    const dakika = Math.round((set.length * SANIYE_SORU) / 60);

    const exam = await this.prisma.$transaction(async (tx) => {
      const e = await tx.exam.create({
        data: {
          title: sinav.name,
          description:
            'Çıkmış sınav — sabit soru seti, süreli, tekrarlanabilir. Resmî sıralamaya girmez.',
          // Gerçek sınav tarihi: pencere çoktan kapalı olduğu için akış
          // doğrudan arşiv moduna düşer.
          startAt: sinav.heldOn ?? new Date('2020-01-01'),
          durationMinutes: dakika,
          isPremium: false,
          liveAnswerReveal: false,
          questionsOpenAfterEnd: true,
          // Çıkmış sınavda sızma riski yok: kitapçık resmî cevap anahtarıyla
          // zaten yayımlanmış durumda.
          archiveOpenAfterEnd: true,
          status: 'published',
          sortOrder: sinav.sortOrder,
        },
      });
      await tx.examQuestion.createMany({
        data: set.map((q, i) => ({
          examId: e.id,
          questionId: q.questionId,
          questionVersionId: q.question.currentVersionId!,
          sortOrder: i,
        })),
      });
      await tx.pastExam.update({ where: { id: sinav.id }, data: { examId: e.id } });
      return e;
    });

    await this.audit.log(actor, 'past_exam.engine_link', 'past_exam', id, {
      slug: sinav.slug,
      examId: exam.id,
      soru: set.length,
      dakika,
    });
    return { examId: exam.id, soru: set.length, dakika };
  }

  /** Dönem üstverisi ve yayın durumu. Soru içeriği buradan DEĞİŞTİRİLEMEZ. */
  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: {
      name?: string;
      summary?: string | null;
      status?: 'draft' | 'published' | 'archived';
      sortOrder?: number;
      isPremium?: boolean;
    },
  ) {
    const mevcut = await this.prisma.pastExam.findFirst({ where: { id, deletedAt: null }, select: { slug: true } });
    if (!mevcut) throw new NotFoundException('Çıkmış sınav bulunamadı.');
    const sinav = await this.prisma.pastExam.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.summary !== undefined ? { summary: dto.summary } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isPremium !== undefined ? { isPremium: dto.isPremium } : {}),
      },
    });
    await this.audit.log(actor, 'past_exam.update', 'past_exam', id, { slug: mevcut.slug, ...dto });
    return sinav;
  }

  /** Sorunun public sayfada görünürlüğü / iptal işareti. */
  async updateQuestion(
    actor: AuthenticatedUser,
    id: string,
    questionId: string,
    dto: { publicly?: boolean; cancelled?: boolean },
  ) {
    const kayit = await this.prisma.pastExamQuestion.findUnique({
      where: { pastExamId_questionId: { pastExamId: id, questionId } },
      select: { orderNo: true },
    });
    if (!kayit) throw new NotFoundException('Soru bu sınava bağlı değil.');
    const guncel = await this.prisma.pastExamQuestion.update({
      where: { pastExamId_questionId: { pastExamId: id, questionId } },
      data: {
        ...(dto.publicly !== undefined ? { publicly: dto.publicly } : {}),
        ...(dto.cancelled !== undefined ? { cancelled: dto.cancelled } : {}),
      },
    });
    await this.audit.log(actor, 'past_exam.question_update', 'past_exam', id, {
      questionId,
      orderNo: kayit.orderNo,
      ...dto,
    });
    return guncel;
  }
}

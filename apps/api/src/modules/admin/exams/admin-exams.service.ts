import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { AuditService } from '../audit.service';
import { UpsertExamDto } from '../dto/exam.dto';
import { allocateQuota, pickSectionQuestions } from './exam-autofill.logic';
import { bayraklariHesapla, tekrarEdenKokler } from './exam-review.logic';
import { PushService } from '../../notifications/push.service';

/**
 * Deneme yönetimi (Doc 18 §8). Kurallar:
 *  - Soru seti yalnız TASLAK'ta düzenlenir; YAYINDA sürümler sabitlenir
 *    (soru sonradan güncellense de deneme/geçmiş bozulmaz).
 *  - Yayından kaldırma yalnız katılım YOKKEN; katılım varsa arşivlenir.
 *  - Editor taslak hazırlar; yayın/arşiv YALNIZ admin (controller'da).
 */
@Injectable()
export class AdminExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly push: PushService,
  ) {}

  async list() {
    const exams = await this.prisma.exam.findMany({
      where: { deletedAt: null },
      orderBy: [{ startAt: 'desc' }],
      include: { _count: { select: { questions: true, sessions: true } } },
    });
    return exams.map((e) => ({
      id: e.id,
      title: e.title,
      startAt: e.startAt,
      durationMinutes: e.durationMinutes,
      isPremium: e.isPremium,
      status: e.status,
      questionCount: e._count.questions,
      attemptCount: e._count.sessions,
    }));
  }

  async detail(id: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id, deletedAt: null },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
          include: {
            question: {
              select: {
                id: true,
                topic: { select: { name: true, course: { select: { name: true } } } },
                currentVersion: { select: { stem: true } },
              },
            },
            questionVersion: { select: { stem: true, versionNo: true } },
          },
        },
        _count: { select: { sessions: true } },
      },
    });
    if (!exam) throw new NotFoundException('Deneme bulunamadı.');
    return {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      startAt: exam.startAt,
      durationMinutes: exam.durationMinutes,
      isPremium: exam.isPremium,
      liveAnswerReveal: exam.liveAnswerReveal,
      questionsOpenAfterEnd: exam.questionsOpenAfterEnd,
      status: exam.status,
      attemptCount: exam._count.sessions,
      questions: exam.questions.map((q, i) => ({
        order: i + 1,
        questionId: q.questionId,
        // Taslakta güncel yayın kökü gösterilir; yayında SABİTLENMİŞ sürüm.
        stem:
          exam.status === 'draft'
            ? (q.question.currentVersion?.stem ?? q.questionVersion.stem)
            : q.questionVersion.stem,
        pinnedVersionNo: q.questionVersion.versionNo,
        topicName: q.question.topic.name,
        courseName: q.question.topic.course.name,
      })),
    };
  }

  /**
   * Yayın öncesi GÖZDEN GEÇİRME (Doc 18 §8): setteki her sorunun TAM içeriği.
   *
   * Neden ayrı uç: `detail` yalnız kökü döndürüyordu, panel de onu tek satıra
   * kırpıyordu — 100 soruluk otomatik seti yayınlamadan önce okumak imkânsızdı.
   * 2 Eylül 2026 denemesinde müfredat dışı Türkçe soruları bu körlük yüzünden
   * yayına gitti. Yükü ağır (şıklar + açıklama + kullanım geçmişi), bu yüzden
   * hafif `detail`den ayrıldı.
   *
   * Bayraklar gözü doğru yere götürmek içindir, ENGEL DEĞİLDİR: kaynaksız soru
   * da denemeye girebilir (kullanıcı kararı) — yalnız işaretlenir.
   */
  async inceleme(id: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, title: true, status: true, startAt: true, durationMinutes: true },
    });
    if (!exam) throw new NotFoundException('Deneme bulunamadı.');

    const rows = await this.prisma.examQuestion.findMany({
      where: { examId: id },
      orderBy: { sortOrder: 'asc' },
      include: {
        question: {
          select: {
            id: true,
            articleNo: true,
            currentVersionId: true,
            topic: {
              select: { id: true, name: true, course: { select: { id: true, name: true } } },
            },
            _count: { select: { examQuestions: true } },
          },
        },
        questionVersion: {
          select: {
            id: true,
            versionNo: true,
            stem: true,
            mediaUrl: true,
            explanation: true,
            sourceLabel: true,
            options: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, label: true, text: true, isCorrect: true },
            },
          },
        },
      },
    });

    // Taslakta güncel sürüm gösterilir (yayında sürümler sabitlenir), bu yüzden
    // taslak için güncel sürümleri ayrıca çekeriz — panelde okunan metin, yayına
    // gidecek metnin AYNISI olmalı.
    const taslak = exam.status === 'draft';
    const guncelIds = rows
      .map((r) => r.question.currentVersionId)
      .filter((v): v is string => v != null && taslak);
    const guncel = guncelIds.length
      ? await this.prisma.questionVersion.findMany({
          where: { id: { in: guncelIds } },
          select: {
            id: true,
            questionId: true,
            versionNo: true,
            stem: true,
            mediaUrl: true,
            explanation: true,
            sourceLabel: true,
            options: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, label: true, text: true, isCorrect: true },
            },
          },
        })
      : [];
    const guncelOf = new Map(guncel.map((v) => [v.questionId, v]));

    // Yakın kullanım: aynı soru son denemelerde çıktıysa aday "bunu görmüştüm" der.
    const sonKullanim = await this.prisma.examQuestion.findMany({
      where: {
        questionId: { in: rows.map((r) => r.questionId) },
        examId: { not: id },
        exam: { deletedAt: null, status: 'published' },
      },
      select: { questionId: true, exam: { select: { title: true, startAt: true } } },
    });
    const sonOf = new Map<string, { title: string; startAt: Date }>();
    for (const k of sonKullanim) {
      const v = sonOf.get(k.questionId);
      if (!v || k.exam.startAt > v.startAt) sonOf.set(k.questionId, k.exam);
    }

    const sorular = rows.map((r, i) => {
      const v = (taslak ? guncelOf.get(r.questionId) : null) ?? r.questionVersion;
      const son = sonOf.get(r.questionId);
      const dersAdi = r.question.topic.course.name;
      return {
        order: i + 1,
        questionId: r.questionId,
        versionId: v.id,
        versionNo: v.versionNo,
        stem: v.stem,
        mediaUrl: v.mediaUrl,
        explanation: v.explanation,
        sourceLabel: v.sourceLabel,
        articleNo: r.question.articleNo,
        topicId: r.question.topic.id,
        topicName: r.question.topic.name,
        courseId: r.question.topic.course.id,
        courseName: dersAdi,
        options: v.options,
        // Bu deneme dahil kaç denemede kullanıldı.
        usageCount: r.question._count.examQuestions,
        lastUsedIn: son ? { title: son.title, startAt: son.startAt } : null,
      };
    });
    // Benzer kök yalnız SET İÇİNDE anlamlı — bütün köklerden sonra hesaplanır.
    const tekrarlayan = tekrarEdenKokler(sorular.map((q) => q.stem));

    return {
      exam,
      questionCount: sorular.length,
      // Ders bazlı dağılım — kota kontrolü panelde bunun üstünden yapılır.
      dersDagilimi: [...sorular.reduce((m, q) => m.set(q.courseName, (m.get(q.courseName) ?? 0) + 1), new Map<string, number>())]
        .map(([courseName, count]) => ({ courseName, count }))
        .sort((a, b) => b.count - a.count),
      questions: sorular.map((q) => ({
        ...q,
        bayraklar: bayraklariHesapla(
          {
            stem: q.stem,
            sourceLabel: q.sourceLabel,
            explanation: q.explanation,
            articleNo: q.articleNo,
            courseName: q.courseName,
            optionCorrectCount: q.options.filter((o) => o.isCorrect).length,
            usedBefore: q.lastUsedIn != null,
          },
          tekrarlayan,
        ),
      })),
    };
  }

  /**
   * Bir soruyu setten çıkarır; `yerineGetir` ise AYNI DERSTEN yenisini koyar.
   *
   * Yeni soru setteki AYNI SIRAYA girer — okurken liste altından kaymaz.
   *
   * İlk sürümde havuz "önce KONU, tükendiyse ders" idi ve pratikte kırıldı
   * (4 Eylül 2026, canlı deneme): konu havuzu dar. Örnek — "2576 Bölge İdare
   * Mahkemeleri Kanunu" konusunda 9 soru var, 2'si zaten sette, geriye 7 aday
   * kalıyordu. Üstüne seçim "az kullanılmış önce" sıralı: setten çıkarılan soru
   * kullanım sayısı düştüğü için ANINDA en iyi aday oluyordu. Sonuç, aynı 2-3
   * sorunun dönüp durması — kullanıcı "değiştirdiğim soru yine geliyor" diye
   * bildirdi, denetim kaydı da tam bu döngüyü gösterdi. Aynı derste havuz
   * 458 (429'u sette değil); konu yerine ders almak sorunu kökten çözer ve
   * "hangi alandan çıkardıysak o alandan gelsin" kuralına da uyar.
   *
   * İkinci koruma: bu denemeden BİR KEZ ÇIKARILAN soru geri önerilmez —
   * reddedilenler denetim kaydından okunur, sayfa yenilense de unutulmaz.
   */
  async replaceQuestion(
    actor: AuthenticatedUser,
    id: string,
    questionId: string,
    yerineGetir: boolean,
  ) {
    const exam = await this.exists(id);
    if (exam.status !== 'draft') {
      throw new BadRequestException('Soru seti yalnız taslak denemede düzenlenebilir.');
    }
    const mevcut = await this.prisma.examQuestion.findUnique({
      where: { examId_questionId: { examId: id, questionId } },
      include: { question: { select: { topic: { select: { courseId: true } } } } },
    });
    if (!mevcut) throw new NotFoundException('Bu soru denemede yok.');

    let yeni: { id: string; currentVersionId: string | null } | null = null;
    if (yerineGetir) {
      const settekiler = (
        await this.prisma.examQuestion.findMany({
          where: { examId: id },
          select: { questionId: true },
        })
      ).map((r) => r.questionId);
      const disari = [...new Set([...settekiler, ...(await this.reddedilenler(id))])];

      const adaylar = await this.prisma.question.findMany({
        where: {
          topic: { courseId: mevcut.question.topic.courseId },
          deletedAt: null,
          currentVersionId: { not: null },
          id: { notIn: disari },
        },
        select: { id: true, currentVersionId: true, _count: { select: { examQuestions: true } } },
      });
      if (adaylar.length === 0) {
        throw new BadRequestException(
          'Bu dersin bankasında sette olmayan ve daha önce çıkarılmamış soru kalmadı — elle soru ekle.',
        );
      }
      // Az kullanılmış öncelikli, eşitlikte rastgele (autofill ile aynı ilke).
      const [sec] = adaylar
        .map((a) => ({ a, r: Math.random() }))
        .sort((x, y) => x.a._count.examQuestions - y.a._count.examQuestions || x.r - y.r);
      yeni = { id: sec.a.id, currentVersionId: sec.a.currentVersionId };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.examQuestion.delete({
        where: { examId_questionId: { examId: id, questionId } },
      });
      if (yeni) {
        await tx.examQuestion.create({
          data: {
            examId: id,
            questionId: yeni.id,
            questionVersionId: yeni.currentVersionId!,
            sortOrder: mevcut.sortOrder, // aynı sıra — liste kaymaz
          },
        });
      }
    });
    await this.audit.log(
      actor,
      yeni ? 'exam.replace_question' : 'exam.remove_question',
      'exam',
      id,
      { cikarilan: questionId, eklenen: yeni?.id ?? null },
    );
    return this.inceleme(id);
  }

  /**
   * Bu denemeden daha önce ÇIKARILMIŞ soru id'leri (denetim kaydından).
   * Reddedilen soru bir daha önerilmemeli; ayrı bir tablo tutmak yerine zaten
   * yazdığımız denetim kaydı okunur — sayfa yenilense, gün değişse de kalıcı.
   */
  private async reddedilenler(examId: string): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<{ qid: string | null }[]>`
      SELECT DISTINCT detail->>'cikarilan' AS qid
      FROM audit_logs
      WHERE entity_type = 'exam'
        AND entity_id = ${examId}
        AND action IN ('exam.replace_question', 'exam.remove_question')`;
    return rows.map((r) => r.qid).filter((v): v is string => v != null);
  }

  async create(actor: AuthenticatedUser, dto: UpsertExamDto) {
    const exam = await this.prisma.exam.create({
      data: { ...this.mapDto(dto), status: 'draft', createdBy: actor.id },
    });
    await this.audit.log(actor, 'exam.create', 'exam', exam.id, { title: exam.title });
    return this.detail(exam.id);
  }

  async update(actor: AuthenticatedUser, id: string, dto: UpsertExamDto) {
    const exam = await this.exists(id);
    if (exam.status === 'archived') {
      throw new BadRequestException('Arşivlenmiş deneme düzenlenemez.');
    }
    await this.prisma.exam.update({ where: { id }, data: this.mapDto(dto) });
    await this.audit.log(actor, 'exam.update', 'exam', id, { title: dto.title });
    return this.detail(id);
  }

  /** Soru setini (sıralı) belirle — YALNIZ taslakta. */
  async setQuestions(actor: AuthenticatedUser, id: string, questionIds: string[]) {
    const exam = await this.exists(id);
    if (exam.status !== 'draft') {
      throw new BadRequestException('Soru seti yalnız taslak denemede düzenlenebilir.');
    }
    const unique = [...new Set(questionIds)];
    if (unique.length !== questionIds.length) {
      throw new BadRequestException('Soru listesi tekrar içeriyor.');
    }
    // Yalnız YAYINDA sorusu olanlar bağlanabilir (currentVersionId dolu).
    const questions = await this.prisma.question.findMany({
      where: { id: { in: unique }, deletedAt: null, currentVersionId: { not: null } },
      select: { id: true, currentVersionId: true },
    });
    const byId = new Map(questions.map((q) => [q.id, q]));
    const missing = unique.filter((qid) => !byId.has(qid));
    if (missing.length > 0) {
      throw new BadRequestException(
        `Şu sorular yayınlanmamış ya da bulunamadı: ${missing.length} adet.`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.examQuestion.deleteMany({ where: { examId: id } });
      if (unique.length > 0) {
        await tx.examQuestion.createMany({
          data: unique.map((qid, i) => ({
            examId: id,
            questionId: qid,
            questionVersionId: byId.get(qid)!.currentVersionId!,
            sortOrder: i,
          })),
        });
      }
    });
    await this.audit.log(actor, 'exam.set_questions', 'exam', id, { count: unique.length });
    return this.detail(id);
  }

  /**
   * Otomatik doldur (Doc 18 §8 devamı): müfredat bölüm ağırlıklarına
   * (ExamSection.weightPercent) göre kota dağıt, her bölümün derslerinden
   * YAYINDAKİ sorulardan az-kullanılmış-öncelikli rastgele seç ve taslağın
   * soru setini bu listeyle DEĞİŞTİR. Sonuç gerçek sınav bölüm sırasındadır;
   * admin isterse elden düzeltip yayınlar.
   */
  async autofill(
    actor: AuthenticatedUser,
    id: string,
    moduleId: string,
    questionCount: number,
  ) {
    const exam = await this.exists(id);
    if (exam.status !== 'draft') {
      throw new BadRequestException('Otomatik doldurma yalnız taslak denemede yapılabilir.');
    }

    const sections = await this.prisma.examSection.findMany({
      where: { examTypeId: moduleId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: { courses: { select: { courseId: true } } },
    });
    if (sections.length === 0) {
      throw new BadRequestException(
        'Bu sınav türünde müfredat bölümü tanımlı değil — önce İçerik Ağacı > Müfredat kurulmalı.',
      );
    }

    // Bölüm başına aday havuzu: yayında + silinmemiş, kullanım sayısıyla.
    const pools = await Promise.all(
      sections.map(async (s) => {
        const courseIds = s.courses.map((c) => c.courseId);
        if (courseIds.length === 0) return { section: s, candidates: [] };
        const rows = await this.prisma.question.findMany({
          where: {
            deletedAt: null,
            currentVersionId: { not: null },
            topic: { courseId: { in: courseIds } },
          },
          select: {
            id: true,
            topicId: true,
            _count: { select: { examQuestions: true } },
          },
        });
        return {
          section: s,
          candidates: rows.map((r) => ({
            questionId: r.id,
            usageCount: r._count.examQuestions,
            topicId: r.topicId,
          })),
        };
      }),
    );

    // Aynı soru iki bölümde görünebilir (ders paylaşımı) — ilk bölüm kazanır.
    const claimed = new Set<string>();
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
      questionCount,
    );

    const breakdown: { section: string; count: number; available: number }[] = [];
    const ids: string[] = [];
    for (const p of pools) {
      const n = quota.get(p.section.id) ?? 0;
      // Bölüm içinde KONU-dengeli seçim — tek konuya yığılma olmaz.
      const picked = pickSectionQuestions(p.candidates, n);
      ids.push(...picked);
      breakdown.push({
        section: p.section.name,
        count: picked.length,
        available: p.candidates.length,
      });
    }
    if (ids.length === 0) {
      throw new BadRequestException('Bu sınav türünün derslerinde yayında soru yok.');
    }

    const detail = await this.setQuestions(actor, id, ids);
    await this.audit.log(actor, 'exam.autofill', 'exam', id, {
      moduleId,
      requested: questionCount,
      filled: ids.length,
      breakdown,
    });
    return { ...detail, autofill: { requested: questionCount, filled: ids.length, breakdown } };
  }

  /** Yayınla: ≥1 soru şartı + sürümleri SABİTLE (Doc 18 §6). */
  async publish(actor: AuthenticatedUser, id: string, announce = false) {
    const exam = await this.exists(id);
    if (exam.status === 'published') return this.detail(id); // idempotent
    const rows = await this.prisma.examQuestion.findMany({
      where: { examId: id },
      include: { question: { select: { currentVersionId: true } } },
    });
    if (rows.length === 0) {
      throw new BadRequestException('Yayın için en az 1 soru bağlanmalı.');
    }

    await this.prisma.$transaction(async (tx) => {
      // Sabitle: her sorunun ŞU ANKİ yayın sürümü kilitlenir.
      for (const r of rows) {
        if (r.question.currentVersionId && r.question.currentVersionId !== r.questionVersionId) {
          await tx.examQuestion.update({
            where: { examId_questionId: { examId: id, questionId: r.questionId } },
            data: { questionVersionId: r.question.currentVersionId },
          });
        }
      }
      await tx.exam.update({ where: { id }, data: { status: 'published' } });
    });
    await this.audit.log(actor, 'exam.publish', 'exam', id, {
      title: exam.title,
      questionCount: rows.length,
    });

    // Duyuru (opsiyonel): kayıtlı tüm cihazlara push — dokunan Denemeler
    // sekmesine iner. Push yapılandırılmamışsa sessizce atlanır.
    if (announce) {
      const saat = new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Istanbul',
      }).format(exam.startAt);
      const sonuc = await this.push.sendToAll({
        title: 'Canlı deneme yayında! 🔴',
        body: `"${exam.title}" — ${saat}'te başlıyor. Türkiye sıralamasında yerini al!`,
        route: 'denemeler',
      });
      await this.audit.log(actor, 'exam.announce', 'exam', id, {
        title: exam.title,
        ...sonuc,
      });
    }
    return this.detail(id);
  }

  /** Yayından kaldır: yalnız katılım yoksa (aksi halde arşivle). */
  async unpublish(actor: AuthenticatedUser, id: string) {
    const exam = await this.exists(id);
    const attempts = await this.prisma.quizSession.count({ where: { examId: id } });
    if (attempts > 0) {
      throw new BadRequestException(
        'Katılım almış deneme yayından kaldırılamaz — arşivleyebilirsin.',
      );
    }
    await this.prisma.exam.update({ where: { id }, data: { status: 'draft' } });
    await this.audit.log(actor, 'exam.unpublish', 'exam', id, { title: exam.title });
    return this.detail(id);
  }

  async archive(actor: AuthenticatedUser, id: string) {
    const exam = await this.exists(id);
    await this.prisma.exam.update({ where: { id }, data: { status: 'archived' } });
    await this.audit.log(actor, 'exam.archive', 'exam', id, { title: exam.title });
    return { archived: true };
  }

  /** Katılımcı sonuçları + özet. */
  async results(id: string) {
    await this.exists(id);
    const sessions = await this.prisma.quizSession.findMany({
      where: { examId: id, status: 'completed' },
      orderBy: [{ score: 'desc' }, { durationSeconds: 'asc' }],
      include: { user: { select: { displayName: true, email: true } } },
    });
    const inProgress = await this.prisma.quizSession.count({
      where: { examId: id, status: 'in_progress' },
    });
    const scores = sessions.map((s) => (s.score != null ? Number(s.score) : 0));
    return {
      summary: {
        completed: sessions.length,
        inProgress,
        avgScore: scores.length
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
          : null,
        maxScore: scores.length ? Math.max(...scores) : null,
      },
      participants: sessions.map((s, i) => ({
        rank: i + 1,
        displayName: s.user.displayName,
        email: s.user.email,
        score: s.score != null ? Number(s.score) : 0,
        correctCount: s.correctCount,
        wrongCount: s.wrongCount,
        blankCount: s.blankCount,
        durationSeconds: s.durationSeconds,
        completedAt: s.completedAt,
      })),
    };
  }

  private mapDto(dto: UpsertExamDto) {
    return {
      title: dto.title,
      description: dto.description ?? null,
      startAt: new Date(dto.startAt),
      durationMinutes: dto.durationMinutes,
      isPremium: dto.isPremium ?? false,
      liveAnswerReveal: dto.liveAnswerReveal ?? false,
      questionsOpenAfterEnd: dto.questionsOpenAfterEnd ?? true,
    };
  }

  private async exists(id: string) {
    const exam = await this.prisma.exam.findFirst({ where: { id, deletedAt: null } });
    if (!exam) throw new NotFoundException('Deneme bulunamadı.');
    return exam;
  }
}

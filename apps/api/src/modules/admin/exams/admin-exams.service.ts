import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { AuditService } from '../audit.service';
import { UpsertExamDto } from '../dto/exam.dto';
import { allocateQuota, pickSectionQuestions } from './exam-autofill.logic';
import { bayraklariHesapla, tekrarEdenKokler } from './exam-review.logic';
import { CampaignsService } from '../../notifications/campaigns.service';
import { IPTAL_EDILMEMIS } from '../../../common/iptal-soru';
import { ExamsService } from '../../exams/exams.service';

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
    private readonly campaigns: CampaignsService,
    private readonly examsSvc: ExamsService,
  ) {}

  async list() {
    const exams = await this.prisma.exam.findMany({
      where: { deletedAt: null, pastExam: null },
      orderBy: [{ startAt: 'desc' }],
      include: { _count: { select: { questions: true, sessions: true } } },
    });
    const stats = await this.prisma.quizSession.groupBy({
      by: ['examId'],
      where: {
        examId: { in: exams.map((e) => e.id) },
        status: 'completed',
        attemptRole: 'official',
      },
      _count: { _all: true },
      _avg: { score: true },
    });
    const statOf = new Map(stats.map((x) => [x.examId, x]));
    return exams.map((e) => ({
      id: e.id,
      title: e.title,
      startAt: e.startAt,
      endAt: e.endAt,
      durationMinutes: e.durationMinutes,
      publishMode: e.publishMode,
      difficulty: e.difficulty,
      isPremium: e.isPremium,
      liveAnswerReveal: e.liveAnswerReveal,
      practiceAfterEnd: e.practiceAfterEnd,
      status: e.status,
      questionCount: e._count.questions,
      /** Eski alan: toplam oturum (resmî + tekrar). */
      attemptCount: e._count.sessions,
      participantCount: statOf.get(e.id)?._count._all ?? 0,
      avgScore:
        statOf.get(e.id)?._avg.score != null
          ? Math.round(Number(statOf.get(e.id)!._avg.score) * 100) / 100
          : null,
      rankingsComputedAt: e.rankingsComputedAt,
      questionPackBuiltAt: e.questionPackBuiltAt,
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
      endAt: exam.endAt,
      publishMode: exam.publishMode,
      difficulty: exam.difficulty,
      examTypeId: exam.examTypeId,
      isPremium: exam.isPremium,
      liveAnswerReveal: exam.liveAnswerReveal,
      questionsOpenAfterEnd: exam.questionsOpenAfterEnd,
      practiceAfterEnd: exam.practiceAfterEnd,
      /** Eski alan adı (panelin eski sürümü). */
      archiveOpenAfterEnd: exam.practiceAfterEnd,
      remindEnabled: exam.remindEnabled,
      rankingsComputedAt: exam.rankingsComputedAt,
      questionPackBuiltAt: exam.questionPackBuiltAt,
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
      dersDagilimi: [
        ...sorular.reduce(
          (m, q) => m.set(q.courseName, (m.get(q.courseName) ?? 0) + 1),
          new Map<string, number>(),
        ),
      ]
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
          ...IPTAL_EDILMEMIS,
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
    onlyMissing = false,
  ) {
    const exam = await this.exists(id);
    if (exam.status !== 'draft') {
      throw new BadRequestException('Otomatik doldurma yalnız taslak denemede yapılabilir.');
    }
    // Doc 50 §3: son 4 haftada YAYINLANMIŞ bir denemede çıkan sorular dışlanır —
    // haftalık deneme bitince pratik çözüme açıldığı için aynı soru hemen tekrar
    // çıkarsa ölçüm bozulur. Bu denemeden daha önce çıkarılanlar da dışarıda.
    const since = new Date(Date.now() - 28 * 86_400_000);
    const recent = await this.prisma.examQuestion.findMany({
      where: {
        exam: { status: 'published', deletedAt: null, startAt: { gte: since }, id: { not: id } },
      },
      select: { questionId: true },
    });
    const excluded = new Set<string>([
      ...recent.map((r) => r.questionId),
      ...(await this.reddedilenler(id)),
    ]);
    const keep: { questionId: string; question: { topic: { courseId: string } } }[] = onlyMissing
      ? await this.prisma.examQuestion.findMany({
          where: { examId: id },
          orderBy: { sortOrder: 'asc' },
          include: { question: { select: { topic: { select: { courseId: true } } } } },
        })
      : [];
    for (const k of keep) excluded.add(k.questionId);

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
        if (courseIds.length === 0) return { section: s, kept: 0, candidates: [] };
        const rows = await this.prisma.question.findMany({
          where: {
            deletedAt: null,
            currentVersionId: { not: null },
            ...IPTAL_EDILMEMIS,
            topic: { courseId: { in: courseIds } },
            id: { notIn: [...excluded] },
          },
          select: {
            id: true,
            topicId: true,
            _count: { select: { examQuestions: true } },
          },
        });
        return {
          section: s,
          kept: keep.filter((k) => courseIds.includes(k.question.topic.courseId)).length,
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

    // Hedef kota: ağırlıklara göre (PAEM: GK+Analitik 30, diğer 7 ders 10).
    // Kapasite kısıtı YOK burada — eksik kalan ders 'missing' olarak raporlanır
    // (panel "4 soru eksik: İnsan Hakları 6/10" der); artığı başka derse kaydırmayız,
    // çünkü resmî dağılım bozulur.
    const target = allocateQuota(
      pools.map((p) => ({
        sectionId: p.section.id,
        weight: p.section.weightPercent,
        available: 10_000,
      })),
      questionCount,
    );

    const breakdown: { section: string; target: number; count: number; available: number }[] = [];
    const missing: { section: string; need: number }[] = [];
    const ids: string[] = keep.map((k) => k.questionId);
    for (const p of pools) {
      const t = target.get(p.section.id) ?? 0;
      const n = Math.max(0, t - p.kept);
      // Bölüm içinde KONU-dengeli seçim — tek konuya yığılma olmaz.
      const picked = pickSectionQuestions(p.candidates, n);
      ids.push(...picked);
      const count = p.kept + picked.length;
      breakdown.push({ section: p.section.name, target: t, count, available: p.candidates.length });
      if (count < t) missing.push({ section: p.section.name, need: t - count });
    }
    if (ids.length === 0) {
      throw new BadRequestException('Bu sınav türünün derslerinde yayında soru yok.');
    }

    const detail = await this.setQuestions(actor, id, ids);
    if (!exam.examTypeId) {
      await this.prisma.exam.update({ where: { id }, data: { examTypeId: moduleId } });
    }
    await this.audit.log(actor, 'exam.autofill', 'exam', id, {
      moduleId,
      requested: questionCount,
      filled: ids.length,
      onlyMissing,
      breakdown,
      missing,
    });
    return {
      ...detail,
      autofill: { requested: questionCount, filled: ids.length, breakdown, missing },
    };
  }

  /**
   * Yayın ön kontrolü (Doc 50 A4): engeller ve uyarılar. Engel varsa yayın reddedilir.
   */
  async publishCheck(id: string) {
    const exam = await this.exists(id);
    const rows = await this.prisma.examQuestion.findMany({
      where: { examId: id },
      include: {
        question: {
          select: {
            id: true,
            currentVersionId: true,
            topic: { select: { courseId: true } },
            reports: { where: { status: 'open' }, select: { id: true } },
          },
        },
      },
    });
    const blockers: string[] = [];
    const warnings: string[] = [];
    if (rows.length === 0) blockers.push('Yayın için en az 1 soru bağlanmalı.');
    if (exam.publishMode === 'takvimli') {
      const end = exam.endAt ?? new Date(exam.startAt.getTime() + exam.durationMinutes * 60_000);
      if (end <= exam.startAt) blockers.push('Pencere kapanışı açılıştan sonra olmalı.');
    }
    const unpublished = rows.filter((r) => !r.question.currentVersionId).length;
    if (unpublished > 0) blockers.push(`${unpublished} soru artık yayında değil.`);
    const reported = rows.filter((r) => r.question.reports.length > 0);
    if (reported.length > 0) {
      warnings.push(
        `${reported.length} soru açık hata bildirimi taşıyor (S.${rows
          .map((r, i) => (r.question.reports.length > 0 ? i + 1 : null))
          .filter((x) => x != null)
          .slice(0, 5)
          .join(', S.')}) — gözden geçirilmesi önerilir.`,
      );
    }
    // Ders dağılımı eşleşmesi (varsa sınav türü).
    let distribution: { section: string; target: number; count: number }[] = [];
    if (exam.examTypeId) {
      const sections = await this.prisma.examSection.findMany({
        where: { examTypeId: exam.examTypeId, deletedAt: null },
        orderBy: { sortOrder: 'asc' },
        include: { courses: { select: { courseId: true } } },
      });
      const target = allocateQuota(
        sections.map((s) => ({ sectionId: s.id, weight: s.weightPercent, available: 10_000 })),
        rows.length,
      );
      const sectionOf = new Map<string, string>();
      for (const s of sections)
        for (const c of s.courses) if (!sectionOf.has(c.courseId)) sectionOf.set(c.courseId, s.id);
      const count = new Map<string, number>();
      let unmapped = 0;
      for (const r of rows) {
        const sid = sectionOf.get(r.question.topic.courseId);
        if (!sid) unmapped++;
        else count.set(sid, (count.get(sid) ?? 0) + 1);
      }
      distribution = sections.map((s) => ({
        section: s.name,
        target: target.get(s.id) ?? 0,
        count: count.get(s.id) ?? 0,
      }));
      if (unmapped > 0)
        blockers.push(`${unmapped} soru hiçbir derse eşlenmiyor (müfredat bölümü eksik).`);
      const off = distribution.filter((d) => d.count !== d.target);
      if (off.length > 0)
        warnings.push(
          `Dağılım resmî tablodan sapıyor: ${off.map((d) => `${d.section} ${d.count}/${d.target}`).join(', ')}.`,
        );
    } else {
      warnings.push('Sınav türü seçilmedi; ders dağılımı sonuç ekranında gösterilemez.');
    }
    // Yakın tarihli tekrar: son 4 haftada yayınlanan denemelerde çıkan soru.
    const since = new Date(Date.now() - 28 * 86_400_000);
    const repeat = await this.prisma.examQuestion.count({
      where: {
        questionId: { in: rows.map((r) => r.questionId) },
        exam: { id: { not: id }, status: 'published', deletedAt: null, startAt: { gte: since } },
      },
    });
    if (repeat > 0) warnings.push(`${repeat} soru son 4 haftada başka bir denemede çıktı.`);
    return {
      ok: blockers.length === 0,
      blockers,
      warnings,
      questionCount: rows.length,
      distribution,
    };
  }

  /** Yayınla: ≥1 soru şartı + sürümleri SABİTLE (Doc 18 §6). */
  async publish(actor: AuthenticatedUser, id: string, announce = false) {
    const exam = await this.exists(id);
    if (exam.status === 'published') return this.detail(id); // idempotent
    const check = await this.publishCheck(id);
    if (!check.ok) {
      throw new BadRequestException({
        code: 'PUBLISH_BLOCKED',
        message: check.blockers.join(' '),
        details: check,
      });
    }
    const rows = await this.prisma.examQuestion.findMany({
      where: { examId: id },
      include: { question: { select: { currentVersionId: true } } },
    });

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
      await tx.exam.update({
        where: { id },
        data: {
          status: 'published',
          // Takvimlide pencere kapanışı açıkça yazılır (Doc 50 §2.1).
          endAt:
            exam.publishMode === 'takvimli' && !exam.endAt
              ? new Date(exam.startAt.getTime() + exam.durationMinutes * 60_000)
              : exam.endAt,
        },
      });
    });
    // Soru paketi (Doc 50 §5-1): start DB'ye yalnız oturum satırı yazsın.
    await this.examsSvc.buildQuestionPack(id);
    await this.audit.log(actor, 'exam.publish', 'exam', id, {
      title: exam.title,
      publishMode: exam.publishMode,
      questionCount: rows.length,
      warnings: check.warnings,
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
      const sonuc = await this.campaigns.quickSend(
        exam.publishMode === 'serbest'
          ? {
              name: `Deneme yayını: ${exam.title}`,
              category: 'exam',
              title: 'Yeni deneme yayında',
              body: `"${exam.title}" — istediğin zaman çöz; ilk çözümün sıralamaya girer.`,
              deepLink: { target: 'exam', params: { examId: id } },
              channels: ['push', 'inbox'],
            }
          : {
              name: `Haftalık deneme duyurusu: ${exam.title}`,
              category: 'exam',
              title: 'Haftalık deneme yayında',
              body: `"${exam.title}" — ${saat}'te başlıyor. Türkiye sıralamasında yerini al.`,
              deepLink: { target: 'exam', params: { examId: id } },
              channels: ['push', 'inbox', 'email'],
            },
        actor,
      );
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
      where: { examId: id, status: 'completed', attemptRole: 'official' },
      orderBy: [
        { score: 'desc' },
        { wrongCount: 'asc' },
        { durationSeconds: 'asc' },
        { completedAt: 'asc' },
      ],
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
    const publishMode = dto.publishMode ?? 'takvimli';
    const startAt = new Date(dto.startAt);
    // Takvimlide kapanış verilmezse açılış + süre; serbestte boş = süresiz.
    const endAt =
      dto.endAt != null
        ? new Date(dto.endAt)
        : publishMode === 'takvimli'
          ? new Date(startAt.getTime() + dto.durationMinutes * 60_000)
          : null;
    if (endAt && endAt <= startAt) {
      throw new BadRequestException('Kapanış, açılıştan sonra olmalı.');
    }
    return {
      title: dto.title,
      description: dto.description ?? null,
      startAt,
      endAt,
      durationMinutes: dto.durationMinutes,
      publishMode,
      difficulty: dto.difficulty ?? null,
      examTypeId: dto.examTypeId ?? undefined,
      isPremium: dto.isPremium ?? false,
      liveAnswerReveal: dto.liveAnswerReveal ?? false,
      questionsOpenAfterEnd: dto.questionsOpenAfterEnd ?? true,
      practiceAfterEnd: dto.practiceAfterEnd ?? dto.archiveOpenAfterEnd ?? true,
      remindEnabled: dto.remindEnabled ?? true,
    };
  }

  private async exists(id: string) {
    const exam = await this.prisma.exam.findFirst({ where: { id, deletedAt: null } });
    if (!exam) throw new NotFoundException('Deneme bulunamadı.');
    return exam;
  }
}

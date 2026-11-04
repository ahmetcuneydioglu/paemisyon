import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CourseTestsService } from '../course-tests/course-tests.service';
import { FlashcardsService } from '../flashcards/flashcards.service';
import type { ModeCounts } from '../flashcards/flashcards.logic';
import { haftaBasi } from '../../common/gun';
import { LAW_NAME_RE, slugify } from '../public/public.service';
import { enTazeYarimTur, TAZE_TUR_MS, yarimTurSorgusu } from '../coach/today-task.logic';
import {
  band,
  dersKocCumlesi,
  dersKunyesi,
  enZayif,
  kaldiginYer,
  konuKocCumlesi,
  konuKunyesi,
  maddeAraligi,
  yayginAgirlik,
  yuzde,
  type Band,
} from './rooms.logic';

type Satir = {
  id: string;
  name: string;
  solved: number;
  correct: number;
  accuracy: number | null;
  accuracyPct: number | null;
  band: Band;
  inPlanThisWeek: boolean;
  isPremium: boolean;
  /** Kilit kararı sunucuda: premium içerik && kullanıcı premium değil. */
  locked: boolean;
  isLaw: boolean;
  lawSlug: string | null;
  wrongCount: number;
  favoriteCount: number;
  /** Yayındaki ünite özetleri; tek ünite varsa istemci doğrudan açar. */
  units: { count: number; read: number; firstSlug: string | null };
  /** Bilgi kartları (Doc 56): bayrak kapalıyken ya da kart yoksa null (istemci satır çizmez). */
  flashcards: FlashcardRoomCounts | null;
  note: string;
};
/** Oda yanıtındaki kart sayımı: açık kartlar; kilitli kartlar yalnız `locked`'ta. */
type FlashcardRoomCounts = { count: number; due: number; learned: number; locked: number };
const kartSayimi = (c: ModeCounts | undefined): FlashcardRoomCounts | null =>
  c && (c.total > 0 || c.locked > 0)
    ? { count: c.total, due: c.due, learned: c.learned, locked: c.locked }
    : null;
/** İstemciye giden konu satırı: ham doğruluk/doğru sayısı dışarı çıkmaz (yüzde ve band yeter). */
const kamu = (r: Satir) => ({
  id: r.id,
  name: r.name,
  solved: r.solved,
  accuracyPct: r.accuracyPct,
  band: r.band,
  inPlanThisWeek: r.inPlanThisWeek,
  isPremium: r.isPremium,
  locked: r.locked,
  isLaw: r.isLaw,
  lawSlug: r.lawSlug,
  wrongCount: r.wrongCount,
  favoriteCount: r.favoriteCount,
  units: r.units,
  flashcards: r.flashcards,
  note: r.note,
});

/**
 * Ders odası ve konu odası (Doc 49/14): Kütüphane'de dersin ve konunun tek sayfası.
 * Veri ve cümleler sunucuda; istemci yalnız çizer. Mevcut tablolardan okunur, yeni tablo yok.
 */
@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseTests: CourseTestsService,
    private readonly flashcards: FlashcardsService,
  ) {}

  /** Bilgi kartı sayımları yalnız bayrak açıkken (ya da admin/beta için) hesaplanır. */
  private async kartlar(
    userId: string,
    isPremiumUser: boolean,
    roles: readonly string[],
    by: { courseId?: string; topicId?: string },
  ) {
    if (!(await this.flashcards.enabledFor({ roles: [...roles] }))) return null;
    return this.flashcards.roomCounts(userId, isPremiumUser, by);
  }

  async courseRoom(
    userId: string,
    courseId: string,
    isPremiumUser = false,
    roles: readonly string[] = [],
  ) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
      select: { id: true, name: true, icon: true },
    });
    if (!course) throw new NotFoundException('Ders bulunamadı');
    const buHafta = haftaBasi();
    const [
      topics,
      progress,
      wrongCount,
      favCount,
      legislation,
      profile,
      planItems,
      sayimlar,
      testler,
      units,
      kartlar,
    ] = await Promise.all([
      this.prisma.topic.findMany({
        where: { courseId, deletedAt: null, parentId: null },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          isPremium: true,
          children: {
            where: { deletedAt: null },
            orderBy: { sortOrder: 'asc' },
            select: { id: true, name: true, isPremium: true },
          },
        },
      }),
      this.prisma.userTopicProgress.findMany({
        where: { userId, topic: { courseId, deletedAt: null } },
        select: { topicId: true, solvedCount: true, correctCount: true },
      }),
      this.yanlisSayisi(userId, { courseId }),
      this.favoriSayisi(userId, { courseId }),
      this.prisma.legislation.findMany({
        where: { topic: { courseId, deletedAt: null }, status: 'published' },
        select: {
          slug: true,
          shortName: true,
          name: true,
          _count: { select: { articles: { where: { status: 'published' } } } },
        },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { preferredModuleId: true } }),
      this.prisma.studyPlanItem.findMany({
        where: {
          plan: { userId, status: 'active' },
          weekStart: buHafta,
          kind: 'topic',
          topic: { courseId },
        },
        select: { topicId: true },
      }),
      this.konuSayimlari(userId, courseId),
      this.courseTests.roomSummary(userId, courseId, isPremiumUser),
      this.prisma.summaryUnit.findMany({
        where: { status: 'published', deletedAt: null, topic: { courseId, deletedAt: null } },
        orderBy: { sortOrder: 'asc' },
        select: {
          topicId: true,
          slug: true,
          progress: { where: { userId, completedAt: { not: null } }, select: { unitId: true } },
        },
      }),
      this.kartlar(userId, isPremiumUser, roles, { courseId }),
    ]);
    const examWeight = profile?.preferredModuleId
      ? await this.prisma.examSection.findFirst({
          where: {
            examTypeId: profile.preferredModuleId,
            deletedAt: null,
            courses: { some: { courseId } },
          },
          orderBy: { weightPercent: 'desc' },
          select: { weightPercent: true },
        })
      : null;

    const prog = new Map(progress.map((p) => [p.topicId, p]));
    const planli = new Set(planItems.map((i) => i.topicId));
    const uniteler = new Map<string, Satir['units']>();
    for (const u of units) {
      const k = uniteler.get(u.topicId) ?? { count: 0, read: 0, firstSlug: u.slug };
      k.count += 1;
      if (u.progress.length) k.read += 1;
      uniteler.set(u.topicId, k);
    }
    const satir = (t: { id: string; name: string; isPremium: boolean }): Satir => {
      const p = prog.get(t.id);
      const solved = p?.solvedCount ?? 0;
      const correct = p?.correctCount ?? 0;
      const accuracy = solved > 0 ? correct / solved : null;
      const isLaw = LAW_NAME_RE.test(t.name);
      const u = uniteler.get(t.id) ?? { count: 0, read: 0, firstSlug: null };
      const yanlis = sayimlar.yanlis.get(t.id) ?? 0;
      return {
        id: t.id,
        name: t.name,
        solved,
        correct,
        accuracy,
        accuracyPct: yuzde(accuracy),
        band: band(solved, accuracy) as Band,
        inPlanThisWeek: planli.has(t.id),
        isPremium: t.isPremium,
        locked: t.isPremium && !isPremiumUser,
        isLaw,
        lawSlug: isLaw ? slugify(t.name) : null,
        wrongCount: yanlis,
        favoriteCount: sayimlar.favori.get(t.id) ?? 0,
        units: u,
        flashcards: kartlar ? kartSayimi(kartlar.byTopic.get(t.id)) : null,
        note: konuKunyesi({ solved, unitCount: u.count, wrongCount: yanlis }),
      };
    };
    const rows = topics.map((t) => ({ ...satir(t), children: t.children.map(satir) }));
    const hepsi = rows.flatMap((r) => [r, ...r.children]);
    const totalSolved = progress.reduce((s, p) => s + p.solvedCount, 0);
    const totalCorrect = progress.reduce((s, p) => s + p.correctCount, 0);
    const accuracy = totalSolved > 0 ? totalCorrect / totalSolved : null;
    const weakest = enZayif(
      hepsi.map((r) => ({
        topicId: r.id,
        name: r.name,
        solved: r.solved,
        correct: r.correct,
        accuracy: r.accuracy,
      })),
    );
    return {
      course: { id: course.id, name: course.name, icon: course.icon },
      summary: {
        solved: totalSolved,
        correct: totalCorrect,
        accuracyPct: yuzde(accuracy),
        band: band(totalSolved, accuracy),
        examWeightPercent: examWeight?.weightPercent ?? null,
        weakest: weakest
          ? { topicId: weakest.topicId, name: weakest.name, accuracyPct: yuzde(weakest.accuracy) }
          : null,
      },
      coach: dersKocCumlesi({
        solved: totalSolved,
        weakest,
        weakestInPlan: weakest ? planli.has(weakest.topicId) : false,
      }),
      topics: rows.map((r) => ({ ...kamu(r), children: r.children.map(kamu) })),
      tools: {
        wrongCount,
        favoriteCount: favCount,
        summaryUnitCount: units.length,
        /** Bilgi kartları (Doc 56): bayrak kapalı ya da kart yoksa null. */
        flashcards: kartlar ? kartSayimi(kartlar.total) : null,
        /** Ders testleri (Doc 49/18): seçim sayfasının alt yazısı. */
        tests: testler,
        // Ana metin önce: madde sayısı çoktan aza (Anayasa Hukuku'nda 12 mevzuat var).
        legislation: [...legislation]
          .sort((a, b) => b._count.articles - a._count.articles)
          .map((l) => ({
            slug: l.slug,
            name: l.shortName ?? l.name,
            articleCount: l._count.articles,
          })),
      },
    };
  }

  async topicRoom(
    userId: string,
    topicId: string,
    isPremiumUser = false,
    roles: readonly string[] = [],
  ) {
    const topic = await this.prisma.topic.findFirst({
      where: { id: topicId, deletedAt: null },
      select: {
        id: true,
        name: true,
        isPremium: true,
        courseId: true,
        course: { select: { name: true } },
        legislation: { select: { slug: true, shortName: true, name: true, status: true } },
      },
    });
    if (!topic) throw new NotFoundException('Konu bulunamadı');
    const buHafta = haftaBasi();
    const [progress, wrongCount, favCount, son5, planItem, maddeler, kartlar] = await Promise.all([
      this.prisma.userTopicProgress.findUnique({
        where: { userId_topicId: { userId, topicId } },
        select: { solvedCount: true, correctCount: true },
      }),
      this.yanlisSayisi(userId, { topicId }),
      this.favoriSayisi(userId, { topicId }),
      // QuizAnswer'da question ilişkisi yok — son 5 cevap raw join ile.
      this.prisma.$queryRaw<{ is_correct: boolean }[]>`
        SELECT qa.is_correct FROM quiz_answers qa
        JOIN quiz_sessions s ON s.id = qa.session_id AND s.user_id = ${userId}::uuid
        JOIN questions q ON q.id = qa.question_id AND q.topic_id = ${topicId}::uuid
        WHERE qa.is_correct IS NOT NULL
        ORDER BY qa.answered_at DESC LIMIT 5`,
      this.prisma.studyPlanItem.findFirst({
        where: { plan: { userId, status: 'active' }, weekStart: buHafta, kind: 'topic', topicId },
        select: { targetMinutes: true, doneMinutes: true, status: true },
      }),
      this.prisma.lawArticle.findMany({
        where: { topicId, status: 'published' },
        select: { articleNo: true },
      }),
      this.kartlar(userId, isPremiumUser, roles, { topicId }),
    ]);
    const solved = progress?.solvedCount ?? 0;
    const correct = progress?.correctCount ?? 0;
    const accuracy = solved > 0 ? correct / solved : null;
    const inPlan = planItem != null;
    const isLaw = LAW_NAME_RE.test(topic.name);
    const leg =
      topic.legislation && topic.legislation.status === 'published' ? topic.legislation : null;
    return {
      topic: {
        id: topic.id,
        name: topic.name,
        courseId: topic.courseId,
        courseName: topic.course.name,
        isPremium: topic.isPremium,
        locked: topic.isPremium && !isPremiumUser,
      },
      summary: {
        solved,
        correct,
        accuracyPct: yuzde(accuracy),
        band: band(solved, accuracy),
        inPlanThisWeek: inPlan,
        planRemainingMinutes:
          planItem && planItem.status === 'pending'
            ? Math.max(0, planItem.targetMinutes - planItem.doneMinutes)
            : null,
      },
      coach: konuKocCumlesi({
        solved,
        accuracy,
        son5Dogru: son5.length ? son5.filter((a) => a.is_correct).length : null,
        son5Toplam: son5.length,
        inPlan,
      }),
      wrongCount,
      favoriteCount: favCount,
      /** Bilgi kartları (Doc 56): bayrak kapalı ya da kart yoksa null. */
      flashcards: kartlar ? kartSayimi(kartlar.total) : null,
      legislation:
        leg || maddeler.length
          ? {
              slug: leg?.slug ?? (isLaw ? slugify(topic.name) : null),
              name: leg?.shortName ?? leg?.name ?? null,
              articleCount: maddeler.length,
              articleRange: maddeAraligi(maddeler.map((m) => m.articleNo)),
            }
          : null,
    };
  }

  /**
   * Çalış ana ekranı (Doc 49/17): hedef sınavın dersleri kart verisiyle + "kaldığın yer" + toplamlar.
   * Ders sırası ağırlığa göre (eşitlikte müfredat sırası); künye cümlesi sunucuda.
   */
  async study(
    userId: string,
    moduleIdParam: string | null = null,
    now = new Date(),
    ctx: { isPremium: boolean; roles: readonly string[] } = { isPremium: false, roles: [] },
  ) {
    // Web'de sınav bağlamı seçilebilir (?sinav=); verilmezse hedef sınav.
    const [profile, secilen] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { preferredModule: { select: { id: true, name: true } } },
      }),
      moduleIdParam
        ? this.prisma.examType.findFirst({
            where: { id: moduleIdParam, isActive: true },
            select: { id: true, name: true },
          })
        : Promise.resolve(null),
    ]);
    const modul = secilen ?? profile?.preferredModule ?? null;
    const moduleId = modul?.id ?? null;
    const kartVade = (await this.flashcards.enabledFor({ roles: [...ctx.roles] }))
      ? this.flashcards.dueTotal(userId, ctx.isPremium, now)
      : Promise.resolve(null);
    const [sections, progress, yanlis, favori, uniteler, yarim, flashcardsDue] = await Promise.all([
      moduleId
        ? this.prisma.examSection.findMany({
            where: { examTypeId: moduleId, deletedAt: null },
            orderBy: { sortOrder: 'asc' },
            select: {
              weightPercent: true,
              courses: {
                orderBy: { sortOrder: 'asc' },
                select: {
                  course: { select: { id: true, name: true, icon: true, deletedAt: true } },
                },
              },
            },
          })
        : Promise.resolve([]),
      this.prisma.userTopicProgress.findMany({
        where: { userId, topic: { deletedAt: null } },
        select: { solvedCount: true, correctCount: true, topic: { select: { courseId: true } } },
      }),
      this.prisma.$queryRaw<{ course_id: string; cnt: number }[]>`
        SELECT t.course_id, COUNT(*)::int AS cnt FROM wrong_answers wa
        JOIN questions q ON q.id = wa.question_id AND q.deleted_at IS NULL
        JOIN topics t ON t.id = q.topic_id AND t.deleted_at IS NULL
        WHERE wa.user_id = ${userId}::uuid AND wa.resolved_at IS NULL
        GROUP BY t.course_id`,
      this.prisma.$queryRaw<{ course_id: string; cnt: number }[]>`
        SELECT t.course_id, COUNT(*)::int AS cnt FROM bookmarks b
        JOIN questions q ON q.id = b.question_id AND q.deleted_at IS NULL
        JOIN topics t ON t.id = q.topic_id AND t.deleted_at IS NULL
        WHERE b.user_id = ${userId}::uuid
        GROUP BY t.course_id`,
      this.prisma.$queryRaw<{ course_id: string; cnt: number }[]>`
        SELECT t.course_id, COUNT(*)::int AS cnt FROM summary_units su
        JOIN topics t ON t.id = su.topic_id AND t.deleted_at IS NULL
        WHERE su.status = 'published' AND su.deleted_at IS NULL
        GROUP BY t.course_id`,
      this.prisma.quizSession.findMany(yarimTurSorgusu(userId)),
      kartVade,
    ]);
    const harita = (rows: { course_id: string; cnt: number }[]) =>
      new Map(rows.map((r) => [r.course_id, r.cnt]));
    const yanlisM = harita(yanlis);
    const favoriM = harita(favori);
    const uniteM = harita(uniteler);
    const cozum = new Map<string, { solved: number; correct: number }>();
    for (const p of progress) {
      const c = cozum.get(p.topic.courseId) ?? { solved: 0, correct: 0 };
      c.solved += p.solvedCount;
      c.correct += p.correctCount;
      cozum.set(p.topic.courseId, c);
    }
    // Düzleştir + tekilleştir (catalog.getCourses ile aynı kural: ilk bölümün ağırlığı).
    const gorulen = new Set<string>();
    const dersler: {
      id: string;
      name: string;
      icon: string | null;
      weightPercent: number;
      sira: number;
    }[] = [];
    for (const sec of sections) {
      for (const sc of sec.courses) {
        if (sc.course.deletedAt || gorulen.has(sc.course.id)) continue;
        gorulen.add(sc.course.id);
        dersler.push({ ...sc.course, weightPercent: sec.weightPercent, sira: dersler.length });
      }
    }
    const yaygin = yayginAgirlik(dersler.map((d) => d.weightPercent));
    const courses = dersler
      .sort((a, b) => b.weightPercent - a.weightPercent || a.sira - b.sira)
      .map((d) => {
        const c = cozum.get(d.id) ?? { solved: 0, correct: 0 };
        const accuracy = c.solved > 0 ? c.correct / c.solved : null;
        const wrongCount = yanlisM.get(d.id) ?? 0;
        return {
          id: d.id,
          name: d.name,
          icon: d.icon,
          weightPercent: d.weightPercent,
          solved: c.solved,
          accuracyPct: yuzde(accuracy),
          band: band(c.solved, accuracy),
          wrongCount,
          favoriteCount: favoriM.get(d.id) ?? 0,
          summaryUnitCount: uniteM.get(d.id) ?? 0,
          note: dersKunyesi({
            weightPercent: d.weightPercent,
            yayginAgirlik: yaygin,
            solved: c.solved,
            wrongCount,
          }),
        };
      });
    const toplam = (m: Map<string, number>) => [...m.values()].reduce((s, n) => s + n, 0);
    return {
      module: modul,
      resume: kaldiginYer(enTazeYarimTur(yarim), now, TAZE_TUR_MS),
      courses,
      totals: {
        wrongCount: toplam(yanlisM),
        favoriteCount: toplam(favoriM),
        /** Bilgi kartları (Doc 56): vadesi gelen açık kart; bayrak kapalıyken null. */
        flashcardsDue,
      },
    };
  }

  /** Dersin konu başına açık yanlış ve favori sayıları (konu eylem sayfası, Doc 49/17). */
  private async konuSayimlari(userId: string, courseId: string) {
    const [y, f] = await Promise.all([
      this.prisma.$queryRaw<{ topic_id: string; cnt: number }[]>`
        SELECT q.topic_id, COUNT(*)::int AS cnt FROM wrong_answers wa
        JOIN questions q ON q.id = wa.question_id AND q.deleted_at IS NULL
        JOIN topics t ON t.id = q.topic_id AND t.deleted_at IS NULL
        WHERE wa.user_id = ${userId}::uuid AND wa.resolved_at IS NULL AND t.course_id = ${courseId}::uuid
        GROUP BY q.topic_id`,
      this.prisma.$queryRaw<{ topic_id: string; cnt: number }[]>`
        SELECT q.topic_id, COUNT(*)::int AS cnt FROM bookmarks b
        JOIN questions q ON q.id = b.question_id AND q.deleted_at IS NULL
        JOIN topics t ON t.id = q.topic_id AND t.deleted_at IS NULL
        WHERE b.user_id = ${userId}::uuid AND t.course_id = ${courseId}::uuid
        GROUP BY q.topic_id`,
    ]);
    return {
      yanlis: new Map(y.map((r) => [r.topic_id, r.cnt])),
      favori: new Map(f.map((r) => [r.topic_id, r.cnt])),
    };
  }

  /** Çözülmemiş yanlış sayısı — WrongAnswer'da question ilişkisi yok (composite id), raw join. */
  private async yanlisSayisi(userId: string, by: { courseId?: string; topicId?: string }) {
    const rows = by.topicId
      ? await this.prisma.$queryRaw<{ cnt: number }[]>`
          SELECT COUNT(*)::int AS cnt FROM wrong_answers wa
          JOIN questions q ON q.id = wa.question_id AND q.deleted_at IS NULL
          WHERE wa.user_id = ${userId}::uuid AND wa.resolved_at IS NULL AND q.topic_id = ${by.topicId}::uuid`
      : await this.prisma.$queryRaw<{ cnt: number }[]>`
          SELECT COUNT(*)::int AS cnt FROM wrong_answers wa
          JOIN questions q ON q.id = wa.question_id AND q.deleted_at IS NULL
          JOIN topics t ON t.id = q.topic_id AND t.deleted_at IS NULL
          WHERE wa.user_id = ${userId}::uuid AND wa.resolved_at IS NULL AND t.course_id = ${by.courseId}::uuid`;
    return rows[0]?.cnt ?? 0;
  }

  /** Favoriler = yer imleri (Bookmark; question ilişkisi yok → raw join), silinmiş soru hariç. */
  private async favoriSayisi(userId: string, by: { courseId?: string; topicId?: string }) {
    const rows = by.topicId
      ? await this.prisma.$queryRaw<{ cnt: number }[]>`
          SELECT COUNT(*)::int AS cnt FROM bookmarks b
          JOIN questions q ON q.id = b.question_id AND q.deleted_at IS NULL
          WHERE b.user_id = ${userId}::uuid AND q.topic_id = ${by.topicId}::uuid`
      : await this.prisma.$queryRaw<{ cnt: number }[]>`
          SELECT COUNT(*)::int AS cnt FROM bookmarks b
          JOIN questions q ON q.id = b.question_id AND q.deleted_at IS NULL
          JOIN topics t ON t.id = q.topic_id AND t.deleted_at IS NULL
          WHERE b.user_id = ${userId}::uuid AND t.course_id = ${by.courseId}::uuid`;
    return rows[0]?.cnt ?? 0;
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

/**
 * Mevzuat Merkezi (Expo "Mevzuat" sekmesi, 28 Eki 2026; gysrota düzeni): kullanıcının hedef sınavındaki
 * derslere bağlı kanunlar ders adına göre gruplanır ("Sınavım"); kalan yayımlı mevzuat "Tüm mevzuat"tır.
 * Her kanunda kaldığı yer ve konum tabanlı ilerleme (okunan madde sayısı tutulmaz; kaldığı maddenin sırası
 * madde sayısına oranlanır: bitmeden %100, başlamışsa %0 görünmez). "Devam et" en son okunan kanundur.
 * Madde metni dönmez; okuyucu `/public/mevzuat/:slug/oku` ile açılır.
 */
@Injectable()
export class MevzuatMerkeziService {
  constructor(private readonly prisma: PrismaService) {}

  async merkez(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferredModuleId: true, preferredModule: { select: { id: true, name: true } } },
    });
    const [legs, progress, questionCounts, courseLinks] = await Promise.all([
      this.prisma.legislation.findMany({
        where: { deletedAt: null, status: 'published' },
        select: {
          id: true,
          slug: true,
          type: true,
          number: true,
          name: true,
          shortName: true,
          topicId: true,
          lastVerifiedAt: true,
          topic: { select: { courseId: true, parent: { select: { courseId: true } } } },
          articles: {
            where: { status: 'published', deletedAt: null },
            orderBy: { sortKey: 'asc' },
            select: { articleNo: true, title: true },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.readingProgress.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: { legislationId: true, articleNo: true, updatedAt: true },
      }),
      this.prisma.question.groupBy({
        by: ['topicId'],
        where: { deletedAt: null, currentVersion: { status: 'published' } },
        _count: { _all: true },
      }),
      user?.preferredModuleId
        ? this.prisma.examSectionCourse.findMany({
            where: {
              section: { examTypeId: user.preferredModuleId, deletedAt: null },
              course: { deletedAt: null },
            },
            orderBy: [{ section: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
            select: { courseId: true, course: { select: { name: true } } },
          })
        : Promise.resolve([] as { courseId: string; course: { name: string } }[]),
    ]);
    const qByTopic = new Map(questionCounts.map((q) => [q.topicId, q._count._all]));
    const progressByLeg = new Map(progress.map((p) => [p.legislationId, p]));
    const courseOrder = new Map<string, { name: string; order: number }>();
    courseLinks.forEach((l, i) => {
      if (!courseOrder.has(l.courseId))
        courseOrder.set(l.courseId, { name: l.course.name, order: i });
    });

    const laws = legs
      .filter((l) => l.articles.length > 0)
      .map((l) => {
        const courseId = l.topic?.courseId ?? l.topic?.parent?.courseId ?? null;
        const course = courseId ? (courseOrder.get(courseId) ?? null) : null;
        const p = progressByLeg.get(l.id) ?? null;
        const idx = p ? l.articles.findIndex((a) => a.articleNo === p.articleNo) : -1;
        const total = l.articles.length;
        const percent =
          idx < 0
            ? 0
            : idx + 1 >= total
              ? 100
              : Math.min(99, Math.max(1, Math.round(((idx + 1) / total) * 100)));
        return {
          slug: l.slug,
          type: l.type,
          number: l.number,
          name: l.name,
          shortName: l.shortName,
          topicId: l.topicId,
          articleCount: total,
          questionCount: l.topicId ? (qByTopic.get(l.topicId) ?? 0) : 0,
          lastVerifiedAt: l.lastVerifiedAt?.toISOString() ?? null,
          courseName: course?.name ?? null,
          courseOrder: course?.order ?? null,
          inExam: course != null,
          percent,
          lastRead: p
            ? {
                no: p.articleNo,
                title: idx >= 0 ? (l.articles[idx]?.title ?? null) : null,
                index: idx,
                updatedAt: p.updatedAt.toISOString(),
              }
            : null,
        };
      });

    // Sınavım grupları: ders sırasıyla; grup içinde kanun sırası (sortOrder) korunur.
    const groupMap = new Map<string, { name: string; order: number; laws: typeof laws }>();
    for (const law of laws) {
      if (!law.inExam || !law.courseName) continue;
      const g = groupMap.get(law.courseName) ?? {
        name: law.courseName,
        order: law.courseOrder ?? 0,
        laws: [],
      };
      g.laws.push(law);
      groupMap.set(law.courseName, g);
    }
    const groups = [...groupMap.values()]
      .sort((a, b) => a.order - b.order)
      .map(({ name, laws: ls }) => ({ name, laws: ls.map(strip) }));

    const latestLegId = progress[0]?.legislationId ?? null;
    const latestSlug = latestLegId ? (legs.find((l) => l.id === latestLegId)?.slug ?? null) : null;
    const latest = latestSlug ? (laws.find((l) => l.slug === latestSlug) ?? null) : null;
    const cont = latest?.lastRead
      ? {
          slug: latest.slug,
          lawShort: latest.shortName ?? latest.name,
          lawName: latest.name,
          no: latest.lastRead.no,
          title: latest.lastRead.title,
          percent: latest.percent,
          articleCount: latest.articleCount,
          index: latest.lastRead.index,
        }
      : null;

    return {
      exam: user?.preferredModule ?? null,
      groups,
      all: laws.map(strip),
      continue: cont,
    };
  }
}

function strip<T extends { courseOrder: number | null }>(law: T): Omit<T, 'courseOrder'> {
  const { courseOrder: _o, ...rest } = law;
  void _o;
  return rest;
}

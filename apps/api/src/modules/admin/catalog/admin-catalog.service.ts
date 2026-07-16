import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { AuditService } from '../audit.service';
import {
  AttachCourseDto,
  ReorderDto,
  UpsertCourseDto,
  UpsertSectionDto,
  UpsertTopicDto,
} from '../dto/catalog.dto';

/** Keyword listesini normalize eder: kırp, boşları at, tekilleştir. */
function cleanKeywords(raw?: string[]): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  for (const k of raw) {
    const t = k.trim();
    if (t.length > 0) seen.add(t);
  }
  return [...seen];
}

/** İçerik ağacı yönetimi: Modül → Ders → Konu (Doc 9 §3). */
@Injectable()
export class AdminCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Tam ağaç — panel solunda tek istekte gösterilir. Soru sayıları dahil.
   *  Doc 21 köprüsü: dersler artık MÜFREDAT bölümleri üzerinden gelir; yanıt
   *  şekli korunur (courses[].topics[]) — panel UI'ı bozulmadan çalışır.
   *  Alt konular "Konu › Alt Konu" olarak düzleştirilir (tam yeniden tasarım
   *  Doc 21 §8'de ayrı iş). */
  async tree() {
    const topicSelect = {
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { questions: { where: { deletedAt: null } } } } },
    } as const;

    const examTypes = await this.prisma.examType.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        sections: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            courses: {
              orderBy: { sortOrder: 'asc' },
              include: {
                course: {
                  include: {
                    topics: { ...topicSelect, include: { ...topicSelect.include, parent: { select: { name: true } } } },
                  },
                },
              },
            },
          },
        },
      },
    });

    return examTypes.map((m) => {
      const seen = new Set<string>();
      const courses: {
        id: string;
        name: string;
        sortOrder: number;
        topics: {
          id: string;
          name: string;
          sortOrder: number;
          isPremium: boolean;
          matchKeywords: string[];
          questionCount: number;
        }[];
      }[] = [];
      let order = 0;
      for (const s of m.sections) {
        for (const sc of s.courses) {
          const c = sc.course;
          if (c.deletedAt || seen.has(c.id)) continue;
          seen.add(c.id);
          courses.push({
            id: c.id,
            name: c.name,
            sortOrder: ++order,
            topics: c.topics.map((t) => ({
              id: t.id,
              name: t.parent ? `${t.parent.name} › ${t.name}` : t.name,
              sortOrder: t.sortOrder,
              isPremium: t.isPremium,
              matchKeywords: t.matchKeywords,
              questionCount: t._count.questions,
            })),
          });
        }
      }
      return { id: m.id, key: m.key, name: m.name, isActive: m.isActive, courses };
    });
  }

  // ── Müfredat yönetim ağacı (Doc 21 §8): Sınav Türü → Bölüm → Ders → Konu ağacı.
  // Panelin yeni İçerik Ağacı bunu kullanır; tree() (düz) import/soru formu için kalır.
  async curriculum() {
    const [examTypes, allCourses] = await Promise.all([
      this.prisma.examType.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
          sections: {
            where: { deletedAt: null },
            orderBy: { sortOrder: 'asc' },
            include: {
              courses: {
                orderBy: { sortOrder: 'asc' },
                include: { course: { select: { id: true, name: true, deletedAt: true } } },
              },
            },
          },
        },
      }),
      // Küresel ders havuzu + konu ağacı + soru sayıları + hangi sınavlarda kullanıldığı.
      this.prisma.course.findMany({
        where: { deletedAt: null },
        orderBy: { sortOrder: 'asc' },
        include: {
          topics: {
            where: { deletedAt: null },
            orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
            include: { _count: { select: { questions: { where: { deletedAt: null } } } } },
          },
          sections: {
            include: { section: { select: { examTypeId: true, deletedAt: true } } },
          },
        },
      }),
    ]);

    // Ders → konu ağacı (parentId ile iç içe).
    const courseNode = (c: (typeof allCourses)[number]) => {
      const byParent = new Map<string | null, typeof c.topics>();
      for (const t of c.topics) {
        const k = t.parentId ?? null;
        (byParent.get(k) ?? byParent.set(k, []).get(k)!).push(t);
      }
      const build = (parentId: string | null): unknown[] =>
        (byParent.get(parentId) ?? []).map((t) => ({
          id: t.id,
          name: t.name,
          sortOrder: t.sortOrder,
          isPremium: t.isPremium,
          matchKeywords: t.matchKeywords,
          questionCount: t._count.questions,
          children: build(t.id),
        }));
      const usedByExams = new Set(
        c.sections.filter((sc) => !sc.section.deletedAt).map((sc) => sc.section.examTypeId),
      );
      return {
        id: c.id,
        name: c.name,
        questionCount: c.topics.reduce((s, t) => s + t._count.questions, 0),
        usedByExamTypeIds: [...usedByExams],
        topics: build(null),
      };
    };
    const courseById = new Map(allCourses.map((c) => [c.id, courseNode(c)]));

    return {
      examTypes: examTypes.map((e) => ({
        id: e.id,
        key: e.key,
        name: e.name,
        isActive: e.isActive,
        sections: e.sections.map((s) => ({
          id: s.id,
          name: s.name,
          weightPercent: s.weightPercent,
          sortOrder: s.sortOrder,
          courses: s.courses
            .filter((sc) => !sc.course.deletedAt)
            .map((sc) => courseById.get(sc.course.id)),
        })),
        weightTotal: e.sections.reduce((sum, s) => sum + s.weightPercent, 0),
      })),
      // Havuzdaki dersler (bölüme bağlı olmayanlar dahil — panelde bağlanabilir).
      coursePool: allCourses.map((c) => courseById.get(c.id)),
    };
  }

  // ── Bölüm (ExamSection) CRUD ──
  async createSection(actor: AuthenticatedUser, dto: UpsertSectionDto) {
    const section = await this.prisma.examSection.create({
      data: {
        examTypeId: dto.examTypeId,
        name: dto.name,
        weightPercent: dto.weightPercent ?? 0,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    await this.audit.log(actor, 'section.create', 'exam_section', section.id, { name: dto.name });
    return section;
  }

  async updateSection(actor: AuthenticatedUser, id: string, dto: UpsertSectionDto) {
    await this.ensure('section', id);
    const section = await this.prisma.examSection.update({
      where: { id },
      data: { name: dto.name, weightPercent: dto.weightPercent ?? 0, sortOrder: dto.sortOrder ?? 0 },
    });
    await this.audit.log(actor, 'section.update', 'exam_section', id, { name: dto.name });
    return section;
  }

  async deleteSection(actor: AuthenticatedUser, id: string) {
    await this.ensure('section', id);
    // Bağlar cascade siler; ders/konu/soru KALIR (küresel havuzda).
    await this.prisma.examSection.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log(actor, 'section.delete', 'exam_section', id);
    return { deleted: true };
  }

  async attachCourse(actor: AuthenticatedUser, sectionId: string, dto: AttachCourseDto) {
    await this.ensure('section', sectionId);
    await this.ensure('course', dto.courseId);
    await this.prisma.examSectionCourse.upsert({
      where: { sectionId_courseId: { sectionId, courseId: dto.courseId } },
      update: { sortOrder: dto.sortOrder ?? 0 },
      create: { sectionId, courseId: dto.courseId, sortOrder: dto.sortOrder ?? 0 },
    });
    await this.audit.log(actor, 'section.attach_course', 'exam_section', sectionId, { courseId: dto.courseId });
    return { attached: true };
  }

  async detachCourse(actor: AuthenticatedUser, sectionId: string, courseId: string) {
    await this.prisma.examSectionCourse.deleteMany({ where: { sectionId, courseId } });
    await this.audit.log(actor, 'section.detach_course', 'exam_section', sectionId, { courseId });
    return { detached: true };
  }

  // ── Ders (küresel) CRUD ──
  async createCourse(actor: AuthenticatedUser, dto: UpsertCourseDto) {
    const course = await this.prisma.course.create({
      data: { name: dto.name, sortOrder: dto.sortOrder ?? 0 }, // moduleId YOK (küresel)
    });
    await this.audit.log(actor, 'course.create', 'course', course.id, { name: dto.name });
    return course;
  }

  async updateCourse(actor: AuthenticatedUser, id: string, dto: UpsertCourseDto) {
    await this.ensure('course', id);
    const course = await this.prisma.course.update({
      where: { id },
      data: { name: dto.name, ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}) },
    });
    await this.audit.log(actor, 'course.update', 'course', id, { name: dto.name });
    return course;
  }

  async deleteCourse(actor: AuthenticatedUser, id: string) {
    await this.ensure('course', id);
    const qCount = await this.prisma.question.count({
      where: { deletedAt: null, topic: { courseId: id } },
    });
    if (qCount > 0) {
      throw new BadRequestException(
        `Bu derste ${qCount} soru var; önce soruları başka derse taşı ya da arşivle.`,
      );
    }
    await this.prisma.$transaction([
      this.prisma.examSectionCourse.deleteMany({ where: { courseId: id } }),
      this.prisma.course.update({ where: { id }, data: { deletedAt: new Date() } }),
    ]);
    await this.audit.log(actor, 'course.delete', 'course', id);
    return { deleted: true };
  }

  // ── Konu / Alt Konu CRUD ──
  async createTopic(actor: AuthenticatedUser, dto: UpsertTopicDto) {
    if (dto.parentId) {
      // Alt konu: üst konu aynı derste olmalı.
      const parent = await this.prisma.topic.findFirst({
        where: { id: dto.parentId, courseId: dto.courseId, deletedAt: null },
      });
      if (!parent) throw new BadRequestException('Üst konu bu derste bulunamadı.');
    }
    const topic = await this.prisma.topic.create({
      data: {
        courseId: dto.courseId,
        parentId: dto.parentId ?? null,
        name: dto.name,
        sortOrder: dto.sortOrder ?? 0,
        isPremium: dto.isPremium ?? false,
        matchKeywords: cleanKeywords(dto.matchKeywords),
      },
    });
    await this.audit.log(actor, 'topic.create', 'topic', topic.id, { name: dto.name });
    return topic;
  }

  async updateTopic(actor: AuthenticatedUser, id: string, dto: UpsertTopicDto) {
    await this.ensure('topic', id);
    const topic = await this.prisma.topic.update({
      where: { id },
      data: {
        courseId: dto.courseId,
        ...(dto.parentId !== undefined ? { parentId: dto.parentId ?? null } : {}),
        name: dto.name,
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        isPremium: dto.isPremium ?? false,
        // Yalnız gönderilince güncelle — ad/premium değişimi keyword'leri silmesin.
        ...(dto.matchKeywords !== undefined
          ? { matchKeywords: cleanKeywords(dto.matchKeywords) }
          : {}),
      },
    });
    await this.audit.log(actor, 'topic.update', 'topic', id, { name: dto.name });
    return topic;
  }

  async deleteTopic(actor: AuthenticatedUser, id: string) {
    await this.ensure('topic', id);
    const qCount = await this.prisma.question.count({ where: { topicId: id, deletedAt: null } });
    const childCount = await this.prisma.topic.count({ where: { parentId: id, deletedAt: null } });
    if (qCount > 0 || childCount > 0) {
      throw new BadRequestException(
        `Bu konuda ${qCount} soru ve ${childCount} alt konu var; önce onları taşı/arşivle.`,
      );
    }
    await this.prisma.topic.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log(actor, 'topic.delete', 'topic', id);
    return { deleted: true };
  }

  // ── Sıralama (sürükle-bırak): dizideki index = yeni sortOrder ──
  async reorder(actor: AuthenticatedUser, dto: ReorderDto) {
    const ops = dto.ids.map((id, i) => {
      const data = { sortOrder: i + 1 };
      switch (dto.entity) {
        case 'section':
          return this.prisma.examSection.update({ where: { id }, data });
        case 'course':
          return this.prisma.course.update({ where: { id }, data });
        case 'topic':
          return this.prisma.topic.update({ where: { id }, data });
      }
    });
    await this.prisma.$transaction(ops);
    await this.audit.log(actor, `${dto.entity}.reorder`, dto.entity, dto.ids[0] ?? '', {
      count: dto.ids.length,
    });
    return { reordered: dto.ids.length };
  }

  private async ensure(kind: 'course' | 'topic' | 'section', id: string) {
    const found =
      kind === 'course'
        ? await this.prisma.course.findFirst({ where: { id, deletedAt: null } })
        : kind === 'topic'
          ? await this.prisma.topic.findFirst({ where: { id, deletedAt: null } })
          : await this.prisma.examSection.findFirst({ where: { id, deletedAt: null } });
    if (!found) throw new NotFoundException('Kayıt bulunamadı.');
  }
}

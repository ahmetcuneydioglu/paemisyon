import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { AuditService } from '../audit.service';
import { UpsertCourseDto, UpsertTopicDto } from '../dto/catalog.dto';

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

  async createCourse(actor: AuthenticatedUser, dto: UpsertCourseDto) {
    const course = await this.prisma.course.create({
      data: { moduleId: dto.moduleId, name: dto.name, sortOrder: dto.sortOrder ?? 0 },
    });
    await this.audit.log(actor, 'course.create', 'course', course.id, { name: dto.name });
    return course;
  }

  async updateCourse(actor: AuthenticatedUser, id: string, dto: UpsertCourseDto) {
    await this.ensure('course', id);
    const course = await this.prisma.course.update({
      where: { id },
      data: { moduleId: dto.moduleId, name: dto.name, sortOrder: dto.sortOrder ?? 0 },
    });
    await this.audit.log(actor, 'course.update', 'course', id, { name: dto.name });
    return course;
  }

  async deleteCourse(actor: AuthenticatedUser, id: string) {
    await this.ensure('course', id);
    await this.prisma.course.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log(actor, 'course.delete', 'course', id);
    return { deleted: true };
  }

  async createTopic(actor: AuthenticatedUser, dto: UpsertTopicDto) {
    const topic = await this.prisma.topic.create({
      data: {
        courseId: dto.courseId,
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
        name: dto.name,
        sortOrder: dto.sortOrder ?? 0,
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
    await this.prisma.topic.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log(actor, 'topic.delete', 'topic', id);
    return { deleted: true };
  }

  private async ensure(kind: 'course' | 'topic', id: string) {
    const found =
      kind === 'course'
        ? await this.prisma.course.findFirst({ where: { id, deletedAt: null } })
        : await this.prisma.topic.findFirst({ where: { id, deletedAt: null } });
    if (!found) throw new NotFoundException('Kayıt bulunamadı.');
  }
}

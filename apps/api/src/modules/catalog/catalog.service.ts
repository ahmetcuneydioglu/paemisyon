import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

/// İçerik keşif okuması (Doc 7 §4.3): Modül → Ders → Konu.
@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  getModules() {
    return this.prisma.module.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, key: true, name: true, description: true, icon: true, sortOrder: true },
    });
  }

  getCourses(moduleId: string) {
    return this.prisma.course.findMany({
      where: { moduleId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, sortOrder: true },
    });
  }

  getTopics(courseId: string) {
    return this.prisma.topic.findMany({
      where: { courseId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, sortOrder: true, isPremium: true },
    });
  }

  async getTopic(id: string) {
    const topic = await this.prisma.topic.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, name: true, isPremium: true, courseId: true },
    });
    if (!topic) throw new NotFoundException('Konu bulunamadı.');

    // Yalnızca yayındaki sürümü olan sorular sayılır (Doc 6).
    const questionCount = await this.prisma.question.count({
      where: { topicId: id, deletedAt: null, currentVersionId: { not: null } },
    });
    return { ...topic, questionCount };
  }
}

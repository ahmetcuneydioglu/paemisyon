import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { FREE_LIST_ITEM_LIMIT, FREE_LIST_LIMIT } from '../../common/plan.constants';
import type { AuthenticatedUser } from '../auth/auth.types';

/**
 * Soru notu ve kişisel listeler (Doc 49 S1-C, `10-s1-veri-katmani.md` §1.3).
 * Sınırlar SUNUCUDA: ücretsiz 3 liste × 50 soru (plan.constants), premium sınırsız.
 * Liste sahipliği her işlemde userId ile süzülür — başkasının listesi 404'tür.
 */
@Injectable()
export class ListsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Plan sınırları (istemci "2/3 liste" gösterebilsin diye yanıtla gider). */
  static limits(isPremium: boolean) {
    return isPremium
      ? { maxLists: null, maxItemsPerList: null }
      : { maxLists: FREE_LIST_LIMIT, maxItemsPerList: FREE_LIST_ITEM_LIMIT };
  }

  // ── Not ──

  async getNote(userId: string, questionId: string) {
    const n = await this.prisma.questionNote.findUnique({
      where: { userId_questionId: { userId, questionId } },
      select: { text: true, updatedAt: true },
    });
    return { text: n?.text ?? null, updatedAt: n?.updatedAt.toISOString() ?? null };
  }

  async putNote(userId: string, questionId: string, text: string) {
    const soru = await this.prisma.question.findFirst({
      where: { id: questionId, deletedAt: null },
      select: { id: true },
    });
    if (!soru) throw new NotFoundException('Soru bulunamadı.');
    const n = await this.prisma.questionNote.upsert({
      where: { userId_questionId: { userId, questionId } },
      update: { text },
      create: { userId, questionId, text },
      select: { text: true, updatedAt: true },
    });
    return { text: n.text, updatedAt: n.updatedAt.toISOString() };
  }

  async deleteNote(userId: string, questionId: string) {
    await this.prisma.questionNote.deleteMany({ where: { userId, questionId } });
    return { text: null, updatedAt: null };
  }

  // ── Listeler ──

  async getLists(user: AuthenticatedUser) {
    const rows = await this.prisma.userList.findMany({
      where: { userId: user.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        sortOrder: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        name: r.name,
        sortOrder: r.sortOrder,
        count: r._count.items,
        createdAt: r.createdAt.toISOString(),
      })),
      limits: ListsService.limits(user.isPremium),
    };
  }

  async createList(user: AuthenticatedUser, name: string) {
    if (!user.isPremium) {
      const n = await this.prisma.userList.count({ where: { userId: user.id } });
      if (n >= FREE_LIST_LIMIT) {
        throw new ForbiddenException({
          code: 'LIST_LIMIT_REACHED',
          message: `Ücretsiz planda en çok ${FREE_LIST_LIMIT} liste açabilirsin.`,
          details: { limit: FREE_LIST_LIMIT },
        });
      }
    }
    const son = await this.prisma.userList.aggregate({
      where: { userId: user.id },
      _max: { sortOrder: true },
    });
    const r = await this.prisma.userList.create({
      data: { userId: user.id, name: name.trim(), sortOrder: (son._max.sortOrder ?? -1) + 1 },
      select: { id: true, name: true, sortOrder: true, createdAt: true },
    });
    return { ...r, count: 0, createdAt: r.createdAt.toISOString() };
  }

  async getList(userId: string, listId: string) {
    const list = await this.sahipliListe(userId, listId);
    const items = await this.prisma.userListItem.findMany({
      where: { listId },
      orderBy: { addedAt: 'desc' },
      select: {
        questionId: true,
        addedAt: true,
        question: {
          select: {
            currentVersion: { select: { stem: true } },
            topic: { select: { id: true, name: true } },
          },
        },
      },
    });
    return {
      id: list.id,
      name: list.name,
      sortOrder: list.sortOrder,
      count: items.length,
      items: items.map((i) => ({
        questionId: i.questionId,
        stem: i.question.currentVersion?.stem ?? null,
        topicId: i.question.topic.id,
        topicName: i.question.topic.name,
        addedAt: i.addedAt.toISOString(),
      })),
    };
  }

  async updateList(userId: string, listId: string, patch: { name?: string; sortOrder?: number }) {
    await this.sahipliListe(userId, listId);
    const r = await this.prisma.userList.update({
      where: { id: listId },
      data: {
        ...(patch.name != null ? { name: patch.name.trim() } : {}),
        ...(patch.sortOrder != null ? { sortOrder: patch.sortOrder } : {}),
      },
      select: { id: true, name: true, sortOrder: true, _count: { select: { items: true } } },
    });
    return { id: r.id, name: r.name, sortOrder: r.sortOrder, count: r._count.items };
  }

  async deleteList(userId: string, listId: string) {
    await this.sahipliListe(userId, listId);
    await this.prisma.userList.delete({ where: { id: listId } });
    return { deleted: true };
  }

  async addItem(user: AuthenticatedUser, listId: string, questionId: string) {
    await this.sahipliListe(user.id, listId);
    const soru = await this.prisma.question.findFirst({
      where: { id: questionId, deletedAt: null },
      select: { id: true },
    });
    if (!soru) throw new NotFoundException('Soru bulunamadı.');
    if (!user.isPremium) {
      const varMi = await this.prisma.userListItem.findUnique({
        where: { listId_questionId: { listId, questionId } },
        select: { questionId: true },
      });
      if (!varMi) {
        const n = await this.prisma.userListItem.count({ where: { listId } });
        if (n >= FREE_LIST_ITEM_LIMIT) {
          throw new ForbiddenException({
            code: 'LIST_ITEM_LIMIT_REACHED',
            message: `Ücretsiz planda bir listeye en çok ${FREE_LIST_ITEM_LIMIT} soru eklenir.`,
            details: { limit: FREE_LIST_ITEM_LIMIT },
          });
        }
      }
    }
    await this.prisma.userListItem.upsert({
      where: { listId_questionId: { listId, questionId } },
      update: {},
      create: { listId, questionId },
    });
    const count = await this.prisma.userListItem.count({ where: { listId } });
    return { inList: true, count };
  }

  async removeItem(userId: string, listId: string, questionId: string) {
    await this.sahipliListe(userId, listId);
    await this.prisma.userListItem.deleteMany({ where: { listId, questionId } });
    const count = await this.prisma.userListItem.count({ where: { listId } });
    return { inList: false, count };
  }

  /** Sorunun hangi listelerde olduğu (soru ekranındaki "listeye ekle" sayfası için). */
  async listsOfQuestion(userId: string, questionId: string) {
    const rows = await this.prisma.userListItem.findMany({
      where: { questionId, list: { userId } },
      select: { listId: true },
    });
    return { listIds: rows.map((r) => r.listId) };
  }

  private async sahipliListe(userId: string, listId: string) {
    const list = await this.prisma.userList.findFirst({
      where: { id: listId, userId },
      select: { id: true, name: true, sortOrder: true },
    });
    if (!list) throw new NotFoundException('Liste bulunamadı.');
    return list;
  }
}

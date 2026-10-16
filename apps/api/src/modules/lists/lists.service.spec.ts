import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ListsService } from './lists.service';
import { FREE_LIST_ITEM_LIMIT, FREE_LIST_LIMIT } from '../../common/plan.constants';
import type { AuthenticatedUser } from '../auth/auth.types';

/**
 * Kişisel listeler (Doc 49 S1-C): sınırlar sunucuda, sahiplik her işlemde.
 */
function servis(o: {
  listeSayisi?: number;
  ogeSayisi?: number;
  ogeVar?: boolean;
  liste?: { id: string; name: string; sortOrder: number } | null;
  soruVar?: boolean;
}) {
  const yazilan: string[] = [];
  const prisma = {
    userList: {
      count: async () => o.listeSayisi ?? 0,
      aggregate: async () => ({ _max: { sortOrder: 1 } }),
      create: async (a: { data: { name: string; sortOrder: number } }) => {
        yazilan.push('create');
        return { id: 'l1', name: a.data.name, sortOrder: a.data.sortOrder, createdAt: new Date(0) };
      },
      findFirst: async () =>
        o.liste === undefined ? { id: 'l1', name: 'X', sortOrder: 0 } : o.liste,
      delete: async () => {
        yazilan.push('delete');
      },
    },
    userListItem: {
      count: async () => o.ogeSayisi ?? 0,
      findUnique: async () => (o.ogeVar ? { questionId: 'q1' } : null),
      upsert: async () => {
        yazilan.push('upsert');
      },
      deleteMany: async () => {
        yazilan.push('deleteMany');
      },
    },
    question: { findFirst: async () => (o.soruVar === false ? null : { id: 'q1' }) },
  };
  return { s: new ListsService(prisma as never), yazilan };
}
const free = { id: 'u1', isPremium: false } as AuthenticatedUser;
const premium = { id: 'u1', isPremium: true } as AuthenticatedUser;

describe('ListsService (Doc 49 S1-C)', () => {
  it('ücretsizde 3. listeden sonrası LIST_LIMIT_REACHED; premium sınırsız', async () => {
    const dolu = servis({ listeSayisi: FREE_LIST_LIMIT });
    await expect(dolu.s.createList(free, 'Yeni')).rejects.toMatchObject({
      response: { code: 'LIST_LIMIT_REACHED' },
    });
    expect(dolu.yazilan).toEqual([]);
    const r = await dolu.s.createList(premium, '  Yeni  ');
    expect(r).toMatchObject({ name: 'Yeni', sortOrder: 2, count: 0 });
    await expect(servis({ listeSayisi: 2 }).s.createList(free, 'Üçüncü')).resolves.toMatchObject({
      count: 0,
    });
  });
  it('ücretsizde listede 50 soru tavanı; zaten listede olan soru tavana takılmaz', async () => {
    const dolu = servis({ ogeSayisi: FREE_LIST_ITEM_LIMIT });
    await expect(dolu.s.addItem(free, 'l1', 'q1')).rejects.toBeInstanceOf(ForbiddenException);
    const zaten = servis({ ogeSayisi: FREE_LIST_ITEM_LIMIT, ogeVar: true });
    await expect(zaten.s.addItem(free, 'l1', 'q1')).resolves.toMatchObject({ inList: true });
    const prem = servis({ ogeSayisi: 500 });
    await expect(prem.s.addItem(premium, 'l1', 'q1')).resolves.toMatchObject({
      inList: true,
      count: 500,
    });
  });
  it('başkasının / olmayan liste 404; olmayan soru 404', async () => {
    const yok = servis({ liste: null });
    await expect(yok.s.addItem(free, 'l9', 'q1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(yok.s.deleteList('u1', 'l9')).rejects.toBeInstanceOf(NotFoundException);
    expect(yok.yazilan).toEqual([]);
    await expect(servis({ soruVar: false }).s.addItem(premium, 'l1', 'q9')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
  it('limits: ücretsiz sayılar, premium null', () => {
    expect(ListsService.limits(false)).toEqual({ maxLists: 3, maxItemsPerList: 50 });
    expect(ListsService.limits(true)).toEqual({ maxLists: null, maxItemsPerList: null });
  });
});

import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CoachService, odagiCoz } from './coach.service';

const D = (s: string) => new Date(`${s}T00:00:00.000Z`);
const user = (isPremium: boolean): AuthenticatedUser => ({
  id: '00000000-0000-0000-0000-0000000000a1',
  email: 'aday@example.com',
  roles: ['user'],
  isPremium,
});
const KONU = '00000000-0000-0000-0000-0000000000b1';
const DERS = '00000000-0000-0000-0000-0000000000c1';

describe('odagiCoz — günün odağı geçicidir (Doc 25 §5)', () => {
  const satir = (over: Partial<Parameters<typeof odagiCoz>[0] & object> = {}) => ({
    day: D('2026-10-14'),
    kind: 'topic' as const,
    courseId: DERS,
    topicId: KONU,
    course: { name: 'Anayasa Hukuku', deletedAt: null },
    topic: { name: 'Temel Haklar ve Ödevler', deletedAt: null },
    ...over,
  });

  it('kayıt yoksa koç', () => {
    expect(odagiCoz(null, D('2026-10-14')).kind).toBe('coach');
  });

  it('bugünün konu odağı etiketle döner', () => {
    expect(odagiCoz(satir(), D('2026-10-14'))).toEqual({
      kind: 'topic',
      courseId: DERS,
      topicId: KONU,
      label: 'Temel Haklar ve Ödevler',
    });
  });

  it('dünün odağı bugün koça döner', () => {
    expect(odagiCoz(satir({ day: D('2026-10-13') }), D('2026-10-14')).kind).toBe('coach');
  });

  it('kapsam silinmişse koça döner (boş tura kilitlenmez)', () => {
    expect(
      odagiCoz(satir({ topic: { name: 'x', deletedAt: new Date() } }), D('2026-10-14')).kind,
    ).toBe('coach');
  });

  it('ders ve yanlışlar odağı', () => {
    expect(odagiCoz(satir({ kind: 'course', topicId: null }), D('2026-10-14'))).toMatchObject({
      kind: 'course',
      label: 'Anayasa Hukuku',
      topicId: null,
    });
    expect(odagiCoz(satir({ kind: 'wrongs' }), D('2026-10-14'))).toMatchObject({
      kind: 'wrongs',
      label: null,
    });
  });
});

describe('CoachService.setFocus', () => {
  function setup(topic: { isPremium: boolean } | null = { isPremium: false }) {
    const prisma = {
      dailyFocus: { deleteMany: jest.fn().mockResolvedValue({}), upsert: jest.fn().mockResolvedValue({}) },
      topic: {
        findFirst: jest
          .fn()
          .mockResolvedValue(
            topic ? { id: KONU, name: 'Temel Haklar ve Ödevler', courseId: DERS, ...topic } : null,
          ),
      },
      course: { findFirst: jest.fn().mockResolvedValue({ id: DERS, name: 'Anayasa Hukuku' }) },
    };
    return { service: new CoachService(prisma as never, {} as never), prisma };
  }

  it('koç seçilince kayıt silinir', async () => {
    const { service, prisma } = setup();
    await expect(service.setFocus(user(false), { kind: 'coach' })).resolves.toMatchObject({ kind: 'coach' });
    expect(prisma.dailyFocus.deleteMany).toHaveBeenCalled();
    expect(prisma.dailyFocus.upsert).not.toHaveBeenCalled();
  });

  it('konu odağı dersini de yazar ve etiketi döner', async () => {
    const { service, prisma } = setup();
    const r = await service.setFocus(user(false), { kind: 'topic', topicId: KONU });
    expect(r).toEqual({ kind: 'topic', courseId: DERS, topicId: KONU, label: 'Temel Haklar ve Ödevler' });
    expect(prisma.dailyFocus.upsert.mock.calls[0][0].create).toMatchObject({ kind: 'topic', courseId: DERS, topicId: KONU });
  });

  it('ücretsiz kullanıcı premium konuyu seçerse PREMIUM_REQUIRED (sessizce elenmez)', async () => {
    const { service, prisma } = setup({ isPremium: true });
    await expect(service.setFocus(user(false), { kind: 'topic', topicId: KONU })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.dailyFocus.upsert).not.toHaveBeenCalled();
    await expect(service.setFocus(user(true), { kind: 'topic', topicId: KONU })).resolves.toMatchObject({
      kind: 'topic',
    });
  });

  it('alan uyumsuzluğu ve yok olan kapsam reddedilir', async () => {
    const { service } = setup(null);
    await expect(service.setFocus(user(false), { kind: 'topic' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.setFocus(user(false), { kind: 'course' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.setFocus(user(false), { kind: 'wrongs', topicId: KONU })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.setFocus(user(false), { kind: 'topic', topicId: KONU })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

import { NotFoundException } from '@nestjs/common';
import { AdminCatalogService } from './admin-catalog.service';

/**
 * Ders ikonu güncellemesi (Doc 48 Faz 6.3). İkon panelden yönetilir; ad
 * düzenlemesi gibi ikonu göndermeyen bir istek onu SİLMEMELİ.
 */
function kur(mevcut: { icon: string | null } | null) {
  const yazilan: unknown[] = [];
  const kayitlar: { action: string; detail: unknown }[] = [];
  const prisma = {
    course: {
      findFirst: async () => (mevcut ? { id: 'c1', name: 'Anayasa Hukuku', ...mevcut } : null),
      update: async (args: { data: unknown }) => {
        yazilan.push(args.data);
        return { id: 'c1' };
      },
    },
  };
  const audit = {
    log: async (_aktor: unknown, action: string, _tur: string, _id: string, detail: unknown) => {
      kayitlar.push({ action, detail });
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { servis: new AdminCatalogService(prisma as any, audit as any), yazilan, kayitlar };
}

const aktor = { id: 'u1', roles: ['admin'] } as never;

describe('AdminCatalogService.updateCourse — ders ikonu', () => {
  it('ikon gönderilmezse dokunulmaz — ad düzenlemesi ikonu silmez', async () => {
    const { servis, yazilan, kayitlar } = kur({ icon: 'landmark' });
    await servis.updateCourse(aktor, 'c1', { name: 'Anayasa' });
    expect(yazilan).toEqual([{ name: 'Anayasa' }]);
    expect(kayitlar).toEqual([{ action: 'course.update', detail: { name: 'Anayasa' } }]);
  });

  it('ikon gönderilince yazılır; işlem kaydı önceki değeri taşır', async () => {
    const { servis, yazilan, kayitlar } = kur({ icon: null });
    await servis.updateCourse(aktor, 'c1', { name: 'Anayasa Hukuku', icon: 'landmark' });
    expect(yazilan).toEqual([{ name: 'Anayasa Hukuku', icon: 'landmark' }]);
    expect(kayitlar[0].detail).toEqual({
      name: 'Anayasa Hukuku',
      icon: 'landmark',
      onceki: { icon: null },
    });
  });

  it('null ikonu temizler — istemci açık kitaba döner', async () => {
    const { servis, yazilan, kayitlar } = kur({ icon: 'scale' });
    await servis.updateCourse(aktor, 'c1', { name: 'Anayasa Hukuku', icon: null });
    expect(yazilan).toEqual([{ name: 'Anayasa Hukuku', icon: null }]);
    expect(kayitlar[0].detail).toEqual({
      name: 'Anayasa Hukuku',
      icon: null,
      onceki: { icon: 'scale' },
    });
  });

  it('silinmiş ya da olmayan ders 404 — hiçbir şey yazılmaz', async () => {
    const { servis, yazilan, kayitlar } = kur(null);
    await expect(
      servis.updateCourse(aktor, 'c1', { name: 'Anayasa Hukuku', icon: 'landmark' }),
    ).rejects.toThrow(NotFoundException);
    expect(yazilan).toEqual([]);
    expect(kayitlar).toEqual([]);
  });
});

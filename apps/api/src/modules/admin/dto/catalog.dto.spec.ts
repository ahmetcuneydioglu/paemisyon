// @Type (class-transformer) Reflect.getMetadata okur; Nest dışında yüklü değil.
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { COURSE_ICON_KEYS } from '../../../common/course-icons';
import { UpsertCourseDto } from './catalog.dto';

/**
 * Ders ikonu doğrulaması (Doc 48 Faz 6.3). Gövde, global ValidationPipe'ın
 * (main.ts) yaptığı gibi önce sınıfa çevrilir, sonra aynı seçeneklerle denetlenir.
 */
async function denetle(body: Record<string, unknown>) {
  const dto = plainToInstance(UpsertCourseDto, body);
  const hatalar = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  return { dto, alanlar: hatalar.map((h) => h.property) };
}

describe('UpsertCourseDto.icon — ders ikonu (Doc 48 Faz 6.3)', () => {
  it('izinli anahtar geçer', async () => {
    const { dto, alanlar } = await denetle({ name: 'Anayasa Hukuku', icon: 'landmark' });
    expect(alanlar).toEqual([]);
    expect(dto.icon).toBe('landmark');
  });

  it('listedeki her anahtar geçer — tek kaynak COURSE_ICON_KEYS', async () => {
    for (const icon of COURSE_ICON_KEYS) {
      expect((await denetle({ name: 'Ders', icon })).alanlar).toEqual([]);
    }
  });

  it('null geçer — ikonu temizler (istemci açık kitap çizer)', async () => {
    const { dto, alanlar } = await denetle({ name: 'Ders', icon: null });
    expect(alanlar).toEqual([]);
    expect(dto.icon).toBeNull();
  });

  it('alan hiç yoksa geçer ve tanımsız kalır — servis ikona dokunmaz', async () => {
    const { dto, alanlar } = await denetle({ name: 'Ders' });
    expect(alanlar).toEqual([]);
    expect(dto.icon).toBeUndefined();
  });

  it('listede olmayan değer reddedilir', async () => {
    for (const icon of ['rocket', '', 'Scale', 'book_open', 3, true, ['scale']]) {
      expect((await denetle({ name: 'Ders', icon })).alanlar).toEqual(['icon']);
    }
  });
});

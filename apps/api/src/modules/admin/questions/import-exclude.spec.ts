import { AdminQuestionsService } from './admin-questions.service';

/** Başlıklı CSV — parseImportFile DB'siz çalışır (saf ayrıştırma). */
function csv(): Buffer {
  const lines = [
    'soru,A,B,C,D,dogru',
    'Soru iki?,a,b,c,d,A', // rowNo 2
    'Soru üç?,a,b,c,d,B', // rowNo 3
    'Soru dört?,a,b,c,d,C', // rowNo 4
  ];
  return Buffer.from(lines.join('\n'), 'utf8');
}

/** import()'in dokunduğu yüzeyi taklit eder; yazılan soru köklerini toplar.
 *  Yazma yolu 3 toplu createMany'dir (satır-başına create transaction 5 sn
 *  sınırını aşıyordu — canlıda yaşanan hata). */
function makeService() {
  const writtenStems: string[] = [];
  const prisma = {
    examType: { findFirst: jest.fn().mockResolvedValue({ id: 'M' }) },
    topic: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'T1', name: 'Konu 1', matchKeywords: [], course: { name: 'Ders' } },
      ]),
    },
    $transaction: async (cb: (tx: unknown) => Promise<void>) =>
      cb({
        question: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
        questionVersion: {
          createMany: jest.fn(async (arg: { data: { stem: string }[] }) => {
            writtenStems.push(...arg.data.map((d) => d.stem));
            return { count: arg.data.length };
          }),
        },
        questionOption: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      }),
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  const svc = new AdminQuestionsService(prisma as never, audit as never);
  return { svc, writtenStems };
}

const actor = { id: 'admin', email: 'a@b.c', roles: ['admin'], isPremium: false } as never;
const base = { moduleId: 'M', file: csv(), filename: 'x.csv', skipErrors: false };

describe('AdminQuestionsService.import — çıkarma (Doc 20 ek)', () => {
  it('hepsi atanmış → hepsi yazılır', async () => {
    const { svc, writtenStems } = makeService();
    const r = await svc.import(actor, {
      ...base,
      assignments: { 2: 'T1', 3: 'T1', 4: 'T1' },
      excluded: [],
    });
    expect(r.imported).toBe(3);
    expect(r.excluded).toBe(0);
    expect(writtenStems).toHaveLength(3);
  });

  it('çıkarılan soru DB\'ye YAZILMAZ', async () => {
    const { svc, writtenStems } = makeService();
    const r = await svc.import(actor, {
      ...base,
      assignments: { 2: 'T1', 3: 'T1' },
      excluded: [4],
    });
    expect(r.imported).toBe(2);
    expect(r.excluded).toBe(1);
    expect(writtenStems).toEqual(['Soru iki?', 'Soru üç?']);
    expect(writtenStems).not.toContain('Soru dört?');
  });

  it('karar verilmemiş soru (ne atanmış ne çıkarılmış) → hata', async () => {
    const { svc } = makeService();
    await expect(
      svc.import(actor, { ...base, assignments: { 2: 'T1' }, excluded: [3] }),
    ).rejects.toThrow(/ne sınıflandırıldı ne çıkarıldı/);
  });

  it('hepsi çıkarıldıysa → "Aktarılacak soru kalmadı"', async () => {
    const { svc } = makeService();
    await expect(
      svc.import(actor, { ...base, assignments: {}, excluded: [2, 3, 4] }),
    ).rejects.toThrow(/kalmadı/);
  });

  it('çıkarma, atamadan önceliklidir (atanmış ama çıkarılmış → yazılmaz)', async () => {
    const { svc, writtenStems } = makeService();
    const r = await svc.import(actor, {
      ...base,
      assignments: { 2: 'T1', 3: 'T1', 4: 'T1' },
      excluded: [4],
    });
    expect(r.imported).toBe(2);
    expect(writtenStems).not.toContain('Soru dört?');
  });
});

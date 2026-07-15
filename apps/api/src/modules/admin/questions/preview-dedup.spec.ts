import { AdminQuestionsService } from './admin-questions.service';
import { questionFingerprint } from './import-parser';

/** 3 satırlık CSV: 1 benzersiz + 2 birebir aynı (batch tekrar). */
function csv(): Buffer {
  const lines = [
    'soru,A,B,C,D,dogru',
    'Benzersiz soru?,a,b,c,d,A', // rowNo 2
    'Tekrar eden soru?,x,y,z,t,B', // rowNo 3
    'Tekrar eden soru?,x,y,z,t,B', // rowNo 4 — 3 ile birebir aynı
  ];
  return Buffer.from(lines.join('\n'), 'utf8');
}

describe('previewImport — tekrar tespiti (Doc 20 EK 2)', () => {
  it('banka tekrarı + batch tekrarı işaretlenir; benzersiz temiz kalır', async () => {
    // Bankada "Benzersiz soru?" zaten varmış gibi davran (rowNo 2 → bank dup).
    const bankHash = questionFingerprint('Benzersiz soru?', ['a', 'b', 'c', 'd']);
    const prisma = {
      examType: { findFirst: jest.fn().mockResolvedValue({ id: 'M' }) },
      topic: { findMany: jest.fn().mockResolvedValue([]) },
      questionVersion: {
        findMany: jest.fn().mockResolvedValue([
          {
            contentHash: bankHash,
            question: { topic: { name: 'Anayasa', course: { name: 'Hukuk' } } },
          },
        ]),
      },
    };
    const svc = new AdminQuestionsService(prisma as never, { log: jest.fn() } as never);
    const r = await svc.previewImport({ moduleId: 'M', file: csv(), filename: 'x.csv' });

    const byRow = new Map(r.valid.map((v) => [v.rowNo, v] as const));
    // rowNo 2: bankada var
    expect(byRow.get(2)!.duplicate).toEqual({ scope: 'bank', where: 'Hukuk / Anayasa' });
    // rowNo 3: bankada yok, batch'te ilk görülüş → temiz
    expect(byRow.get(3)!.duplicate).toBeNull();
    // rowNo 4: rowNo 3 ile birebir aynı → batch tekrarı
    expect(byRow.get(4)!.duplicate).toEqual({ scope: 'batch', where: 'bu dosyada #3 ile aynı' });
  });

  it('banka boşsa yalnız batch tekrarları işaretlenir', async () => {
    const prisma = {
      examType: { findFirst: jest.fn().mockResolvedValue({ id: 'M' }) },
      topic: { findMany: jest.fn().mockResolvedValue([]) },
      questionVersion: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const svc = new AdminQuestionsService(prisma as never, { log: jest.fn() } as never);
    const r = await svc.previewImport({ moduleId: 'M', file: csv(), filename: 'x.csv' });
    const byRow = new Map(r.valid.map((v) => [v.rowNo, v] as const));
    expect(byRow.get(2)!.duplicate).toBeNull();
    expect(byRow.get(3)!.duplicate).toBeNull();
    expect(byRow.get(4)!.duplicate).toEqual({ scope: 'batch', where: 'bu dosyada #3 ile aynı' });
  });
});

import { NotFoundException } from '@nestjs/common';
import { MevzuatService } from './mevzuat.service';

/**
 * GET /public/mevzuat/:slug/:no/questions (Doc 49 S1-B). Üç şey korunur:
 * madde yalnız yayımlı metinler arasından çözülür, soru yalnız yayımlı ve
 * iptal edilmemiş olanlardan gelir (sorgu süzgeci), girişsizde `me` yoktur.
 */
type Bag = {
  relation: 'primary' | 'related';
  question: {
    id: string;
    createdAt: Date;
    currentVersion: { stem: string } | null;
    topic: { name: string };
  };
};

function servis(opts: {
  baglar: Bag[];
  cevaplar?: { questionId: string; isCorrect: boolean | null }[];
}) {
  const sorgular: Record<string, unknown>[] = [];
  const prisma = {
    legislation: { findFirst: async () => ({ id: 'leg1', slug: 'tck', name: 'Türk Ceza Kanunu' }) },
    lawArticle: {
      findMany: async () => [
        { id: 'a43', articleNo: '43', title: 'Zincirleme suç' },
        { id: 'a4a', articleNo: '4/A', title: null },
      ],
    },
    questionArticle: {
      findMany: async (q: Record<string, unknown>) => {
        sorgular.push(q);
        return opts.baglar;
      },
    },
    quizAnswer: { findMany: async () => opts.cevaplar ?? [] },
  };
  return { s: new MevzuatService(prisma as never), sorgular };
}

const soru = (id: string, gun: number, relation: Bag['relation'] = 'primary'): Bag => ({
  relation,
  question: {
    id,
    createdAt: new Date(2026, 0, gun),
    currentVersion: { stem: `${id} kökü` },
    topic: { name: 'Türk Ceza Kanunu' },
  },
});

describe('MevzuatService.articleQuestions', () => {
  it('madde slug çözülür; primary önce, sonra eskiden yeniye; girişsizde me yok', async () => {
    const { s, sorgular } = servis({
      baglar: [soru('q3', 3, 'related'), soru('q2', 2), soru('q1', 1)],
    });
    const r = await s.articleQuestions('tck', '43');
    expect(r).toMatchObject({ lawSlug: 'tck', no: '43', slug: '43', count: 3, primaryCount: 2 });
    expect(r.items.map((i) => i.questionId)).toEqual(['q1', 'q2', 'q3']);
    expect(r.items[0]).toMatchObject({ stem: 'q1 kökü', relation: 'primary' });
    expect(r.items[0].me).toBeUndefined();
    // Süzgeç: yalnız yayımlı + iptal edilmemiş sorular (anahtar sızmaz, iptal sayılmaz).
    const where = sorgular[0].where as { lawArticleId: string; question: Record<string, unknown> };
    expect(where.lawArticleId).toBe('a43');
    expect(where.question).toMatchObject({
      deletedAt: null,
      currentVersion: { is: { status: 'published' } },
      pastExams: { none: { cancelled: true } },
    });
  });
  it('harfli madde slug ile bulunur ("4/A" → "4-a")', async () => {
    const { s } = servis({ baglar: [] });
    const r = await s.articleQuestions('tck', '4-a');
    expect(r).toMatchObject({ no: '4/A', count: 0, items: [] });
  });
  it('bilinmeyen madde 404', async () => {
    const { s } = servis({ baglar: [] });
    await expect(s.articleQuestions('tck', '999')).rejects.toBeInstanceOf(NotFoundException);
  });
  it('girişliyse son cevap: çözüldü/doğru; cevapsız soru solved:false', async () => {
    const { s } = servis({
      baglar: [soru('q1', 1), soru('q2', 2)],
      // en yeni önce gelir (orderBy desc); q1 için son cevap yanlış
      cevaplar: [
        { questionId: 'q1', isCorrect: false },
        { questionId: 'q1', isCorrect: true },
      ],
    });
    const r = await s.articleQuestions('tck', '43', 'u1');
    expect(r.items[0].me).toEqual({ solved: true, correct: false });
    expect(r.items[1].me).toEqual({ solved: false, correct: null });
  });
});

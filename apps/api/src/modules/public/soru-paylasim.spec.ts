import { NotFoundException } from '@nestjs/common';
import { paylasilanSoru, paylasimWhere } from './soru-paylasim';

/**
 * GET /public/questions/:id/share (F10-P). Korunanlar: anahtar/açıklama/kaynak
 * etiketi seçilmez; yalnız yayımlı + iptal edilmemiş soru; madde bağı döner.
 */
const surum = {
  id: 'v1',
  questionId: 'q1',
  stem: 'PVSK md. 4/A uyarınca durdurma yetkisi…',
  mediaUrl: null,
  difficulty: 'hard',
  options: [
    { id: 'o1', label: 'A', text: 'Makul sebep' },
    { id: 'o2', label: 'B', text: 'Kesin delil' },
  ],
  question: {
    articleNo: '4/A',
    topic: {
      name: 'Polis Vazife ve Salahiyet Kanunu',
      legislation: { slug: 'pvsk', shortName: 'PVSK' },
    },
  },
};

function prisma(satir: unknown) {
  const sorgular: Record<string, unknown>[] = [];
  return {
    sorgular,
    question: {
      findFirst: async (q: Record<string, unknown>) => {
        sorgular.push(q);
        return satir;
      },
    },
  };
}

describe('paylasilanSoru', () => {
  it('yayımlı soruyu anahtar, açıklama ve kaynak etiketi olmadan döner', async () => {
    const p = prisma({
      currentVersion: surum,
      topic: { name: 'PVSK', course: { name: 'Polis Meslek Mevzuatı' } },
    });
    const r = await paylasilanSoru(p as never, 'q1');
    expect(r.questionId).toBe('q1');
    expect(r.courseName).toBe('Polis Meslek Mevzuatı');
    expect(r.difficulty).toBe('hard');
    expect(r.relatedArticleRef?.label).toBe('PVSK md. 4/A');
    expect(r.options.map((o) => Object.keys(o).sort())).toEqual([
      ['id', 'label', 'text'],
      ['id', 'label', 'text'],
    ]);
    expect(JSON.stringify(r)).not.toMatch(/isCorrect|explanation|sourceLabel/);
    const select = JSON.stringify(p.sorgular[0]);
    expect(select).not.toMatch(/isCorrect|explanation|sourceLabel/);
  });

  it('yalnız yayımlı, silinmemiş, iptal edilmemiş soruyu arar; yoksa 404', async () => {
    const p = prisma(null);
    await expect(paylasilanSoru(p as never, 'yok')).rejects.toBeInstanceOf(NotFoundException);
    const where = paylasimWhere('yok');
    expect(where).toMatchObject({
      id: 'yok',
      deletedAt: null,
      currentVersion: { status: 'published' },
    });
    expect(Object.keys(where).length).toBeGreaterThan(3); // IPTAL_EDILMEMIS eklendi
  });

  it('sürümü olmayan soruda da 404', async () => {
    const p = prisma({ currentVersion: null, topic: { name: 'x', course: { name: 'y' } } });
    await expect(paylasilanSoru(p as never, 'q1')).rejects.toBeInstanceOf(NotFoundException);
  });
});

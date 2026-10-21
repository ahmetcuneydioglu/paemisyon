import { maddeBagiGosterilir, soruOzeti, type SoruSurumu } from './soru-ozeti';

const surum: SoruSurumu = {
  id: 'v1',
  questionId: 'q1',
  stem: 'PVSK’ye göre durdurma için hangisi gereklidir?',
  mediaUrl: null,
  difficulty: 'hard',
  options: [{ id: 'o1', label: 'A', text: 'Makul bir sebep' }],
  question: {
    articleNo: '4/A',
    topic: {
      name: '2559 sayılı Polis Vazife ve Salâhiyet Kanunu',
      legislation: { slug: 'pvsk-2559', shortName: 'PVSK' },
    },
  },
};

describe('soruOzeti (F10-0)', () => {
  it('alıştırmada zorluk ve madde bağı döner; cevap anahtarı yok', () => {
    const o = soruOzeti(surum, 'practice');
    expect(o.difficulty).toBe('hard');
    expect(o.relatedArticleRef).toEqual({
      lawSlug: '2559-sayili-polis-vazife-ve-salahiyet-kanunu',
      no: '4/A',
      slug: '4-a',
      label: 'PVSK md. 4/A',
      legislationSlug: 'pvsk-2559',
    });
    expect(o).not.toHaveProperty('explanation');
    expect(o.options[0]).not.toHaveProperty('isCorrect');
  });

  it('denemede madde bağı GİZLİ (ipucu olur); zorluk kalır', () => {
    const o = soruOzeti(surum, 'exam');
    expect(o.relatedArticleRef).toBeNull();
    expect(o.difficulty).toBe('hard');
  });

  it('kısa ad yoksa konu adı; mevzuat kaydı yoksa okuyucu slug’ı null', () => {
    const o = soruOzeti(
      { ...surum, question: { articleNo: '12', topic: { name: 'Anayasa', legislation: null } } },
      'review',
    );
    expect(o.relatedArticleRef?.label).toBe('Anayasa md. 12');
    expect(o.relatedArticleRef?.legislationSlug).toBeNull();
  });

  it('madde etiketi olmayan soruda bağ null', () => {
    const o = soruOzeti({ ...surum, question: { ...surum.question, articleNo: null } }, 'daily');
    expect(o.relatedArticleRef).toBeNull();
  });

  it('bağ yalnız alıştırma türü modlarda gösterilir', () => {
    expect(['practice', 'review', 'daily'].every(maddeBagiGosterilir)).toBe(true);
    expect(['exam', 'deneme'].some(maddeBagiGosterilir)).toBe(false);
  });
});

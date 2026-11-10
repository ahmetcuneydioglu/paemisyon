import type { ArticleText } from '../summaries/ozet-dogrulayici';
import { validateCard, validateDeck, type FlashcardJson } from './kart-dogrulayici';

const articles = new Map<string, ArticleText>([
  [
    '13',
    {
      articleNo: '13',
      text: 'Temel hak ve hürriyetler, özlerine dokunulmaksızın yalnızca Anayasanın ilgili maddelerinde belirtilen sebeplere bağlı olarak ve ancak kanunla sınırlanabilir.',
    },
  ],
  [
    '75',
    {
      articleNo: '75',
      text: 'Türkiye Büyük Millet Meclisi genel oyla seçilen altıyüz milletvekilinden oluşur.',
    },
  ],
  [
    '77',
    {
      articleNo: '77',
      text: 'Türkiye Büyük Millet Meclisi ve Cumhurbaşkanlığı seçimleri beş yılda bir aynı günde yapılır.',
    },
  ],
]);

const base: FlashcardJson = {
  kind: 'qa',
  front: 'Temel hak ve hürriyetler hangi araçla sınırlanabilir?',
  back: 'Yalnızca kanunla.',
  articleRefs: ['13'],
};

describe('validateCard (Doc 56 §8.3)', () => {
  it('referanslı, sayısız kart geçer', () => {
    const v = validateCard(base, 0, articles);
    expect(v.ok).toBe(true);
    expect(v.lines).toContain('✓ cevapta sayı yok');
  });

  it('articleRefs boşsa ya da madde yoksa kusur', () => {
    expect(validateCard({ ...base, articleRefs: [] }, 0, articles).issues).toContain(
      'articleRefs boş',
    );
    expect(validateCard({ ...base, articleRefs: ['999'] }, 0, articles).issues[0]).toMatch(
      /madde yok: 999/,
    );
  });

  it('cevaptaki sayı madde metninde geçmeli (yazıyla sayı dahil); geçmiyorsa kusur', () => {
    const ok = validateCard(
      { kind: 'numeric', front: 'TBMM kaç üyeden oluşur?', back: '600', articleRefs: ['75'] },
      0,
      articles,
    );
    expect(ok.ok).toBe(true);
    const bad = validateCard(
      { kind: 'numeric', front: 'Seçim kaç yılda bir?', back: '4 yılda bir', articleRefs: ['77'] },
      0,
      articles,
    );
    expect(bad.ok).toBe(false);
    expect(bad.issues[0]).toMatch(/4 referans metinlerinde yok/);
  });

  it('türetilmiş sayı formülle kabul edilir; işleneni metinde olmayan formül kusur', () => {
    const v = validateCard(
      {
        kind: 'numeric',
        front: 'TBMM üye tamsayısının salt çoğunluğu kaçtır?',
        back: '301',
        articleRefs: ['75'],
        derivedNumbers: [{ value: 301, expr: 'floor(600/2)+1', refs: ['75'] }],
      },
      0,
      articles,
    );
    expect(v.ok).toBe(true);
    const w = validateCard(
      {
        kind: 'numeric',
        front: 'x',
        back: '401',
        articleRefs: ['75'],
        derivedNumbers: [{ value: 401, expr: '800/2+1', refs: ['75'] }],
      },
      0,
      articles,
    );
    expect(w.issues[0]).toMatch(/formül işleneni metinde yok: 800/);
  });

  it('karşı örnek sayı metinde GEÇİYORSA kusur', () => {
    const v = validateCard(
      {
        kind: 'trap',
        front: 'Yanlış olan hangisi?',
        back: '5 değil; TBMM 600 üyedir.',
        articleRefs: ['75'],
        counterNumbers: [5],
      },
      0,
      articles,
    );
    expect(v.ok).toBe(true);
    // 500 mevzuatın hiçbir maddesinde geçmez: uydurma öğe (denetim bulgusu 6 Kas 2026)
    const u = validateCard(
      {
        ...v,
        kind: 'trap',
        front: 'x',
        back: '500 değil',
        articleRefs: ['75'],
        counterNumbers: [500],
      } as FlashcardJson,
      0,
      articles,
    );
    expect(u.issues[0]).toMatch(/karşı örnek mevzuatın hiçbir maddesinde geçmiyor/);
    const w = validateCard(
      {
        ...v,
        kind: 'trap',
        front: 'x',
        back: '600 değil',
        articleRefs: ['75'],
        counterNumbers: [600],
      } as FlashcardJson,
      0,
      articles,
    );
    expect(w.issues[0]).toMatch(/karşı örnek olarak verilmiş ama referans metninde GEÇİYOR/);
  });

  it('boşluk kartında ön yüzde boşluk işareti yoksa kusur', () => {
    expect(validateCard({ ...base, kind: 'cloze' }, 0, articles).issues).toContain(
      'boşluk kartında ön yüzde boşluk işareti (___ ya da {{…}}) yok',
    );
    expect(
      validateCard(
        { ...base, kind: 'cloze', front: 'Temel haklar ancak ___ sınırlanabilir.' },
        0,
        articles,
      ).ok,
    ).toBe(true);
  });

  it('uzunluk ve zorluk sınırları', () => {
    expect(validateCard({ ...base, front: 'a'.repeat(401) }, 0, articles).issues[0]).toMatch(
      /aşıyor/,
    );
    expect(validateCard({ ...base, difficulty: 5 }, 0, articles).issues[0]).toMatch(/zorluk 1–3/);
  });
});

describe('validateDeck', () => {
  it('aynı cevaba giden ikinci kart kusur; fails toplamı', () => {
    const r = validateDeck(
      {
        deck: { topicId: 't', legislationSlug: 'anayasa', sourceLabel: 'AI bilgi kartı — test' },
        cards: [base, { ...base, front: 'Başka soru?', back: 'yalnızca KANUNLA' }],
      },
      articles,
    );
    expect(r.ok).toBe(false);
    expect(r.fails).toBe(1);
    expect(r.cards[1]!.issues[0]).toMatch(/aynı cevaba giden ikinci kart \(#1/);
  });
});

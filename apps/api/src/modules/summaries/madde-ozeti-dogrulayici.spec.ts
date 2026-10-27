import {
  isRepealedText,
  validateArticleSummary,
  type ArticleSummaryJson,
} from './madde-ozeti-dogrulayici';

const MD16 = `Zor ve silah kullanma
Madde 16 – (Değişik: 2/6/2007-5681/4 md.)
Polis, görevini yaparken direnişle karşılaşması halinde, bu direnişi kırmak amacıyla ve kıracak ölçüde zor kullanmaya yetkilidir.
Zor kullanma yetkisi kapsamında, direnmenin mahiyetine ve derecesine göre ve direnenleri etkisiz hale getirecek şekilde kademeli olarak artan nispette bedenî kuvvet, maddî güç ve kanunî şartları gerçekleştiğinde silah kullanılabilir.
Polis, zor kullanma yetkisi kapsamında direnmeyi etkisiz kılmak amacıyla kullanacağı araç ve gereç ile kullanacağı zorun derecesini kendisi takdir ve tayin eder. Ancak, toplu kuvvet olarak müdahale edilen durumlarda, zor kullanmanın derecesi ile kullanılacak araç ve gereçler müdahale eden kuvvetin amiri tarafından tayin ve tespit edilir.
Polis, yakalanması gerekli kişi veya dağıtılması gereken topluluğun silahlı olması halinde silahın da kullanılabileceğine ilişkin uyarıyı yapar.
Polis, 5237 sayılı Türk Ceza Kanununun meşru savunmaya ilişkin hükümleri çerçevesinde silah kullanabilir.`;

const MD7 = `Madde 7 – Umuma açık yerlerin açılması ... on beş gün ... üç ay süre ile kapatılır.`;
const MULGA = `(Mülga: 2/6/2007-5681/6 md.)`;

const sameLaw = new Map([
  ['16', { articleNo: '16', text: MD16 }],
  ['7', { articleNo: '7', text: MD7 }],
  ['6', { articleNo: '6', text: MULGA }],
]);

function base(over: Partial<ArticleSummaryJson> = {}): ArticleSummaryJson {
  return {
    lawSlug: 'pvsk',
    articleNo: '16',
    title: 'Zor ve silah kullanma',
    shortSummary: 'Polis direnişi kırmak için kademeli zor kullanabilir.',
    keyPoints: ['Zorun derecesini polis kendisi takdir eder; toplu kuvvette amir belirler (f.3).'],
    sourceLabel: 'AI madde özeti — 2559 s.K. md 16',
    ...over,
  };
}

describe('isRepealedText', () => {
  it('yalnız şerhten ibaret ve "Mülga" içeren metin mülgadır', () => {
    expect(isRepealedText('(Mülga: 2/6/2007-5681/6 md.)')).toBe(true);
    expect(isRepealedText('(Ek:16/6/1985 - 3233/7 md.; Mülga: 24/11/2004-5259/8 md.)')).toBe(true);
  });
  it('yeniden düzenlenen ya da yalnız bir fıkrası kalkan madde yürürlüktedir', () => {
    expect(
      isRepealedText(
        '(Mülga: 13/1/1986 - 3257/13 md.; Yeniden düzenleme: 24/11/2004-5259/1 md.)\nUmuma açık yerler…',
      ),
    ).toBe(false);
    expect(
      isRepealedText(
        '(Ek: 16/6/1985 - 3233/7 md.)\n(Birinci fıkra mülga: 18/11/1992 - 3842/31 md.)\nGözaltı…',
      ),
    ).toBe(false);
    expect(isRepealedText('(Ek: 1/1/2000)')).toBe(false);
  });
});

describe('validateArticleSummary (Doc 54)', () => {
  it('temiz özet geçer', () => {
    const v = validateArticleSummary(base(), sameLaw.get('16')!, sameLaw);
    expect(v.issues).toEqual([]);
    expect(v.ok).toBe(true);
  });

  it('sourceLabel ön eki ve madde no zorunlu', () => {
    const v = validateArticleSummary(
      base({ sourceLabel: 'Kitap X', articleNo: '17' }),
      sameLaw.get('16')!,
      sameLaw,
    );
    expect(v.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining('AI madde özeti'),
        expect.stringContaining('madde no uyuşmuyor'),
      ]),
    );
  });

  it('metinde geçmeyen sayı düşer; türetilmiş sayı formülle geçer', () => {
    const kotu = validateArticleSummary(
      base({ keyPoints: ['Polis 24 saat içinde bildirir.'] }),
      sameLaw.get('16')!,
      sameLaw,
    );
    expect(kotu.issues).toContain('24 madde metninde yok ve türetilmemiş');
    const iyi = validateArticleSummary(
      base({
        keyPoints: ['Üç kademe: bedenî kuvvet, maddî güç, silah.'],
        derivedNumbers: [{ value: 3, expr: '1 + 1 + 1', refs: ['16'] }],
      }),
      sameLaw.get('16')!,
      sameLaw,
    );
    expect(iyi.issues).toEqual([]);
  });

  it('karşı örnek metinde geçmemeli', () => {
    const v = validateArticleSummary(
      base({ examReminders: ['Sınav tuzağı: ihtar 3 kez değil.'], counterNumbers: [3] }),
      sameLaw.get('16')!,
      sameLaw,
    );
    expect(v.issues).toEqual([]);
    const v2 = validateArticleSummary(
      base({ examReminders: ['5237 sayılı yanlış.'], counterNumbers: [5237] }),
      sameLaw.get('16')!,
      sameLaw,
    );
    expect(v2.issues).toEqual([expect.stringContaining('karşı örnek ama metinde GEÇİYOR')]);
  });

  it('aynı kanun atfı bankada olmalı', () => {
    expect(
      validateArticleSummary(
        base({ keyPoints: ['Bkz. md 7 kapatma süreleri.'] }),
        sameLaw.get('16')!,
        sameLaw,
      ).issues,
    ).toEqual([]);
    expect(
      validateArticleSummary(base({ keyPoints: ['Bkz. md 99.'] }), sameLaw.get('16')!, sameLaw)
        .issues,
    ).toContain('aynı kanunda olmayan madde atfı: 99');
  });

  it('başka kanun atfı yalnız metinde anılıyorsa ve verified:false', () => {
    const ok = validateArticleSummary(
      base({ relatedLegislation: [{ law: '5237 sayılı TCK', article: null, verified: false }] }),
      sameLaw.get('16')!,
      sameLaw,
    );
    expect(ok.issues).toEqual([]);
    const yok = validateArticleSummary(
      base({ relatedLegislation: [{ law: '5271 sayılı CMK', article: null, verified: false }] }),
      sameLaw.get('16')!,
      sameLaw,
    );
    expect(yok.issues[0]).toContain('madde metninde anılmıyor');
    const dogrulanmis = validateArticleSummary(
      base({ relatedLegislation: [{ law: '5237 sayılı TCK', article: null, verified: true }] }),
      sameLaw.get('16')!,
      sameLaw,
    );
    expect(dogrulanmis.issues[0]).toContain('verified:true olamaz');
  });

  it('kanunun kendisi ilgili mevzuat olamaz; şerh yılı ve örtük karşı örnek geçer; başka kanun md atfı aynı kanun sayılmaz', () => {
    const kendi = validateArticleSummary(
      base({ relatedLegislation: [{ law: '2559 sayılı PVSK', article: null, verified: false }] }),
      sameLaw.get('16')!,
      sameLaw,
      '2559',
    );
    expect(kendi.issues[0]).toContain('kanunun kendisi');
    const yil = validateArticleSummary(
      base({ keyPoints: ["Madde 2007'de 5681 sayılı Kanunla değiştirildi."] }),
      sameLaw.get('16')!,
      sameLaw,
    );
    expect(yil.issues).toEqual([]);
    const ortuk = validateArticleSummary(
      base({ keyPoints: ['Sınavda "24 saat" seçeneği gelir; metinde böyle bir süre yoktur.'] }),
      sameLaw.get('16')!,
      sameLaw,
    );
    expect(ortuk.issues).toEqual([]);
    const baska = validateArticleSummary(
      base({
        keyPoints: ['5237 sayılı TCK md 25 meşru savunmayı düzenler.'],
        counterNumbers: [25],
      }),
      sameLaw.get('16')!,
      sameLaw,
    );
    expect(baska.issues).toEqual([]);
  });

  it('mülga madde: yalnız başlık + kısa özet; işaret tutarlı olmalı', () => {
    const iyi = validateArticleSummary(
      base({
        articleNo: '6',
        repealed: true,
        keyPoints: undefined,
        title: 'Mülga',
        shortSummary: '5681 sayılı Kanunla kaldırıldı.',
      }),
      sameLaw.get('6')!,
      sameLaw,
    );
    expect(iyi.issues).toEqual([]);
    const dolu = validateArticleSummary(
      base({ articleNo: '6', repealed: true, keyPoints: ['x'] }),
      sameLaw.get('6')!,
      sameLaw,
    );
    expect(dolu.issues[0]).toContain('izinsiz alan dolu');
    const eksik = validateArticleSummary(base({ articleNo: '6' }), sameLaw.get('6')!, sameLaw);
    expect(eksik.issues).toContain('madde metni mülga; repealed=true olmalı');
  });

  it('KHK numarası şerhte geçiyorsa geçer', () => {
    const text = MD16 + '\n(Ek fıkra: 2/1/2017-KHK-680/27 md.)\nTeşhis tutanağa bağlanır.';
    const v = validateArticleSummary(
      base({ keyPoints: ['Fıkra KHK-680 ile eklendi.'] }),
      { articleNo: '16', text },
      sameLaw,
    );
    expect(v.issues).toEqual([]);
  });

  it('kalın numaralı ara başlık sayı taramasına girmez', () => {
    const v = validateArticleSummary(
      base({
        detailed:
          '**3. Talebin yerine getirilmesi (f.3)**\nTalep derhal yerine getirilir.\n\n**4. Yardım**\nKurumlar yardım eder.',
      }),
      sameLaw.get('16')!,
      sameLaw,
    );
    expect(v.issues).toEqual([]);
  });

  it('keyPoints boşsa düşer; aşırı fıkra atfı düşer', () => {
    expect(
      validateArticleSummary(base({ keyPoints: [] }), sameLaw.get('16')!, sameLaw).issues,
    ).toContain('keyPoints boş: en az bir temel nokta');
    expect(
      validateArticleSummary(base({ keyPoints: ['Bkz. f.12'] }), sameLaw.get('16')!, sameLaw)
        .issues[0],
    ).toMatch(/^f\.12 atfı/);
  });
});

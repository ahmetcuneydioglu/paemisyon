import {
  extractNumbers,
  fillGeneratedBlocks,
  numberInTexts,
  safeEval,
  stripAmendmentNotes,
  trNumberPattern,
  validateBlock,
  validateUnit,
  type ArticleText,
  type SummaryBlockJson,
  type SummaryUnitJson,
} from './ozet-dogrulayici';

const MD75 = 'Türkiye Büyük Millet Meclisi genel oyla seçilen altıyüz milletvekilinden oluşur.';
const MD78 =
  'Ara seçim, her seçim döneminde bir defa yapılır ve genel seçimden otuz ay geçmedikçe ara seçime gidilemez. ' +
  'Ancak, boşalan üyeliklerin sayısı, üye tamsayısının yüzde beşini bulduğu hallerde, ara seçimlerinin üç ay içinde yapılmasına karar verilir.';
const MD84 =
  '(Değişik: 23/7/1995-4121/9 md.)\nMeclis çalışmalarına özürsüz veya izinsiz olarak bir ay içerisinde toplam beş birleşim günü katılmayan ' +
  'milletvekilinin milletvekilliğinin düşmesine, Genel Kurulca üye tamsayısının salt çoğunluğunun oyuyla karar verilebilir.';
const MD85 =
  '(Değişik: 23/7/1995-4121/10 md.)\nMeclis Genel Kurulu kararının alındığı tarihten başlayarak yedi gün içerisinde ilgili milletvekili ' +
  'Anayasa Mahkemesine başvurabilir. Anayasa Mahkemesi, iptal istemini onbeş gün içerisinde kesin karara bağlar.';
const MD79 = 'Yüksek Seçim Kurulu yedi asıl ve dört yedek üyeden oluşur. Üyelerin altısı Yargıtay, beşi Danıştay Genel Kurullarınca seçilir.';

const ARTS = new Map<string, ArticleText>([
  ['75', { articleNo: '75', text: MD75 }],
  ['78', { articleNo: '78', text: MD78 }],
  ['79', { articleNo: '79', text: MD79 }],
  ['84', { articleNo: '84', text: MD84 }],
  ['85', { articleNo: '85', text: MD85 }],
]);

describe('Türkçe sayı eşlemesi (Doc 53 doğrulayıcı)', () => {
  it('rakam ve sözcük eşdeğer: 600 = altıyüz, 15 = onbeş, 7 = yedi', () => {
    expect(numberInTexts(600, [MD75])).toBe(true);
    expect(numberInTexts(15, [MD85])).toBe(true);
    expect(numberInTexts(7, [MD85])).toBe(true);
    expect(trNumberPattern(15)).toBe('on\\s?beş');
  });

  it('ek kabul edilir: "beşini" → 5, "altısı" → 6', () => {
    expect(numberInTexts(5, [MD78])).toBe(true);
    expect(numberInTexts(6, [MD79])).toBe(true);
  });

  it('"onbeş" içindeki "on" 10 sayılmaz; "on beş" içindeki "beş" 5 sayılmaz', () => {
    expect(numberInTexts(10, [MD85])).toBe(false);
    expect(numberInTexts(5, ['Anayasa Mahkemesi on beş gün içinde karar verir.'])).toBe(false);
  });

  it('"beş birleşim" içindeki "bir" hecesi sayı sayılmaz, beş eşleşir', () => {
    expect(numberInTexts(5, [MD84])).toBe(true);
  });

  it('değişiklik notundaki kanun numarası ve tarih eşlemeye girmez ("4121/10" → 10 yok)', () => {
    expect(stripAmendmentNotes(MD85)).not.toContain('4121');
    expect(numberInTexts(10, [MD85])).toBe(false);
    expect(numberInTexts(1995, [MD84])).toBe(false);
  });
});

describe('sayı çıkarımı', () => {
  it('liste numarası, madde atfı ve fıkra kesri sayı değildir', () => {
    const t = '1. İstifa\n2. Kesin hüküm (md 84/2)\n3. 85. maddeye göre 7 gün içinde';
    expect(extractNumbers(t).sort((a, b) => a - b)).toEqual([7]);
  });
  it('madde aralığı ("md 1–6", "md 12-14") sayı değildir', () => {
    expect(extractNumbers('md 1–6 sayılarla: 7 gün').sort((a, b) => a - b)).toEqual([7]);
    expect(extractNumbers('Sayılarla md 12-14')).toEqual([]);
  });
  it('yüzde ve süre sayıları alınır', () => {
    expect(extractNumbers('yüzde 5 boşalma, 30 ay, 3 ay içinde').sort((a, b) => a - b)).toEqual([3, 5, 30]);
  });
});

describe('güvenli formül', () => {
  it('floor ve dört işlem', () => {
    expect(safeEval('floor(600 / 2) + 1')).toBe(301);
    expect(safeEval('600 * 5 / 100')).toBe(30);
    expect(safeEval('ceil(12 * 2 / 3)')).toBe(8);
  });
  it('başka her şey reddedilir', () => {
    expect(() => safeEval('process.exit(1)')).toThrow();
    expect(() => safeEval('floor')).toThrow();
  });
});

describe('kart doğrulama', () => {
  const kural: SummaryBlockJson = {
    type: 'rule',
    title: 'Devamsızlık',
    body: '**1 ay** içinde toplam **5 birleşim günü** katılmayan milletvekili için üye tamsayısının salt çoğunluğu, yani **301** oy gerekir.',
    articleRefs: ['84', '75'],
    derivedNumbers: [{ value: 301, expr: 'floor(600 / 2) + 1', refs: ['75', '84'] }],
  };

  it('metindeki ve türetilmiş sayılar geçer', () => {
    const v = validateBlock(kural, 0, ARTS);
    expect(v.ok).toBe(true);
    expect(v.lines.some((l) => l.includes('301 türetildi'))).toBe(true);
  });

  it('metinde olmayan, türetilmemiş sayı düşer (7 gün → 10 gün)', () => {
    const v = validateBlock({ type: 'rule', title: 'İptal', body: '**10 gün** içinde başvurulur.', articleRefs: ['85'] }, 0, ARTS);
    expect(v.ok).toBe(false);
    expect(v.issues[0]).toContain('10 referans metinlerinde yok');
  });

  it('yanlış formül düşer', () => {
    const v = validateBlock({ ...kural, derivedNumbers: [{ value: 301, expr: 'floor(600 / 2) + 2', refs: ['75'] }] }, 0, ARTS);
    expect(v.ok).toBe(false);
    expect(v.issues[0]).toContain('302 ≠ 301');
  });

  it('zincirli türetim: işlenen aynı karttaki başka bir türetilmiş sayı olabilir', () => {
    const v = validateBlock(
      {
        type: 'trap',
        title: 'Yeter sayı',
        body: '600 üyede toplantı yeter sayısı **200**, 200 üyeyle toplanınca katılanların salt çoğunluğu **101**.',
        articleRefs: ['75', '78'],
        derivedNumbers: [
          // "üçte biri" → 3 işleneni md 78 metnindeki "üç ay"dan okunur (gerçekte md 96).
          { value: 200, expr: '600 / 3', refs: ['75', '78'] },
          { value: 101, expr: 'floor(200 / 2) + 1', refs: ['75'] },
        ],
      },
      0,
      ARTS,
    );
    expect(v.ok).toBe(true);
  });

  it('formül işleneni referans metinlerinde yoksa düşer', () => {
    const v = validateBlock({ ...kural, derivedNumbers: [{ value: 301, expr: 'floor(600 / 2) + 1', refs: ['84'] }] }, 0, ARTS);
    expect(v.ok).toBe(false);
    expect(v.issues[0]).toContain('işleneni metinde yok: 600');
  });

  it('karşı örnek sayısı metinde GEÇMEMELİ', () => {
    const tuzak: SummaryBlockJson = {
      type: 'trap',
      title: 'Ara seçim',
      body: '"Genel seçime 2 yıl kala ara seçim yapılamaz" yanlış; 30 ay kuralı var.',
      articleRefs: ['78'],
      counterNumbers: [2],
    };
    expect(validateBlock(tuzak, 0, ARTS).ok).toBe(true);
    const kotu = { ...tuzak, body: '"30 ay" yanlıştır.', counterNumbers: [30] };
    const v = validateBlock(kotu, 0, ARTS);
    expect(v.ok).toBe(false);
    expect(v.issues[0]).toContain('GEÇİYOR');
  });

  it('referanssız kart ve bilinmeyen madde düşer', () => {
    expect(validateBlock({ type: 'concept', body: 'x', articleRefs: [] }, 0, ARTS).issues).toEqual(['articleRefs boş']);
    expect(validateBlock({ type: 'concept', body: 'x', articleRefs: ['999'] }, 0, ARTS).issues[0]).toContain('madde yok: 999');
  });

  it('satır sayıları KENDİ referanslarında aranır', () => {
    const tablo: SummaryBlockJson = {
      type: 'numbers',
      title: 'Sayılar',
      rows: [
        { label: 'YSK', value: '7 asıl, 4 yedek', refs: ['79'] },
        { label: 'İptal', value: '7 gün', refs: ['79'] }, // 7 md 79'da var ama "gün" md 85'te; sayı düzeyinde geçer
        { label: 'Karar', value: '15 gün', refs: ['79'] }, // 15 md 79'da yok → düşer
      ],
      articleRefs: ['79', '85'],
    };
    const v = validateBlock(tablo, 0, ARTS);
    expect(v.ok).toBe(false);
    expect(v.issues).toEqual(['satır "Karar": 15 satırın referanslarında yok']);
  });

  it('exam_stats/bridge kartları sayı kontrolü dışında ama referansları gerçek olmalı', () => {
    expect(validateBlock({ type: 'exam_stats', rows: [], articleRefs: ['75'], generated: true }, 0, ARTS).ok).toBe(true);
    expect(validateBlock({ type: 'bridge', articleRefs: ['1'], generated: true }, 0, ARTS).ok).toBe(false);
  });
});

describe('ünite: betik üretimi kartlar veriden dolar', () => {
  const unit: SummaryUnitJson = {
    unit: {
      slug: 'u',
      legislationSlug: 't-c-anayasasi',
      topicId: 't',
      title: 'Yasama I',
      articleFrom: '75',
      articleTo: '86',
      sourceLabel: 'AI özeti — T.C. Anayasası, md 75–86',
    },
    blocks: [
      { type: 'concept', title: 'Meclis', body: '600 milletvekili', articleRefs: ['75'] },
      { type: 'exam_stats', title: 'Sınav der ki', rows: [], articleRefs: [] },
      { type: 'bridge', title: 'Soru çöz', articleRefs: [] },
    ],
  };

  it('exam_stats satırları ve bridge referansları ünite maddelerinden gelir', () => {
    fillGeneratedBlocks(unit, {
      perArticle: new Map([['75', 1]]),
      titles: new Map([['75', '']]),
      totalQuestions: 1,
      exams: new Map([['PAEM 10', 1]]),
    });
    const stats = unit.blocks[1];
    expect(stats.generated).toBe(true);
    expect(stats.articleRefs).toEqual(['75']);
    expect(stats.rows?.[0]).toEqual({ label: 'Bu ünitenin maddelerinden yayındaki soru', value: '1', refs: ['75'] });
    expect(stats.rows?.some((r) => r.label === 'Resmî sınavlarda' && String(r.value).includes('PAEM 10'))).toBe(true);
    expect(unit.blocks[2].rows?.[0].value).toBe('md 75–86, 1 soru');
    expect(validateUnit(unit, ARTS).ok).toBe(true);
  });
});

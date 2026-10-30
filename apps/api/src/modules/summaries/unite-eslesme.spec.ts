import {
  articleKey,
  articleLabel,
  articleNumber,
  tallyByUnit,
  unitOfArticle,
  type UnitRange,
} from './unite-eslesme';

const UNITS: UnitRange[] = [
  { id: 'u7', topicId: 'anayasa', articleFrom: '75', articleTo: '86' },
  { id: 'u8', topicId: 'anayasa', articleFrom: '87', articleTo: '100' },
  { id: 'p1', topicId: 'pvsk', articleFrom: '1', articleTo: '10' },
];

// PVSK: açık liste — sayısal olmayan maddeler (4/A, Ek 6, Geçici 2) ancak böyle üniteye düşer.
const PVSK: UnitRange[] = [
  {
    id: 'g1',
    topicId: 'pvsk',
    articleFrom: '1',
    articleTo: '5',
    articleNos: ['1', '2', '4', '4/A', '5'],
  },
  {
    id: 'g4',
    topicId: 'pvsk',
    articleFrom: '16',
    articleTo: 'Ek 9',
    articleNos: ['16', '17', 'Ek 4', 'Ek 6', 'Ek 9'],
  },
  {
    id: 'g5',
    topicId: 'pvsk',
    articleFrom: '22',
    articleTo: 'Geçici 2',
    articleNos: ['22', '23', '24', '25', '26', '27', '28', 'Ek 5', 'Ek 7', 'Ek 10', 'Geçici 2'],
  },
];

describe('madde numarası (ünite etiketi)', () => {
  it('sayısal ve fıkralı sayısal okunur; Ek/Geçici/harfli okunmaz', () => {
    expect(articleNumber('84')).toBe(84);
    expect(articleNumber('84/2')).toBe(84);
    expect(articleNumber(' 7 ')).toBe(7);
    expect(articleNumber('Ek 1')).toBeNull();
    expect(articleNumber('Geçici 2')).toBeNull();
    expect(articleNumber('4/A')).toBeNull();
    expect(articleNumber(null)).toBeNull();
  });
});

describe('madde anahtarı (liste eşlemesi)', () => {
  it('fıkra atılır, harf eki ve Ek/Geçici korunur, boşluk/büyük-küçük sadeleşir', () => {
    expect(articleKey('84/2')).toBe('84');
    expect(articleKey('4/A')).toBe('4/A');
    expect(articleKey(' 4 / a ')).toBe('4/A');
    expect(articleKey('Ek  6')).toBe('Ek 6');
    expect(articleKey('ek 6')).toBe('Ek 6');
    expect(articleKey('Ek6')).toBe('Ek 6');
    expect(articleKey('geçici 2')).toBe('Geçici 2');
    expect(articleKey('')).toBeNull();
    expect(articleKey(null)).toBeNull();
  });
});

describe('ünite eşlemesi (açık liste — PVSK)', () => {
  it('4/A, Ek 6 ve Geçici 2 listedeki üniteye düşer; fıkralı sayısal madde listede aranır', () => {
    expect(unitOfArticle(PVSK, 'pvsk', '4/A')?.id).toBe('g1');
    expect(unitOfArticle(PVSK, 'pvsk', 'Ek 6')?.id).toBe('g4');
    expect(unitOfArticle(PVSK, 'pvsk', 'Geçici 2')?.id).toBe('g5');
    expect(unitOfArticle(PVSK, 'pvsk', '16/3')?.id).toBe('g4');
    expect(unitOfArticle(PVSK, 'pvsk', 'ek 7')?.id).toBe('g5');
  });
  it('listede olmayan madde (3 mülga, Ek 8 mülga, 9) hiçbir üniteye düşmez; aralık sanılmaz', () => {
    expect(unitOfArticle(PVSK, 'pvsk', '3')).toBeNull();
    expect(unitOfArticle(PVSK, 'pvsk', 'Ek 8')).toBeNull();
    expect(unitOfArticle(PVSK, 'pvsk', '9')).toBeNull();
    expect(unitOfArticle(PVSK, 'anayasa', '4/A')).toBeNull();
  });
  it('liste dolu olan ünitede aralık YOK sayılır (23 listede var, 23/A yok)', () => {
    expect(unitOfArticle(PVSK, 'pvsk', '23')?.id).toBe('g5');
    expect(unitOfArticle(PVSK, 'pvsk', '23/A')).toBeNull();
  });
});

describe('madde etiketi', () => {
  it('aralık modunda from–to', () => {
    expect(articleLabel(UNITS[0]!)).toBe('75–86');
  });
  it('listede ardışık sayılar katlanır, Ek/Geçici sırayla eklenir', () => {
    expect(articleLabel(PVSK[2]!)).toBe('22–28, Ek 5, Ek 7, Ek 10, Geçici 2');
    expect(articleLabel(PVSK[0]!)).toBe('1, 2, 4, 4/A, 5');
    expect(
      articleLabel({
        articleFrom: '',
        articleTo: '',
        articleNos: ['6', '7', '8', '10', '11', '12', '14', '19', '21', 'Ek 1', 'Geçici 1'],
      }),
    ).toBe('6–8, 10–12, 14, 19, 21, Ek 1, Geçici 1');
  });
});

describe('ünite eşlemesi', () => {
  it('konu + aralık ile ünite bulur; sınırlar dâhil', () => {
    expect(unitOfArticle(UNITS, 'anayasa', '75')?.id).toBe('u7');
    expect(unitOfArticle(UNITS, 'anayasa', '86')?.id).toBe('u7');
    expect(unitOfArticle(UNITS, 'anayasa', '87')?.id).toBe('u8');
  });
  it('başka konunun aynı madde numarası eşleşmez; aralık dışı ve maddesiz düşer', () => {
    expect(unitOfArticle(UNITS, 'pvsk', '84')).toBeNull();
    expect(unitOfArticle(UNITS, 'anayasa', '120')).toBeNull();
    expect(unitOfArticle(UNITS, 'anayasa', null)).toBeNull();
    expect(unitOfArticle(UNITS, 'anayasa', 'Geçici 2')).toBeNull();
  });
});

describe('ünite sayımı (konu ilerlemesiyle aynı kural)', () => {
  it('doğru/yanlış ünitede birikir; ünitesiz cevap sayılmaz', () => {
    const t = tallyByUnit(
      [
        { topicId: 'anayasa', articleNo: '76', isCorrect: true },
        { topicId: 'anayasa', articleNo: '84/2', isCorrect: false },
        { topicId: 'anayasa', articleNo: '90', isCorrect: true },
        { topicId: 'anayasa', articleNo: null, isCorrect: true },
        { topicId: 'ceza', articleNo: '76', isCorrect: true },
        { topicId: 'pvsk', articleNo: '4/A', isCorrect: true },
        { topicId: 'pvsk', articleNo: 'Ek 6', isCorrect: false },
      ],
      [...UNITS, ...PVSK],
    );
    expect(t.get('u7')).toEqual({ solved: 2, correct: 1 });
    expect(t.get('u8')).toEqual({ solved: 1, correct: 1 });
    expect(t.get('g1')).toEqual({ solved: 1, correct: 1 });
    expect(t.get('g4')).toEqual({ solved: 1, correct: 0 });
    expect(t.size).toBe(4);
  });
  it('ünite yoksa boş döner', () => {
    expect(tallyByUnit([{ topicId: 'anayasa', articleNo: '76', isCorrect: true }], []).size).toBe(
      0,
    );
  });
});

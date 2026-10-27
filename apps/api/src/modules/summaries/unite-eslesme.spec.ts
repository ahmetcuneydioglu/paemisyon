import { articleNumber, tallyByUnit, unitOfArticle, type UnitRange } from './unite-eslesme';

const UNITS: UnitRange[] = [
  { id: 'u7', topicId: 'anayasa', articleFrom: '75', articleTo: '86' },
  { id: 'u8', topicId: 'anayasa', articleFrom: '87', articleTo: '100' },
  { id: 'p1', topicId: 'pvsk', articleFrom: '1', articleTo: '10' },
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
      ],
      UNITS,
    );
    expect(t.get('u7')).toEqual({ solved: 2, correct: 1 });
    expect(t.get('u8')).toEqual({ solved: 1, correct: 1 });
    expect(t.size).toBe(2);
  });
  it('ünite yoksa boş döner', () => {
    expect(tallyByUnit([{ topicId: 'anayasa', articleNo: '76', isCorrect: true }], []).size).toBe(
      0,
    );
  });
});

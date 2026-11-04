import { normalizeForCompare, richTextToPlain } from './rich-text';

const p = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] });

describe('richTextToPlain (Doc 55 §3: paragraflar satır satır)', () => {
  it('paragrafları satır satır, biçim işaretlerini düşürerek çevirir', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Kalın ', marks: [{ type: 'bold' }] },
            { type: 'text', text: 'metin.' },
          ],
        },
        p('İkinci paragraf.'),
      ],
    };
    expect(richTextToPlain(doc)).toBe('Kalın metin.\nİkinci paragraf.');
  });
  it('hardBreak satır, listeler önek, tablo satırları dik çizgi', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'a' },
            { type: 'hardBreak' },
            { type: 'text', text: 'b' },
          ],
        },
        {
          type: 'orderedList',
          attrs: { start: 3 },
          content: [
            { type: 'listItem', content: [p('üç')] },
            { type: 'listItem', content: [p('dört')] },
          ],
        },
        { type: 'bulletList', content: [{ type: 'listItem', content: [p('madde')] }] },
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                { type: 'tableCell', content: [p('x')] },
                { type: 'tableCell', content: [p('y')] },
              ],
            },
          ],
        },
      ],
    };
    expect(richTextToPlain(doc)).toBe('a\nb\n3. üç\n4. dört\n- madde\nx | y');
  });
  it('boş belge ve null boş metin verir; fazla boşluk sıkışır', () => {
    expect(richTextToPlain(null)).toBe('');
    expect(richTextToPlain({ type: 'doc', content: [p('  çok   boşluk  ')] })).toBe('çok boşluk');
  });
  it('normalizeForCompare tipografik tırnak/tireyi ve boşluğu eşitler', () => {
    expect(normalizeForCompare('Polis’in  “yetkisi” – md.')).toBe(
      normalizeForCompare('Polis\'in "yetkisi" - md.'),
    );
  });
});

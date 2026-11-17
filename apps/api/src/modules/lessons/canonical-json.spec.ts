import { canonicalJson } from './canonical-json';

describe('canonicalJson', () => {
  it('anahtar sırası ve undefined alanlar farkı eşitliği bozmaz', () => {
    const a = { sections: [{ title: 'A', blocks: [{ kind: 'text', text: 'x', note: undefined }] }] };
    const b = { sections: [{ blocks: [{ text: 'x', kind: 'text' }], title: 'A' }] };
    expect(canonicalJson(a)).toBe(canonicalJson(b));
  });

  it('dizi sırası ve metin farkı eşitsizliktir', () => {
    expect(canonicalJson({ r: [1, 2] })).not.toBe(canonicalJson({ r: [2, 1] }));
    expect(canonicalJson({ t: 'altı yüz' })).not.toBe(canonicalJson({ t: 'altı yüz ' }));
  });
});

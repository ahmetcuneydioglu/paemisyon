import { readFileSync } from 'fs';
import { join } from 'path';
import { loadPassageMap, loadRefMap } from './kart-kaynak';
import { validateCard } from './kart-dogrulayici';

const PASAJLAR = [
  {
    id: 'p1',
    passageNo: '2.1-02',
    heading: 'Erzurum Kongresi',
    text: 'Erzurum Kongresi 23 Temmuz 1919 tarihinde toplandı ve 7 Ağustos 1919 tarihine kadar sürdü.',
  },
  {
    id: 'p2',
    passageNo: '2.1-03',
    heading: 'Sivas Kongresi',
    text: 'Sivas Kongresi 4 Eylül 1919 tarihinde toplandı ve 11 Eylül 1919 tarihine kadar sürdü.',
  },
];

function db() {
  return {
    sourcePassage: { findMany: jest.fn().mockResolvedValue(PASAJLAR) },
    lawArticle: { findMany: jest.fn().mockResolvedValue([]) },
  };
}

describe('kart-kaynak — referans haritası (Doc 56 §12)', () => {
  it('pasaj haritası madde haritasıyla aynı biçimdedir: numara → metin, başlık', async () => {
    const d = db();
    const m = await loadPassageMap(d as never, 'doc1');
    expect(d.sourcePassage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { documentId: 'doc1' } }),
    );
    expect(m.get('2.1-03')).toEqual({
      articleNo: '2.1-03',
      text: PASAJLAR[1]!.text,
      id: 'p2',
      title: 'Sivas Kongresi',
    });
  });

  it('dayanak kaynak metinse mevzuata bakılmaz; ikisi de yoksa harita boştur', async () => {
    const d = db();
    await loadRefMap(d as never, { sourceDocumentId: 'doc1', legislationId: null });
    expect(d.lawArticle.findMany).not.toHaveBeenCalled();
    expect((await loadRefMap(d as never, {})).size).toBe(0);
  });

  it('doğrulayıcı pasaja karşı çalışır: pasajdaki tarih geçer, başka pasajın tarihi kusurdur', async () => {
    const m = await loadPassageMap(db() as never, 'doc1');
    const kart = (back: string) =>
      validateCard(
        {
          kind: 'numeric',
          front: 'Sivas Kongresi ne zaman toplandı?',
          back,
          articleRefs: ['2.1-03'],
        },
        0,
        m,
      );
    expect(kart('4 Eylül 1919.').ok).toBe(true);
    expect(kart('23 Temmuz 1919.').issues).toEqual([
      expect.stringMatching(/23 referans metinlerinde yok/),
    ]);
  });
});

describe('kaynak metin kullanıcıya sızmaz (CLAUDE.md: kaynak künyesi/metni yalnız panelde)', () => {
  it('kullanıcı ucunun servisi source_* tablolarını ve pasaj ilişkisini hiç seçmez', () => {
    const kod = readFileSync(join(__dirname, 'flashcards.service.ts'), 'utf8');
    expect(kod).not.toMatch(/sourceDocument|sourcePassage|passages\s*:/);
  });
});

import { parseLessonMarkdown, readingMinutes } from './ders-markdown';
import { validateLesson, type LessonSourceInput } from './ders-dogrulayici';

const MD = `# Yazılı ve yazısız anayasa

**Anayasa Türleri · Ders 1**

Durum: İnceleme sürümü. Hedef: Kuralların düzenleniş biçimini anlar.

## Yazılı anayasa

Anayasal kuralların yetkili bir organ tarafından belirli bir belge içinde toplanmasıdır.

- Türkiye'nin 1982 anayasası yazılıdır.

## Karşılaştırma

| Ölçüt | Yazılı | Yazısız |
|---|---|---|
| Kaynak | Belge | Teamül |

---

## Kaynak ve inceleme notları — kullanıcı metnine dahil değil

- THEMIS Anayasa Hukuku, 24. baskı, s.22. Tanımlar temel alındı.
- Birleşik Krallık açıklaması: https://www.parliament.uk/site-information/glossary/constitution/
`;

const base = () => {
  const p = parseLessonMarkdown(MD);
  return {
    slug: 'yazili-yazisiz',
    title: p.title,
    goal: p.goal,
    body: p.body,
    sources: [
      { kind: 'book', label: 'THEMIS Anayasa Hukuku 24. baskı', page: 's.22', isPublic: false },
      ...p.urlSources.map((u) => ({ kind: 'url', ...u })),
    ] as LessonSourceInput[],
    reviewNote: p.reviewNotes.join('\n'),
    sourceLabel: 'THEMIS Anayasa Hukuku 24. baskı s.22',
  };
};

describe('parseLessonMarkdown', () => {
  it('başlık, hedef, bölümler, tablo ve notları ayırır', () => {
    const p = parseLessonMarkdown(MD);
    expect(p.title).toBe('Yazılı ve yazısız anayasa');
    expect(p.goal).toBe('Kuralların düzenleniş biçimini anlar.');
    expect(p.body.sections.map((s) => s.title)).toEqual(['Yazılı anayasa', 'Karşılaştırma']);
    expect(p.body.sections[1].blocks[0]).toEqual({
      kind: 'table',
      headers: ['Ölçüt', 'Yazılı', 'Yazısız'],
      rows: [['Kaynak', 'Belge', 'Teamül']],
    });
    expect(p.urlSources).toHaveLength(1);
    expect(p.reviewNotes[0]).toContain('THEMIS');
    expect(readingMinutes(p.body)).toBeGreaterThanOrEqual(3);
  });
});

describe('validateLesson', () => {
  it('temiz ders geçer', () => {
    const v = validateLesson(base());
    expect(v.issues).toEqual([]);
  });
  it('kaynak kitap adı gövdeye sızarsa düşer; reviewNote ve kitap kaynağı zorunlu', () => {
    const l = base();
    l.body.sections[0].blocks.push({ kind: 'text', text: 'THEMIS bu konuda şöyle der.' });
    expect(validateLesson(l).issues.some((i) => i.includes('yasak ifade'))).toBe(true);
    const l2 = {
      ...base(),
      reviewNote: '',
      sources: base().sources.filter((s) => s.kind === 'url'),
    };
    const v2 = validateLesson(l2);
    expect(v2.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining('reviewNote'),
        expect.stringContaining('kitap ya da madde'),
      ]),
    );
  });
  it('madde kaynağı verilince sayılar madde metninde aranır', () => {
    const l = base();
    l.body.sections[0].blocks.push({
      kind: 'text',
      text: 'Dokunulmazlık on beş gün içinde karara bağlanır.',
    });
    l.sources.push({
      kind: 'article',
      label: 'Anayasa md 85',
      article: {
        articleNo: '85',
        text: 'Anayasa Mahkemesi iptal istemini onbeş gün içerisinde kesin karara bağlar.',
      },
    });
    expect(validateLesson(l).issues).toEqual([]);
    l.body.sections[0].blocks.push({ kind: 'text', text: 'Süre 7 gün değildir, 30 gündür.' });
    expect(validateLesson(l).issues.some((i) => i.includes('madde metinlerinde yok'))).toBe(true);
  });
  it('kitap künyesi kullanıcıya açık olamaz', () => {
    const l = base();
    l.sources[0] = { ...l.sources[0], isPublic: true };
    expect(validateLesson(l).issues[0]).toContain('kullanıcıya açık olamaz');
  });
});

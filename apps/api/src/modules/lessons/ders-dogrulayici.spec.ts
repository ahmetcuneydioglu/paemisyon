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

describe('yönerge blokları (tanım, uyarı, örnek, madde, soru)', () => {
  const md = `# Kurucu iktidar

**Giriş · Ders 3**

Durum: taslak. Hedef: Asli ve tali kurucu iktidarı ayırmak.

## Kavram

:::tanim Kurucu iktidar
Anayasayı yapan ya da değiştiren iktidardır.
:::

Bir cümle.

:::uyari
Kurulmuş iktidarla karıştırma.
:::

:::madde t-c-anayasasi:175
Değişiklik usulü burada.
:::

:::soru 3f0a2b4c-1111-4222-8333-944455556666
:::

---

## Kaynak ve inceleme notları — kullanıcı metnine dahil değil

- Editoryal okuma yapıldı.
`;
  it('yönergeleri bloklara çevirir ve bağları toplar', () => {
    const p = parseLessonMarkdown(md);
    const kinds = p.body.sections[0].blocks.map((b) => b.kind);
    expect(kinds).toEqual(['tanim', 'text', 'uyari', 'madde', 'soru']);
    expect(p.body.sections[0].blocks[0]).toMatchObject({ term: 'Kurucu iktidar' });
    expect(p.body.sections[0].blocks[3]).toMatchObject({
      law: 't-c-anayasasi',
      no: '175',
      note: 'Değişiklik usulü burada.',
    });
  });
  it('madde bağı çözülmemişse ve soru yayınlı değilse düşer', () => {
    const p = parseLessonMarkdown(md);
    const v = validateLesson({
      slug: 'kurucu-iktidar',
      title: p.title,
      goal: p.goal,
      body: p.body,
      sources: [{ kind: 'book', label: 'Kitap', isPublic: false }],
      reviewNote: 'ok',
      sourceLabel: 'Kitap s.1',
      questions: { '3f0a2b4c-1111-4222-8333-944455556666': false },
    });
    expect(v.ok).toBe(false);
    expect(v.issues.join('\n')).toMatch(/madde bağı bankada çözülemedi/);
    expect(v.issues.join('\n')).toMatch(/soru bankada yayınlı değil/);
  });
  it('kapanmayan yönerge hata verir', () => {
    const kesik =
      md.split(':::uyari')[0] +
      ':::uyari\nKurulmuş\n\n---\n\n## Kaynak ve inceleme notları — kullanıcı metnine dahil değil\n\n- not\n';
    expect(() => parseLessonMarkdown(kesik)).toThrow(/kapanmadı/);
  });
});

/**
 * Doc 57 — ders markdown'ı → sürüm gövdesi (SAF). Kaynak dosya düzeni (docs/57-konu-anlatimi/<ders>/<bölüm>/NN-*.md):
 *   # Başlık
 *   **<Bölüm adı> · Ders N**            (bilgi satırı, gövdeye girmez)
 *   Durum: … Hedef: <öğrenme hedefi>
 *   ## Alt başlık … (metin, "- " listeler, | tablo |)
 *   ---
 *   ## Kaynak ve inceleme notları — kullanıcı metnine dahil değil
 *   - <etiket>: <URL>   → kamuya açık kaynak (url)
 *   - diğer satırlar    → inceleme notu (reviewNote)
 * Kitap künyesi (book) ve madde kaynakları içe aktarma çağrısında verilir; gövdeye konmaz.
 */
/**
 * Blok türleri (kullanıcı kararı 7 Kas 2026: altıyla sınırlı — metin dışında tanım, karşılaştırma
 * tablosu, uyarı, örnek, madde bağı, sınavda çıkmış soru). Markdown'da yönerge bloğu:
 *   :::tanim <terim>      … :::      → tanım kartı
 *   :::uyari              … :::      → "Dikkat / karıştırma" kutusu (tek ton)
 *   :::ornek              … :::      → kısa örnek
 *   :::madde <kanunSlug>:<no>  [tek satır not]  :::  → resmî madde bağı (madde metni yeniden yazılmaz)
 *   :::soru <questionId>  :::        → bankadaki gerçek, kaynaklı soru (yayınlı olmalı; etiket gösterilmez)
 * `| a | b |` tablo = karşılaştırma. Yayında madde ve soru blokları sunucuda zenginleştirilir.
 */
export type LessonBlock =
  | { kind: 'text'; text: string }
  | { kind: 'table'; headers: string[]; rows: string[][] }
  | { kind: 'tanim'; term: string; text: string }
  | { kind: 'uyari'; text: string }
  | { kind: 'ornek'; text: string }
  | { kind: 'madde'; law: string; no: string; note?: string }
  | { kind: 'soru'; questionId: string };

/** Gövdedeki madde bağları: "<kanunSlug>:<no>" (madde kaynağı olarak otomatik eklenir). */
export function lessonArticleRefs(body: LessonBody): string[] {
  const out = new Set<string>();
  for (const s of body.sections)
    for (const b of s.blocks) if (b.kind === 'madde') out.add(`${b.law}:${b.no}`);
  return [...out];
}

/** Gövdedeki soru blokları (bankada yayınlı olmalı). */
export function lessonQuestionIds(body: LessonBody): string[] {
  const out = new Set<string>();
  for (const s of body.sections)
    for (const b of s.blocks) if (b.kind === 'soru') out.add(b.questionId);
  return [...out];
}
export interface LessonSectionBody {
  title: string;
  blocks: LessonBlock[];
}
export interface LessonBody {
  sections: LessonSectionBody[];
}
export interface ParsedLesson {
  title: string;
  goal: string;
  body: LessonBody;
  /** Notlardaki URL'li satırlar: kamuya açık web kaynakları. */
  urlSources: { label: string; url: string }[];
  /** URL'siz not satırları: editoryal inceleme kaydı. */
  reviewNotes: string[];
}

const NOT_BASLIGI = /\n## Kaynak ve inceleme notları[^\n]*\n/;

export function parseLessonMarkdown(markdown: string): ParsedLesson {
  const [mainRaw, notesRaw = ''] = markdown.split(NOT_BASLIGI, 2);
  const main = mainRaw.replace(/\n---\s*$/, '').trim();
  const lines = main.split('\n');
  const title = (lines[0] ?? '').replace(/^#\s*/, '').trim();
  if (!title) throw new Error('başlık yok (ilk satır "# …" olmalı)');
  const goalMatch = main.match(/(?:Bu dersin hedefi:|Hedef:)\s*(.+)/);
  if (!goalMatch) throw new Error(`"${title}": "Hedef:" satırı yok`);
  const goal = goalMatch[1].trim();

  const sections: LessonSectionBody[] = [];
  const chunks = main.split(/\n## /).slice(1);
  for (const chunk of chunks) {
    const nl = chunk.indexOf('\n');
    const heading = (nl < 0 ? chunk : chunk.slice(0, nl)).trim();
    const body = (nl < 0 ? '' : chunk.slice(nl + 1)).trim();
    const blocks: LessonBlock[] = [];
    const bl = body.split('\n');
    let i = 0;
    while (i < bl.length) {
      const directive = bl[i].match(/^:::(tanim|uyari|ornek|madde|soru)\b\s*(.*)$/);
      if (directive) {
        const kind = directive[1];
        const arg = directive[2].trim();
        const inner: string[] = [];
        i++;
        while (i < bl.length && bl[i].trim() !== ':::') inner.push(bl[i++]);
        if (i >= bl.length)
          throw new Error(`"${heading}": ":::${kind}" bloğu kapanmadı (":::" satırı yok)`);
        i++;
        const text = inner.join('\n').trim();
        if (kind === 'tanim') blocks.push({ kind, term: arg, text });
        else if (kind === 'uyari' || kind === 'ornek') blocks.push({ kind, text });
        else if (kind === 'madde') {
          const m = arg.match(/^([a-z0-9-]+):(\S+)$/i);
          if (!m)
            throw new Error(`"${heading}": madde bağı "<kanunSlug>:<no>" biçiminde olmalı: ${arg}`);
          blocks.push({ kind, law: m[1], no: m[2], ...(text ? { note: text } : {}) });
        } else blocks.push({ kind: 'soru', questionId: arg });
        continue;
      }
      if (bl[i].startsWith('|')) {
        const table: string[][] = [];
        while (i < bl.length && bl[i].startsWith('|')) {
          const cells = bl[i]
            .trim()
            .replace(/^\||\|$/g, '')
            .split('|')
            .map((c) => c.trim());
          i++;
          if (!cells.every((c) => /^[:\s-]+$/.test(c))) table.push(cells);
        }
        if (table.length > 0)
          blocks.push({ kind: 'table', headers: table[0], rows: table.slice(1) });
      } else {
        const para: string[] = [];
        while (i < bl.length && !bl[i].startsWith('|') && !bl[i].startsWith(':::'))
          para.push(bl[i++]);
        const text = para.join('\n').trim();
        if (text) blocks.push({ kind: 'text', text });
      }
    }
    if (heading && blocks.length > 0) sections.push({ title: heading, blocks });
  }

  const urlSources: { label: string; url: string }[] = [];
  const reviewNotes: string[] = [];
  for (const raw of notesRaw.split('\n')) {
    const line = raw.replace(/^\s*-\s*/, '').trim();
    if (!line) continue;
    const url = line.match(/https?:\/\/\S+/)?.[0];
    if (url)
      urlSources.push({
        label:
          line
            .split(/https?:/)[0]
            .trim()
            .replace(/[:：]\s*$/, '') || url,
        url,
      });
    else reviewNotes.push(line);
  }
  return { title, goal, body: { sections }, urlSources, reviewNotes };
}

/** Okuma süresi: ~170 kelime/dk, en az 3 dk; tablolar hücre başına yarım kelime sayılır. */
export function readingMinutes(body: LessonBody): number {
  let words = 0;
  for (const s of body.sections) {
    words += s.title.split(/\s+/).length;
    for (const b of s.blocks) {
      if (b.kind === 'text' || b.kind === 'uyari' || b.kind === 'ornek')
        words += b.text.split(/\s+/).filter(Boolean).length;
      else if (b.kind === 'tanim') words += `${b.term} ${b.text}`.split(/\s+/).length;
      else if (b.kind === 'madde') words += 20;
      else if (b.kind === 'soru') words += 60;
      else
        words +=
          (b.headers.length + b.rows.reduce((n, r) => n + r.length, 0)) * 0.5 +
          b.rows.reduce((n, r) => n + r.join(' ').split(/\s+/).length, 0);
    }
  }
  return Math.max(3, Math.round(words / 170));
}

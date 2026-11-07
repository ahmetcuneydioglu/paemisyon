/**
 * Doc 57 — ders doğrulayıcısı (SAF). Betik gövdenin biçimini, kaynak zorunluluğunu, kullanıcı metnine
 * sızmaması gerekenleri ve (madde kaynağı verilmişse) sayıların madde metninde geçtiğini denetler.
 * Teori ve tarih iddialarının doğruluğunu göremez: `reviewNote` zorunludur, yayın insanındır (yalnız admin).
 */
import { extractNumbers, numberInTexts, type ArticleText } from '../summaries/ozet-dogrulayici';
import type { LessonBody } from './ders-markdown';

export interface LessonSourceInput {
  kind: 'book' | 'url' | 'article';
  label: string;
  url?: string | null;
  page?: string | null;
  /** article: "2709:12" gibi kanun slug/no çözümlenmiş madde metni (doğrulamaya verilir) */
  article?: ArticleText | null;
  isPublic?: boolean;
}

export interface LessonValidationInput {
  slug: string;
  title: string;
  goal: string;
  body: LessonBody;
  sources: LessonSourceInput[];
  reviewNote?: string | null;
  sourceLabel: string;
  /** Gövdedeki soru bloklarının çözümü: id → yayınlı mı (servis doldurur; verilmezse soru bloğu denetlenmez). */
  questions?: Record<string, boolean>;
}

export interface LessonValidation {
  ok: boolean;
  issues: string[];
  lines: string[];
}

/** Kullanıcı metnine sızmaması gerekenler: üretim/inceleme sözcükleri ve kaynak kitap adı (4 Eyl kuralı). */
const YASAK = [
  /\bAI\b/i,
  /\bmodel(?:i|in)?\b/i,
  /inceleme notu/i,
  /kullanıcı metnine dahil değil/i,
  /\bTHEMIS\b/i,
  /\bbask[ıi]\b/i,
];

export function lessonText(body: LessonBody): string {
  const parts: string[] = [];
  for (const s of body.sections) {
    parts.push(s.title);
    for (const b of s.blocks) {
      if (b.kind === 'text' || b.kind === 'uyari' || b.kind === 'ornek') parts.push(b.text);
      else if (b.kind === 'tanim') parts.push(`${b.term}\n${b.text}`);
      else if (b.kind === 'table')
        parts.push([b.headers.join(' '), ...b.rows.map((r) => r.join(' '))].join('\n'));
      else if (b.kind === 'madde' && b.note) parts.push(b.note);
    }
  }
  return parts.join('\n');
}

export function validateLesson(l: LessonValidationInput): LessonValidation {
  const issues: string[] = [];
  const lines: string[] = [];
  const ok = (m: string) => lines.push(`✓ ${m}`);
  const bad = (m: string) => {
    issues.push(m);
    lines.push(`✗ ${m}`);
  };

  if (!l.slug?.trim() || !l.title?.trim() || !l.goal?.trim()) bad('slug, başlık ve hedef zorunlu');
  if (!/^[a-z0-9-]+$/.test(l.slug ?? '')) bad(`slug biçimi: ${l.slug}`);
  if (!l.sourceLabel?.trim()) bad('sourceLabel boş (panel künyesi)');
  if (!l.body?.sections?.length) bad('gövdede bölüm yok');
  for (const [i, s] of (l.body?.sections ?? []).entries()) {
    if (!s.title?.trim()) bad(`bölüm ${i + 1}: başlık yok`);
    if (!s.blocks?.length) bad(`bölüm "${s.title}": blok yok`);
    for (const b of s.blocks ?? []) {
      if (b.kind === 'table') {
        const w = b.headers.length;
        if (w < 2) bad(`bölüm "${s.title}": tablo en az iki sütun`);
        if (b.rows.some((r) => r.length !== w))
          bad(`bölüm "${s.title}": tablo satır genişlikleri başlıkla eşit değil`);
        if (b.rows.length === 0) bad(`bölüm "${s.title}": tablonun satırı yok`);
      } else if (b.kind === 'text' || b.kind === 'uyari' || b.kind === 'ornek') {
        if (!b.text.trim()) bad(`bölüm "${s.title}": boş ${b.kind} bloğu`);
      } else if (b.kind === 'tanim') {
        if (!b.term.trim() || !b.text.trim())
          bad(`bölüm "${s.title}": tanım bloğunda terim ve açıklama zorunlu`);
      } else if (b.kind === 'madde') {
        if (!/^[a-z0-9-]+$/i.test(b.law) || !b.no.trim())
          bad(`bölüm "${s.title}": madde bağı biçimi (${b.law}:${b.no})`);
        else if (
          !(l.sources ?? []).some(
            (src) => src.kind === 'article' && src.article && src.article.articleNo === b.no,
          )
        )
          bad(`bölüm "${s.title}": madde bağı bankada çözülemedi (${b.law}:${b.no})`);
      } else if (b.kind === 'soru') {
        if (!/^[0-9a-f-]{36}$/i.test(b.questionId))
          bad(`bölüm "${s.title}": soru kimliği UUID değil (${b.questionId})`);
        else if (l.questions && !l.questions[b.questionId])
          bad(`bölüm "${s.title}": soru bankada yayınlı değil (${b.questionId})`);
      }
    }
  }
  if (!l.sources?.length) bad('en az bir kaynak zorunlu');
  if (!l.sources?.some((s) => s.kind === 'book' || s.kind === 'article'))
    bad('kitap ya da madde türünde bir kaynak zorunlu (yalnız URL yetmez)');
  for (const s of l.sources ?? []) {
    if (!s.label?.trim()) bad('kaynak etiketi boş');
    if (s.kind === 'url' && !/^https?:\/\//.test(s.url ?? ''))
      bad(`URL kaynağı geçersiz: ${s.label}`);
    if (s.kind === 'book' && s.isPublic !== false)
      bad(`kitap künyesi kullanıcıya açık olamaz: ${s.label}`);
    if (s.kind === 'article' && !s.article) bad(`madde kaynağı bankada çözülemedi: ${s.label}`);
  }
  if (!l.reviewNote?.trim()) bad('reviewNote (editoryal inceleme kaydı) zorunlu');

  const metin = lessonText(l.body ?? { sections: [] });
  for (const re of YASAK) if (re.test(metin)) bad(`kullanıcı metninde yasak ifade: ${re.source}`);
  if (/\n---\s*$/.test(metin) || /## Kaynak ve inceleme/.test(metin))
    bad('inceleme notları gövdeye sızmış');

  // Madde kaynağı varsa, gövdedeki sayılar o madde metinlerinde geçmeli (yıl ve madde no hariç tutulur).
  const articles = (l.sources ?? [])
    .filter((s) => s.kind === 'article' && s.article)
    .map((s) => s.article!);
  if (articles.length > 0) {
    const texts = articles.map((a) => a.text);
    // Madde atıfları, yıllar ve numaralı ara başlıklar ("**4. Değişikliğin…**") sayı taramasına girmez.
    const temiz = metin
      .replace(/\b(?:md|madde)\.?\s*\d+(?:\/[A-Z])?/gi, ' ')
      .replace(/\b(1[0-9]{3}|20[0-9]{2})\b/g, ' ')
      .replace(/\*\*\d{1,2}\.\s/g, '** ')
      .replace(/(^|\n)\s*\d{1,2}\.\s/g, '$1 ');
    for (const n of extractNumbers(temiz)) {
      if (numberInTexts(n, texts)) ok(`${n} → madde metninde`);
      else bad(`${n} verilen madde metinlerinde yok`);
    }
  } else {
    ok('madde kaynağı yok: sayı denetimi uygulanmadı (teori/tarih dersi — insan incelemesi)');
  }
  if (issues.length === 0) ok(`${l.body.sections.length} bölüm, ${l.sources.length} kaynak`);
  return { ok: issues.length === 0, issues, lines };
}

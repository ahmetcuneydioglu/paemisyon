/**
 * Doc 54 — madde özeti doğrulayıcısı (SAF). Doc 53 çekirdeğini (sayı eşleme, türetim, karşı örnek)
 * madde düzeyine uygular: özetin bütün metin alanlarındaki her sayı, maddenin kendi metninde ya da
 * `relatedLegislation` ile anılan AYNI kanundaki maddede geçmeli; türetilmiş sayı formülle; karşı
 * örnek metinde geçmemeli; aynı kanuna atıflar bankada var olmalı; mülga maddede yalnız izinli alanlar.
 *
 * Anlam doğruluğunu (yetki/şart karışıklığı, kanunda olmayan bilgi) betik göremez; yayın insanındır.
 */
import {
  extractNumbers,
  normalizeCounterNumbers,
  numberInTexts,
  safeEval,
  type ArticleText,
  type DerivedNumber,
} from './ozet-dogrulayici';

export interface LabeledValue {
  label: string;
  value: string;
  /** Fıkra/bent atfı: "f.2", "f.7-c" */
  ref?: string;
}
export interface AuthorityLimit {
  authority: string;
  limit: string;
  ref?: string;
}
export interface RelatedLegislation {
  law: string;
  article?: string | null;
  note?: string;
  /** Yalnız metinde açıkça anılan atıf `true` olabilir; başka kanunun metni doğrulanmadıysa `false`. */
  verified: boolean;
}

export interface ArticleSummaryJson {
  lawSlug: string;
  articleNo: string;
  repealed?: boolean;
  title: string;
  shortSummary: string;
  detailed?: string;
  keyPoints?: string[];
  conditions?: string[];
  exceptions?: string[];
  timeLimits?: LabeledValue[];
  numericalValues?: LabeledValue[];
  authorityAndLimits?: AuthorityLimit[];
  relatedLegislation?: RelatedLegislation[];
  examReminders?: string[];
  derivedNumbers?: DerivedNumber[];
  counterNumbers?: number[];
  verifiedAt?: string;
  sourceLabel: string;
  generatedBy?: string;
}

export interface ArticleSummaryValidation {
  ok: boolean;
  issues: string[];
  lines: string[];
}

/**
 * Madde mülga mı? Baştaki şerh parantezleri ("(Mülga: …)", "(Ek: …; Mülga: …)") düşüldükten sonra gövde
 * kalmıyorsa ve şerh "Mülga" içeriyorsa mülgadır. "(Mülga: …; Yeniden düzenleme: …)" + gövde → yürürlükte;
 * "(Birinci fıkra mülga: …)" + gövde → yürürlükte (yalnız bir fıkra kalkmış).
 */
export function isRepealedText(text: string): boolean {
  let t = text.trim();
  let serh = '';
  for (;;) {
    const m = t.match(/^\(([^()]*)\)\s*/);
    if (!m) break;
    serh += m[1] + ' ';
    t = t.slice(m[0].length);
  }
  return t.trim().length === 0 && /mülga/i.test(serh);
}

/** Sayının geçtiği cümlede olumsuzlama var mı ("… 10 gün değil", "… metinde yoktur", "tuzak")? */
function ortukKarsiOrnek(metin: string, n: number): boolean {
  const cumleler = metin.split(/(?<=[.!?])\s+|\n/);
  const re = new RegExp(`(^|[^\\d])${n}([^\\d]|$)`);
  return cumleler.some(
    (c) =>
      re.test(c) && /\b(?:değil|yoktur|yok\b|yanlış|tuzak|karıştır|geçmez|söylemez|demez)/i.test(c),
  );
}

const ZORUNLU: (keyof ArticleSummaryJson)[] = [
  'lawSlug',
  'articleNo',
  'title',
  'shortSummary',
  'sourceLabel',
];
const MULGA_IZINLI = new Set<keyof ArticleSummaryJson>([
  'lawSlug',
  'articleNo',
  'repealed',
  'title',
  'shortSummary',
  'relatedLegislation',
  'verifiedAt',
  'sourceLabel',
  'generatedBy',
]);

/** Özetin bütün serbest metni (sayı taraması için). */
export function summaryText(s: ArticleSummaryJson): string {
  const parts: string[] = [s.title, s.shortSummary, s.detailed ?? ''];
  for (const k of ['keyPoints', 'conditions', 'exceptions', 'examReminders'] as const)
    parts.push(...(s[k] ?? []));
  for (const r of [...(s.timeLimits ?? []), ...(s.numericalValues ?? [])])
    parts.push(r.label, r.value);
  for (const a of s.authorityAndLimits ?? []) parts.push(a.authority, a.limit);
  for (const r of s.relatedLegislation ?? []) parts.push(r.note ?? '');
  return parts.join('\n');
}

/** "5271 sayılı", "md 16", "Ek 7" gibi atıf sayılarını sayı taramasından düşürmek için kanun numaraları toplanır. */
function kanunNumaralari(s: ArticleSummaryJson): number[] {
  const out = new Set<number>();
  for (const m of summaryText(s).matchAll(/\b(\d{3,4})\s+sayılı/gi)) out.add(Number(m[1]));
  // KHK numarası ("KHK-680", "680 sayılı KHK") da şerhte geçen bir mevzuat numarasıdır.
  for (const m of summaryText(s).matchAll(/\bKHK[-\s/]*(\d{3,4})\b/g)) out.add(Number(m[1]));
  for (const r of s.relatedLegislation ?? [])
    for (const m of r.law.matchAll(/\b(\d{3,4})\b/g)) out.add(Number(m[1]));
  return [...out];
}

export function validateArticleSummary(
  s: ArticleSummaryJson,
  article: ArticleText,
  /** Aynı kanunun bütün maddeleri (no → metin): aynı kanuna atıflar ve ek referanslar buradan. */
  sameLaw: Map<string, ArticleText>,
  /** Kanunun kendi numarası ("2559"): relatedLegislation'da kendine atıf yasak. */
  ownLawNumber?: string | null,
): ArticleSummaryValidation {
  const issues: string[] = [];
  const lines: string[] = [];
  const ok = (m: string) => lines.push(`✓ ${m}`);
  const bad = (m: string) => {
    issues.push(m);
    lines.push(`✗ ${m}`);
  };

  for (const k of ZORUNLU)
    if (!s[k] || (typeof s[k] === 'string' && !(s[k] as string).trim()))
      bad(`zorunlu alan boş: ${k}`);
  if (!/^AI madde özeti/.test(s.sourceLabel ?? ''))
    bad('sourceLabel "AI madde özeti" ile başlamalı');
  if (s.articleNo !== article.articleNo)
    bad(`madde no uyuşmuyor: ${s.articleNo} ≠ ${article.articleNo}`);

  if (s.repealed) {
    const dolu = (Object.keys(s) as (keyof ArticleSummaryJson)[]).filter(
      (k) =>
        !MULGA_IZINLI.has(k) &&
        s[k] != null &&
        (!Array.isArray(s[k]) || (s[k] as unknown[]).length > 0) &&
        s[k] !== '',
    );
    if (dolu.length) bad(`mülga maddede izinsiz alan dolu: ${dolu.join(', ')}`);
    if (!isRepealedText(article.text))
      bad('madde metni mülga değil (gövdesi var); repealed işareti yanlış');
    else ok('mülga kaydı: yalnız başlık + kısa özet');
    return { ok: issues.length === 0, issues, lines };
  }
  if (isRepealedText(article.text)) bad('madde metni mülga; repealed=true olmalı');

  // Aynı kanuna atıflar: "md 7", "Ek 7" bankada olmalı. Başka kanun atfı yalnız metinde anılan kanun numarasıyla.
  const metin = summaryText(s);
  // "md 7" / "madde 7" / "Ek 7": 1–3 hane (yıl değil), "'" eki yok; önündeki ~60 karakterde başka kanun
  // anılıyorsa ("5271 sayılı … md 81", "CMK md 81") aynı kanun atfı sayılmaz — sayı taramasına bırakılır.
  const aynıKanunAtif: string[] = [];
  for (const m of metin.matchAll(
    /\b(?:md|madde)\.?\s*((?:Ek|Geçici)\s*)?(\d{1,3}(?:\/[A-Z])?)(?![\d'’])/gi,
  )) {
    const once = metin.slice(Math.max(0, m.index! - 60), m.index!);
    if (
      /\d{3,4}\s+sayılı|\b(?:CMK|TCK|CMUK|TMK|İYUK|HMK|KHK|Kanunu(?:nun|na)?|Yönetmeli[kğ])/i.test(
        once,
      )
    )
      continue;
    aynıKanunAtif.push(`${m[1] ? m[1].trim() + ' ' : ''}${m[2]}`.replace(/\s+/g, ' '));
  }
  const refTexts: string[] = [article.text];
  for (const no of new Set(aynıKanunAtif)) {
    const a = sameLaw.get(no);
    if (!a) bad(`aynı kanunda olmayan madde atfı: ${no}`);
    else refTexts.push(a.text);
  }
  for (const r of s.relatedLegislation ?? []) {
    const num = r.law.match(/\b(\d{3,4})\b/)?.[1];
    if (num && ownLawNumber && num === ownLawNumber) {
      bad(`relatedLegislation "${r.law}": kanunun kendisi ilgili mevzuat olarak verilemez`);
      continue;
    }
    if (num && !new RegExp(`(^|[^\\d])${num}([^\\d]|$)`).test(article.text))
      bad(
        `relatedLegislation "${r.law}" madde metninde anılmıyor (yalnız metinde geçen kanun/madde bağlanır)`,
      );
    if (r.verified && num && !sameLaw.has(r.article ?? ''))
      bad(`relatedLegislation "${r.law}": başka kanun doğrulanmadan verified:true olamaz`);
  }

  // Sayılar: kanun numaraları ve yıl biçimli tarih parçaları ayrı ele alınır — ikisi de metinde geçmeli.
  const kanunlar = new Set(kanunNumaralari(s));
  const derived = s.derivedNumbers ?? [];
  const counters = normalizeCounterNumbers(s.counterNumbers);
  const temiz = metin
    .replace(/\b(?:md|madde)\.?\s*(?:Ek|Geçici)?\s*\d+(?:\/[A-Z])?/gi, ' ')
    .replace(/\bf\.\s*\d+(?:-[a-zçğ])?/gi, ' ')
    // Kalın numaralı ara başlık ("**3. Talebin yerine getirilmesi**") sayı değil, sıra numarasıdır.
    .replace(/\*\*\d{1,2}\.\s/g, '** ');
  for (const n of extractNumbers(temiz)) {
    if (counters.includes(n)) {
      if (numberInTexts(n, refTexts)) bad(`${n} karşı örnek ama metinde GEÇİYOR`);
      else ok(`${n} karşı örnek, metinde yok`);
      continue;
    }
    if (
      kanunlar.has(n)
        ? new RegExp(`(^|[^\\d])${n}([^\\d]|$)`).test(refTexts.join('\n'))
        : numberInTexts(n, refTexts)
    ) {
      ok(`${n} → madde metninde`);
      continue;
    }
    // Yıl (1900–2100): değişiklik şerhindeki tarihte ("24/11/2004-5259/1 md.") geçiyorsa geçer —
    // şerhler sayı taramasından düşer ama "2004'te 5259 sayılı Kanunla" anlatımı metne dayanır.
    if (
      n >= 1900 &&
      n <= 2100 &&
      new RegExp(`(^|[^\\d])${n}([^\\d]|$)`).test(refTexts.join('\n'))
    ) {
      ok(`${n} → değişiklik şerhinde`);
      continue;
    }
    const d = derived.find((x) => x.value === n);
    if (!d) {
      // Örtük karşı örnek: sayı "değil / yoktur / yanlış / tuzak" içeren cümlede anılıyor ve metinde yoksa,
      // cümle zaten onun metinde olmadığını söylüyor — counterNumbers'a yazılmamış olsa da geçer.
      if (ortukKarsiOrnek(metin, n)) {
        ok(`${n} örtük karşı örnek (cümle "değil/yoktur" diyor), metinde yok`);
        continue;
      }
      bad(`${n} madde metninde yok ve türetilmemiş`);
      continue;
    }
    try {
      const v = safeEval(d.expr);
      if (v !== d.value) bad(`${n}: formül ${d.expr} = ${v} ≠ ${d.value}`);
      else ok(`${n} türetildi: ${d.expr}`);
    } catch (e) {
      bad(`${n}: ${(e as Error).message}`);
    }
  }
  // Fıkra atıfları ("f.7") maddede o kadar fıkra var mı — kaba kontrol: fıkra sayısı ≥ atıf.
  const fikraSayisi = article.text.split(/\n(?=\S)/).filter((p) => p.trim().length > 20).length;
  for (const m of metin.matchAll(/\bf\.\s*(\d+)/g)) {
    const f = Number(m[1]);
    if (f > fikraSayisi + 2) bad(`f.${f} atfı: maddede yaklaşık ${fikraSayisi} fıkra var`);
  }
  if (!s.keyPoints?.length) bad('keyPoints boş: en az bir temel nokta');
  return { ok: issues.length === 0, issues, lines };
}

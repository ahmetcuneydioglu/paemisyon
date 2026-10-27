/**
 * Doc 53 — Konu özeti doğrulayıcısı (SAF: veritabanı yok, yalnız metin).
 *
 * Güven ilkesi: özet bir kart dizisidir; her kart en az bir resmî maddeye referans verir ve
 * karttaki her sayı ya referans maddenin metninde geçer ya açık formülle türetilir ya da
 * "yanlış şık" olarak işaretlenir (o zaman metinde GEÇMEMESİ doğrulanır). Anlam doğruluğu
 * (olumsuz iddialar) betikle yakalanamaz; insan incelemesi kaldırılamaz.
 *
 * Hem `scripts/ozet-dogrula.ts` hem admin içe aktarma / kart düzenleme bu dosyayı kullanır.
 */

export type SummaryRow = Record<string, unknown> & { refs?: string[] };
export type DerivedNumber = { value: number; expr: string; refs: string[]; note?: string };

export interface SummaryBlockJson {
  type: 'concept' | 'rule' | 'numbers' | 'compare' | 'trap' | 'exam_stats' | 'bridge';
  title?: string;
  body?: string;
  rows?: SummaryRow[];
  articleRefs: string[];
  derivedNumbers?: DerivedNumber[];
  counterNumbers?: number[];
  generated?: boolean;
}

export interface SummaryUnitJson {
  unit: {
    slug: string;
    legislationSlug: string;
    topicId: string;
    title: string;
    subtitle?: string;
    articleFrom: string;
    articleTo: string;
    readingMinutes?: number;
    /** Konu içindeki sıra (Doc 53 §5 ünite numarası). */
    sortOrder?: number;
    sourceLabel: string;
    generatedBy?: string;
  };
  blocks: SummaryBlockJson[];
}

export interface ArticleText {
  articleNo: string;
  text: string;
}

export interface BlockValidation {
  index: number;
  type: string;
  title: string;
  ok: boolean;
  /** İnsan okunur satırlar: "✓ 7 → referans metninde", "✗ 9 referans metinlerinde yok…" */
  lines: string[];
  issues: string[];
}

export interface UnitValidation {
  ok: boolean;
  fails: number;
  blocks: BlockValidation[];
}

// ── Türkçe sayı sözcükleri ────────────────────────────────────────────────
const BIRLER = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
const ONLAR = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
const SAYI_PARCALARI =
  'bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on|yirmi|otuz|kırk|elli|altmış|yetmiş|seksen|doksan|yüz';

/** 0–999 için sözcük deseni; parçalar arasında isteğe bağlı boşluk ("on\s?beş"). */
export function trNumberPattern(n: number): string | null {
  if (n === 0) return 'sıfır';
  if (n >= 1000 || n < 0 || !Number.isInteger(n)) return null;
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const b = n % 10;
  const parts: string[] = [];
  if (h) parts.push(h === 1 ? 'yüz' : `${BIRLER[h]}\\s?yüz`);
  if (t) parts.push(ONLAR[t]);
  if (b) parts.push(BIRLER[b]);
  return parts.join('\\s?');
}

/**
 * Değişiklik notları ("(Değişik: 23/7/1995-4121/10 md.)", "(Mülga …)", "(Ek fıkra: …)") kanun
 * numarası ve tarih taşır; bunlar madde hükmü değildir, eşlemeden önce atılır.
 */
export const stripAmendmentNotes = (t: string): string =>
  t.replace(/\((?:Değişik|Mülga|Ek fıkra|Ek cümle|Ek|İptal|Yeniden düzenleme)[^)]*\)/g, ' ');

/** Sayı, metinlerden birinde rakam ya da Türkçe sözcük olarak geçiyor mu. */
export function numberInTexts(n: number, texts: string[]): boolean {
  const joined = texts.map(stripAmendmentNotes).join('\n');
  if (new RegExp(`(^|[^\\d])${n}([^\\d]|$)`).test(joined)) return true;
  const w = trNumberPattern(n);
  if (!w) return false;
  // Önünde harf ya da başka bir sayı sözcüğü olmasın ("on beş" içindeki "beş" 5 sayılmaz);
  // arkasında Türkçe ek olabilir ("beşini", "altısı"), ama takip eden parça bütün bir sayı
  // sözcüğü olmasın ("onbeş" içindeki "on" 10 sayılmaz; "beş birleşim"deki "bir" sayı değildir).
  const oncesi = `(?<![a-zçğıöşü])(?<!(?:${SAYI_PARCALARI})\\s?)`;
  const sonrasi = `(?!\\s?(?:${SAYI_PARCALARI})(?:[ıiuü]|[ıiuü]n[ıiuü]|[dt][ea]n|[ea]|inci|üncü|ıncı|uncu|er|ar|şer|şar)?(?![a-zçğıöşü]))`;
  return new RegExp(`${oncesi}${w}${sonrasi}`).test(joined.toLowerCase());
}

/** Kart metnindeki sayılar; liste numarası, madde atfı ve fıkra kesri sayı sayılmaz. */
export function extractNumbers(text: string): number[] {
  const t = text
    .replace(/(^|\n)\s*\d+\.\s/g, '$1 ') // liste numarası: "1. ", "2. "
    .replace(/\bmd\.?\s*\d+(\/\d+)?(\s*[–-]\s*\d+)?/gi, ' ') // madde atfı: "md 84", "md 84/2", "md 1–6"
    .replace(/\b\d+(\/\d+)?\.\s*madde/gi, ' ') // "84. madde", "84/2. madde"
    .replace(/\b\d+\/\d+\b/g, ' '); // fıkra kesri
  const out = new Set<number>();
  for (const m of t.matchAll(/\d+/g)) out.add(Number(m[0]));
  return [...out];
}

/** Türetilmiş sayı formülü: yalnız rakam, + - * / ( ), floor ve ceil (üçte iki gibi yukarı yuvarlanan çoğunluklar). */
export function safeEval(expr: string): number {
  if (
    !/^[\d\s+\-*/()]*(?:(?:floor|ceil)?[\d\s+\-*/()]*)*$/.test(expr) ||
    !/\d/.test(expr) ||
    /[a-z]/.test(expr.replace(/floor|ceil/g, ''))
  ) {
    throw new Error(`güvensiz ifade: ${expr}`);
  }
  const js = expr.replace(/floor/g, 'Math.floor').replace(/ceil/g, 'Math.ceil');
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const v = Function(`"use strict"; return (${js});`)() as unknown;
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`hesaplanamadı: ${expr}`);
  return v;
}

export function blockText(b: Pick<SummaryBlockJson, 'title' | 'body' | 'rows'>): string {
  const parts = [b.title ?? '', b.body ?? ''];
  for (const r of b.rows ?? []) {
    for (const [k, v] of Object.entries(r))
      if (k !== 'refs' && typeof v === 'string') parts.push(v);
  }
  return parts.join('\n');
}

const ROW_TYPES = new Set(['numbers', 'compare', 'exam_stats', 'bridge']);

/** counterNumbers: sayı dizisi; model bazen `{value, note}` nesnesi yazar, ikisi de kabul. */
export function normalizeCounterNumbers(v: unknown): number[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) =>
      typeof x === 'number'
        ? x
        : x && typeof x === 'object' && 'value' in x
          ? Number((x as { value: unknown }).value)
          : NaN,
    )
    .filter((n) => Number.isFinite(n));
}
/** Formül işlenenlerinden metinde aranmayan sabitler (yarı, yüzde, +1). */
const SERBEST_ISLENEN = new Set([1, 2, 100]);

/**
 * Tek kartı doğrular. `articles`: madde no → metin (ünitenin mevzuatındaki TÜM maddeler;
 * ünite dışı referans — md 101, 106 gibi — da bu haritadan okunur).
 */
export function validateBlock(
  b: SummaryBlockJson,
  index: number,
  articles: Map<string, ArticleText>,
): BlockValidation {
  const lines: string[] = [];
  const issues: string[] = [];
  const ok = (m: string) => lines.push(`✓ ${m}`);
  const bad = (m: string) => {
    issues.push(m);
    lines.push(`✗ ${m}`);
  };
  const done = () => ({
    index,
    type: b.type,
    title: b.title ?? '',
    ok: issues.length === 0,
    lines,
    issues,
  });

  if (!b.articleRefs?.length) {
    bad('articleRefs boş');
    return done();
  }
  const missing = b.articleRefs.filter((n) => !articles.has(n));
  if (missing.length) bad(`madde yok: ${missing.join(', ')}`);
  else ok(`referanslar var: md ${b.articleRefs.join(', ')}`);

  if (ROW_TYPES.has(b.type) && b.body) bad(`${b.type} kartında body olmaz, rows olur`);
  for (const r of b.rows ?? []) {
    if (!r.refs?.length) bad(`satır refs boş: ${JSON.stringify(r).slice(0, 60)}`);
    else for (const n of r.refs) if (!articles.has(n)) bad(`satır referansı yok: md ${n}`);
  }
  if (b.generated || b.type === 'exam_stats' || b.type === 'bridge') {
    ok('betik üretimi, sayı kontrolü dışı');
    return done();
  }

  const refTexts = b.articleRefs.map((n) => articles.get(n)?.text ?? '');
  const derived = b.derivedNumbers ?? [];
  const counters = normalizeCounterNumbers(b.counterNumbers);
  for (const n of extractNumbers(blockText(b))) {
    if (counters.includes(n)) {
      if (numberInTexts(n, refTexts))
        bad(`${n} karşı örnek olarak verilmiş ama referans metninde GEÇİYOR`);
      else ok(`${n} karşı örnek (yanlış şık), metinde yok`);
      continue;
    }
    if (numberInTexts(n, refTexts)) {
      ok(`${n} → referans metninde`);
      continue;
    }
    const d = derived.find((x) => x.value === n);
    if (!d) {
      bad(`${n} referans metinlerinde yok ve türetilmemiş`);
      continue;
    }
    let v: number;
    try {
      v = safeEval(d.expr);
    } catch (e) {
      bad(`${n}: ${(e as Error).message}`);
      continue;
    }
    if (v !== d.value) {
      bad(`${n}: formül ${d.expr} = ${v} ≠ ${d.value}`);
      continue;
    }
    const dTexts = (d.refs ?? []).map((x) => articles.get(x)?.text ?? '');
    // Zincirli türetim: işlenen, aynı kartta formülle türetilmiş başka bir sayı olabilir
    // (600/3 = 200 toplantı yeter sayısı → 200'ün salt çoğunluğu 101).
    const digerTuretilmis = new Set(derived.filter((x) => x !== d).map((x) => x.value));
    const operands = [...new Set([...d.expr.matchAll(/\d+/g)].map((m) => Number(m[0])))].filter(
      (o) => !SERBEST_ISLENEN.has(o) && !digerTuretilmis.has(o),
    );
    const lost = operands.filter((o) => !numberInTexts(o, dTexts));
    if (lost.length) bad(`${n}: formül işleneni metinde yok: ${lost.join(', ')}`);
    else ok(`${n} türetildi: ${d.expr} (md ${(d.refs ?? []).join(', ')})`);
  }
  // Satır düzeyi: satırın sayıları KENDİ referanslarında olmalı.
  for (const r of b.rows ?? []) {
    const rt = Object.entries(r)
      .filter(([k, v]) => k !== 'refs' && typeof v === 'string')
      .map(([, v]) => v as string)
      .join(' ');
    const rTexts = (r.refs ?? []).map((n) => articles.get(n)?.text ?? '');
    for (const n of extractNumbers(rt)) {
      if (numberInTexts(n, rTexts)) continue;
      if (derived.some((d) => d.value === n) || counters.includes(n)) continue;
      bad(
        `satır "${String((r as any).label ?? (r as any).aspect ?? '?')}": ${n} satırın referanslarında yok`,
      );
    }
  }
  return done();
}

export function validateUnit(
  data: SummaryUnitJson,
  articles: Map<string, ArticleText>,
): UnitValidation {
  const blocks = data.blocks.map((b, i) => validateBlock(b, i, articles));
  const fails = blocks.reduce((s, b) => s + b.issues.length, 0);
  return { ok: fails === 0, fails, blocks };
}

/** Ünite aralığındaki referanslar (sayısal karşılaştırma; "Ek 3" gibi olanlar aralık dışı sayılır). */
export function unitArticleNos(data: SummaryUnitJson): string[] {
  const from = Number(data.unit.articleFrom);
  const to = Number(data.unit.articleTo);
  const all = [...new Set(data.blocks.flatMap((b) => b.articleRefs ?? []))];
  return all
    .filter((n) => {
      const k = Number(n);
      return Number.isFinite(k) && k >= from && k <= to;
    })
    .sort((a, b) => Number(a) - Number(b));
}

export interface ExamStatsInput {
  /** madde no → yayındaki soru sayısı */
  perArticle: Map<string, number>;
  /** madde no → başlık */
  titles: Map<string, string>;
  /** Ünitenin maddelerine bağlı tekil soru sayısı */
  totalQuestions: number;
  /** Resmî sınav adı → soru sayısı (yalnız resmî; kitap/deneme etiketi girmez) */
  exams: Map<string, number>;
}

/** Betik üretimi kartlar (exam_stats, bridge) — model yazmaz, veri yazar. */
export function fillGeneratedBlocks(data: SummaryUnitJson, stats: ExamStatsInput): void {
  const refs = unitArticleNos(data);
  const temiz = (t: string) => t.replace(/^\d+\.\s*|^[A-Z]\.\s*/, '');
  const top = refs
    .map((no) => ({ no, n: stats.perArticle.get(no) ?? 0 }))
    .sort((a, b) => b.n - a.n);
  for (const b of data.blocks) {
    if (b.type === 'exam_stats') {
      b.generated = true;
      b.articleRefs = refs;
      b.rows = [
        {
          label: 'Bu ünitenin maddelerinden yayındaki soru',
          value: String(stats.totalQuestions),
          refs,
        },
        ...top
          .filter((t) => t.n > 0)
          .slice(0, 5)
          .map((t) => {
            const title = stats.titles.get(t.no);
            return {
              label: `md ${t.no}${title ? ' — ' + temiz(title) : ''}`,
              value: `${t.n} soru`,
              refs: [t.no],
            };
          }),
        ...(stats.exams.size
          ? [
              {
                label: 'Resmî sınavlarda',
                value: [...stats.exams]
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 4)
                  .map(([k, v]) => `${k} (${v})`)
                  .join(', '),
                refs,
              },
            ]
          : []),
        ...(top.some((t) => t.n === 0)
          ? [
              {
                label: 'Hiç soru çıkmamış',
                value: top
                  .filter((t) => t.n === 0)
                  .map((t) => `md ${t.no}`)
                  .join(', '),
                refs,
              },
            ]
          : []),
      ];
    }
    if (b.type === 'bridge') {
      b.generated = true;
      b.articleRefs = refs;
      b.rows = [
        {
          label: 'Madde kapsamlı seans',
          value: `md ${data.unit.articleFrom}–${data.unit.articleTo}, ${Math.min(10, stats.totalQuestions)} soru`,
          refs,
        },
      ];
    }
  }
}

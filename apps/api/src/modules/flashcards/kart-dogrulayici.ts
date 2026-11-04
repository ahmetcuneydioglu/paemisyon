/**
 * Doc 56 — Bilgi kartı doğrulayıcısı (SAF: veritabanı yok, yalnız metin).
 *
 * Güven ilkesi Doc 53'le aynıdır: her kart en az bir resmî maddeye referans verir; cevap ve
 * açıklamadaki her sayı ya referans maddenin metninde geçer, ya açık formülle türetilir, ya da
 * "yanlış şık" (counterNumbers) olarak işaretlenir. Anlam doğruluğu (tuzak kartlarındaki olumsuz
 * iddialar) betikle yakalanamaz; insan incelemesi kaldırılamaz.
 *
 * Sayı çekirdeği `summaries/ozet-dogrulayici.ts`'ten yeniden kullanılır (tek tanım). Hem
 * `scripts/kart-dogrula.ts` hem admin içe aktarma / kart düzenleme bu dosyayı kullanır.
 */
import {
  extractNumbers,
  normalizeCounterNumbers,
  numberInTexts,
  safeEval,
  type ArticleText,
  type DerivedNumber,
} from '../summaries/ozet-dogrulayici';

export type FlashcardKindJson = 'qa' | 'cloze' | 'numeric' | 'trap';

export interface FlashcardJson {
  kind: FlashcardKindJson;
  front: string;
  back: string;
  explanation?: string;
  difficulty?: number;
  /** Madde numaraları (kanonik: "13", "4/A", "Ek 6"). İlk eleman birincil referans. */
  articleRefs: string[];
  derivedNumbers?: DerivedNumber[];
  counterNumbers?: number[];
}

export interface FlashcardDeckJson {
  deck: {
    /** Kartların konusu (zorunlu; deste tablo değil, kapsam etiketidir). */
    topicId: string;
    legislationSlug: string;
    /** Ünite etiketi (isteğe bağlı): kartlar bu ünitenin alt konu filtresine düşer. */
    unitSlug?: string;
    sourceLabel: string;
    generatedBy?: string;
  };
  cards: FlashcardJson[];
}

export interface CardValidation {
  index: number;
  kind: string;
  front: string;
  ok: boolean;
  lines: string[];
  issues: string[];
}

export interface DeckValidation {
  ok: boolean;
  fails: number;
  cards: CardValidation[];
}

const FRONT_MAX = 400;
const BACK_MAX = 400;
const EXPLANATION_MAX = 1200;
const KINDS: ReadonlySet<string> = new Set(['qa', 'cloze', 'numeric', 'trap']);
/** Formül işlenenlerinden metinde aranmayan sabitler (ozet-dogrulayici ile aynı). */
const SERBEST_ISLENEN = new Set([1, 2, 7, 100]);

/** Cevap + açıklama metni (sayı denetiminin kapsamı; ön yüzdeki sayı soru kurgusudur, denetlenmez). */
export function cardAnswerText(c: Pick<FlashcardJson, 'back' | 'explanation'>): string {
  return [c.back ?? '', c.explanation ?? ''].join('\n');
}

export function validateCard(
  c: FlashcardJson,
  index: number,
  articles: Map<string, ArticleText>,
): CardValidation {
  const lines: string[] = [];
  const issues: string[] = [];
  const ok = (m: string) => lines.push(`✓ ${m}`);
  const bad = (m: string) => {
    issues.push(m);
    lines.push(`✗ ${m}`);
  };
  const done = () => ({
    index,
    kind: String(c.kind ?? ''),
    front: (c.front ?? '').slice(0, 80),
    ok: issues.length === 0,
    lines,
    issues,
  });

  if (!KINDS.has(c.kind)) bad(`tür geçersiz: ${String(c.kind)}`);
  if (!c.front?.trim()) bad('ön yüz boş');
  else if (c.front.length > FRONT_MAX) bad(`ön yüz ${FRONT_MAX} karakteri aşıyor`);
  if (!c.back?.trim()) bad('arka yüz boş');
  else if (c.back.length > BACK_MAX) bad(`arka yüz ${BACK_MAX} karakteri aşıyor`);
  if (c.explanation && c.explanation.length > EXPLANATION_MAX)
    bad(`açıklama ${EXPLANATION_MAX} karakteri aşıyor`);
  if (c.kind === 'cloze' && !/_{3,}|\{\{.+?\}\}/.test(c.front ?? ''))
    bad('boşluk kartında ön yüzde boşluk işareti (___ ya da {{…}}) yok');
  if (c.difficulty != null && ![1, 2, 3].includes(c.difficulty))
    bad(`zorluk 1–3 olmalı: ${c.difficulty}`);

  if (!c.articleRefs?.length) {
    bad('articleRefs boş');
    return done();
  }
  const missing = c.articleRefs.filter((n) => !articles.has(n));
  if (missing.length) bad(`madde yok: ${missing.join(', ')}`);
  else ok(`referanslar var: md ${c.articleRefs.join(', ')}`);
  if (issues.length) return done();

  const refTexts = c.articleRefs.map((n) => articles.get(n)?.text ?? '');
  const derived = c.derivedNumbers ?? [];
  const counters = normalizeCounterNumbers(c.counterNumbers);
  const sayilar = extractNumbers(cardAnswerText(c));
  if (!sayilar.length) ok('cevapta sayı yok');
  for (const n of sayilar) {
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
    const digerTuretilmis = new Set(derived.filter((x) => x !== d).map((x) => x.value));
    const operands = [...new Set([...d.expr.matchAll(/\d+/g)].map((m) => Number(m[0])))].filter(
      (o) => !SERBEST_ISLENEN.has(o) && !digerTuretilmis.has(o),
    );
    const lost = operands.filter((o) => !numberInTexts(o, dTexts));
    if (lost.length) bad(`${n}: formül işleneni metinde yok: ${lost.join(', ')}`);
    else ok(`${n} türetildi: ${d.expr} (md ${(d.refs ?? []).join(', ')})`);
  }
  return done();
}

const normalize = (s: string) =>
  s
    .toLocaleLowerCase('tr-TR')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

/**
 * Desteyi doğrular. Kart düzeyi denetimlere ek olarak: aynı cevaba giden ikinci kart (ön yüzü
 * farklı olsa da) kusurdur — kullanıcı aynı bilgiyi iki kez puanlamasın (Doc 56 §8.3).
 */
export function validateDeck(
  data: FlashcardDeckJson,
  articles: Map<string, ArticleText>,
): DeckValidation {
  const cards = data.cards.map((c, i) => validateCard(c, i, articles));
  const seen = new Map<string, number>();
  data.cards.forEach((c, i) => {
    const key = normalize(c.back ?? '');
    if (!key) return;
    const first = seen.get(key);
    if (first != null) {
      const v = cards[i]!;
      const m = `aynı cevaba giden ikinci kart (#${first + 1} ile aynı arka yüz)`;
      v.issues.push(m);
      v.lines.push(`✗ ${m}`);
      v.ok = false;
    } else seen.set(key, i);
  });
  const fails = cards.reduce((s, c) => s + c.issues.length, 0);
  return { ok: fails === 0, fails, cards };
}

/** Destenin başvurduğu tüm madde numaraları (tekil, sıralı). */
export function deckArticleNos(data: FlashcardDeckJson): string[] {
  const out: string[] = [];
  for (const c of data.cards)
    for (const n of c.articleRefs ?? []) if (!out.includes(n)) out.push(n);
  return out;
}

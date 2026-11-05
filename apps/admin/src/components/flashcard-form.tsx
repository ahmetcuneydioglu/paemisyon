'use client';

import { FLASHCARD_KIND_LABEL, VERIFICATION_LABEL, type FlashcardDerivedNumber, type FlashcardDetail, type FlashcardKind, type VerificationStatus } from '@/lib/types';

/* ── Rozetler (liste + detay) ── */

const KIND_TONE: Record<FlashcardKind, string> = {
  qa: 'bg-sky-50 text-sky-700 border-sky-200',
  cloze: 'bg-sky-50 text-sky-700 border-sky-200',
  numeric: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  trap: 'bg-rose-50 text-rose-700 border-rose-200',
};
const VERIFY_TONE: Record<VerificationStatus, string> = {
  pending_review: 'bg-slate-100 text-slate-600',
  verified: 'bg-emerald-100 text-emerald-800',
  needs_refresh: 'bg-red-100 text-red-700',
};

export function KindBadge({ kind }: { kind: FlashcardKind }) {
  return <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${KIND_TONE[kind]}`}>{FLASHCARD_KIND_LABEL[kind]}</span>;
}
export function VerifyBadge({ status }: { status: VerificationStatus }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs ${VERIFY_TONE[status]}`}>{VERIFICATION_LABEL[status]}</span>;
}

/** Form taslağı: metin alanları ham tutulur, gönderimde ayrıştırılır (`draftToBody`). */
export interface FlashcardDraft {
  kind: FlashcardKind;
  front: string;
  back: string;
  explanation: string;
  difficulty: 1 | 2 | 3;
  unitSlug: string;
  articleRefs: string;
  counterNumbers: string;
  derivedNumbers: string;
}

export const EMPTY_DRAFT: FlashcardDraft = {
  kind: 'qa',
  front: '',
  back: '',
  explanation: '',
  difficulty: 2,
  unitSlug: '',
  articleRefs: '',
  counterNumbers: '',
  derivedNumbers: '',
};

export function detailToDraft(d: FlashcardDetail): FlashcardDraft {
  return {
    kind: d.kind,
    front: d.front,
    back: d.back,
    explanation: d.explanation ?? '',
    difficulty: (d.difficulty as 1 | 2 | 3) ?? 2,
    unitSlug: d.unit?.slug ?? '',
    articleRefs: d.articles.map((a) => a.no).join(', '),
    counterNumbers: d.counterNumbers.join(', '),
    derivedNumbers: d.derivedNumbers?.length ? JSON.stringify(d.derivedNumbers, null, 1) : '',
  };
}

function parseList(s: string): string[] {
  return s
    .split(/[,\n]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export interface FlashcardBody {
  kind: FlashcardKind;
  front: string;
  back: string;
  explanation: string | null;
  difficulty: number;
  unitSlug: string | null;
  articleRefs: string[];
  counterNumbers: number[];
  derivedNumbers: FlashcardDerivedNumber[] | null;
}

/** Taslak → API gövdesi; hata varsa mesaj döner (sunucu yine doğrular; bu yalnız biçim). */
export function draftToBody(d: FlashcardDraft): { body: FlashcardBody } | { error: string } {
  if (!d.front.trim()) return { error: 'Ön yüz boş olamaz.' };
  if (!d.back.trim()) return { error: 'Arka yüz boş olamaz.' };
  const articleRefs = parseList(d.articleRefs);
  if (articleRefs.length === 0) return { error: 'En az bir madde referansı gerekli (örn. 75, 84).' };
  const counterNumbers = parseList(d.counterNumbers).map(Number);
  if (counterNumbers.some((n) => !Number.isInteger(n))) return { error: 'Karşı örnek sayılar tam sayı olmalı.' };
  let derivedNumbers: FlashcardDerivedNumber[] | null = null;
  if (d.derivedNumbers.trim()) {
    try {
      const parsed = JSON.parse(d.derivedNumbers) as unknown;
      if (!Array.isArray(parsed)) return { error: 'Türetilmiş sayılar bir JSON dizisi olmalı.' };
      derivedNumbers = parsed as FlashcardDerivedNumber[];
    } catch {
      return { error: 'Türetilmiş sayılar geçerli JSON değil.' };
    }
  }
  return {
    body: {
      kind: d.kind,
      front: d.front.trim(),
      back: d.back.trim(),
      explanation: d.explanation.trim() || null,
      difficulty: d.difficulty,
      unitSlug: d.unitSlug.trim() || null,
      articleRefs,
      counterNumbers,
      derivedNumbers,
    },
  };
}

const INPUT = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

/**
 * Kart formu (Doc 56 §8.2 detay/yeni): ön yüz, arka yüz, açıklama, tür, zorluk, ünite etiketi,
 * madde referansları, karşı örnek ve türetilmiş sayılar. Konu/mevzuat seçimi çağıranın (yeni kart).
 */
export function FlashcardForm({
  draft,
  onChange,
  disabled,
  unitOptions,
}: {
  draft: FlashcardDraft;
  onChange: (d: FlashcardDraft) => void;
  disabled?: boolean;
  /** Konunun yayındaki/incelemedeki üniteleri; boşsa serbest metin. */
  unitOptions?: { slug: string; title: string }[];
}) {
  const set = <K extends keyof FlashcardDraft>(k: K, v: FlashcardDraft[K]) => onChange({ ...draft, [k]: v });
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          Tür
          <select value={draft.kind} onChange={(e) => set('kind', e.target.value as FlashcardKind)} disabled={disabled} className={INPUT}>
            {(Object.keys(FLASHCARD_KIND_LABEL) as FlashcardKind[]).map((k) => (
              <option key={k} value={k}>
                {FLASHCARD_KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Zorluk
          <select value={draft.difficulty} onChange={(e) => set('difficulty', Number(e.target.value) as 1 | 2 | 3)} disabled={disabled} className={INPUT}>
            <option value={1}>1 · kolay</option>
            <option value={2}>2 · orta</option>
            <option value={3}>3 · zor</option>
          </select>
        </label>
        <label className="block text-sm">
          Ünite etiketi <span className="text-xs text-slate-500">(isteğe bağlı)</span>
          {unitOptions && unitOptions.length > 0 ? (
            <select value={draft.unitSlug} onChange={(e) => set('unitSlug', e.target.value)} disabled={disabled} className={INPUT}>
              <option value="">— konu geneli —</option>
              {unitOptions.map((u) => (
                <option key={u.slug} value={u.slug}>
                  {u.title}
                </option>
              ))}
            </select>
          ) : (
            <input value={draft.unitSlug} onChange={(e) => set('unitSlug', e.target.value)} disabled={disabled} placeholder="anayasa-yasama-1" className={`${INPUT} font-mono`} />
          )}
        </label>
      </div>
      <label className="block text-sm">
        Ön yüz <span className="text-xs text-slate-500">(soru ya da boşluklu cümle; boşluk kartında ___ ya da {'{{…}}'})</span>
        <textarea value={draft.front} onChange={(e) => set('front', e.target.value)} disabled={disabled} rows={2} maxLength={400} className={INPUT} />
      </label>
      <label className="block text-sm">
        Arka yüz <span className="text-xs text-slate-500">(kısa cevap; her sayı madde metninde geçmeli)</span>
        <textarea value={draft.back} onChange={(e) => set('back', e.target.value)} disabled={disabled} rows={2} maxLength={400} className={INPUT} />
      </label>
      <label className="block text-sm">
        Açıklama <span className="text-xs text-slate-500">(isteğe bağlı; kalın için **…**, liste için satır başı {'"- "'})</span>
        <textarea value={draft.explanation} onChange={(e) => set('explanation', e.target.value)} disabled={disabled} rows={4} maxLength={1200} className={INPUT} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          Madde referansları <span className="text-xs text-slate-500">(virgülle; ilki birincil: 84, 75)</span>
          <input value={draft.articleRefs} onChange={(e) => set('articleRefs', e.target.value)} disabled={disabled} className={`${INPUT} font-mono`} />
        </label>
        <label className="block text-sm">
          Karşı örnek sayılar <span className="text-xs text-slate-500">(kartın {'"yanlış"'} dediği; metinde geçmemeli)</span>
          <input value={draft.counterNumbers} onChange={(e) => set('counterNumbers', e.target.value)} disabled={disabled} placeholder="2, 6" className={`${INPUT} font-mono`} />
        </label>
      </div>
      <label className="block text-sm">
        Türetilmiş sayılar <span className="text-xs text-slate-500">(JSON: {'[{"value":301,"expr":"floor(600 / 2) + 1","refs":["75","84"]}]'})</span>
        <textarea value={draft.derivedNumbers} onChange={(e) => set('derivedNumbers', e.target.value)} disabled={disabled} rows={2} spellCheck={false} className={`${INPUT} font-mono text-xs`} />
      </label>
    </div>
  );
}

/** Doğrulama satırları: ✗ kırmızı; betiğin anlamı doğrulamadığı notuyla. */
export function ValidationLines({ lines, note = true }: { lines: string[]; note?: boolean }) {
  return (
    <div>
      <ul className="rounded-lg bg-slate-50 p-2 font-mono text-xs text-slate-700">
        {lines.map((l, i) => (
          <li key={i} className={l.startsWith('✗') ? 'text-red-700' : ''}>
            {l}
          </li>
        ))}
      </ul>
      {note && (
        <p className="mt-1 text-xs text-slate-500">
          Betik yalnız referans ve sayıları denetler; tuzak kartlarındaki olumsuz iddiaları ve anlamı insan okur.
        </p>
      )}
    </div>
  );
}

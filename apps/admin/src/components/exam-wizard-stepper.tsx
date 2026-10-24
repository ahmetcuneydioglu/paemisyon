'use client';

import Link from 'next/link';

export const WIZARD_STEPS = ['Kimlik', 'Ayarlar', 'Sorular', 'Önizleme ve yayın'] as const;
export type WizardStep = 1 | 2 | 3 | 4;

/** Dört adımlı sihirbaz başlığı (Doc 50 A1–A4). Tamamlanan adımlar tıklanabilir. */
export function ExamWizardStepper({
  active,
  examId,
}: {
  active: WizardStep;
  /** Taslak id'si; yoksa (yeni deneme) yalnız 1. adım erişilebilir. */
  examId: string | null;
}) {
  return (
    <ol className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm" aria-label="Adımlar">
      {WIZARD_STEPS.map((label, i) => {
        const n = (i + 1) as WizardStep;
        const done = n < active;
        const cur = n === active;
        const reachable = examId != null;
        const inner = (
          <>
            <span
              className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${
                cur
                  ? 'bg-indigo-600 text-white'
                  : done
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
              }`}
              aria-hidden
            >
              {done ? '✓' : n}
            </span>
            <span className={cur ? 'font-medium text-slate-900' : 'text-slate-500'}>{label}</span>
          </>
        );
        return (
          <li key={label} className="flex items-center gap-2" aria-current={cur ? 'step' : undefined}>
            {reachable && !cur ? (
              <Link href={`/exams/${examId}?adim=${n}`} className="flex items-center gap-2 hover:underline">
                {inner}
              </Link>
            ) : (
              <span className="flex items-center gap-2">{inner}</span>
            )}
            {i < WIZARD_STEPS.length - 1 && <span className="ml-2 h-px w-8 bg-slate-200" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

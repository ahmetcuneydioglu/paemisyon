'use client';

import { useState } from 'react';

export interface ExamFormValue {
  title: string;
  description: string;
  startAt: string; // ISO
  durationMinutes: number;
  isPremium: boolean;
  liveAnswerReveal: boolean;
  questionsOpenAfterEnd: boolean;
}

export function emptyExam(): ExamFormValue {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  t.setHours(20, 0, 0, 0); // yarın 20:00 — tipik canlı deneme saati
  return {
    title: '',
    description: '',
    startAt: t.toISOString(),
    durationMinutes: 60,
    isPremium: false,
    liveAnswerReveal: false,
    questionsOpenAfterEnd: true,
  };
}

/** ISO ↔ datetime-local (yerel saat) dönüşümü. */
function isoToLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Deneme meta formu (Doc 18 §8). Soru seçici ayrı bileşendedir. */
export function ExamForm({
  initial,
  submitLabel,
  busy,
  disabled = false,
  onSubmit,
}: {
  initial: ExamFormValue;
  submitLabel: string;
  busy: boolean;
  disabled?: boolean;
  onSubmit: (v: ExamFormValue) => void;
}) {
  const [v, setV] = useState<ExamFormValue>(initial);
  const set = (patch: Partial<ExamFormValue>) => setV((p) => ({ ...p, ...patch }));
  const valid = v.title.trim().length >= 3 && v.durationMinutes >= 5 && !!v.startAt;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid && !disabled) onSubmit(v);
      }}
      className="max-w-2xl space-y-4"
    >
      <div>
        <label className="block text-sm font-medium">Deneme adı</label>
        <input
          required
          disabled={disabled}
          value={v.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="Örn: Genel Mevzuat Deneme Sınavı 4"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Açıklama (opsiyonel)</label>
        <textarea
          rows={2}
          disabled={disabled}
          value={v.description}
          onChange={(e) => set({ description: e.target.value })}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium">Başlangıç (tarih + saat)</label>
          <input
            type="datetime-local"
            required
            disabled={disabled}
            value={isoToLocal(v.startAt)}
            onChange={(e) => {
              if (e.target.value) set({ startAt: new Date(e.target.value).toISOString() });
            }}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Süre (dakika)</label>
          <input
            type="number"
            min={5}
            max={600}
            required
            disabled={disabled}
            value={v.durationMinutes}
            onChange={(e) => set({ durationMinutes: Number(e.target.value) })}
            className="mt-1 w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
          />
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            disabled={disabled}
            checked={v.isPremium}
            onChange={(e) => set({ isPremium: e.target.checked })}
          />
          Premium deneme (yalnız abonelere açık)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            disabled={disabled}
            checked={v.liveAnswerReveal}
            onChange={(e) => set({ liveAnswerReveal: e.target.checked })}
          />
          Cevaplarken doğruyu anında göster
          <span className="text-xs text-amber-600">
            (⚠ sınav sürerken cevap anahtarını ifşa eder — önerilmez)
          </span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            disabled={disabled}
            checked={v.questionsOpenAfterEnd}
            onChange={(e) => set({ questionsOpenAfterEnd: e.target.checked })}
          />
          Sınav bitince sorular herkese açık görüntülenebilsin
        </label>
      </div>

      {!disabled && (
        <button
          type="submit"
          disabled={!valid || busy}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {busy ? 'Kaydediliyor…' : submitLabel}
        </button>
      )}
    </form>
  );
}

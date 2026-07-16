'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import type { CatalogModule, Difficulty, QuestionOption } from '@/lib/types';

export interface QuestionFormValue {
  topicId: string;
  stem: string;
  explanation: string;
  difficulty: Difficulty;
  /** Madde Atlası (Doc 25 §4): "16", "4/A", "Ek 6"… Boş = madde yok. */
  articleNo: string;
  options: QuestionOption[];
}

const LABELS = ['A', 'B', 'C', 'D', 'E'];

export function emptyQuestion(): QuestionFormValue {
  return {
    topicId: '',
    stem: '',
    explanation: '',
    difficulty: 'medium',
    articleNo: '',
    options: [
      { label: 'A', text: '', isCorrect: true },
      { label: 'B', text: '', isCorrect: false },
      { label: 'C', text: '', isCorrect: false },
      { label: 'D', text: '', isCorrect: false },
    ],
  };
}

/** Soru formu (Doc 9 §4.2): kök, 2-5 şık (tek doğru), açıklama, zorluk, konu. */
export function QuestionForm({
  initial,
  submitLabel,
  busy,
  onSubmit,
}: {
  initial: QuestionFormValue;
  submitLabel: string;
  busy: boolean;
  onSubmit: (value: QuestionFormValue) => void;
}) {
  const [v, setV] = useState<QuestionFormValue>(initial);
  const tree = useQuery({
    queryKey: ['catalog-tree'],
    queryFn: () => api<CatalogModule[]>('/admin/catalog/tree'),
  });

  const set = (patch: Partial<QuestionFormValue>) => setV((p) => ({ ...p, ...patch }));

  function setOption(i: number, patch: Partial<QuestionOption>) {
    set({
      options: v.options.map((o, j) => (j === i ? { ...o, ...patch } : o)),
    });
  }

  function markCorrect(i: number) {
    set({ options: v.options.map((o, j) => ({ ...o, isCorrect: j === i })) });
  }

  function addOption() {
    if (v.options.length >= 5) return;
    set({ options: [...v.options, { label: LABELS[v.options.length], text: '', isCorrect: false }] });
  }

  function removeOption(i: number) {
    if (v.options.length <= 2) return;
    const next = v.options.filter((_, j) => j !== i).map((o, j) => ({ ...o, label: LABELS[j] }));
    if (!next.some((o) => o.isCorrect)) next[0] = { ...next[0], isCorrect: true };
    set({ options: next });
  }

  const valid =
    v.topicId &&
    v.stem.trim().length >= 5 &&
    v.options.every((o) => o.text.trim().length > 0) &&
    v.options.filter((o) => o.isCorrect).length === 1;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit(v);
      }}
      className="max-w-3xl space-y-5"
    >
      <div>
        <label className="block text-sm font-medium">Konu</label>
        <select
          required
          value={v.topicId}
          onChange={(e) => set({ topicId: e.target.value })}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Konu seç…</option>
          {tree.data?.map((m) =>
            m.courses.map((c) =>
              c.topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {m.name} / {c.name} / {t.name}
                </option>
              )),
            ),
          )}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Soru kökü</label>
        <textarea
          required
          rows={3}
          value={v.stem}
          onChange={(e) => set({ stem: e.target.value })}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Soruyu yaz…"
        />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium">Şıklar (doğruyu işaretle)</label>
          {v.options.length < 5 && (
            <button type="button" onClick={addOption} className="text-sm font-medium text-indigo-600 hover:underline">
              + Şık ekle
            </button>
          )}
        </div>
        <div className="space-y-2">
          {v.options.map((o, i) => (
            <div key={o.label} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                checked={o.isCorrect}
                onChange={() => markCorrect(i)}
                title="Doğru cevap"
              />
              <span className="w-5 text-sm font-medium text-slate-500">{o.label})</span>
              <input
                required
                value={o.text}
                onChange={(e) => setOption(i, { text: e.target.value })}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder={`${o.label} şıkkı`}
              />
              {v.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="px-1 text-slate-400 hover:text-red-600"
                  title="Şıkkı kaldır"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Açıklama (çözüm)</label>
        <textarea
          rows={2}
          value={v.explanation}
          onChange={(e) => set({ explanation: e.target.value })}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Doğru cevabın gerekçesi — practice modunda gösterilir"
        />
      </div>

      <div className="flex gap-4">
        <div>
          <label className="block text-sm font-medium">Zorluk</label>
          <select
            value={v.difficulty}
            onChange={(e) => set({ difficulty: e.target.value as Difficulty })}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="easy">Kolay</option>
            <option value="medium">Orta</option>
            <option value="hard">Zor</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Kanun maddesi</label>
          <input
            value={v.articleNo}
            onChange={(e) => set({ articleNo: e.target.value })}
            maxLength={16}
            className="mt-1 w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="örn. 16, 4/A, Ek 6"
            title="Madde Atlası: sorunun bağlı olduğu madde. Boş bırakılırsa kökten otomatik tespit edilir."
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!valid || busy}
        className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {busy ? 'Kaydediliyor…' : submitLabel}
      </button>
    </form>
  );
}

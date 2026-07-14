'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui';
import type { CatalogModule, Paged, QuestionListItem } from '@/lib/types';

export interface PickedQuestion {
  questionId: string;
  stem: string;
  topicName: string;
}

/**
 * Soru seçici (Doc 18 §8): solda YAYINDAKİ sorularda arama/filtre → Ekle;
 * sağda seçili set (sırala ↑↓ / çıkar). Kaydetme üst bileşende.
 */
export function ExamQuestionPicker({
  value,
  onChange,
}: {
  value: PickedQuestion[];
  onChange: (next: PickedQuestion[]) => void;
}) {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [topicId, setTopicId] = useState('');
  const [page, setPage] = useState(1);

  const tree = useQuery({
    queryKey: ['catalog-tree'],
    queryFn: () => api<CatalogModule[]>('/admin/catalog/tree'),
  });

  const params = new URLSearchParams({ status: 'published', page: String(page) });
  if (search) params.set('search', search);
  if (topicId) params.set('topicId', topicId);
  const results = useQuery({
    queryKey: ['picker-questions', search, topicId, page],
    queryFn: () => api<Paged<QuestionListItem>>(`/admin/questions?${params}`),
  });

  const pickedIds = new Set(value.map((p) => p.questionId));
  const add = (q: QuestionListItem) => {
    if (pickedIds.has(q.id)) return;
    onChange([...value, { questionId: q.id, stem: q.latestVersion?.stem ?? '', topicName: q.topicName }]);
  };
  const remove = (id: string) => onChange(value.filter((p) => p.questionId !== id));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Sol: yayında soru arama */}
      <Card className="p-0">
        <div className="space-y-2 border-b border-slate-100 p-4">
          <div className="text-sm font-semibold">Yayındaki sorulardan ekle</div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput);
              setPage(1);
            }}
            className="flex gap-2"
          >
            <input
              placeholder="Soru kökünde ara…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </form>
          <select
            value={topicId}
            onChange={(e) => {
              setTopicId(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">Tüm konular</option>
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
        <ul className="max-h-96 divide-y divide-slate-50 overflow-y-auto">
          {results.data?.items.map((q) => (
            <li key={q.id} className="flex items-center gap-2 px-4 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <div className="truncate">{q.latestVersion?.stem}</div>
                <div className="text-xs text-slate-400">{q.topicName}</div>
              </div>
              <button
                type="button"
                onClick={() => add(q)}
                disabled={pickedIds.has(q.id)}
                className="shrink-0 rounded bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white disabled:bg-slate-300"
              >
                {pickedIds.has(q.id) ? 'Eklendi' : '+ Ekle'}
              </button>
            </li>
          ))}
          {results.data && results.data.items.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-500">Sonuç yok.</li>
          )}
        </ul>
        {results.data && results.data.total > results.data.pageSize && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="disabled:opacity-40"
            >
              ← Önceki
            </button>
            <span>
              {page} / {Math.ceil(results.data.total / results.data.pageSize)}
            </span>
            <button
              type="button"
              disabled={page >= Math.ceil(results.data.total / results.data.pageSize)}
              onClick={() => setPage((p) => p + 1)}
              className="disabled:opacity-40"
            >
              Sonraki →
            </button>
          </div>
        )}
      </Card>

      {/* Sağ: seçili set */}
      <Card className="p-0">
        <div className="border-b border-slate-100 p-4 text-sm font-semibold">
          Denemedeki sorular ({value.length})
        </div>
        <ol className="max-h-[26rem] divide-y divide-slate-50 overflow-y-auto">
          {value.map((p, i) => (
            <li key={p.questionId} className="flex items-center gap-2 px-4 py-2 text-sm">
              <span className="w-6 shrink-0 text-xs font-bold text-slate-400">{i + 1}.</span>
              <div className="min-w-0 flex-1">
                <div className="truncate">{p.stem}</div>
                <div className="text-xs text-slate-400">{p.topicName}</div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="px-1 text-slate-400 hover:text-slate-700 disabled:opacity-30" aria-label="Yukarı">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="px-1 text-slate-400 hover:text-slate-700 disabled:opacity-30" aria-label="Aşağı">↓</button>
                <button type="button" onClick={() => remove(p.questionId)} className="px-1 text-red-400 hover:text-red-600" aria-label="Çıkar">✕</button>
              </div>
            </li>
          ))}
          {value.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-500">
              Soldan soru ekle — sıralama buradan yönetilir.
            </li>
          )}
        </ol>
      </Card>
    </div>
  );
}

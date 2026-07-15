'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { CatalogModule } from '@/lib/types';

/** İçerik ağacı: Modül → Ders → Konu (Doc 9 §3). Ekle/yeniden adlandır/premium işaretle. */
export default function CatalogPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['catalog-tree'],
    queryFn: () => api<CatalogModule[]>('/admin/catalog/tree'),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['catalog-tree'] });

  const addCourse = useMutation({
    mutationFn: (moduleId: string) => {
      const name = window.prompt('Yeni ders adı:');
      if (!name) return Promise.reject(new Error('İptal edildi.'));
      return api('/admin/catalog/courses', { method: 'POST', body: { moduleId, name } });
    },
    onSuccess: invalidate,
  });

  const addTopic = useMutation({
    mutationFn: (courseId: string) => {
      const name = window.prompt('Yeni konu adı:');
      if (!name) return Promise.reject(new Error('İptal edildi.'));
      return api('/admin/catalog/topics', { method: 'POST', body: { courseId, name } });
    },
    onSuccess: invalidate,
  });

  const renameCourse = useMutation({
    mutationFn: ({ id, moduleId, current }: { id: string; moduleId: string; current: string }) => {
      const name = window.prompt('Ders adı:', current);
      if (!name || name === current) return Promise.reject(new Error('İptal edildi.'));
      return api(`/admin/catalog/courses/${id}`, { method: 'PATCH', body: { moduleId, name } });
    },
    onSuccess: invalidate,
  });

  const updateTopic = useMutation({
    mutationFn: (body: {
      id: string;
      courseId: string;
      name: string;
      isPremium: boolean;
      matchKeywords?: string[];
    }) =>
      api(`/admin/catalog/topics/${body.id}`, {
        method: 'PATCH',
        body: {
          courseId: body.courseId,
          name: body.name,
          isPremium: body.isPremium,
          // undefined bırak → backend keyword'leri korur (ad/premium değişiminde).
          ...(body.matchKeywords !== undefined ? { matchKeywords: body.matchKeywords } : {}),
        },
      }),
    onSuccess: invalidate,
  });

  const [openCourses, setOpenCourses] = useState<Record<string, boolean>>({});

  if (q.isPending) return <Spinner />;
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;

  return (
    <>
      <PageHeader title="İçerik Ağacı" subtitle="Modül → Ders → Konu hiyerarşisi" />
      <div className="space-y-6">
        {q.data.map((m) => (
          <Card key={m.id}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">
                {m.name} <span className="ml-1 text-xs font-normal text-slate-400">({m.key})</span>
              </h2>
              <button
                onClick={() => addCourse.mutate(m.id)}
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                + Ders ekle
              </button>
            </div>
            {m.courses.length === 0 && <p className="text-sm text-slate-400">Henüz ders yok.</p>}
            <ul className="space-y-2">
              {m.courses.map((c) => {
                const open = openCourses[c.id] ?? true;
                return (
                  <li key={c.id} className="rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <button
                        onClick={() => setOpenCourses((p) => ({ ...p, [c.id]: !open }))}
                        className="flex items-center gap-2 text-sm font-medium"
                      >
                        <span className="text-slate-400">{open ? '▾' : '▸'}</span>
                        {c.name}
                        <span className="text-xs font-normal text-slate-400">
                          {c.topics.length} konu
                        </span>
                      </button>
                      <div className="flex gap-3 text-xs">
                        <button
                          onClick={() => renameCourse.mutate({ id: c.id, moduleId: m.id, current: c.name })}
                          className="text-slate-500 hover:underline"
                        >
                          Yeniden adlandır
                        </button>
                        <button
                          onClick={() => addTopic.mutate(c.id)}
                          className="font-medium text-indigo-600 hover:underline"
                        >
                          + Konu
                        </button>
                      </div>
                    </div>
                    {open && c.topics.length > 0 && (
                      <ul className="divide-y divide-slate-50 border-t border-slate-100">
                        {c.topics.map((t) => (
                          <li key={t.id} className="px-4 py-2 pl-10 text-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span>{t.name}</span>
                                <span className="text-xs text-slate-400">{t.questionCount} soru</span>
                                {t.isPremium && (
                                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                                    Premium
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-3 text-xs">
                                <button
                                  onClick={() => {
                                    const cur = t.matchKeywords.join(', ');
                                    const input = window.prompt(
                                      'İçe aktarma eşleşme desenleri (virgülle ayır):\nÖrn. 657 sayılı, Devlet Memurları Kanunu',
                                      cur,
                                    );
                                    if (input !== null) {
                                      updateTopic.mutate({
                                        id: t.id,
                                        courseId: c.id,
                                        name: t.name,
                                        isPremium: t.isPremium,
                                        matchKeywords: input
                                          .split(',')
                                          .map((s) => s.trim())
                                          .filter(Boolean),
                                      });
                                    }
                                  }}
                                  className="text-indigo-600 hover:underline"
                                >
                                  Eşleşme
                                </button>
                                <button
                                  onClick={() =>
                                    updateTopic.mutate({
                                      id: t.id,
                                      courseId: c.id,
                                      name: t.name,
                                      isPremium: !t.isPremium,
                                    })
                                  }
                                  className="text-slate-500 hover:underline"
                                >
                                  {t.isPremium ? 'Ücretsiz yap' : 'Premium yap'}
                                </button>
                                <button
                                  onClick={() => {
                                    const name = window.prompt('Konu adı:', t.name);
                                    if (name && name !== t.name) {
                                      updateTopic.mutate({ id: t.id, courseId: c.id, name, isPremium: t.isPremium });
                                    }
                                  }}
                                  className="text-slate-500 hover:underline"
                                >
                                  Yeniden adlandır
                                </button>
                              </div>
                            </div>
                            {t.matchKeywords.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {t.matchKeywords.map((k) => (
                                  <span
                                    key={k}
                                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500"
                                  >
                                    {k}
                                  </span>
                                ))}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}
      </div>
    </>
  );
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import type { CatalogModule, ContentStatus, Paged, QuestionListItem } from '@/lib/types';

/** Kaynak etiketi gösterim anahtarı — kullanıcı uygulamalarında "Kaynak: ..."
 *  satırını açar/kapar (~1 dk içinde yansır; SettingsService önbelleği). */
function SourceToggle() {
  const qc = useQueryClient();
  const settings = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api<{ showQuestionSource: boolean }>('/admin/settings'),
  });
  const update = useMutation({
    mutationFn: (v: boolean) =>
      api<{ showQuestionSource: boolean }>('/admin/settings', {
        method: 'PATCH',
        body: { showQuestionSource: v },
      }),
    onSuccess: (r) => qc.setQueryData(['admin-settings'], r),
  });
  const on = settings.data?.showQuestionSource ?? true;
  return (
    <label
      className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
      title="Açıkken kullanıcılar cevap incelemesinde sorunun kaynağını (örn. hangi sınavdan geldiğini) görür."
    >
      <input
        type="checkbox"
        checked={on}
        disabled={settings.isLoading || update.isPending}
        onChange={(e) => update.mutate(e.target.checked)}
      />
      Kaynak etiketini kullanıcıya göster
    </label>
  );
}

/** Soru listesi (Doc 9 §4.1): filtre (durum/konu/arama) + sayfalama. */
export default function QuestionsPage() {
  const [status, setStatus] = useState<ContentStatus | ''>('');
  const [topicId, setTopicId] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const tree = useQuery({
    queryKey: ['catalog-tree'],
    queryFn: () => api<CatalogModule[]>('/admin/catalog/tree'),
  });

  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (topicId) params.set('topicId', topicId);
  if (search) params.set('search', search);
  params.set('page', String(page));

  const q = useQuery({
    queryKey: ['questions', status, topicId, search, page],
    queryFn: () => api<Paged<QuestionListItem>>(`/admin/questions?${params}`),
  });

  const totalPages = q.data ? Math.max(1, Math.ceil(q.data.total / q.data.pageSize)) : 1;

  return (
    <>
      <PageHeader
        title="Sorular"
        subtitle="Sürümlü soru bankası — düzenleme yayındakini bozmaz"
        action={
          <div className="flex gap-2">
            <SourceToggle />
            <Link
              href="/questions/import"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              ⬆ İçe Aktar
            </Link>
            <Link
              href="/questions/new"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              + Yeni Soru
            </Link>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput);
            setPage(1);
          }}
        >
          <input
            placeholder="Soru kökünde ara…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
        </form>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ContentStatus | '');
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Tüm durumlar</option>
          <option value="draft">Taslak</option>
          <option value="in_review">İncelemede</option>
          <option value="published">Yayında</option>
          <option value="archived">Arşiv</option>
        </select>
        <select
          value={topicId}
          onChange={(e) => {
            setTopicId(e.target.value);
            setPage(1);
          }}
          className="max-w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm"
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

      {q.isPending ? (
        <Spinner />
      ) : q.isError ? (
        <ErrorBox error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <>
          <Card className="p-0">
            <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                  <th className="px-5 py-3 font-medium">Soru</th>
                  <th className="px-3 py-3 font-medium">Konu</th>
                  <th className="px-3 py-3 font-medium">Durum</th>
                  <th className="px-3 py-3 font-medium">Sürüm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {q.data.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="max-w-md px-5 py-3">
                      <Link href={`/questions/${item.id}`} className="block truncate font-medium text-indigo-700 hover:underline">
                        {item.latestVersion?.stem ?? '(boş)'}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {item.courseName} / {item.topicName}
                    </td>
                    <td className="px-3 py-3">
                      {item.latestVersion && <StatusBadge status={item.latestVersion.status} />}
                    </td>
                    <td className="px-3 py-3 text-slate-500">
                      v{item.latestVersion?.versionNo ?? '-'}
                      {item.publishedVersionNo != null && item.publishedVersionNo !== item.latestVersion?.versionNo
                        ? ` (yayında v${item.publishedVersionNo})`
                        : ''}
                    </td>
                  </tr>
                ))}
                {q.data.items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                      Filtreye uyan soru yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table></div>
          </Card>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>{q.data.total} soru</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              >
                ← Önceki
              </button>
              <span>
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              >
                Sonraki →
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

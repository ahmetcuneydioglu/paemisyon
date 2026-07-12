'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { Paged, QuestionListItem } from '@/lib/types';

interface ReviewTopicSummary {
  topicId: string;
  topicName: string;
  courseName: string;
  count: number;
}

interface BulkApproveResult {
  topicName: string;
  approved: number;
  skipped: { questionId: string; reason: string }[];
}

/** Onay kuyruğu (Doc 9 §4.3): konu kartları + toplu onay (admin) + tekil inceleme. */
export default function ReviewQueuePage() {
  const qc = useQueryClient();
  const [me, setMe] = useState<{ roles: string[] } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('');

  useEffect(() => {
    api<{ roles: string[] }>('/me').then(setMe).catch(() => setMe({ roles: [] }));
  }, []);
  const isAdmin = me?.roles.includes('admin') ?? false;

  const summary = useQuery({
    queryKey: ['review-summary'],
    queryFn: () => api<ReviewTopicSummary[]>('/admin/review/summary'),
  });

  const list = useQuery({
    queryKey: ['review-queue', selectedTopic],
    queryFn: () =>
      api<Paged<QuestionListItem>>(
        `/admin/questions?status=in_review${selectedTopic ? `&topicId=${selectedTopic}` : ''}`,
      ),
  });

  const bulk = useMutation({
    mutationFn: (topicId: string) =>
      api<BulkApproveResult>('/admin/questions/bulk-approve', {
        method: 'POST',
        body: { topicId },
      }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['review-summary'] });
      qc.invalidateQueries({ queryKey: ['review-queue'] });
      qc.invalidateQueries({ queryKey: ['questions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setNotice(
        `✅ "${r.topicName}": ${r.approved} soru yayınlandı${
          r.skipped.length > 0 ? `, ${r.skipped.length} soru atlandı (doğru şık eksik)` : ''
        }.`,
      );
    },
  });

  function confirmBulk(t: ReviewTopicSummary) {
    const ok = window.confirm(
      `"${t.courseName} / ${t.topicName}" konusundaki ${t.count} sorunun TAMAMI yayına alınacak.\n\n` +
        'Örneklem kontrolü yaptıysan devam et. Bu işlem soruları uygulamada anında görünür yapar.',
    );
    if (ok) bulk.mutate(t.topicId);
  }

  return (
    <>
      <PageHeader
        title="Onay Kuyruğu"
        subtitle="İncelemede bekleyen sorular — onaylanmadan yayına çıkmaz"
      />

      {notice && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}
      {bulk.isError && (
        <div className="mb-4">
          <ErrorBox error={bulk.error} />
        </div>
      )}

      {/* ── Konu kartları + toplu onay ── */}
      {summary.isPending ? (
        <Spinner />
      ) : summary.isError ? (
        <ErrorBox error={summary.error} onRetry={() => summary.refetch()} />
      ) : summary.data.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">🎉 Kuyruk boş — onay bekleyen soru yok.</p>
        </Card>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {summary.data.map((t) => (
            <Card key={t.topicId} className="flex flex-col justify-between">
              <div>
                <div className="text-xs text-slate-400">{t.courseName}</div>
                <div className="font-medium">{t.topicName}</div>
                <div className="mt-1 text-sm text-slate-500">{t.count} soru bekliyor</div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setSelectedTopic(selectedTopic === t.topicId ? '' : t.topicId)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                >
                  {selectedTopic === t.topicId ? 'Filtreyi kaldır' : 'Listede göster'}
                </button>
                {isAdmin && (
                  <button
                    onClick={() => confirmBulk(t)}
                    disabled={bulk.isPending}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {bulk.isPending && bulk.variables === t.topicId
                      ? 'Yayınlanıyor…'
                      : 'Tümünü Onayla'}
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Tekil inceleme listesi ── */}
      {list.data && list.data.items.length > 0 && (
        <>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Tek tek incele{selectedTopic ? ' (filtreli)' : ''} — {list.data.total} soru
          </h2>
          <Card className="p-0">
            <ul className="divide-y divide-slate-100">
              {list.data.items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/questions/${item.id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {item.latestVersion?.stem}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {item.courseName} / {item.topicName} · v{item.latestVersion?.versionNo}
                      </div>
                    </div>
                    <span className="ml-4 shrink-0 text-sm text-indigo-600">İncele →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </>
  );
}

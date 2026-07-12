'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { Paged, QuestionListItem } from '@/lib/types';

/** Onay kuyruğu (Doc 9 §4.3): in_review sorular — mevzuat güvencesinin kapısı. */
export default function ReviewQueuePage() {
  const q = useQuery({
    queryKey: ['review-queue'],
    queryFn: () => api<Paged<QuestionListItem>>('/admin/questions?status=in_review'),
  });

  if (q.isPending) return <Spinner />;
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;

  return (
    <>
      <PageHeader
        title="Onay Kuyruğu"
        subtitle="İncelemede bekleyen sorular — onaylanmadan yayına çıkmaz"
      />
      {q.data.items.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">🎉 Kuyruk boş — onay bekleyen soru yok.</p>
        </Card>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-slate-100">
            {q.data.items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/questions/${item.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{item.latestVersion?.stem}</div>
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
      )}
    </>
  );
}

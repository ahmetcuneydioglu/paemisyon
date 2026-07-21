'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { AuditEntry, Paged } from '@/lib/types';

/** İşlem kayıtları (Doc 9 §6): kim, neyi, ne zaman — salt-okur. */
export default function AuditPage() {
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ['audit', page],
    queryFn: () => api<Paged<AuditEntry>>(`/admin/audit?page=${page}`),
  });

  if (q.isPending) return <Spinner />;
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;

  const totalPages = Math.max(1, Math.ceil(q.data.total / q.data.pageSize));

  return (
    <>
      <PageHeader title="İşlem Kayıtları" subtitle="Tüm admin/editör işlemlerinin izi (salt-okur)" />
      <Card className="p-0">
        <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
              <th className="px-5 py-3 font-medium">Zaman</th>
              <th className="px-3 py-3 font-medium">Kim</th>
              <th className="px-3 py-3 font-medium">İşlem</th>
              <th className="px-3 py-3 font-medium">Nesne</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {q.data.items.map((a) => (
              <tr key={a.id}>
                <td className="whitespace-nowrap px-5 py-2.5 text-xs text-slate-500">
                  {new Date(a.createdAt).toLocaleString('tr-TR')}
                </td>
                <td className="px-3 py-2.5">{a.actorEmail}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{a.action}</td>
                <td className="px-3 py-2.5 text-xs text-slate-500">
                  {a.entityType}
                  {a.entityId ? ` · ${a.entityId.slice(0, 8)}…` : ''}
                </td>
              </tr>
            ))}
            {q.data.items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                  Kayıt yok.
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
      </Card>
      <div className="mt-4 flex items-center justify-end gap-2 text-sm text-slate-500">
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
    </>
  );
}

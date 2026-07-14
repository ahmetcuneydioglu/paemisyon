'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, ErrorBox, PageHeader, Spinner, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import type { AdminExamListItem } from '@/lib/types';

/** Denemeler (Doc 18 §8): randevulu canlı deneme yönetimi. */
export default function ExamsPage() {
  const q = useQuery({
    queryKey: ['admin-exams'],
    queryFn: () => api<AdminExamListItem[]>('/admin/exams'),
  });

  return (
    <>
      <PageHeader
        title="Denemeler"
        subtitle="Randevulu canlı deneme sınavları — yayınlanmadan webde görünmez"
        action={
          <Link
            href="/exams/new"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Yeni Deneme
          </Link>
        }
      />

      {q.isPending ? (
        <Spinner />
      ) : q.isError ? (
        <ErrorBox error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="px-5 py-3 font-medium">Deneme</th>
                <th className="px-3 py-3 font-medium">Tarih / Saat</th>
                <th className="px-3 py-3 font-medium">Süre</th>
                <th className="px-3 py-3 font-medium">Soru</th>
                <th className="px-3 py-3 font-medium">Katılım</th>
                <th className="px-3 py-3 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {q.data.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link
                      href={`/exams/${e.id}`}
                      className="font-medium text-indigo-700 hover:underline"
                    >
                      {e.title}
                    </Link>
                    {e.isPremium && (
                      <span className="ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-xs font-medium text-violet-700">
                        Premium
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {new Date(e.startAt).toLocaleString('tr-TR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="px-3 py-3">{e.durationMinutes} dk</td>
                  <td className="px-3 py-3">{e.questionCount}</td>
                  <td className="px-3 py-3">{e.attemptCount}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={e.status} />
                  </td>
                </tr>
              ))}
              {q.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    Henüz deneme yok — &quot;+ Yeni Deneme&quot; ile başla.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

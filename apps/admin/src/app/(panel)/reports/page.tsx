'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Card, ErrorBox, HubBadge, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';

interface ReportItem {
  id: string;
  questionId: string;
  stem: string;
  topicName: string;
  courseName: string;
  message: string;
  reporterEmail: string;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: string;
  /** Soru Merkezi sorusu (Doc 55 F3): iletim durumu; null = PAEMİSYON sorusu. */
  hub: {
    code: string | null;
    forwardedAt: string | null;
    flagged: boolean | null;
    error: string | null;
    tries: number;
  } | null;
}
interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Merkez iletim durumu satırı (Doc 55 F3): iletildi / incelemede / bekliyor / iletilemedi. */
function HubForwardState({ hub }: { hub: NonNullable<ReportItem['hub']> }) {
  const base = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium';
  if (hub.forwardedAt) {
    return hub.flagged ? (
      <span className={`${base} bg-violet-50 text-violet-800`} title="Merkez eşiği aşıldı; soru merkezde inceleme listesinde.">
        Merkezde incelemede
      </span>
    ) : (
      <span className={`${base} bg-emerald-50 text-emerald-700`} title={new Date(hub.forwardedAt).toLocaleString('tr-TR')}>
        Merkeze iletildi
      </span>
    );
  }
  if (hub.error) {
    return (
      <span className={`${base} bg-red-50 text-red-700`} title={`${hub.tries}. deneme: ${hub.error}`}>
        Merkeze iletilemedi
      </span>
    );
  }
  return <span className={`${base} bg-slate-100 text-slate-600`}>Merkeze iletim bekliyor</span>;
}

/** Soru hata bildirimleri: kullanıcı kalite döngüsü (özellikle eski içerik için). */
export default function ReportsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<'open' | 'resolved' | 'dismissed'>('open');
  const [page, setPage] = useState(1);

  const q = useQuery({
    queryKey: ['reports', status, page],
    queryFn: () => api<Paged<ReportItem>>(`/admin/reports?status=${status}&page=${page}`),
  });

  const setReportStatus = useMutation({
    mutationFn: ({ id, s }: { id: string; s: 'resolved' | 'dismissed' }) =>
      api(`/admin/reports/${id}/status`, { method: 'POST', body: { status: s } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });

  const totalPages = q.data ? Math.max(1, Math.ceil(q.data.total / q.data.pageSize)) : 1;

  return (
    <>
      <PageHeader
        title="Soru Bildirimleri"
        subtitle="Kullanıcıların bildirdiği soru hataları — düzelt, çöz olarak işaretle"
      />

      <div className="mb-4 flex gap-2">
        {(['open', 'resolved', 'dismissed'] as const).map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              status === s ? 'bg-indigo-600 text-white' : 'border border-slate-300 text-slate-600'
            }`}
          >
            {s === 'open' ? 'Açık' : s === 'resolved' ? 'Çözüldü' : 'Yok sayıldı'}
          </button>
        ))}
      </div>

      {setReportStatus.isError && (
        <div className="mb-4">
          <ErrorBox error={setReportStatus.error} />
        </div>
      )}

      {q.isPending ? (
        <Spinner />
      ) : q.isError ? (
        <ErrorBox error={q.error} onRetry={() => q.refetch()} />
      ) : q.data.items.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">
            {status === 'open' ? '🎉 Açık bildirim yok.' : 'Bu durumda bildirim yok.'}
          </p>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {q.data.items.map((r) => (
              <Card key={r.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/questions/${r.questionId}`}
                      className="block truncate text-sm font-medium text-indigo-700 hover:underline"
                    >
                      {r.stem}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <span>
                        {r.courseName} / {r.topicName}
                      </span>
                      {r.hub && (
                        <>
                          {r.hub.code && <HubBadge code={r.hub.code} size="xs" />}
                          <HubForwardState hub={r.hub} />
                        </>
                      )}
                    </div>
                    <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      💬 {r.message}
                    </p>
                    {r.hub && (
                      <p className="mt-1 text-xs text-sky-800">
                        Düzeltme Soru Merkezi&apos;nde yapılır; yeni sürüm senkronla gelir. Burada yalnız
                        bildirimi kapatırsın.
                      </p>
                    )}
                    <div className="mt-1 text-xs text-slate-400">
                      {r.reporterEmail} · {new Date(r.createdAt).toLocaleString('tr-TR')}
                    </div>
                  </div>
                  {status === 'open' && (
                    <div className="flex shrink-0 flex-col gap-2">
                      <button
                        onClick={() => setReportStatus.mutate({ id: r.id, s: 'resolved' })}
                        disabled={setReportStatus.isPending}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        ✓ Çözüldü
                      </button>
                      <button
                        onClick={() => setReportStatus.mutate({ id: r.id, s: 'dismissed' })}
                        disabled={setReportStatus.isPending}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Yok say
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>{q.data.total} bildirim</span>
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

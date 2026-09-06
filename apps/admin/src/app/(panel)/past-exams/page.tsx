'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, ErrorBox, PageHeader, Spinner, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import type { AdminPastExamListItem } from '@/lib/types';

/** Tür rozeti — public sayfadaki rozetin panel karşılığı (Doc 36 §1). */
function KindBadge({ kind }: { kind: AdminPastExamListItem['kind'] }) {
  const resmi = kind === 'resmi';
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-xs font-medium ${
        resmi ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'
      }`}
      title={
        resmi
          ? 'Kurumun yayımladığı gerçek kitapçık'
          : 'Sınav yayımlanmadı; yalnız aday hatırlatmasından çıkarılmış konu dağılımı'
      }
    >
      {resmi ? 'Çıkmış sınav' : 'Konu analizi'}
    </span>
  );
}

/** Çıkmış sınav vitrini (Doc 36): dönemler, yayın durumu, public soru sayısı. */
export default function PastExamsPage() {
  const q = useQuery({
    queryKey: ['admin-past-exams'],
    queryFn: () => api<AdminPastExamListItem[]>('/admin/past-exams'),
  });

  return (
    <>
      <PageHeader
        title="Çıkmış Sınavlar"
        subtitle="paemisyon.com/paem-cikmis-sorular vitrini — yayınlanmayan dönem sitede görünmez"
      />

      {q.isPending ? (
        <Spinner />
      ) : q.isError ? (
        <ErrorBox error={q.error} onRetry={() => q.refetch()} />
      ) : q.data.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">Henüz çıkmış sınav kaydı yok.</p>
        </Card>
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                  <th className="px-5 py-3 font-medium">Dönem</th>
                  <th className="px-3 py-3 font-medium">Tür</th>
                  <th className="px-3 py-3 font-medium">Soru</th>
                  <th className="px-3 py-3 font-medium">Sitede açık</th>
                  <th className="px-3 py-3 font-medium">Hazır</th>
                  <th className="px-3 py-3 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {q.data.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/past-exams/${s.id}`}
                        className="font-medium text-indigo-700 hover:underline"
                      >
                        {s.name}
                      </Link>
                      <div className="text-xs text-slate-400">/{s.slug}</div>
                    </td>
                    <td className="px-3 py-3">
                      <KindBadge kind={s.kind} />
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {s.kind === 'analiz' ? (
                        <span className="text-slate-400">— (konu analizi)</span>
                      ) : (
                        <>
                          {s.linked}
                          {s.cancelledCount > 0 && (
                            <span className="ml-1 text-xs text-slate-400">
                              ({s.cancelledCount} iptal)
                            </span>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {s.publicCount}
                      {/* Public işaretli ama sürümü yayında değilse sayfada görünmez —
                          sessiz kalmak yerine panelde uyarı gösterilir. */}
                      {s.publicNotLive > 0 && (
                        <span
                          className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700"
                          title="Bu sorular public işaretli ama sürümleri onay kuyruğunda; sitede görünmüyorlar."
                        >
                          {s.publicNotLive} yayında değil
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {s.kind === 'analiz' ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <span title="Yayında ve açıklaması olan soru sayısı">
                          {s.readyCount}/{s.linked}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}

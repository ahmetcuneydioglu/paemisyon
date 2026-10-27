'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, ErrorBox, PageHeader, Spinner, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import { VERIFICATION_LABEL, type ArticleSummaryList } from '@/lib/types';

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('tr-TR', { dateStyle: 'medium' }) : '—');

/** Bir kanunun maddeleri + özet durumu: özetsiz maddeler de listede (kapsama boşluğu görünsün). */
export default function ArticleSummaryLawPage() {
  const { slug } = useParams<{ slug: string }>();
  const q = useQuery({ queryKey: ['admin-article-summaries-law', slug], queryFn: () => api<ArticleSummaryList>(`/admin/article-summaries/law/${slug}`) });
  const d = q.data;
  const summarized = d?.articles.filter((a) => a.summary).length ?? 0;
  return (
    <div>
      <PageHeader
        title={d?.law.name ?? 'Madde özetleri'}
        subtitle={d ? `${d.articles.length} madde · ${summarized} özetli · ${d.articles.filter((a) => a.summary?.status === 'published').length} yayında` : ''}
        action={
          <Link href="/article-summaries" className="text-sm text-slate-600 hover:underline">
            ← Madde Özetleri
          </Link>
        }
      />
      {q.isLoading && <Spinner />}
      {q.error && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {d && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="py-1 pr-3 font-medium">Madde</th>
                  <th className="py-1 pr-3 font-medium">Özet</th>
                  <th className="py-1 pr-3 font-medium">Durum</th>
                  <th className="py-1 pr-3 font-medium">Mevzuat kontrolü</th>
                  <th className="py-1 pr-3 font-medium">Soru</th>
                  <th className="py-1 pr-3 font-medium">Güncellendi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {d.articles.map((a) => (
                  <tr key={a.lawArticleId} className={`hover:bg-slate-50 ${a.summary?.staleSince ? 'bg-red-50/40' : ''}`}>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <span className="font-medium">md {a.no}</span>
                      {a.articleTitle && <span className="ml-2 text-xs text-slate-500">{a.articleTitle}</span>}
                    </td>
                    <td className="min-w-[16rem] py-2 pr-3">
                      {a.summary ? (
                        <>
                          <Link href={`/article-summaries/${a.summary.id}`} className="font-medium hover:underline">
                            {a.summary.title}
                          </Link>
                          <div className="text-xs text-slate-500">
                            v{a.summary.version}
                            {a.summary.repealed ? ' · mülga kaydı' : ''}
                            <span className="ml-2 rounded bg-violet-50 px-1.5 py-0.5 text-violet-700">{a.summary.sourceLabel}</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">özet yok</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {a.summary ? (
                        <>
                          <StatusBadge status={a.summary.status} />
                          {a.summary.staleSince && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">eskimiş</span>}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap text-xs">
                      {a.summary ? (
                        <span className={a.summary.verificationStatus === 'verified' ? 'text-emerald-700' : a.summary.verificationStatus === 'needs_refresh' ? 'text-red-700' : 'text-amber-700'}>
                          {VERIFICATION_LABEL[a.summary.verificationStatus]}
                          {a.summary.verifiedAt ? ` · ${fmt(a.summary.verifiedAt)}` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400">metin {fmt(a.textVerifiedAt)}</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{a.questionCount}</td>
                    <td className="py-2 pr-3 whitespace-nowrap text-xs text-slate-500">{a.summary ? fmt(a.summary.updatedAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

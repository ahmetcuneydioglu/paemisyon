'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import { VERIFICATION_LABEL, type ArticleSummaryList } from '@/lib/types';

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('tr-TR', { dateStyle: 'medium' }) : '—');

interface PublishManyResult {
  published: { id: string; articleNo: string }[];
  skipped: { id: string; articleNo: string; reason: string }[];
  /** Web önbelleği yenilemesinin sonucu (tek paket): başarısızsa neden (ör. Vercel Firewall 429). */
  web: string;
  webOk: boolean;
}

/**
 * Bir kanunun maddeleri + özet durumu: özetsiz maddeler de listede (kapsama boşluğu görünsün).
 * Toplu yayın (admin): satır seç → "Seçilileri yayınla", ya da incelemedeki uygun olanların tümü. Sunucu her
 * özeti tek tek aynı kapıdan geçirir; eskimiş/kusurlu/tazeleme gerekli olanı atlar ve nedenini döner.
 */
export default function ArticleSummaryLawPage() {
  const { slug } = useParams<{ slug: string }>();
  const qc = useQueryClient();
  const [me, setMe] = useState<{ roles: string[] } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  useEffect(() => {
    api<{ roles: string[] }>('/me').then(setMe).catch(() => setMe({ roles: [] }));
  }, []);
  const isAdmin = me?.roles.includes('admin') ?? false;

  const q = useQuery({ queryKey: ['admin-article-summaries-law', slug], queryFn: () => api<ArticleSummaryList>(`/admin/article-summaries/law/${slug}`) });
  const d = q.data;
  const summarized = d?.articles.filter((a) => a.summary).length ?? 0;
  // Yayına aday: incelemede, eskimemiş, tazeleme gerekmeyen. Kusur kontrolü sunucuda (atlanır, nedeniyle döner).
  const candidates = (d?.articles ?? []).filter((a) => a.summary && a.summary.status !== 'published' && !a.summary.staleSince && a.summary.verificationStatus !== 'needs_refresh');
  const selectable = candidates.map((a) => a.summary!.id);

  const publishMany = useMutation({
    mutationFn: (ids: string[]) => api<PublishManyResult>('/admin/article-summaries/publish-many', { method: 'POST', body: { ids } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['admin-article-summaries-law', slug] });
      qc.invalidateQueries({ queryKey: ['admin-article-summaries-laws'] });
      setSelected(new Set());
      const skipped = r.skipped.length ? `\nAtlanan ${r.skipped.length}: ${r.skipped.map((x) => `md ${x.articleNo} (${x.reason.split('\n')[0]})`).join('; ')}` : '';
      const web = r.published.length && !r.webOk ? `\nWeb: ${r.web}` : '';
      setNotice({ kind: r.published.length && r.webOk ? 'ok' : 'err', text: `Yayınlanan ${r.published.length}: ${r.published.map((x) => `md ${x.articleNo}`).join(', ') || '—'}.${skipped}${web}` });
    },
    onError: (e: unknown) => setNotice({ kind: 'err', text: e instanceof Error ? e.message : 'Toplu yayın başarısız.' }),
  });
  const revalidate = useMutation({
    mutationFn: () => api<{ paths: number }>(`/admin/article-summaries/law/${slug}/revalidate-web`, { method: 'POST' }),
    onSuccess: (r) => setNotice({ kind: 'ok', text: `Web önbelleği tazelendi: ${r.paths} sayfa (madde sayfaları + okuyucu).` }),
    onError: (e: unknown) => setNotice({ kind: 'err', text: e instanceof Error ? e.message : 'Yenileme başarısız.' }),
  });
  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const allSelected = selectable.length > 0 && selectable.every((id) => selected.has(id));
  return (
    <div>
      <PageHeader
        title={d?.law.name ?? 'Madde özetleri'}
        subtitle={d ? `${d.articles.length} madde · ${summarized} özetli · ${d.articles.filter((a) => a.summary?.status === 'published').length} yayında` : ''}
        action={
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => revalidate.mutate()}
                disabled={revalidate.isPending}
                title="Girişsiz madde sayfaları günde bir, okuyucu saatte bir yenilenir; bu düğme beklemeden tazeler."
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
              >
                {revalidate.isPending ? 'Tazeleniyor…' : 'Web önbelleğini tazele'}
              </button>
            )}
            <Link href="/article-summaries" className="text-sm text-slate-600 hover:underline">
              ← Madde Özetleri
            </Link>
          </div>
        }
      />
      {notice && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm whitespace-pre-line ${notice.kind === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {notice.text}
          <button onClick={() => setNotice(null)} className="ml-3 underline">
            kapat
          </button>
        </div>
      )}

      {isAdmin && d && candidates.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
          <span className="text-slate-600">
            {selected.size > 0 ? `${selected.size} seçili` : `${candidates.length} özet yayına aday`}
          </span>
          <button
            onClick={() => publishMany.mutate([...selected])}
            disabled={selected.size === 0 || publishMany.isPending}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 font-medium text-white disabled:opacity-50"
          >
            {publishMany.isPending ? 'Yayınlanıyor…' : 'Seçilileri yayınla'}
          </button>
          <button
            onClick={() => confirm(`İncelemedeki ${candidates.length} özetin tamamı yayınlansın mı? Kusurlu olanlar sunucuda atlanır.`) && publishMany.mutate(selectable)}
            disabled={publishMany.isPending}
            className="rounded-lg border border-emerald-600 px-3 py-1.5 font-medium text-emerald-700 disabled:opacity-50"
          >
            Uygun olanların tümünü yayınla ({candidates.length})
          </button>
          <span className="text-xs text-slate-400">Yayın madde bazında denetlenir: eskimiş, kusurlu ya da tazeleme bekleyen özet yayınlanmaz.</span>
        </div>
      )}

      {q.isLoading && <Spinner />}
      {q.error && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {d && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  {isAdmin && (
                    <th className="py-1 pr-2">
                      <input
                        type="checkbox"
                        aria-label="Yayına aday özetlerin tümünü seç"
                        checked={allSelected}
                        disabled={selectable.length === 0}
                        onChange={(e) => setSelected(e.target.checked ? new Set(selectable) : new Set())}
                      />
                    </th>
                  )}
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
                    {isAdmin && (
                      <td className="py-2 pr-2">
                        {a.summary && selectable.includes(a.summary.id) ? (
                          <input type="checkbox" aria-label={`md ${a.no} seç`} checked={selected.has(a.summary.id)} onChange={() => toggle(a.summary!.id)} />
                        ) : null}
                      </td>
                    )}
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

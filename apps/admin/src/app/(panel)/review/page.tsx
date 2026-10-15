'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { SOURCE_KIND_LABEL, type Paged, type QuestionListItem, type SourceKind } from '@/lib/types';

interface ReviewTopicSummary {
  topicId: string;
  topicName: string;
  courseName: string;
  count: number;
  /** Kaynak türü kırılımı (Doc 49 A0): sentetik soru gerçek sorudan ayrı sayılır. */
  byKind: Record<SourceKind, number>;
}

interface BulkApproveResult {
  topicName: string;
  approved: number;
  skipped: { questionId: string; reason: string }[];
  /** Sentetik olduğu için toplu onayın atladığı soru sayısı. */
  syntheticSkipped: number;
}

const KIND_ORDER: SourceKind[] = ['gercek', 'turetim', 'ai', 'yok'];
const KIND_BADGE: Record<SourceKind, string> = {
  gercek: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  turetim: 'bg-violet-50 text-violet-700 border-violet-200',
  ai: 'bg-violet-50 text-violet-700 border-violet-200',
  yok: 'bg-slate-100 text-slate-600 border-slate-200',
};

function bulkNotice(baslik: string, r: BulkApproveResult): string {
  const parcalar = [`${r.approved} soru yayınlandı`];
  if (r.syntheticSkipped > 0) parcalar.push(`${r.syntheticSkipped} sentetik soru atlandı (tek tek incele)`);
  const digerAtlanan = r.skipped.length - r.syntheticSkipped;
  if (digerAtlanan > 0) parcalar.push(`${digerAtlanan} soru atlandı (doğru şık eksik)`);
  return `✅ ${baslik}: ${parcalar.join(', ')}.`;
}

/** Onay kuyruğu (Doc 9 §4.3): konu kartları + toplu onay (admin) + tekil inceleme. */
export default function ReviewQueuePage() {
  const qc = useQueryClient();
  const [me, setMe] = useState<{ roles: string[] } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [kind, setKind] = useState<SourceKind | ''>('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  useEffect(() => {
    api<{ roles: string[] }>('/me').then(setMe).catch(() => setMe({ roles: [] }));
  }, []);
  const isAdmin = me?.roles.includes('admin') ?? false;

  const summary = useQuery({
    queryKey: ['review-summary'],
    queryFn: () => api<ReviewTopicSummary[]>('/admin/review/summary'),
  });

  const list = useQuery({
    queryKey: ['review-queue', selectedTopic, kind, page],
    queryFn: () =>
      api<Paged<QuestionListItem>>(
        `/admin/questions?status=in_review&page=${page}&pageSize=${PAGE_SIZE}` +
          (selectedTopic ? `&topicId=${selectedTopic}` : '') +
          (kind ? `&sourceKind=${kind}` : ''),
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
      setNotice(bulkNotice(`"${r.topicName}"`, r));
    },
  });

  // Tüm kuyruk (tüm konular) tek tıkla — topicId'siz bulk-approve.
  const bulkAll = useMutation({
    mutationFn: () =>
      api<BulkApproveResult>('/admin/questions/bulk-approve', {
        method: 'POST',
        body: {},
      }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['review-summary'] });
      qc.invalidateQueries({ queryKey: ['review-queue'] });
      qc.invalidateQueries({ queryKey: ['questions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setNotice(bulkNotice('Tüm kuyruk', r));
    },
  });

  // Toplu RET: yalnız kuyruktaki (in_review) sürümler draft'a döner —
  // yayındaki sorulara dokunmaz, soru silmez (geri alınabilir).
  const bulkRejectAll = useMutation({
    mutationFn: () =>
      api<{ rejected: number }>('/admin/questions/bulk-reject', {
        method: 'POST',
        body: {},
      }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['review-summary'] });
      qc.invalidateQueries({ queryKey: ['review-queue'] });
      qc.invalidateQueries({ queryKey: ['questions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setNotice(`🚫 Tüm kuyruk reddedildi: ${r.rejected} soru taslağa döndü.`);
    },
  });

  function confirmBulkRejectAll() {
    const ok = window.confirm(
      `Onay kuyruğundaki TÜM ${totalCount} soru REDDEDİLECEK (taslağa dönecek).\n\n` +
        'Yayındaki sorulara dokunulmaz, soru silinmez — taslaklar gerekirse ' +
        'tek tek düzeltilip yeniden kuyruğa gönderilebilir. Devam edilsin mi?',
    );
    if (ok) bulkRejectAll.mutate();
  }

  const sentetik = (t: { byKind: Record<SourceKind, number> }) => t.byKind.ai + t.byKind.turetim;

  function confirmBulk(t: ReviewTopicSummary) {
    const gercek = t.count - sentetik(t);
    const ok = window.confirm(
      `"${t.courseName} / ${t.topicName}": ${gercek} gerçek kaynaklı soru yayına alınacak.\n\n` +
        (sentetik(t) > 0
          ? `${sentetik(t)} sentetik soru (AI üretimi / mevzuat türetimi) ATLANIR; onlar tek tek incelenir.\n\n`
          : '') +
        'Örneklem kontrolü yaptıysan devam et. Bu işlem soruları uygulamada anında görünür yapar.',
    );
    if (ok) bulk.mutate(t.topicId);
  }

  const totalCount = summary.data?.reduce((sum, t) => sum + t.count, 0) ?? 0;
  const totalByKind = (summary.data ?? []).reduce<Record<SourceKind, number>>(
    (acc, t) => {
      for (const k of KIND_ORDER) acc[k] += t.byKind[k];
      return acc;
    },
    { gercek: 0, turetim: 0, ai: 0, yok: 0 },
  );
  const totalSentetik = totalByKind.ai + totalByKind.turetim;
  function confirmBulkAll() {
    const ok = window.confirm(
      `Onay kuyruğundaki ${totalCount - totalSentetik} gerçek kaynaklı soru (tüm konular) yayına alınacak.\n\n` +
        (totalSentetik > 0
          ? `${totalSentetik} sentetik soru ATLANIR; onlar tek tek incelenir.\n\n`
          : '') +
        'Bu işlem soruları uygulamada anında görünür yapar. Devam edilsin mi?',
    );
    if (ok) bulkAll.mutate();
  }

  return (
    <>
      <PageHeader
        title="Onay Kuyruğu"
        subtitle="İncelemede bekleyen sorular — onaylanmadan yayına çıkmaz"
        action={
          isAdmin && totalCount > 0 ? (
            <div className="flex gap-2">
              <button
                onClick={confirmBulkRejectAll}
                disabled={bulkAll.isPending || bulk.isPending || bulkRejectAll.isPending}
                className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {bulkRejectAll.isPending ? 'Reddediliyor…' : `Tümünü Reddet (${totalCount})`}
              </button>
              <button
                onClick={confirmBulkAll}
                disabled={bulkAll.isPending || bulk.isPending || bulkRejectAll.isPending}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {bulkAll.isPending ? 'Yayınlanıyor…' : `Tümünü Onayla (${totalCount})`}
              </button>
            </div>
          ) : undefined
        }
      />

      {notice && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}
      {(bulk.isError || bulkAll.isError || bulkRejectAll.isError) && (
        <div className="mb-4">
          <ErrorBox error={bulk.error ?? bulkAll.error ?? bulkRejectAll.error} />
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
                <div className="mt-1 text-sm text-slate-500">
                  {t.count} soru bekliyor
                  {sentetik(t) > 0 && (
                    <span className="ml-2 rounded border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-xs text-violet-700">
                      {sentetik(t)} sentetik
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    setSelectedTopic(selectedTopic === t.topicId ? '' : t.topicId);
                    setPage(1); // filtre değişince baştan başla
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                >
                  {selectedTopic === t.topicId ? 'Filtreyi kaldır' : 'Listede göster'}
                </button>
                {isAdmin && (
                  <button
                    onClick={() => confirmBulk(t)}
                    disabled={bulk.isPending || bulkAll.isPending}
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

      {/* ── Kaynak türü filtresi (Doc 49 A0): sentetik soru gerçek sorudan ayrı incelenir ── */}
      {totalCount > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500">Kaynak türü:</span>
          <button
            onClick={() => { setKind(''); setPage(1); }}
            className={`rounded-full border px-3 py-1 font-medium ${kind === '' ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
          >
            Tümü ({totalCount})
          </button>
          {KIND_ORDER.map((k) => (
            <button
              key={k}
              onClick={() => { setKind(k); setPage(1); }}
              className={`rounded-full border px-3 py-1 font-medium ${kind === k ? 'border-slate-800 bg-slate-800 text-white' : `${KIND_BADGE[k]} hover:opacity-80`}`}
            >
              {SOURCE_KIND_LABEL[k]} ({totalByKind[k]})
            </button>
          ))}
        </div>
      )}

      {/* ── Tekil inceleme listesi (sayfalı) ── */}
      {list.data && list.data.total === 0 && (kind || selectedTopic) && (
        <Card>
          <p className="text-sm text-slate-500">Bu filtrede bekleyen soru yok.</p>
        </Card>
      )}
      {list.data && list.data.total > 0 && (
        <>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Tek tek incele{selectedTopic || kind ? ' (filtreli)' : ''} — {list.data.total} soru
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
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>
                          {item.courseName} / {item.topicName} · v{item.latestVersion?.versionNo}
                        </span>
                        <span className={`rounded border px-1.5 py-0.5 ${KIND_BADGE[item.sourceKind]}`}>
                          {SOURCE_KIND_LABEL[item.sourceKind]}
                        </span>
                        {item.latestVersion?.sourceLabel && (
                          <span className="truncate text-slate-400">{item.latestVersion.sourceLabel}</span>
                        )}
                      </div>
                    </div>
                    <span className="ml-4 shrink-0 text-sm text-indigo-600">İncele →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          {list.data.total > PAGE_SIZE && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || list.isFetching}
                className="rounded-lg border border-slate-300 px-4 py-2 font-medium hover:bg-slate-50 disabled:opacity-40"
              >
                ← Önceki
              </button>
              <span className="text-slate-500">
                Sayfa {page} / {Math.ceil(list.data.total / PAGE_SIZE)} ·{' '}
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, list.data.total)} arası
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(list.data.total / PAGE_SIZE) || list.isFetching}
                className="rounded-lg border border-slate-300 px-4 py-2 font-medium hover:bg-slate-50 disabled:opacity-40"
              >
                Sonraki →
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

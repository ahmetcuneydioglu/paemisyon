'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { CampaignBadge, Chip, channelsText } from '@/components/notifications/ui';
import { CATEGORY_LABEL, fmtDate, fmtInt, pct, type Campaign, type CampaignStatus } from '../types';

const FILTERS: [CampaignStatus | '', string][] = [['', 'Tümü'], ['draft', 'Taslak'], ['scheduled', 'Planlı'], ['sending', 'Gönderiliyor'], ['sent', 'Gönderildi'], ['paused', 'Duraklatıldı'], ['cancelled', 'İptal']];

/** Kampanyalar (Doc 52 §12). */
export default function CampaignsPage() {
  const [status, setStatus] = useState<CampaignStatus | ''>('');
  const q = useQuery({
    queryKey: ['notif-campaigns', status],
    queryFn: () => api<{ items: Campaign[]; total: number }>(`/admin/notifications/campaigns?pageSize=100${status ? `&status=${status}` : ''}`),
    refetchInterval: 30_000,
  });
  const audience = (c: Campaign) =>
    c.audienceMode === 'all' ? 'Herkes' : c.audienceMode === 'testers' ? 'Testerlar' : c.audienceMode === 'users' ? `${c.userIds.length} kullanıcı` : c.segment?.name ?? 'Kural';
  return (
    <div>
      <PageHeader
        title="Kampanyalar"
        subtitle={q.data ? `${q.data.total} kampanya` : 'Elle hazırlanan bildirimler'}
        action={<Link href="/notifications/new" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">+ Yeni bildirim</Link>}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map(([k, l]) => (
          <Chip key={k} label={l} selected={status === k} onClick={() => setStatus(k)} />
        ))}
      </div>
      {q.isPending ? <Spinner /> : q.isError ? <ErrorBox error={q.error} onRetry={() => q.refetch()} /> : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                  <th className="px-5 py-3 font-medium">Ad</th>
                  <th className="px-3 py-3 font-medium">Kategori</th>
                  <th className="px-3 py-3 font-medium">Kanal</th>
                  <th className="px-3 py-3 font-medium">Kitle</th>
                  <th className="px-3 py-3 font-medium">Durum</th>
                  <th className="px-3 py-3 font-medium">Zaman</th>
                  <th className="px-3 py-3 text-right font-medium">Gönd.</th>
                  <th className="px-3 py-3 text-right font-medium">Bastırılan</th>
                  <th className="px-3 py-3 text-right font-medium">Başarısız</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {q.data.items.length === 0 && (
                  <tr><td colSpan={9} className="px-5 py-8 text-center text-slate-500">Kampanya yok.</td></tr>
                )}
                {q.data.items.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link href={`/notifications/campaigns/${c.id}`} className="font-medium text-indigo-700 hover:underline">{c.name}</Link>
                      <div className="text-xs text-slate-400">{c.variant?.title}</div>
                    </td>
                    <td className="px-3 py-3">{CATEGORY_LABEL[c.category]}</td>
                    <td className="px-3 py-3 text-slate-600">{channelsText(c.channels)}</td>
                    <td className="px-3 py-3 text-slate-600">{audience(c)}{c.estimatedRecipients != null ? ` · ${fmtInt(c.estimatedRecipients)}` : ''}</td>
                    <td className="px-3 py-3"><CampaignBadge status={c.status} /></td>
                    <td className="px-3 py-3 text-slate-600">{fmtDate(c.sentAt ?? c.scheduledAt ?? c.createdAt)}</td>
                    <td className="px-3 py-3 text-right">{c.status === 'sent' || c.status === 'sending' ? fmtInt(c.sentCount) : '—'}</td>
                    <td className="px-3 py-3 text-right text-slate-500">{c.suppressedCount ? fmtInt(c.suppressedCount) : '—'}</td>
                    <td className="px-3 py-3 text-right text-slate-500">{c.failedCount ? pct(c.failedCount, c.sentCount + c.failedCount) : '—'}</td>
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

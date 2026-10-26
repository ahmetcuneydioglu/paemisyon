'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { useIsAdmin } from '@/components/notifications/campaign-form';
import { CampaignBadge, channelsText } from '@/components/notifications/ui';
import { fmtInt, type Campaign } from '../types';

/** Planlanmış (Doc 52 §12): güne göre gruplu planlı ve gönderilmekte olan kampanyalar. Otomasyon koşuları F2. */
export default function ScheduledPage() {
  const qc = useQueryClient();
  const isAdmin = useIsAdmin();
  const q = useQuery({ queryKey: ['notif-campaigns', 'scheduled-view'], queryFn: async () => {
    const [s, g] = await Promise.all([api<{ items: Campaign[] }>('/admin/notifications/campaigns?status=scheduled&pageSize=100'), api<{ items: Campaign[] }>('/admin/notifications/campaigns?status=sending&pageSize=100')]);
    return [...g.items, ...s.items].sort((a, b) => +new Date(a.scheduledAt ?? a.startedAt ?? 0) - +new Date(b.scheduledAt ?? b.startedAt ?? 0));
  }, refetchInterval: 30_000 });
  const cancel = useMutation({ mutationFn: (id: string) => api(`/admin/notifications/campaigns/${id}/status`, { method: 'POST', body: { action: 'cancel' } }), onSuccess: () => qc.invalidateQueries({ queryKey: ['notif-campaigns'] }) });
  const groups = new Map<string, Campaign[]>();
  for (const c of q.data ?? []) { const k = new Date(c.scheduledAt ?? c.startedAt ?? c.createdAt).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }); groups.set(k, [...(groups.get(k) ?? []), c]); }
  return (
    <div>
      <PageHeader title="Planlanmış" subtitle="Planlı ve gönderilmekte olan kampanyalar · iptal yalnız admin · otomasyon koşuları F2’de" />
      {q.isPending ? <Spinner /> : q.isError ? <ErrorBox error={q.error} onRetry={() => q.refetch()} /> : groups.size === 0 ? <Card><p className="text-sm text-slate-500">Planlı kampanya yok.</p></Card> : (
        <div className="space-y-5">
          {[...groups.entries()].map(([day, items]) => (
            <div key={day}>
              <h2 className="mb-2 text-base font-semibold">{day}</h2>
              <Card className="divide-y divide-slate-100 p-0">
                {items.map((c) => (
                  <div key={c.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                    <div className="w-14 font-semibold">{new Date(c.scheduledAt ?? c.startedAt ?? c.createdAt).toLocaleTimeString('tr-TR', { timeStyle: 'short' })}</div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/notifications/campaigns/${c.id}`} className="font-medium text-indigo-700 hover:underline">{c.name}</Link>
                      <div className="text-xs text-slate-500">{fmtInt(c.estimatedRecipients)} kişi · {channelsText(c.channels)}</div>
                    </div>
                    <CampaignBadge status={c.status} />
                    {isAdmin && <button type="button" onClick={() => cancel.mutate(c.id)} disabled={cancel.isPending} className="text-xs font-medium text-red-700 hover:underline">İptal</button>}
                  </div>
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

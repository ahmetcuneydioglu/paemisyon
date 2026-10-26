'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { useIsAdmin } from '@/components/notifications/campaign-form';
import { BarRow, CampaignBadge, ConfirmDialog, StatCard, Warnings, channelsText } from '@/components/notifications/ui';
import { CATEGORY_LABEL, CHANNEL_LABEL, DELIVERY_STATUS, REASON_LABEL, TARGET_LABEL, fmtDate, fmtInt, pct, type Campaign, type Channel, type DeliveryStatus } from '../../types';

type Analytics = {
  campaign: Campaign;
  deliveries: { channel: Channel; status: DeliveryStatus; count: number }[];
  opened: number; clicked: number; converted: number;
  platforms: { platform: string | null; n: number }[];
  suppression: { reason: string | null; count: number }[];
};

/** Kampanya detayı: sayaçlar, kanal kırılımı, bastırma nedenleri, eylemler (Figma slide-over). */
export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const isAdmin = useIsAdmin();
  const [confirm, setConfirm] = useState<'cancel' | 'pause' | 'resume' | null>(null);
  const q = useQuery({ queryKey: ['notif-campaign-analytics', id], queryFn: () => api<Analytics>(`/admin/notifications/campaigns/${id}/analytics`), refetchInterval: 15_000 });
  const act = useMutation({
    mutationFn: (action: 'cancel' | 'pause' | 'resume') => api<Campaign>(`/admin/notifications/campaigns/${id}/status`, { method: 'POST', body: { action } }),
    onSuccess: () => { setConfirm(null); qc.invalidateQueries({ queryKey: ['notif-campaign-analytics', id] }); qc.invalidateQueries({ queryKey: ['notif-campaigns'] }); },
  });
  const copy = useMutation({
    mutationFn: async () => {
      const c = q.data!.campaign; const v = c.variant!;
      return api<Campaign>('/admin/notifications/campaigns', { method: 'POST', body: {
        name: `${c.name} (kopya)`, category: c.category, priority: c.priority, channels: c.channels, title: v.title, body: v.body, imageUrl: v.imageUrl, ctaLabel: v.ctaLabel,
        deepLink: v.deepLink, emailSubject: v.emailSubject, emailBody: v.emailBody, audienceMode: c.audienceMode, segmentId: c.segmentId, segmentRules: c.segmentRulesSnapshot ?? undefined,
        userIds: c.userIds, sendMode: 'now', conversionEvent: c.conversionEvent, attributionWindowHours: c.attributionWindowHours, respectQuietHours: c.respectQuietHours, countTowardCaps: c.countTowardCaps, ttlHours: c.ttlHours,
      } });
    },
    onSuccess: (c) => router.push(`/notifications/campaigns/${c.id}/edit`),
  });
  if (q.isPending) return <Spinner />;
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  const { campaign: c, deliveries, opened, clicked, converted, platforms, suppression } = q.data;
  const sent = deliveries.filter((d) => d.status === 'sent').reduce((a, d) => a + d.count, 0);
  const byChannel = (['push', 'email'] as Channel[]).map((ch) => ({ ch, rows: deliveries.filter((d) => d.channel === ch) }));
  const maxP = Math.max(1, ...platforms.map((p) => p.n));
  const maxS = Math.max(1, ...suppression.map((s) => s.count));
  const editable = c.status === 'draft' || c.status === 'scheduled';
  return (
    <div>
      <PageHeader
        title={c.name}
        subtitle={`${CATEGORY_LABEL[c.category]} · ${c.priority} · ${channelsText(c.channels)} · ${c.sentAt ? `gönderildi ${fmtDate(c.sentAt)}` : c.scheduledAt ? `planlı ${fmtDate(c.scheduledAt)}` : `oluşturuldu ${fmtDate(c.createdAt)}`}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <CampaignBadge status={c.status} />
            {editable && <Link href={`/notifications/campaigns/${c.id}/edit`} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">Düzenle</Link>}
            <button type="button" onClick={() => copy.mutate()} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">Kopyala</button>
            {isAdmin && c.status === 'sending' && <button type="button" onClick={() => setConfirm('pause')} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">Duraklat</button>}
            {isAdmin && c.status === 'paused' && <button type="button" onClick={() => setConfirm('resume')} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">Sürdür</button>}
            {isAdmin && !['sent', 'cancelled'].includes(c.status) && <button type="button" onClick={() => setConfirm('cancel')} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700">İptal et</button>}
          </div>
        }
      />
      {act.error && <div className="mb-4"><ErrorBox error={act.error} /></div>}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Tahmini kitle" value={fmtInt(c.estimatedRecipients)} hint={`açılan ${fmtInt(c.materializedRecipients)}`} />
        <StatCard label="Gönderilen" value={fmtInt(sent)} hint="FCM / SES kabul etti" />
        <StatCard label="Açılma" value={pct(opened, sent)} hint={`${fmtInt(opened)} dokunma`} />
        <StatCard label="Tıklama" value={pct(clicked, sent)} hint={`${fmtInt(clicked)} hedefe gidildi`} />
        <StatCard label="Dönüşüm" value={pct(converted, sent)} hint={c.conversionEvent ? `${c.conversionEvent} · ${c.attributionWindowHours} sa` : 'dönüşüm olayı yok'} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold">Kanal kırılımı</h2>
          {byChannel.map(({ ch, rows }) => rows.length ? (
            <div key={ch} className="text-sm">
              <div className="mb-1 font-medium text-slate-700">{CHANNEL_LABEL[ch]}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                {rows.map((r) => (
                  <span key={r.status}>{DELIVERY_STATUS[r.status].label}: <span className="font-medium">{fmtInt(r.count)}</span></span>
                ))}
              </div>
            </div>
          ) : null)}
          {platforms.length > 0 && (
            <div className="space-y-1.5 pt-2">
              {platforms.map((p) => (
                <BarRow key={p.platform ?? 'x'} label={`Push · ${p.platform ?? 'bilinmiyor'}`} value={p.n} max={maxP} right={fmtInt(p.n)} />
              ))}
            </div>
          )}
          {deliveries.length === 0 && <p className="text-sm text-slate-500">Henüz teslim yok.</p>}
        </Card>
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold">Bastırılan · {fmtInt(suppression.reduce((a, s) => a + s.count, 0))}</h2>
          {suppression.length === 0 ? <p className="text-sm text-slate-500">Bastırma yok.</p> : suppression.map((s) => (
            <BarRow key={s.reason ?? 'x'} label={REASON_LABEL[s.reason ?? ''] ?? s.reason ?? '—'} value={s.count} max={maxS} right={fmtInt(s.count)} color="bg-amber-400" />
          ))}
        </Card>
        <Card className="space-y-2 lg:col-span-2">
          <h2 className="text-sm font-semibold">Mesaj</h2>
          {c.variant && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <div className="font-semibold">{c.variant.title}</div>
              <div className="text-slate-700">{c.variant.body}</div>
              <div className="mt-1 text-xs text-slate-500">→ {TARGET_LABEL[c.variant.deepLink?.target] ?? c.variant.deepLink?.target}{c.variant.deepLink?.params && Object.values(c.variant.deepLink.params)[0] ? ` · ${Object.values(c.variant.deepLink.params)[0]}` : ''}</div>
            </div>
          )}
          <Warnings items={c.warnings} />
          <p className="text-xs text-slate-500">Varyant: tek (A/B F3) · sessiz saat {c.respectQuietHours ? 'uygulanır' : 'uygulanmaz'} · kapı {c.countTowardCaps ? 'sayılır' : 'sayılmaz'} · ttl {c.ttlHours} sa · kitle {c.audienceMode}{c.segment ? ` (${c.segment.name})` : ''}</p>
        </Card>
      </div>
      <ConfirmDialog
        open={confirm !== null}
        title={confirm === 'cancel' ? 'Kampanyayı iptal et' : confirm === 'pause' ? 'Duraklat' : 'Sürdür'}
        body={confirm === 'cancel' ? 'Kuyruktaki teslimler süresi dolmuş sayılır; gönderilmiş olanlar geri alınamaz.' : confirm === 'pause' ? 'Kitle açma ve yeni teslim durur; kuyruktakiler bekler.' : 'Kampanya kaldığı yerden devam eder.'}
        confirmLabel={confirm === 'cancel' ? 'İptal et' : confirm === 'pause' ? 'Duraklat' : 'Sürdür'}
        danger={confirm === 'cancel'}
        busy={act.isPending}
        onConfirm={() => confirm && act.mutate(confirm)}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}

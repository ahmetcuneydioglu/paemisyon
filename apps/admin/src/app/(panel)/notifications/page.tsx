'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { BarRow, CampaignBadge, SeriesChart, StatCard } from '@/components/notifications/ui';
import { CHANNEL_LABEL, REASON_LABEL, fmtDate, fmtInt, pct, type Overview } from './types';

/** Genel Bakış (Doc 52 §12): bugünün sayaçları, 30 gün seri, bastırma nedenleri, sıradakiler, kill switch şeridi. */
export default function NotificationsOverviewPage() {
  const q = useQuery({ queryKey: ['notif-overview'], queryFn: () => api<Overview>('/admin/notifications/overview'), refetchInterval: 30_000 });
  if (q.isPending) return <><PageHeader title="Bildirim Merkezi" /><Spinner /></>;
  if (q.isError) return <><PageHeader title="Bildirim Merkezi" /><ErrorBox error={q.error} onRetry={() => q.refetch()} /></>;
  const o = q.data;
  const count = (ch: 'push' | 'email' | 'inbox', st?: string) => o.today.filter((t) => t.channel === ch && (!st || t.status === st)).reduce((a, t) => a + t.count, 0);
  const pushSent = count('push', 'sent'), emailSent = count('email', 'sent');
  const sent = pushSent + emailSent;
  const failed = count('push', 'failed') + count('email', 'failed');
  const suppressedTotal = o.suppression.reduce((a, s) => a + s.count, 0);
  const maxS = Math.max(1, ...o.suppression.map((s) => s.count));
  return (
    <div>
      <PageHeader
        title="Bildirim Merkezi"
        subtitle={`Bugün ${fmtInt(sent)} gönderim · ${o.scheduled.length} planlı/gönderilen kampanya · kuyruk ${fmtInt(o.pendingQueue)}`}
        action={<Link href="/notifications/new" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">+ Yeni bildirim</Link>}
      />
      <div className={`mb-4 flex flex-wrap items-center gap-3 rounded-lg border px-4 py-2.5 text-sm ${o.killSwitch ? 'border-red-300 bg-red-50 text-red-800' : o.environment.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-300 bg-amber-50 text-amber-900'}`}>
        <span className={`size-2 rounded-full ${o.killSwitch ? 'bg-red-600' : o.environment.ok ? 'bg-emerald-600' : 'bg-amber-500'}`} aria-hidden />
        {o.killSwitch ? 'KILL SWITCH AÇIK — hiçbir bildirim gönderilmiyor.' : o.environment.ok ? 'Gönderim açık' : 'Ortam kapısı eşleşmiyor — işçi gönderim yapmıyor.'}
        <span className="text-xs opacity-80">ortam: {o.environment.setting || '(ayarsız)'} / işçi: {o.environment.worker || '(boş)'} · sağlayıcı {o.environment.provider} · kitle {o.audienceRefreshedAt ? fmtDate(o.audienceRefreshedAt) : 'henüz yok'}</span>
        <Link href="/notifications/settings" className="ml-auto text-xs underline">Ayarlar</Link>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Bugün gönderilen" value={fmtInt(sent)} hint={`push ${fmtInt(pushSent)} · e-posta ${fmtInt(emailSent)}`} />
        <StatCard label="Başarısız" value={fmtInt(failed)} hint={failed ? 'token temizlendi / sağlayıcı hatası' : 'temiz'} warn={failed > 0} />
        <StatCard label="Açılma" value={pct(o.openedToday, sent)} hint={`${fmtInt(o.openedToday)} dokunma`} />
        <StatCard label="Tıklama" value={pct(o.clickedToday, sent)} hint={`${fmtInt(o.clickedToday)} hedefe gidildi`} />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Dönüşüm" value={pct(o.convertedToday, sent)} hint={`${fmtInt(o.convertedToday)} · 24 sa pencere`} />
        <StatCard label="Bastırılan" value={fmtInt(suppressedTotal)} hint="kural gereği gitmeyen" />
        <StatCard label="Kutuya yazılan" value={fmtInt(count('inbox'))} hint="bugün" />
        <StatCard label="Kuyruk" value={fmtInt(o.pendingQueue)} hint="bekleyen teslim" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <h2 className="text-sm font-semibold">Son 30 gün</h2>
          <p className="mb-3 text-xs text-slate-500">Gönderilen (açık) · açılan (koyu), günlük özetten</p>
          <SeriesChart series={o.series} />
        </Card>
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Sıradaki</h2>
          {o.scheduled.length === 0 ? <p className="text-sm text-slate-500">Planlı kampanya yok. Otomasyonlar kendi sekmesinde.</p> : (
            <ul className="space-y-2 text-sm">
              {o.scheduled.map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-2">
                  <div><Link href={`/notifications/campaigns/${s.id}`} className="font-medium text-indigo-700 hover:underline">{s.name}</Link>
                    <div className="text-xs text-slate-500">{fmtDate(s.scheduledAt)} · {fmtInt(s.estimatedRecipients)} kişi</div></div>
                  <CampaignBadge status={s.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="space-y-2">
          <h2 className="text-sm font-semibold">Gönderilmeyenler</h2>
          <p className="text-xs text-slate-500">Bugün {fmtInt(suppressedTotal)} bastırma · nedenine göre</p>
          {o.suppression.length === 0 ? <p className="text-sm text-slate-500">Bastırma yok.</p> : o.suppression.map((s) => (
            <BarRow key={s.reason ?? 'x'} label={REASON_LABEL[s.reason ?? ''] ?? s.reason ?? '—'} value={s.count} max={maxS} right={fmtInt(s.count)} color="bg-amber-400" />
          ))}
        </Card>
        <Card className="space-y-2">
          <h2 className="text-sm font-semibold">Kanal · bugün</h2>
          {(['push', 'email', 'inbox'] as const).map((ch) => (
            <div key={ch} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{CHANNEL_LABEL[ch]}</span>
              <span className="text-xs text-slate-500">{o.today.filter((t) => t.channel === ch).map((t) => `${t.status} ${t.count}`).join(' · ') || '—'}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

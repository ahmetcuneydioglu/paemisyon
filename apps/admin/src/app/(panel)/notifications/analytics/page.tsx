'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { BarRow, Chip, SeriesChart, StatCard } from '@/components/notifications/ui';
import { CATEGORY_LABEL, CHANNEL_LABEL, fmtInt, pct, type Analytics, type Category, type Channel } from '../types';

/** Analizler (Doc 52 §11–12): günlük özetten kategori, kanal, platform, saat histogramı; A/B F3. */
export default function AnalyticsPage() {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const q = useQuery({ queryKey: ['notif-analytics', days], queryFn: () => api<Analytics>(`/admin/notifications/analytics?days=${days}`) });
  if (q.isPending) return <><PageHeader title="Analizler" /><Spinner /></>;
  if (q.isError) return <><PageHeader title="Analizler" /><ErrorBox error={q.error} onRetry={() => q.refetch()} /></>;
  const a = q.data;
  const maxCat = Math.max(1, ...a.byCategory.map((c) => c.sent));
  const maxH = Math.max(1, ...a.hourly.map((h) => h.n));
  return (
    <div>
      <PageHeader title="Analizler" subtitle="Günlük özet tablosundan · “teslim” FCM/SES kabul etti demektir · açılma yalnız dokunma" />
      <div className="mb-4 flex gap-2">{([7, 30, 90] as const).map((d) => <Chip key={d} label={`${d} gün`} selected={days === d} onClick={() => setDays(d)} />)}<span className="ml-auto text-xs text-slate-400">CSV (F3)</span></div>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Gönderilen" value={fmtInt(a.totals.sent)} hint={`başarısız ${fmtInt(a.totals.failed)} · bastırılan ${fmtInt(a.totals.suppressed)}`} />
        <StatCard label="Açılma" value={pct(a.totals.opened, a.totals.sent)} hint={`${fmtInt(a.totals.opened)} dokunma`} />
        <StatCard label="Tıklama" value={pct(a.totals.clicked, a.totals.sent)} hint={`${fmtInt(a.totals.clicked)} hedefe gidildi`} />
        <StatCard label="Dönüşüm" value={pct(a.totals.converted, a.totals.sent)} hint="son dokunuş, 24 sa" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-2">
          <h2 className="text-sm font-semibold">Kategoriye göre</h2>
          <p className="text-xs text-slate-500">Gönderilen · açılma oranı</p>
          {a.byCategory.length === 0 ? <p className="text-sm text-slate-500">Veri yok.</p> : a.byCategory.map((c) => <BarRow key={c.key} label={CATEGORY_LABEL[c.key as Category] ?? c.key} value={c.sent} max={maxCat} right={`${fmtInt(c.sent)} · ${pct(c.opened, c.sent)}`} />)}
        </Card>
        <Card>
          <h2 className="text-sm font-semibold">Açılma saati</h2>
          <p className="mb-3 text-xs text-slate-500">TR saati · akıllı gönderim saati (F3) bunu kullanır</p>
          <div className="flex h-28 items-end gap-0.5">{a.hourly.map((h) => <div key={h.h} className="flex-1 rounded-sm bg-indigo-500" style={{ height: `${Math.max(2, (100 * h.n) / maxH)}%` }} title={`${h.h}:00 — ${h.n}`} />)}</div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-400"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-semibold">Kanal ve platform</h2>
          <table className="w-full text-sm"><thead><tr className="text-left text-xs text-slate-500"><th className="py-1 font-medium">Kanal</th><th className="py-1 text-right font-medium">Gönderilen</th><th className="py-1 text-right font-medium">Başarısız</th><th className="py-1 text-right font-medium">Açılma</th></tr></thead>
            <tbody className="divide-y divide-slate-50">{a.byChannel.map((c) => <tr key={c.key}><td className="py-1.5">{CHANNEL_LABEL[c.key as Channel] ?? c.key}</td><td className="py-1.5 text-right">{fmtInt(c.sent)}</td><td className="py-1.5 text-right">{fmtInt(c.failed)}</td><td className="py-1.5 text-right">{pct(c.opened, c.sent)}</td></tr>)}
            {a.byPlatform.filter((p) => p.key !== '—').map((p) => <tr key={`p-${p.key}`}><td className="py-1.5 pl-4 text-slate-600">Push · {p.key}</td><td className="py-1.5 text-right">{fmtInt(p.sent)}</td><td className="py-1.5 text-right">{fmtInt(p.failed)}</td><td className="py-1.5 text-right">{pct(p.opened, p.sent)}</td></tr>)}</tbody></table>
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-semibold">Segmente göre</h2>
          {a.segments.length === 0 ? <p className="text-sm text-slate-500">Bu aralıkta segmentli kampanya yok.</p> : (
            <table className="w-full text-sm"><thead><tr className="text-left text-xs text-slate-500"><th className="py-1 font-medium">Segment</th><th className="py-1 text-right font-medium">Kampanya</th><th className="py-1 text-right font-medium">Gönderilen</th></tr></thead>
              <tbody className="divide-y divide-slate-50">{a.segments.map((s) => <tr key={s.id}><td className="py-1.5">{s.name}</td><td className="py-1.5 text-right">{s.campaigns}</td><td className="py-1.5 text-right">{fmtInt(s.sent)}</td></tr>)}</tbody></table>
          )}
        </Card>
        <Card className="lg:col-span-2"><h2 className="text-sm font-semibold">Günlük seri</h2><p className="mb-3 text-xs text-slate-500">Gönderilen (açık) · açılan (koyu)</p><SeriesChart series={a.series} /></Card>
        <Card className="border-dashed bg-slate-50 lg:col-span-2"><h2 className="text-sm font-semibold text-slate-600">Varyant karşılaştırma (F3)</h2><p className="text-xs text-slate-500">A/B varyantları ve akıllı gönderim saati üçüncü fazda açılır; şema yeri hazır, sayaçlar bu tabloya düşer.</p></Card>
      </div>
    </div>
  );
}

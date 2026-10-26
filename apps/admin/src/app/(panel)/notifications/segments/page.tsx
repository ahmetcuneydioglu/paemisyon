'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { RuleBuilder } from '@/components/notifications/rule-builder';
import { Field, Pill, inputCls } from '@/components/notifications/ui';
import { fmtDate, fmtInt, type Group, type Segment, type SegmentField } from '../types';

type Draft = { id: string | null; name: string; description: string; rules: Group; status: 'active' | 'archived' };
const empty = (): Draft => ({ id: null, name: '', description: '', rules: { op: 'and', rules: [] }, status: 'active' });

/** Segmentler (Doc 52 §12): tablo + kural kurucu; sayı her görüntülemede taze sorgudan. */
export default function SegmentsPage() {
  const qc = useQueryClient();
  const [d, setD] = useState<Draft>(empty());
  const q = useQuery({ queryKey: ['notif-segments'], queryFn: () => api<{ items: Segment[]; fields: Record<string, SegmentField> }>('/admin/notifications/segments') });
  const est = useQuery({
    queryKey: ['notif-seg-est', d.rules],
    queryFn: () => api<{ total: number; push: number; summary: string; refreshedAt: string | null }>('/admin/notifications/segments/estimate', { method: 'POST', body: { rules: d.rules } }),
  });
  const save = useMutation({
    mutationFn: () => d.id
      ? api<Segment>(`/admin/notifications/segments/${d.id}`, { method: 'PUT', body: { name: d.name, description: d.description || null, rules: d.rules, status: d.status } })
      : api<Segment>('/admin/notifications/segments', { method: 'POST', body: { name: d.name, description: d.description || null, rules: d.rules, status: d.status } }),
    onSuccess: (s) => { qc.invalidateQueries({ queryKey: ['notif-segments'] }); setD({ id: s.id, name: s.name, description: s.description ?? '', rules: s.rules, status: s.status }); },
  });
  return (
    <div>
      <PageHeader title="Segmentler" subtitle="Kitle tablosu saat başı yenilenir; sayılar en fazla 1 saat gecikmeli." action={<button type="button" onClick={() => setD(empty())} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">+ Segment</button>} />
      {q.isPending ? <Spinner /> : q.isError ? <ErrorBox error={q.error} onRetry={() => q.refetch()} /> : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Card className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 text-left text-xs text-slate-500"><th className="px-5 py-3 font-medium">Ad</th><th className="px-3 py-3 font-medium">Kural özeti</th><th className="px-3 py-3 text-right font-medium">Kişi</th><th className="px-3 py-3 font-medium">Son sayım</th><th className="px-3 py-3 font-medium">Durum</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {q.data.items.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">Henüz segment yok.</td></tr>}
                {q.data.items.map((s) => (
                  <tr key={s.id} className={`cursor-pointer hover:bg-slate-50 ${d.id === s.id ? 'bg-indigo-50/50' : ''}`} onClick={() => setD({ id: s.id, name: s.name, description: s.description ?? '', rules: s.rules, status: s.status })}>
                    <td className="px-5 py-3 font-medium text-indigo-700">{s.name}</td>
                    <td className="px-3 py-3 text-xs text-slate-600">{s.summary}</td>
                    <td className="px-3 py-3 text-right">{fmtInt(s.lastCount)}</td>
                    <td className="px-3 py-3 text-xs text-slate-500">{fmtDate(s.lastCountedAt)}</td>
                    <td className="px-3 py-3"><Pill label={s.status === 'active' ? 'Aktif' : 'Arşiv'} cls={s.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card className="space-y-3">
            <h2 className="text-base font-semibold">{d.id ? 'Segmenti düzenle' : 'Yeni segment'}</h2>
            {save.error && <ErrorBox error={save.error} />}
            <Field label="Ad"><input className={inputCls} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field>
            <Field label="Açıklama"><input className={inputCls} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} /></Field>
            <RuleBuilder group={d.rules} fields={q.data.fields} onChange={(g) => setD({ ...d, rules: g })} />
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              {est.isFetching ? 'Sayılıyor…' : est.data ? <><span className="font-semibold">{fmtInt(est.data.total)} kişi</span> · push {fmtInt(est.data.push)} <div className="text-xs">{est.data.summary}</div></> : est.error ? <span className="text-red-700">{(est.error as Error).message}</span> : '—'}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" disabled={save.isPending || d.name.trim().length < 2} onClick={() => save.mutate()} className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50">Kaydet</button>
              {d.id && <Link href="/notifications/new" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">Bu segmente bildirim</Link>}
              {d.id && (
                <label className="ml-auto flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={d.status === 'archived'} onChange={(e) => setD({ ...d, status: e.target.checked ? 'archived' : 'active' })} /> Arşivde</label>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

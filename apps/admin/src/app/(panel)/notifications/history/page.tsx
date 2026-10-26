'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { DeliveryBadge, inputCls } from '@/components/notifications/ui';
import { CATEGORY_LABEL, CHANNEL_LABEL, DELIVERY_STATUS, REASON_LABEL, fmtDate, fmtInt, type Channel, type DeliveryStatus, type HistoryItem } from '../types';

/** Gönderim geçmişi (Doc 52 §12): teslim satırları, e-posta ve token maskeli; CSV F3. */
export default function HistoryPage() {
  const [f, setF] = useState({ email: '', channel: '' as Channel | '', status: '' as DeliveryStatus | '', page: 1 });
  const qs = new URLSearchParams({ page: String(f.page), pageSize: '50', ...(f.email ? { email: f.email } : {}), ...(f.channel ? { channel: f.channel } : {}), ...(f.status ? { status: f.status } : {}) });
  const q = useQuery({ queryKey: ['notif-history', qs.toString()], queryFn: () => api<{ items: HistoryItem[]; total: number; page: number; pageSize: number }>(`/admin/notifications/history?${qs}`), placeholderData: (p) => p });
  const pages = q.data ? Math.max(1, Math.ceil(q.data.total / q.data.pageSize)) : 1;
  return (
    <div>
      <PageHeader title="Gönderim geçmişi" subtitle={q.data ? `${fmtInt(q.data.total)} teslim (son 90 gün ham) · e-posta ve token maskeli` : ''} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input className={`${inputCls} w-56`} placeholder="Kullanıcı e-posta" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value, page: 1 })} />
        <select className={`${inputCls} w-40`} value={f.channel} onChange={(e) => setF({ ...f, channel: e.target.value as Channel | '', page: 1 })}><option value="">Kanal: tümü</option>{(['push', 'email'] as Channel[]).map((c) => <option key={c} value={c}>{CHANNEL_LABEL[c]}</option>)}</select>
        <select className={`${inputCls} w-44`} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as DeliveryStatus | '', page: 1 })}><option value="">Durum: tümü</option>{(Object.keys(DELIVERY_STATUS) as DeliveryStatus[]).map((s) => <option key={s} value={s}>{DELIVERY_STATUS[s].label}</option>)}</select>
        <span className="ml-auto text-xs text-slate-500">Sayfa {f.page} / {pages}</span>
      </div>
      {q.isPending ? <Spinner /> : q.isError ? <ErrorBox error={q.error} onRetry={() => q.refetch()} /> : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead><tr className="border-b border-slate-100 text-left text-xs text-slate-500"><th className="px-5 py-3 font-medium">Zaman</th><th className="px-3 py-3 font-medium">Kullanıcı</th><th className="px-3 py-3 font-medium">Kaynak</th><th className="px-3 py-3 font-medium">Kanal</th><th className="px-3 py-3 font-medium">Platform</th><th className="px-3 py-3 font-medium">Durum</th><th className="px-3 py-3 font-medium">Neden / sağlayıcı</th><th className="px-3 py-3 font-medium">Etkileşim</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {q.data.items.length === 0 && <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-500">Kayıt yok.</td></tr>}
                {q.data.items.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5 text-xs text-slate-600">{fmtDate(r.sentAt ?? r.queuedAt)}</td>
                    <td className="px-3 py-2.5">{r.user}</td>
                    <td className="px-3 py-2.5"><div className="font-medium">{r.source}</div><div className="text-xs text-slate-500">{r.title} · {CATEGORY_LABEL[r.category]}</div></td>
                    <td className="px-3 py-2.5">{CHANNEL_LABEL[r.channel]}</td>
                    <td className="px-3 py-2.5 text-slate-600">{r.platform ?? '—'}</td>
                    <td className="px-3 py-2.5"><DeliveryBadge status={r.status} /></td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">{r.suppressionReason ? REASON_LABEL[r.suppressionReason] ?? r.suppressionReason : r.errorCode ?? (r.status === 'sent' ? 'kabul edildi' : '—')}{r.attempts > 1 ? ` · ${r.attempts}. deneme` : ''}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">{[r.opened && 'açıldı', r.clicked && 'tıklandı', r.converted && 'dönüştü'].filter(Boolean).join(' · ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            <span>Ham teslim 90 gün saklanır, sonra günlük özet. CSV dışa aktarım F3.</span>
            <div className="flex gap-2">
              <button type="button" disabled={f.page <= 1} onClick={() => setF({ ...f, page: f.page - 1 })} className="rounded-full border border-slate-200 px-3 py-1 disabled:opacity-40">‹ Önceki</button>
              <button type="button" disabled={f.page >= pages} onClick={() => setF({ ...f, page: f.page + 1 })} className="rounded-full border border-slate-200 px-3 py-1 disabled:opacity-40">Sonraki ›</button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

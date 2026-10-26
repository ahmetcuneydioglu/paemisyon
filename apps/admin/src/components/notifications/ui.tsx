'use client';

import { useEffect } from 'react';
import {
  CAMPAIGN_STATUS, CATEGORY_LABEL, CHANNEL_LABEL, DELIVERY_STATUS, type CampaignStatus, type Category, type Channel, type DeliveryStatus, type Warning,
} from '@/app/(panel)/notifications/types';

/** Sayısal kart (Figma Admin/StatCard). */
export function StatCard({ label, value, hint, warn }: { label: string; value: string; hint?: string; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${warn ? 'text-red-700' : 'text-slate-900'}`}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

export function Pill({ label, cls }: { label: string; cls: string }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}
export const CampaignBadge = ({ status }: { status: CampaignStatus }) => <Pill {...CAMPAIGN_STATUS[status]} />;
export const DeliveryBadge = ({ status }: { status: DeliveryStatus }) => <Pill {...DELIVERY_STATUS[status]} />;
export const CategoryBadge = ({ category }: { category: Category }) => <Pill label={CATEGORY_LABEL[category]} cls="bg-slate-100 text-slate-700" />;
export const channelsText = (c: Channel[]) => c.map((x) => CHANNEL_LABEL[x]).join(' · ');

export function Chip({ label, selected, onClick }: { label: string; selected?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm ${
        selected ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );
}

export function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
      {help && <span className="mt-1 block text-xs text-slate-500">{help}</span>}
    </label>
  );
}
export const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none';

export function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${checked ? 'bg-indigo-600' : 'bg-slate-300'} disabled:opacity-50`}
    >
      <span className={`inline-block size-5 rounded-full bg-white shadow transition ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export function Warnings({ items }: { items: Warning[] }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      {items.map((w, i) => (
        <li key={i}>{w.message}</li>
      ))}
    </ul>
  );
}

/** Onay penceresi: Gönder ve iptal gibi geri alınmaz eylemler (alıcı sayısı gösterilir). */
export function ConfirmDialog({
  open, title, body, confirmLabel, danger, busy, onConfirm, onClose,
}: { open: boolean; title: string; body: React.ReactNode; confirmLabel: string; danger?: boolean; busy?: boolean; onConfirm: () => void; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h2 id="confirm-title" className="text-base font-semibold">{title}</h2>
        <div className="mt-2 text-sm text-slate-600">{body}</div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" disabled={busy}>
            Vazgeç
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {busy ? 'Bekleyin…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Basit yatay çubuk grafik satırı. */
export function BarRow({ label, value, max, right, color = 'bg-indigo-500' }: { label: string; value: number; max: number; right: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-44 shrink-0 truncate text-slate-600">{label}</div>
      <div className="h-2.5 flex-1 rounded bg-slate-100">
        <div className={`h-2.5 rounded ${color}`} style={{ width: `${max > 0 ? Math.min(100, (100 * value) / max) : 0}%` }} />
      </div>
      <div className="w-24 shrink-0 text-right text-slate-700">{right}</div>
    </div>
  );
}

/** Günlük seri: gönderilen (açık) + açılan (koyu) çubukları. */
export function SeriesChart({ series }: { series: { day: string; sent: number; opened: number }[] }) {
  const max = Math.max(1, ...series.map((s) => s.sent));
  if (series.length === 0) return <p className="text-sm text-slate-500">Henüz günlük özet yok (gece 04.20’de yazılır).</p>;
  return (
    <div className="flex h-36 items-end gap-1">
      {series.map((s) => (
        <div key={s.day} className="flex flex-1 flex-col items-center justify-end gap-px" title={`${s.day}: ${s.sent} gönderildi, ${s.opened} açıldı`}>
          <div className="w-full rounded-sm bg-indigo-100" style={{ height: `${(100 * s.sent) / max}%` }} />
          <div className="w-full rounded-sm bg-indigo-500" style={{ height: `${(28 * s.opened) / max}%` }} />
        </div>
      ))}
    </div>
  );
}

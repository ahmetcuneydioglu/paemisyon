'use client';

import type { ContentStatus } from '@/lib/types';

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="min-w-0 flex-1 basis-40">
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const STATUS_META: Record<ContentStatus, { label: string; cls: string }> = {
  draft: { label: 'Taslak', cls: 'bg-slate-100 text-slate-700' },
  in_review: { label: 'İncelemede', cls: 'bg-amber-100 text-amber-800' },
  published: { label: 'Yayında', cls: 'bg-emerald-100 text-emerald-800' },
  archived: { label: 'Arşiv', cls: 'bg-slate-100 text-slate-400' },
};

export function StatusBadge({ status }: { status: ContentStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Spinner() {
  return <div className="py-12 text-center text-sm text-slate-500">Yükleniyor…</div>;
}

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const msg = error instanceof Error ? error.message : 'Bir şeyler ters gitti.';
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {msg}
      {onRetry && (
        <button onClick={onRetry} className="ml-3 font-medium underline">
          Tekrar dene
        </button>
      )}
    </div>
  );
}

/**
 * Soru Merkezi rozeti (Doc 55): soru merkezden geliyor, içerik orada düzenlenir.
 * `href` varsa merkezin soru sayfasına açılır (yeni sekme); yoksa yalnız kod.
 */
export function HubBadge({
  code,
  href,
  size = 'sm',
}: {
  code: string;
  href?: string | null;
  size?: 'xs' | 'sm';
}) {
  const cls = `inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 font-medium text-sky-800 ${
    size === 'xs' ? 'px-1.5 py-0 text-[11px]' : 'px-2 py-0.5 text-xs'
  }`;
  const body = (
    <>
      <span aria-hidden>⇄</span>
      <span>{code}</span>
    </>
  );
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={`${cls} hover:bg-sky-100`} title="Soru Merkezi'nde aç">
      {body}
    </a>
  ) : (
    <span className={cls} title="Soru Merkezi sorusu">
      {body}
    </span>
  );
}

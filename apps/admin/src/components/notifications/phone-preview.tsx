'use client';

import { useState } from 'react';
import { Chip } from './ui';

/** Kilit ekranı bildirim önizlemesi (Figma: Önizleme sütunu). Metin canlı değişir. */
export function PhonePreview({ title, body, emailSubject, emailEnabled }: { title: string; body: string; emailSubject?: string | null; emailEnabled: boolean }) {
  const [os, setOs] = useState<'ios' | 'android' | 'web'>('ios');
  const t = title.replaceAll(/\{\{?\s*ad\s*(\|[^}]*)?\}?\}/g, 'Ahmet') || 'Başlık';
  const b = body.replaceAll(/\{\{?\s*ad\s*(\|[^}]*)?\}?\}/g, 'Ahmet') || 'Gövde metni burada görünür.';
  const bodyShown = os === 'android' && b.length > 70 ? `${b.slice(0, 70)}…` : b;
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(['ios', 'android', 'web'] as const).map((k) => (
          <Chip key={k} label={k === 'ios' ? 'iOS' : k === 'android' ? 'Android' : 'Web'} selected={os === k} onClick={() => setOs(k)} />
        ))}
      </div>
      <div className="rounded-[28px] bg-slate-900 px-3 pb-24 pt-8 text-center">
        <div className="text-xs text-slate-400">Pazar 26 Ekim</div>
        <div className="mb-3 text-5xl font-light text-white">09:41</div>
        <div className="flex items-start gap-2.5 rounded-2xl bg-white/95 p-3 text-left">
          <div className="mt-0.5 size-9 shrink-0 rounded-lg bg-amber-400" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="text-[13px] font-semibold leading-snug text-slate-900">{t}</div>
              <div className="shrink-0 text-[11px] text-slate-500">şimdi</div>
            </div>
            <div className="mt-0.5 text-[12px] leading-snug text-slate-600">{bodyShown}</div>
          </div>
        </div>
      </div>
      {os === 'android' && b.length > 70 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Android bildirim gölgesinde gövde 2 satırda kesilir; ilk 70 karakter anlamı taşımalı.</p>
      )}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">E-posta önizleme</div>
        {emailEnabled ? (
          <div className="mt-1 rounded-lg border border-slate-200 p-3 text-sm">
            <div className="font-medium">{emailSubject || t}</div>
            <div className="mt-1 text-xs text-slate-500">Paemisyon şablonu, çıkış bağlantısı ve kişiselleştirme sunucuda eklenir.</div>
          </div>
        ) : (
          <p className="mt-1 text-xs text-slate-500">Kanal kapalı. Açıldığında konu satırı ve Paemisyon şablonu burada görünür.</p>
        )}
      </div>
    </div>
  );
}

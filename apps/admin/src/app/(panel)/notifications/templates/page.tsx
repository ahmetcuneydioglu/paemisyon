'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { CategoryBadge, Chip, Field, Warnings, inputCls } from '@/components/notifications/ui';
import { CATEGORY_CHANNELS, CATEGORY_LABEL, CHANNEL_LABEL, PRIORITY_LABEL, TARGET_LABEL, type Category, type Priority, type Template } from '../types';

type Draft = { id: string | null; code: string; name: string; category: Category; title: string; body: string; ctaLabel: string; target: string; emailSubject: string; emailBody: string; defaultPriority: Priority; status: 'active' | 'archived' };
const empty = (): Draft => ({ id: null, code: '', name: '', category: 'exam', title: '', body: '', ctaLabel: '', target: 'home', emailSubject: '', emailBody: '', defaultPriority: 'normal', status: 'active' });

/** Şablonlar (Doc 52 §12): kategori sekmeleri, kart önizleme, düzenleme paneli. */
export default function TemplatesPage() {
  const qc = useQueryClient();
  const [cat, setCat] = useState<Category | ''>('');
  const [d, setD] = useState<Draft | null>(null);
  const q = useQuery({ queryKey: ['notif-templates'], queryFn: () => api<{ items: Template[]; variables: string[] }>('/admin/notifications/templates') });
  const save = useMutation({
    mutationFn: () => {
      const body = { code: d!.code.trim(), name: d!.name.trim(), category: d!.category, title: d!.title, body: d!.body, ctaLabel: d!.ctaLabel || null, deepLink: { target: d!.target }, emailSubject: d!.emailSubject || null, emailBody: d!.emailBody || null, defaultPriority: d!.defaultPriority, status: d!.status };
      return d!.id ? api<Template>(`/admin/notifications/templates/${d!.id}`, { method: 'PUT', body }) : api<Template>('/admin/notifications/templates', { method: 'POST', body });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notif-templates'] }); setD(null); },
  });
  const items = (q.data?.items ?? []).filter((t) => !cat || t.category === cat);
  return (
    <div>
      <PageHeader title="Şablonlar" subtitle={q.data ? `${q.data.items.length} şablon · her şablonun push ve e-posta sürümü` : ''} action={<button type="button" onClick={() => setD(empty())} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">+ Şablon</button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Chip label="Tümü" selected={cat === ''} onClick={() => setCat('')} />
        {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => <Chip key={c} label={CATEGORY_LABEL[c]} selected={cat === c} onClick={() => setCat(c)} />)}
      </div>
      {q.isPending ? <Spinner /> : q.isError ? <ErrorBox error={q.error} onRetry={() => q.refetch()} /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.length === 0 && <p className="text-sm text-slate-500">Şablon yok.</p>}
          {items.map((t) => (
            <Card key={t.id} className={`space-y-3 ${t.status === 'archived' ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between gap-2"><CategoryBadge category={t.category} /><span className="font-mono text-xs text-slate-500">{t.code}</span></div>
              <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <div className="mt-0.5 size-7 shrink-0 rounded-md bg-amber-400" aria-hidden />
                <div className="min-w-0 text-sm"><div className="font-semibold">{t.title}</div><div className="text-xs text-slate-600">{t.body}</div></div>
              </div>
              <div className="flex flex-wrap gap-1">{t.variables.length ? t.variables.map((v) => <span key={v} className="rounded-full border border-slate-200 px-2 py-0.5 font-mono text-[11px] text-slate-600">{`{{${v}}}`}</span>) : <span className="text-xs text-slate-400">değişken yok</span>}</div>
              <Warnings items={t.warnings} />
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{CATEGORY_CHANNELS[t.category].map((c) => CHANNEL_LABEL[c]).join(' · ')} · → {TARGET_LABEL[t.deepLink?.target] ?? 'Bugün'}</span>
                <button type="button" className="font-medium text-indigo-700 hover:underline" onClick={() => setD({ id: t.id, code: t.code, name: t.name, category: t.category, title: t.title, body: t.body, ctaLabel: t.ctaLabel ?? '', target: t.deepLink?.target ?? 'home', emailSubject: t.emailSubject ?? '', emailBody: t.emailBody ?? '', defaultPriority: t.defaultPriority, status: t.status })}>Düzenle</button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {d && (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/30" onClick={() => setD(null)}>
          <div className="h-full w-full max-w-lg overflow-y-auto bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Şablon düzenle">
            <h2 className="mb-3 text-base font-semibold">{d.id ? 'Şablonu düzenle' : 'Yeni şablon'}</h2>
            {save.error && <div className="mb-3"><ErrorBox error={save.error} /></div>}
            <div className="space-y-3">
              <Field label="Kod (tekil, snake_case)"><input className={`${inputCls} font-mono`} value={d.code} onChange={(e) => setD({ ...d, code: e.target.value })} disabled={!!d.id} /></Field>
              <Field label="Ad"><input className={inputCls} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field>
              <Field label="Kategori"><select className={inputCls} value={d.category} onChange={(e) => setD({ ...d, category: e.target.value as Category })}>{(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}</select></Field>
              <Field label="Başlık" help={`${d.title.length}/40`}><input className={inputCls} value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></Field>
              <Field label="Gövde" help={`${d.body.length}/150 · değişkenler: ${(q.data?.variables ?? []).map((v) => `{{${v}}}`).join(' ')}`}><textarea className={`${inputCls} min-h-24`} value={d.body} onChange={(e) => setD({ ...d, body: e.target.value })} /></Field>
              <Field label="CTA"><input className={inputCls} value={d.ctaLabel} onChange={(e) => setD({ ...d, ctaLabel: e.target.value })} /></Field>
              <Field label="Hedef ekran"><select className={inputCls} value={d.target} onChange={(e) => setD({ ...d, target: e.target.value })}>{Object.entries(TARGET_LABEL).filter(([k]) => !['question', 'exam', 'exam_result', 'legislation'].includes(k)).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
              <Field label="Varsayılan öncelik"><select className={inputCls} value={d.defaultPriority} onChange={(e) => setD({ ...d, defaultPriority: e.target.value as Priority })}>{(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}</select></Field>
              <Field label="E-posta konusu"><input className={inputCls} value={d.emailSubject} onChange={(e) => setD({ ...d, emailSubject: e.target.value })} /></Field>
              <Field label="E-posta gövdesi (markdown)"><textarea className={`${inputCls} min-h-24`} value={d.emailBody} onChange={(e) => setD({ ...d, emailBody: e.target.value })} /></Field>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={d.status === 'archived'} onChange={(e) => setD({ ...d, status: e.target.checked ? 'archived' : 'active' })} /> Arşivde</label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setD(null)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">Vazgeç</button>
                <button type="button" disabled={save.isPending || d.code.trim().length < 2 || d.name.trim().length < 2 || d.title.trim().length < 2 || d.body.trim().length < 2} onClick={() => save.mutate()} className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50">Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

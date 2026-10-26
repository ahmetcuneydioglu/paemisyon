'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, ErrorBox, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { ExamCalendarItem } from '@/app/(panel)/notifications/types';
import { Field, Pill, inputCls } from './ui';

type Draft = { examTypeId: string; name: string; examDate: string; countdownDays: string; isConfirmed: boolean; isActive: boolean; note: string };
const EMPTY: Draft = { examTypeId: '', name: '', examDate: '', countdownDays: '60,30,14,7,3,1', isConfirmed: true, isActive: true, note: '' };
const toDraft = (r: ExamCalendarItem): Draft => ({ examTypeId: r.examTypeId ?? '', name: r.name, examDate: r.examDate.slice(0, 10), countdownDays: r.countdownDays.join(','), isConfirmed: r.isConfirmed, isActive: r.isActive, note: r.note ?? '' });

/**
 * Sınav takvimi (Doc 52 F2): resmî sınav tarihleri. Kullanıcının kendi hedef tarihi yoksa modülünün
 * (ya da modülsüz genel kaydın) en yakın aktif + kesin tarihi kitle tablosuna düşer; `exam_countdown`
 * otomasyonu bu günleri sayar. Editor ekler/düzenler, admin siler.
 */
export function ExamCalendarCard({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['notif-exam-calendar'], queryFn: () => api<ExamCalendarItem[]>('/admin/notifications/exam-calendar') });
  const modules = useQuery({ queryKey: ['admin-catalog-tree'], queryFn: () => api<{ id: string; name: string }[]>('/admin/catalog/tree') });
  const [editing, setEditing] = useState<{ id: string | null; d: Draft } | null>(null);
  const invalidate = () => { qc.invalidateQueries({ queryKey: ['notif-exam-calendar'] }); setEditing(null); };
  const body = (d: Draft) => ({
    examTypeId: d.examTypeId || null, name: d.name, examDate: d.examDate,
    countdownDays: d.countdownDays.split(',').map((x) => Number(x.trim())).filter((n) => Number.isInteger(n) && n > 0),
    isConfirmed: d.isConfirmed, isActive: d.isActive, note: d.note || null,
  });
  const save = useMutation({
    mutationFn: ({ id, d }: { id: string | null; d: Draft }) => api(id ? `/admin/notifications/exam-calendar/${id}` : '/admin/notifications/exam-calendar', { method: id ? 'PATCH' : 'POST', body: body(d) }),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: (id: string) => api(`/admin/notifications/exam-calendar/${id}`, { method: 'DELETE' }), onSuccess: invalidate });
  const d = editing?.d;
  const set = (patch: Partial<Draft>) => setEditing({ id: editing!.id, d: { ...editing!.d, ...patch } });
  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div><h2 className="text-base font-semibold">Sınav takvimi</h2><p className="text-xs text-slate-500">Hedef tarihi olmayan adaya modülünün kesin tarihi sayılır; geri sayım yalnız “aktif + kesin” kayıtlarda çalışır.</p></div>
        <button type="button" onClick={() => setEditing({ id: null, d: EMPTY })} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">+ Tarih</button>
      </div>
      {q.isPending && <Spinner />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {(save.error || remove.error) && <ErrorBox error={save.error ?? remove.error} />}
      {q.data && (
        <ul className="divide-y divide-slate-100 text-sm">
          {q.data.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2">
              <div>
                <div className="font-medium">{r.name} <span className="font-normal text-slate-500">· {r.examType?.name ?? 'Genel'}</span></div>
                <div className="text-xs text-slate-500">{new Date(r.examDate).toLocaleDateString('tr-TR', { dateStyle: 'long' })} · geri sayım {r.countdownDays.join(' · ')}{r.note ? ` · ${r.note}` : ''}</div>
              </div>
              <div className="flex items-center gap-2">
                <Pill label={r.isActive ? (r.isConfirmed ? 'Kesin' : 'Tahmini') : 'Pasif'} cls={r.isActive && r.isConfirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'} />
                <button type="button" onClick={() => setEditing({ id: r.id, d: toDraft(r) })} className="text-xs text-indigo-700 hover:underline">Düzenle</button>
                {isAdmin && <button type="button" onClick={() => remove.mutate(r.id)} className="text-xs text-slate-400 hover:text-red-600" aria-label="Sil">✕</button>}
              </div>
            </li>
          ))}
          {q.data.length === 0 && <li className="py-3 text-slate-500">Kayıt yok. Resmî tarih açıklanınca ekle; açıklanmadıysa “tahmini” işaretle.</li>}
        </ul>
      )}
      {editing && d && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Ad"><input className={inputCls} value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="PAEM 2027" /></Field>
            <Field label="Modül">
              <select className={inputCls} value={d.examTypeId} onChange={(e) => set({ examTypeId: e.target.value })}>
                <option value="">Genel (tüm modüller)</option>
                {(modules.data ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
            <Field label="Sınav tarihi"><input type="date" className={inputCls} value={d.examDate} onChange={(e) => set({ examDate: e.target.value })} /></Field>
            <Field label="Geri sayım günleri" help="virgülle"><input className={inputCls} value={d.countdownDays} onChange={(e) => set({ countdownDays: e.target.value })} /></Field>
          </div>
          <Field label="Not"><input className={inputCls} value={d.note} onChange={(e) => set({ note: e.target.value })} placeholder="Resmî duyuru bağlantısı, kaynak…" /></Field>
          <div className="flex flex-wrap gap-5 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={d.isConfirmed} onChange={(e) => set({ isConfirmed: e.target.checked })} />Kesin tarih</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={d.isActive} onChange={(e) => set({ isActive: e.target.checked })} />Aktif</label>
          </div>
          <div className="flex gap-2">
            <button type="button" disabled={!d.name || !d.examDate || save.isPending} onClick={() => save.mutate({ id: editing.id, d })} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">Kaydet</button>
            <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">Vazgeç</button>
          </div>
        </div>
      )}
    </Card>
  );
}

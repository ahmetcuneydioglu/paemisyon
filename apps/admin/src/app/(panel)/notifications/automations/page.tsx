'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { useIsAdmin } from '@/components/notifications/campaign-form';
import { PhonePreview } from '@/components/notifications/phone-preview';
import { RuleBuilder } from '@/components/notifications/rule-builder';
import { CategoryBadge, Chip, ConfirmDialog, Field, Pill, StatCard, Toggle, Warnings, channelsText, inputCls } from '@/components/notifications/ui';
import {
  AUTOMATION_STATUS, CATEGORY_CHANNELS, CHANNEL_LABEL, PRIORITY_LABEL, TARGET_LABEL, WEEKDAYS, fmtDate, fmtInt,
  type Automation, type AutomationPreview, type AutomationSchedule, type Channel, type Group, type Priority, type Segment, type SegmentField,
} from '../types';

type Filter = 'hepsi' | 'active' | 'paused' | 'schedule' | 'event';

/**
 * Otomatik Bildirimler (Doc 52 §8, §12): hazır set kart ızgarası — tetik, koşul özeti, son koşu, 7 gün,
 * aç/kapat (admin); kart açılınca düzenleme (metin, kanal, takvim, koşul, sıklık), prova ve koşu geçmişi.
 * Hazır set kapalı doğar; açılınca o ana kadarki olaylar işlenmiş sayılır (geriye dönük gönderim yok).
 */
export default function AutomationsPage() {
  const isAdmin = useIsAdmin();
  const [filter, setFilter] = useState<Filter>('hepsi');
  const [openId, setOpenId] = useState<string | null>(null);
  const q = useQuery({ queryKey: ['notif-automations'], queryFn: () => api<Automation[]>('/admin/notifications/automations'), refetchInterval: 60_000 });
  if (q.isPending) return <><PageHeader title="Otomatik bildirimler" /><Spinner /></>;
  if (q.isError) return <><PageHeader title="Otomatik bildirimler" /><ErrorBox error={q.error} onRetry={() => q.refetch()} /></>;
  const rows = q.data.filter((a) =>
    filter === 'hepsi' ? true : filter === 'active' || filter === 'paused' ? a.status === filter : a.triggerType === filter,
  );
  const active = q.data.filter((a) => a.status === 'active').length;
  const sent7 = q.data.reduce((s, a) => s + (a.sent7d ?? 0), 0);
  const opened7 = q.data.reduce((s, a) => s + (a.opened7d ?? 0), 0);
  const open = openId ? q.data.find((a) => a.id === openId) ?? null : null;
  return (
    <div>
      <PageHeader
        title="Otomatik bildirimler"
        subtitle={`${active}/${q.data.length} açık · son 7 gün ${fmtInt(sent7)} gönderim · ${fmtInt(opened7)} açılma · her gönderim karar akışından geçer`}
      />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Açık otomasyon" value={`${active}`} hint={`${q.data.length - active} kapalı`} />
        <StatCard label="7 gün gönderim" value={fmtInt(sent7)} hint="kuyruğa verilen" />
        <StatCard label="7 gün açılma" value={fmtInt(opened7)} hint={sent7 ? `%${Math.round((100 * opened7) / sent7)}` : '—'} />
        <StatCard label="Hata" value={`${q.data.filter((a) => a.lastError).length}`} hint="3 üst üste hata duraklatır" warn={q.data.some((a) => a.lastError)} />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {([['hepsi', 'Tümü'], ['active', 'Açık'], ['paused', 'Kapalı'], ['schedule', 'Zamanlı'], ['event', 'Olaylı']] as [Filter, string][]).map(([k, l]) => (
          <Chip key={k} label={l} selected={filter === k} onClick={() => setFilter(k)} />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((a) => (
          <AutomationCard key={a.id} a={a} isAdmin={isAdmin} onOpen={() => setOpenId(a.id)} />
        ))}
      </div>
      {open && <AutomationDrawer id={open.id} isAdmin={isAdmin} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function AutomationCard({ a, isAdmin, onOpen }: { a: Automation; isAdmin: boolean; onOpen: () => void }) {
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const status = useMutation({
    mutationFn: (s: 'active' | 'paused') => api(`/admin/notifications/automations/${a.id}/status`, { method: 'POST', body: { status: s } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notif-automations'] }); setConfirm(false); },
  });
  const on = a.status === 'active';
  return (
    <Card className={`space-y-2 ${on ? '' : 'bg-slate-50'}`}>
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={onOpen} className="text-left">
          <div className="text-sm font-semibold text-slate-900 hover:underline">{a.name}</div>
          <div className="font-mono text-[11px] text-slate-500">{a.code}</div>
        </button>
        <Toggle checked={on} disabled={!isAdmin || status.isPending} onChange={() => setConfirm(true)} label={`${a.name} aç/kapat`} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <CategoryBadge category={a.category} />
        <Pill label={a.triggerType === 'schedule' ? a.scheduleSummary : a.scheduleSummary} cls="bg-indigo-50 text-indigo-700" />
        <Pill label={channelsText(a.channels)} cls="bg-slate-100 text-slate-700" />
      </div>
      <p className="text-xs text-slate-600">Koşul: {a.conditionsSummary}{a.hasPayloadFilter ? ' · olay süzgeci' : ''}</p>
      <p className="truncate text-xs text-slate-500" title={a.title}>“{a.title}”</p>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>7 gün: {fmtInt(a.sent7d ?? 0)} gönderim · {fmtInt(a.opened7d ?? 0)} açılma</span>
        <span>{a.lastRun ? `son koşu ${fmtDate(a.lastRun.startedAt)}` : 'henüz koşmadı'}</span>
      </div>
      {a.lastError && <p className="rounded bg-red-50 px-2 py-1 text-xs text-red-700">Hata: {a.lastError}</p>}
      {status.error && <ErrorBox error={status.error} />}
      <ConfirmDialog
        open={confirm}
        title={on ? `${a.name} — kapat` : `${a.name} — aç`}
        body={on ? 'Otomasyon durur; bekleyen kuyruk ttl içinde tamamlanır.' : 'Açılış anından önceki olaylar işlenmiş sayılır (geriye dönük gönderim yok). Zamanlı otomasyon bir sonraki vadede koşar.'}
        confirmLabel={on ? 'Kapat' : 'Aç'}
        danger={!on}
        busy={status.isPending}
        onConfirm={() => status.mutate(on ? 'paused' : 'active')}
        onClose={() => setConfirm(false)}
      />
    </Card>
  );
}

type Form = {
  name: string; title: string; body: string; ctaLabel: string; emailSubject: string; emailBody: string; channels: Channel[]; priority: Priority;
  schedule: AutomationSchedule | null; conditions: Group; delayMinutes: string; cooldownHours: string; maxPerUserPerDay: string; ttlHours: string;
  respectQuietHours: boolean; countTowardCaps: boolean;
};
const toForm = (a: Automation): Form => ({
  name: a.name, title: a.title, body: a.body, ctaLabel: a.ctaLabel ?? '', emailSubject: a.emailSubject ?? '', emailBody: a.emailBody ?? '',
  channels: a.channels, priority: a.priority, schedule: 'kind' in a.schedule ? (a.schedule as AutomationSchedule) : null,
  conditions: isGroupLike(a.conditions) ? (a.conditions as Group) : { op: 'and', rules: [] },
  delayMinutes: String(a.delayMinutes), cooldownHours: String(a.cooldownHours), maxPerUserPerDay: String(a.maxPerUserPerDay), ttlHours: String(a.ttlHours),
  respectQuietHours: a.respectQuietHours, countTowardCaps: a.countTowardCaps,
});
const isGroupLike = (c: unknown): c is Group => !!c && typeof c === 'object' && Array.isArray((c as Group).rules);

/** Sağ panel: düzenleme + prova + koşu geçmişi (editor düzenler, admin açar/kapatır/şimdi çalıştırır). */
function AutomationDrawer({ id, isAdmin, onClose }: { id: string; isAdmin: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['notif-automation', id], queryFn: () => api<Automation>(`/admin/notifications/automations/${id}`) });
  const segments = useQuery({ queryKey: ['notif-segments'], queryFn: () => api<{ items: Segment[]; fields: Record<string, SegmentField> }>('/admin/notifications/segments') });
  const [form, setForm] = useState<Form | null>(null);
  const [preview, setPreview] = useState<AutomationPreview | null>(null);
  const [tab, setTab] = useState<'edit' | 'runs'>('edit');
  const f = form ?? (q.data ? toForm(q.data) : null);
  const invalidate = () => { qc.invalidateQueries({ queryKey: ['notif-automation', id] }); qc.invalidateQueries({ queryKey: ['notif-automations'] }); };
  const save = useMutation({
    mutationFn: () => api(`/admin/notifications/automations/${id}`, {
      method: 'PATCH',
      body: {
        name: f!.name, title: f!.title, body: f!.body, ctaLabel: f!.ctaLabel || null, emailSubject: f!.emailSubject || null, emailBody: f!.emailBody || null,
        channels: f!.channels, priority: f!.priority, ...(q.data?.triggerType === 'schedule' && f!.schedule ? { schedule: f!.schedule } : {}),
        conditions: f!.conditions.rules.length ? f!.conditions : null,
        delayMinutes: Number(f!.delayMinutes), cooldownHours: Number(f!.cooldownHours), maxPerUserPerDay: Number(f!.maxPerUserPerDay), ttlHours: Number(f!.ttlHours),
        respectQuietHours: f!.respectQuietHours, countTowardCaps: f!.countTowardCaps,
      },
    }),
    onSuccess: () => { setForm(null); invalidate(); },
  });
  const prova = useMutation({ mutationFn: () => api<AutomationPreview>(`/admin/notifications/automations/${id}/preview`, { method: 'POST' }), onSuccess: setPreview });
  const run = useMutation({
    mutationFn: (dryRun: boolean) => api<{ evaluated: number; matched: number; queued: number; suppressed: number }>(`/admin/notifications/automations/${id}/run`, { method: 'POST', body: { dryRun } }),
    onSuccess: invalidate,
  });
  const [runConfirm, setRunConfirm] = useState(false);
  const a = q.data;
  const set = (patch: Partial<Form>) => setForm({ ...(f as Form), ...patch });
  const allowed = a ? CATEGORY_CHANNELS[a.category] : [];
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/30" role="dialog" aria-modal="true" aria-label="Otomasyon">
      <button type="button" className="flex-1" aria-label="Kapat" onClick={onClose} />
      <div className="h-full w-full max-w-3xl overflow-y-auto bg-white p-5 shadow-xl">
        {q.isPending || !a || !f ? <Spinner /> : q.isError ? <ErrorBox error={q.error} /> : (
          <>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{a.name}</h2>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Pill {...AUTOMATION_STATUS[a.status]} />
                  <CategoryBadge category={a.category} />
                  <Pill label={a.scheduleSummary} cls="bg-indigo-50 text-indigo-700" />
                  <span className="font-mono text-[11px] text-slate-500">{a.code}</span>
                </div>
                {a.description && <p className="mt-2 text-xs text-slate-600">{a.description}</p>}
              </div>
              <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">Kapat</button>
            </div>
            <div className="mb-4 flex gap-1">
              {(['edit', 'runs'] as const).map((t) => (
                <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-full px-3 py-1.5 text-sm ${tab === t ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                  {t === 'edit' ? 'Düzenle ve prova' : `Koşu geçmişi (${a.runs?.length ?? 0})`}
                </button>
              ))}
            </div>
            {tab === 'runs' ? (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100 text-left text-xs text-slate-500"><th className="py-2">Başlangıç</th><th>Değerlendirilen</th><th>Eşleşen</th><th>Kuyruk</th><th>Bastırılan</th><th>Hata</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {(a.runs ?? []).map((r) => (
                    <tr key={r.id}><td className="py-2">{fmtDate(r.startedAt)}</td><td>{fmtInt(r.evaluated)}</td><td>{fmtInt(r.matched)}</td><td>{fmtInt(r.queued)}</td><td>{fmtInt(r.suppressed)}</td><td className="text-xs text-red-700">{r.error ?? ''}</td></tr>
                  ))}
                  {(a.runs ?? []).length === 0 && <tr><td colSpan={6} className="py-6 text-center text-slate-500">Henüz koşu yok.</td></tr>}
                </tbody>
              </table>
            ) : (
              <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
                <div className="space-y-4">
                  <Field label="Ad"><input className={inputCls} value={f.name} onChange={(e) => set({ name: e.target.value })} /></Field>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Başlık" help="≤ 40 karakter, emoji yok"><input className={inputCls} value={f.title} onChange={(e) => set({ title: e.target.value })} /></Field>
                    <Field label="CTA"><input className={inputCls} value={f.ctaLabel} onChange={(e) => set({ ctaLabel: e.target.value })} /></Field>
                  </div>
                  <Field label="Gövde" help={`Değişkenler: {{ad}} {{streak}} {{kalan_soru}} {{deneme_adi}} {{net}} {{rakip}} {{gerekli_dogru}} {{sinava_kalan_gun}} {{hafta_soru}} {{hafta_dogruluk}} {{rozet}} {{saat}} {{soru_sayisi}} {{sure}} {{sonuc}}`}>
                    <textarea className={inputCls} rows={3} value={f.body} onChange={(e) => set({ body: e.target.value })} />
                  </Field>
                  <Warnings items={a.warnings} />
                  <Field label="Kanallar" help={`Kategori politikası: ${a.policyChannels.map((c) => CHANNEL_LABEL[c]).join(' · ')}`}>
                    <div className="flex flex-wrap gap-2">
                      {allowed.map((c) => (
                        <Chip key={c} label={CHANNEL_LABEL[c]} selected={f.channels.includes(c)} onClick={() => set({ channels: f.channels.includes(c) ? f.channels.filter((x) => x !== c) : [...f.channels, c] })} />
                      ))}
                    </div>
                  </Field>
                  {f.channels.includes('email') && (
                    <div className="grid gap-3">
                      <Field label="E-posta konusu"><input className={inputCls} value={f.emailSubject} onChange={(e) => set({ emailSubject: e.target.value })} /></Field>
                      <Field label="E-posta gövdesi (markdown)" help="{{link}} hedef web yoludur; boşsa push metni kullanılır"><textarea className={inputCls} rows={5} value={f.emailBody} onChange={(e) => set({ emailBody: e.target.value })} /></Field>
                    </div>
                  )}
                  {a.triggerType === 'schedule' ? (
                    <Field label="Takvim (TR saati)">
                      <ScheduleEditor value={f.schedule} onChange={(s) => set({ schedule: s })} />
                    </Field>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="Olay"><input className={inputCls} value={a.eventType ?? ''} disabled /></Field>
                      <Field label="Gecikme (dk)"><input type="number" min={0} className={inputCls} value={f.delayMinutes} onChange={(e) => set({ delayMinutes: e.target.value })} /></Field>
                    </div>
                  )}
                  <Field label="Koşul (kitle tablosu)" help={a.hasPayloadFilter ? 'Ek olarak kod içi olay süzgeci var (örn. hatırlatma türü).' : undefined}>
                    {segments.data ? <RuleBuilder group={f.conditions} fields={segments.data.fields} onChange={(g) => set({ conditions: g })} /> : <Spinner />}
                  </Field>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <Field label="Öncelik">
                      <select className={inputCls} value={f.priority} onChange={(e) => set({ priority: e.target.value as Priority })}>
                        {(['low', 'normal', 'high'] as Priority[]).map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
                      </select>
                    </Field>
                    <Field label="Cooldown (sa)"><input type="number" min={0} className={inputCls} value={f.cooldownHours} onChange={(e) => set({ cooldownHours: e.target.value })} /></Field>
                    <Field label="Günde en çok"><input type="number" min={1} className={inputCls} value={f.maxPerUserPerDay} onChange={(e) => set({ maxPerUserPerDay: e.target.value })} /></Field>
                    <Field label="TTL (sa)"><input type="number" min={1} className={inputCls} value={f.ttlHours} onChange={(e) => set({ ttlHours: e.target.value })} /></Field>
                  </div>
                  <div className="flex flex-wrap gap-5 text-sm">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={f.respectQuietHours} onChange={(e) => set({ respectQuietHours: e.target.checked })} />Sessiz saatlere uy</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={f.countTowardCaps} onChange={(e) => set({ countTowardCaps: e.target.checked })} />Günlük kapıya sayılsın</label>
                  </div>
                  <div className="text-xs text-slate-500">Hedef: {TARGET_LABEL[a.deepLink.target] ?? a.deepLink.target}{a.deepLink.params && Object.keys(a.deepLink.params).length ? ` (${Object.entries(a.deepLink.params).map(([k, v]) => `${k}=${v}`).join(', ')})` : ''} · dönüşüm olayı: {a.conversionEvent ?? '—'}</div>
                  {save.error && <ErrorBox error={save.error} />}
                  {run.error && <ErrorBox error={run.error} />}
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" disabled={!form || save.isPending} onClick={() => save.mutate()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{save.isPending ? 'Kaydediliyor…' : 'Kaydet'}</button>
                    <button type="button" disabled={prova.isPending} onClick={() => prova.mutate()} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">{prova.isPending ? 'Prova…' : 'Prova'}</button>
                    {isAdmin && (
                      <>
                        <button type="button" disabled={run.isPending} onClick={() => run.mutate(true)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Kuru koşu (say)</button>
                        <button type="button" disabled={run.isPending || a.status !== 'active'} onClick={() => setRunConfirm(true)} className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 disabled:opacity-50" title={a.status !== 'active' ? 'Önce otomasyonu aç' : ''}>Şimdi çalıştır</button>
                      </>
                    )}
                    {run.data && <span className="text-xs text-slate-600">Koşu: {run.data.evaluated} değerlendirildi · {run.data.matched} eşleşti · {run.data.queued} kuyruk · {run.data.suppressed} bastırıldı</span>}
                  </div>
                </div>
                <div className="space-y-3">
                  <PhonePreview title={preview?.rendered.title ?? f.title} body={preview?.rendered.body ?? f.body} emailSubject={preview?.rendered.emailSubject ?? f.emailSubject} emailEnabled={f.channels.includes('email')} />
                  {preview && (
                    <Card className="space-y-2 text-xs text-slate-600">
                      <div className="text-sm font-semibold text-slate-900">Prova</div>
                      <div>Koşulu sağlayan kitle: <b>{fmtInt(preview.estimate.total)}</b>{a.triggerType === 'event' ? ` · açılıştan beri olay: ${fmtInt(preview.estimate.pendingEvents)}` : ''}</div>
                      {preview.schedule && <div>Vade: {preview.schedule.due ? 'şimdi' : preview.schedule.fireAt ? fmtDate(preview.schedule.fireAt) : '—'}</div>}
                      <div>Bağlantı: {preview.rendered.linkResolved ? `${preview.rendered.webPath} (min ${preview.rendered.minAppVersion})` : 'örnek yükte parametre yok'}</div>
                      <Warnings items={preview.warnings} />
                      <div className="pt-1 font-semibold">Örnek alıcılar</div>
                      <ul className="space-y-0.5">{preview.sample.map((s, i) => <li key={i}>{s.email} · seri {s.streak} · {s.platforms.join('/') || 'cihaz yok'}</li>)}</ul>
                      {a.triggerType === 'event' && Object.keys(preview.samplePayload).length > 0 && <pre className="overflow-x-auto rounded bg-slate-50 p-2 text-[11px]">{JSON.stringify(preview.samplePayload, null, 1)}</pre>}
                    </Card>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <ConfirmDialog open={runConfirm} title="Şimdi çalıştır" body="Vade beklenmeden koşar; koşulu sağlayan herkese gerçek gönderim yapılır (dedupe anahtarı günlük tekrarı engeller)." confirmLabel="Çalıştır" danger busy={run.isPending} onConfirm={() => { setRunConfirm(false); run.mutate(false); }} onClose={() => setRunConfirm(false)} />
    </div>
  );
}

function ScheduleEditor({ value, onChange }: { value: AutomationSchedule | null; onChange: (s: AutomationSchedule) => void }) {
  const kind = value?.kind ?? 'daily';
  return (
    <div className="flex flex-wrap items-end gap-3">
      <select className={`${inputCls} w-auto`} value={kind} onChange={(e) => {
        const k = e.target.value as AutomationSchedule['kind'];
        onChange(k === 'daily' ? { kind: 'daily', at: value && 'at' in value ? value.at : '09:00' } : k === 'weekly' ? { kind: 'weekly', at: value && 'at' in value ? value.at : '09:00', weekday: 1 } : { kind: 'user_time', field: 'reminderTime', offsetMinutes: 0 });
      }}>
        <option value="daily">Her gün</option><option value="weekly">Haftalık</option><option value="user_time">Kullanıcının hatırlatma saati</option>
      </select>
      {value?.kind === 'weekly' && (
        <select className={`${inputCls} w-auto`} value={value.weekday} onChange={(e) => onChange({ ...value, weekday: Number(e.target.value) })}>
          {WEEKDAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
        </select>
      )}
      {(value?.kind === 'daily' || value?.kind === 'weekly') && <input type="time" className={`${inputCls} w-auto`} value={value.at} onChange={(e) => onChange({ ...value, at: e.target.value })} />}
      {value?.kind === 'user_time' && (
        <label className="text-sm">Ofset (dk) <input type="number" min={-720} max={720} step={30} className={`${inputCls} ml-2 w-28`} value={value.offsetMinutes} onChange={(e) => onChange({ ...value, offsetMinutes: Number(e.target.value) })} /></label>
      )}
    </div>
  );
}

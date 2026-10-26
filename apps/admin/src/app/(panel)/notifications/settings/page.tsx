'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { useIsAdmin } from '@/components/notifications/campaign-form';
import { ConfirmDialog, Field, Pill, Toggle, inputCls } from '@/components/notifications/ui';
import type { AdminSettings, Tester } from '../types';

const K = { kill: 'notifications.kill_switch', daily: 'notifications.daily_cap', marketing: 'notifications.marketing_daily_cap', decay: 'notifications.decay_weekly_cap', env: 'notifications.environment' };
const RET: [string, string][] = [['inbox', 'Kutu'], ['deliveries', 'Teslim (ham)'], ['events', 'Olaylar'], ['staleDevices', 'Görünmeyen cihaz → stale'], ['inactiveDevices', 'Pasif cihaz silinir']];

/** Ayarlar (Doc 52 §12): kapılar, sönüm, saklama, testerlar, ortam, kill switch. Sınav takvimi F2. */
export default function NotificationSettingsPage() {
  const qc = useQueryClient();
  const isAdmin = useIsAdmin();
  const [email, setEmail] = useState('');
  const [killConfirm, setKillConfirm] = useState(false);
  const [form, setForm] = useState<{ dailyCap: string; marketingDailyCap: string; decayWeeklyCap: string; environment: string; retention: Record<string, string> } | null>(null);
  const s = useQuery({ queryKey: ['notif-settings'], queryFn: () => api<AdminSettings>('/admin/notifications/settings') });
  const testers = useQuery({ queryKey: ['notif-testers'], queryFn: () => api<Tester[]>('/admin/notifications/testers'), enabled: isAdmin });
  const current = form ?? (s.data ? {
    dailyCap: s.data.values[K.daily] ?? String(s.data.defaults.dailyCap), marketingDailyCap: s.data.values[K.marketing] ?? String(s.data.defaults.marketingDailyCap),
    decayWeeklyCap: s.data.values[K.decay] ?? String(s.data.defaults.decayWeeklyCap), environment: s.data.values[K.env] ?? '',
    retention: Object.fromEntries(Object.entries(s.data.retention).map(([k, v]) => [k, String(v)])),
  } : null);
  const save = useMutation({
    mutationFn: () => api('/admin/notifications/settings', { method: 'PUT', body: { dailyCap: Number(current!.dailyCap), marketingDailyCap: Number(current!.marketingDailyCap), decayWeeklyCap: Number(current!.decayWeeklyCap), environment: current!.environment, retention: Object.fromEntries(Object.entries(current!.retention).map(([k, v]) => [k, Number(v)])) } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notif-settings'] }); qc.invalidateQueries({ queryKey: ['notif-overview'] }); setForm(null); },
  });
  const kill = useMutation({ mutationFn: (enabled: boolean) => api('/admin/notifications/kill-switch', { method: 'POST', body: { enabled } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['notif-settings'] }); qc.invalidateQueries({ queryKey: ['notif-overview'] }); setKillConfirm(false); } });
  const addTester = useMutation({ mutationFn: () => api('/admin/notifications/testers', { method: 'POST', body: { email } }), onSuccess: () => { setEmail(''); qc.invalidateQueries({ queryKey: ['notif-testers'] }); } });
  const rmTester = useMutation({ mutationFn: (userId: string) => api(`/admin/notifications/testers/${userId}`, { method: 'DELETE' }), onSuccess: () => qc.invalidateQueries({ queryKey: ['notif-testers'] }) });
  const refresh = useMutation({ mutationFn: () => api<{ rows: number }>('/admin/notifications/audience/refresh', { method: 'POST' }), onSuccess: () => qc.invalidateQueries({ queryKey: ['notif-overview'] }) });
  if (s.isPending || !current) return <><PageHeader title="Ayarlar" /><Spinner /></>;
  if (s.isError) return <><PageHeader title="Ayarlar" /><ErrorBox error={s.error} onRetry={() => s.refetch()} /></>;
  const killOn = s.data.values[K.kill] === 'true' || s.data.values[K.kill] === '1';
  const envOk = !current.environment || current.environment === s.data.worker.env;
  const set = (patch: Partial<typeof current>) => setForm({ ...current, ...patch });
  return (
    <div>
      <PageHeader title="Ayarlar" subtitle="Kapılar, sönüm, saklama, testerlar, ortam, kill switch · yazma yalnız admin" />
      {(save.error || kill.error || addTester.error || rmTester.error) && <div className="mb-4"><ErrorBox error={save.error ?? kill.error ?? addTester.error ?? rmTester.error} /></div>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <div><h2 className="text-base font-semibold">Sıklık kapıları</h2><p className="text-xs text-slate-500">Doc 24: günde en fazla 1 hatırlatma; sistem ve kritik kapı dışı.</p></div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Günlük kapı"><input type="number" min={0} className={inputCls} value={current.dailyCap} onChange={(e) => set({ dailyCap: e.target.value })} disabled={!isAdmin} /></Field>
            <Field label="Pazarlama günlük"><input type="number" min={0} className={inputCls} value={current.marketingDailyCap} onChange={(e) => set({ marketingDailyCap: e.target.value })} disabled={!isAdmin} /></Field>
            <Field label="Sönüm: haftada"><input type="number" min={0} className={inputCls} value={current.decayWeeklyCap} onChange={(e) => set({ decayWeeklyCap: e.target.value })} disabled={!isAdmin} /></Field>
          </div>
          <p className="text-xs text-slate-500">7 gün dokunulmamış push → haftada 2 · 30 gün → yalnız haftalık e-posta (engagementTier). Kutu ve e-posta etkilenmez.</p>
        </Card>
        <Card className="space-y-3">
          <div><h2 className="text-base font-semibold">Sessiz saat ve varsayılan saat</h2><p className="text-xs text-slate-500">Kullanıcı kendi tercihinde değiştirir.</p></div>
          <div className="grid grid-cols-3 gap-3 text-sm"><div><div className="text-[11px] font-semibold uppercase text-slate-500">Başlangıç</div>23:00</div><div><div className="text-[11px] font-semibold uppercase text-slate-500">Bitiş</div>08:00</div><div><div className="text-[11px] font-semibold uppercase text-slate-500">Hatırlatma</div>19:00</div></div>
          <p className="text-xs text-slate-500">Sessiz saatte yüksek öncelik ertelenir, normal/düşük ttl içinde ertelenir yoksa düşer; yalnız kritik (sistem) deler. Varsayılanlar sunucu kodunda (Doc 52 karar 12).</p>
        </Card>
        <Card className="space-y-3">
          <div><h2 className="text-base font-semibold">Saklama süreleri (gün)</h2><p className="text-xs text-slate-500">Gece 04.25 temizliği · günlük özet süresiz.</p></div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{RET.map(([k, l]) => <Field key={k} label={l}><input type="number" min={1} className={inputCls} value={current.retention[k] ?? ''} onChange={(e) => set({ retention: { ...current.retention, [k]: e.target.value } })} disabled={!isAdmin} /></Field>)}</div>
        </Card>
        <Card className="space-y-3">
          <div><h2 className="text-base font-semibold">Testerlar</h2><p className="text-xs text-slate-500">E-postayla işaretlenir; aktif cihazları otomatik test listesine girer.</p></div>
          {!isAdmin ? <p className="text-sm text-slate-500">Tester listesini admin yönetir.</p> : (
            <>
              {(testers.data ?? []).map((t) => (
                <div key={t.userId} className="flex items-start justify-between gap-3 text-sm">
                  <div><div className="font-medium">{t.email}</div><div className="text-xs text-slate-500">{t.devices.length ? t.devices.map((d) => `${d.platform} (${d.token})`).join(' · ') : 'aktif cihaz yok'}</div></div>
                  <button type="button" onClick={() => rmTester.mutate(t.userId)} className="text-xs text-slate-400 hover:text-red-600" aria-label="Tester kaldır">✕</button>
                </div>
              ))}
              <div className="flex gap-2"><input className={inputCls} placeholder="e-posta ekle" value={email} onChange={(e) => setEmail(e.target.value)} /><button type="button" disabled={!email.includes('@') || addTester.isPending} onClick={() => addTester.mutate()} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50">Ekle</button></div>
            </>
          )}
        </Card>
        <Card className="space-y-3">
          <div><h2 className="text-base font-semibold">Ortam kapısı</h2><p className="text-xs text-slate-500">İşçi, ayar ile NOTIFICATIONS_ENV eşleşmezse hiçbir şey göndermez.</p></div>
          <Field label="Ortam değeri (ayar: notifications.environment)"><input className={inputCls} placeholder="(boş = kapı yok)" value={current.environment} onChange={(e) => set({ environment: e.target.value })} disabled={!isAdmin} /></Field>
          <div className="flex items-center justify-between text-sm"><span className="text-slate-600">İşçi ortamı</span><Pill label={`${s.data.worker.env || '(boş)'} · ${envOk ? 'eşleşiyor' : 'EŞLEŞMİYOR'}`} cls={envOk ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'} /></div>
          <div className="flex items-center justify-between text-sm"><span className="text-slate-600">Sağlayıcı</span><span>{s.data.worker.provider === 'console' ? 'console (yalnız log)' : 'FCM + SES'}</span></div>
          <button type="button" onClick={() => refresh.mutate()} disabled={!isAdmin || refresh.isPending} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50">{refresh.isPending ? 'Yenileniyor…' : refresh.data ? `Kitle yenilendi: ${refresh.data.rows}` : 'Kitle tablosunu şimdi yenile'}</button>
        </Card>
        <Card className="border-dashed bg-slate-50"><h2 className="text-base font-semibold text-slate-600">Sınav takvimi (F2)</h2><p className="text-xs text-slate-500">Resmî sınav tarihleri ve geri sayım otomasyonu ikinci fazda; geri sayım yalnız “yayında + kesin” kayıtlarda çalışır.</p></Card>
      </div>
      {isAdmin && (
        <div className="mt-4 flex justify-end"><button type="button" disabled={save.isPending || !form} onClick={() => save.mutate()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Ayarları kaydet</button></div>
      )}
      <Card className={`mt-4 border-red-200 ${killOn ? 'bg-red-50' : 'bg-red-50/40'}`}>
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="text-base font-semibold text-red-800">Kill switch{killOn ? ' — AÇIK' : ''}</h2><p className="mt-1 text-sm text-red-900/80">Açıldığında kuyruktaki ve yeni bildirimlerin tümü anında durur (kutu satırı da yazılmaz). Yalnız admin; audit notification.kill_switch. Kapatınca ertelenenler ttl içindeyse devam eder.</p></div>
          <Toggle checked={killOn} disabled={!isAdmin || kill.isPending} onChange={() => setKillConfirm(true)} label="Kill switch" />
        </div>
      </Card>
      <ConfirmDialog open={killConfirm} title={killOn ? 'Kill switch’i kapat' : 'Kill switch’i aç'} body={killOn ? 'Gönderim yeniden başlar; kuyruktaki ttl içindeki teslimler devam eder.' : 'Tüm bildirim gönderimi anında durur. Kuyruk bekler, yeni bildirimler düşer.'} confirmLabel={killOn ? 'Kapat' : 'Aç'} danger={!killOn} busy={kill.isPending} onConfirm={() => kill.mutate(!killOn)} onClose={() => setKillConfirm(false)} />
    </div>
  );
}

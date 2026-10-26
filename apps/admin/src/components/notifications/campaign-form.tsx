'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Card, ErrorBox } from '@/components/ui';
import { api } from '@/lib/api';
import {
  CATEGORY_CHANNELS, CATEGORY_LABEL, CHANNEL_LABEL, PRIORITY_LABEL, TARGET_LABEL, fmtInt,
  type Campaign, type Category, type Channel, type Estimate, type Group, type LinkOptions, type Preview, type Priority, type SegmentField, type Segment, type Template, type Tester,
} from '@/app/(panel)/notifications/types';
import { PhonePreview } from './phone-preview';
import { RuleBuilder } from './rule-builder';
import { Chip, ConfirmDialog, Field, Toggle, Warnings, inputCls } from './ui';

export type CampaignFormValue = {
  name: string; category: Category; priority: Priority; channels: Channel[]; title: string; body: string; imageUrl: string; ctaLabel: string;
  target: string; targetParam: string; emailSubject: string; emailBody: string; templateId: string;
  audienceMode: 'all' | 'segment' | 'users' | 'testers'; segmentId: string; rules: Group; userIds: string;
  sendMode: 'now' | 'scheduled'; scheduledAt: string; conversionEvent: string; attributionWindowHours: number;
  respectQuietHours: boolean; countTowardCaps: boolean; ttlHours: number;
};

const VARIABLES = ['ad', 'deneme_adi', 'sinava_kalan_gun', 'streak', 'hafta_soru', 'hafta_dogruluk'];
const CONVERSIONS = ['', 'session_completed', 'exam_started', 'exam_review', 'daily_question_completed', 'legislation_opened'];
const EMOJI = /\p{Extended_Pictographic}/u;

export function emptyForm(): CampaignFormValue {
  return {
    name: '', category: 'exam', priority: 'normal', channels: ['push', 'inbox'], title: '', body: '', imageUrl: '', ctaLabel: '',
    target: 'home', targetParam: '', emailSubject: '', emailBody: '', templateId: '',
    audienceMode: 'all', segmentId: '', rules: { op: 'and', rules: [] }, userIds: '',
    sendMode: 'now', scheduledAt: '', conversionEvent: '', attributionWindowHours: 24, respectQuietHours: true, countTowardCaps: true, ttlHours: 24,
  };
}

export function fromCampaign(c: Campaign): CampaignFormValue {
  const v = c.variant;
  const param = v?.deepLink?.params ? Object.values(v.deepLink.params)[0] ?? '' : '';
  return {
    ...emptyForm(),
    name: c.name, category: c.category, priority: c.priority, channels: c.channels, title: v?.title ?? '', body: v?.body ?? '',
    imageUrl: v?.imageUrl ?? '', ctaLabel: v?.ctaLabel ?? '', target: v?.deepLink?.target ?? 'home', targetParam: param,
    emailSubject: v?.emailSubject ?? '', emailBody: v?.emailBody ?? '', templateId: v?.templateId ?? '',
    audienceMode: c.audienceMode, segmentId: c.segmentId ?? '', rules: c.segmentRulesSnapshot ?? { op: 'and', rules: [] }, userIds: c.userIds.join('\n'),
    sendMode: c.sendMode === 'scheduled' ? 'scheduled' : 'now', scheduledAt: c.scheduledAt ? c.scheduledAt.slice(0, 16) : '',
    conversionEvent: c.conversionEvent ?? '', attributionWindowHours: c.attributionWindowHours, respectQuietHours: c.respectQuietHours,
    countTowardCaps: c.countTowardCaps, ttlHours: c.ttlHours,
  };
}

function toPayload(f: CampaignFormValue, params: { target: string; param: string | null }[]) {
  const p = params.find((t) => t.target === f.target)?.param;
  return {
    name: f.name.trim(), category: f.category, priority: f.priority, channels: f.channels, title: f.title.trim(), body: f.body.trim(),
    imageUrl: f.imageUrl.trim() || null, ctaLabel: f.ctaLabel.trim() || null,
    deepLink: { target: f.target, params: p ? { [p]: f.targetParam.trim() } : {} },
    emailSubject: f.channels.includes('email') ? f.emailSubject.trim() || null : null,
    emailBody: f.channels.includes('email') ? f.emailBody.trim() || null : null,
    templateId: f.templateId || null,
    audienceMode: f.audienceMode, segmentId: f.audienceMode === 'segment' && f.segmentId ? f.segmentId : null,
    segmentRules: f.audienceMode === 'segment' && !f.segmentId ? f.rules : undefined,
    userIds: f.audienceMode === 'users' ? f.userIds.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean) : [],
    sendMode: f.sendMode, scheduledAt: f.sendMode === 'scheduled' && f.scheduledAt ? new Date(f.scheduledAt).toISOString() : null,
    conversionEvent: f.conversionEvent || null, attributionWindowHours: f.attributionWindowHours,
    respectQuietHours: f.respectQuietHours, countTowardCaps: f.countTowardCaps, ttlHours: f.ttlHours,
  };
}

/** Yeni Bildirim / kampanya düzenleme formu (Doc 52 §12 "Yeni Bildirim"): üç sütun + alt çubuk. */
export function CampaignForm({ initial, campaignId, isAdmin }: { initial: CampaignFormValue; campaignId: string | null; isAdmin: boolean }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [f, setF] = useState<CampaignFormValue>(initial);
  // İlk kayıtta sayfa değişmez: kimlik state'te tutulur, adres sessizce güncellenir (prova/test sonucu ekranda kalsın).
  const [id, setId] = useState<string | null>(campaignId);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [confirm, setConfirm] = useState<'send' | 'schedule' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const set = <K extends keyof CampaignFormValue>(k: K, v: CampaignFormValue[K]) => setF((s) => ({ ...s, [k]: v }));

  const links = useQuery({ queryKey: ['notif-link-options', f.target], queryFn: () => api<LinkOptions>(`/admin/notifications/link-options?target=${f.target}`) });
  const segments = useQuery({ queryKey: ['notif-segments'], queryFn: () => api<{ items: Segment[]; fields: Record<string, SegmentField> }>('/admin/notifications/segments') });
  const templates = useQuery({ queryKey: ['notif-templates'], queryFn: () => api<{ items: Template[] }>('/admin/notifications/templates') });
  const testers = useQuery({ queryKey: ['notif-testers'], queryFn: () => api<Tester[]>('/admin/notifications/testers'), enabled: isAdmin });

  const allowed = CATEGORY_CHANNELS[f.category];
  const setCategory = (category: Category) =>
    setF((s) => ({ ...s, category, channels: s.channels.filter((c) => CATEGORY_CHANNELS[category].includes(c)) }));

  const estimateBody = useMemo(
    () => ({ category: f.category, audienceMode: f.audienceMode, segmentId: f.audienceMode === 'segment' && f.segmentId ? f.segmentId : null,
      segmentRules: f.audienceMode === 'segment' && !f.segmentId ? f.rules : undefined, channels: f.channels,
      userIds: f.audienceMode === 'users' ? f.userIds.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean) : [] }),
    [f.category, f.audienceMode, f.segmentId, f.rules, f.channels, f.userIds],
  );
  const estimate = useQuery({
    queryKey: ['notif-estimate', estimateBody],
    queryFn: () => api<Estimate>('/admin/notifications/campaigns/estimate', { method: 'POST', body: estimateBody }),
    enabled: f.audienceMode !== 'users' || estimateBody.userIds.length > 0,
  });

  const warnings = useMemo(() => {
    const w: { code: string; message: string }[] = [];
    if (f.title.length > 40) w.push({ code: 'title', message: `Başlık ${f.title.length}/40 karakter.` });
    if (f.body.length > 150) w.push({ code: 'body', message: `Gövde ${f.body.length}/150 karakter; Android 2 satırdan sonra kısaltır.` });
    if (EMOJI.test(f.title) || EMOJI.test(f.body)) w.push({ code: 'emoji', message: 'Bildirim metninde emoji kullanılmaz (Doc 52 karar 10).' });
    if (f.priority === 'critical' && f.category !== 'system') w.push({ code: 'critical', message: 'Kritik öncelik yalnız sistem kategorisinde; başka kategoride yükseğe iner.' });
    return w;
  }, [f.title, f.body, f.priority, f.category]);

  const save = useMutation({
    mutationFn: async () => {
      const body = toPayload(f, links.data?.targets ?? []);
      return id
        ? api<Campaign>(`/admin/notifications/campaigns/${id}`, { method: 'PUT', body })
        : api<Campaign>('/admin/notifications/campaigns', { method: 'POST', body });
    },
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['notif-campaigns'] });
      setNotice('Taslak kaydedildi.');
      if (!id) {
        setId(c.id);
        window.history.replaceState(null, '', `/notifications/campaigns/${c.id}/edit`);
      }
    },
  });
  const doPreview = useMutation({
    mutationFn: async () => {
      const c = await save.mutateAsync();
      return api<Preview>(`/admin/notifications/campaigns/${c.id}/preview`, { method: 'POST' });
    },
    onSuccess: (p) => setPreview(p),
  });
  const testSend = useMutation({
    mutationFn: async () => {
      const c = await save.mutateAsync();
      return api<{ sent: number }>(`/admin/notifications/campaigns/${c.id}/test`, { method: 'POST' });
    },
    onSuccess: (r) => setNotice(`Test gönderildi: ${r.sent} tester.`),
  });
  const send = useMutation({
    mutationFn: async (action: 'send_now' | 'schedule') => {
      const c = await save.mutateAsync();
      const est = await api<Estimate>('/admin/notifications/campaigns/estimate', { method: 'POST', body: estimateBody });
      return api<Campaign>(`/admin/notifications/campaigns/${c.id}/status`, {
        method: 'POST', body: { action, confirmedRecipients: est.total, scheduledAt: action === 'schedule' ? new Date(f.scheduledAt).toISOString() : undefined },
      });
    },
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['notif-campaigns'] });
      setConfirm(null);
      router.push(`/notifications/campaigns/${c.id}`);
    },
  });

  const busy = save.isPending || doPreview.isPending || testSend.isPending || send.isPending;
  const err = save.error ?? doPreview.error ?? testSend.error ?? send.error;
  const param = links.data?.targets.find((t) => t.target === f.target)?.param ?? null;
  const emailOn = f.channels.includes('email');
  const canSend = f.name.trim().length >= 2 && f.title.trim().length >= 2 && f.body.trim().length >= 2 && !warnings.some((w) => w.code === 'emoji');

  return (
    <div className="space-y-4">
      {err && <ErrorBox error={err} />}
      {notice && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</div>}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)_minmax(0,0.9fr)]">
        {/* İçerik */}
        <Card className="space-y-4">
          <div>
            <h2 className="text-base font-semibold">İçerik</h2>
            <p className="text-xs text-slate-500">Kategori, kanal politikasını belirler.</p>
          </div>
          <Field label="Kampanya adı">
            <input className={inputCls} value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Haftalık Deneme 13 duyurusu" />
          </Field>
          <Field label="Kategori">
            <select className={inputCls} value={f.category} onChange={(e) => setCategory(e.target.value as Category)}>
              {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
                <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
              ))}
            </select>
          </Field>
          <Field label="Kanallar" help={f.category === 'marketing' ? 'Pazarlama kategorisinde push kapalıdır (Doc 26).' : undefined}>
            <div className="flex gap-4">
              {(['push', 'inbox', 'email'] as Channel[]).map((c) => (
                <label key={c} className={`flex items-center gap-2 text-sm ${allowed.includes(c) ? '' : 'text-slate-400'}`}>
                  <input type="checkbox" disabled={!allowed.includes(c)} checked={f.channels.includes(c)} onChange={(e) => set('channels', e.target.checked ? [...f.channels, c] : f.channels.filter((x) => x !== c))} />
                  {CHANNEL_LABEL[c]}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Şablon">
            <select
              className={inputCls}
              value={f.templateId}
              onChange={(e) => {
                const t = templates.data?.items.find((x) => x.id === e.target.value);
                set('templateId', e.target.value);
                if (t) setF((s) => ({ ...s, templateId: t.id, category: t.category, channels: s.channels.filter((c) => CATEGORY_CHANNELS[t.category].includes(c)), title: t.title, body: t.body, imageUrl: t.imageUrl ?? '', ctaLabel: t.ctaLabel ?? '', target: t.deepLink?.target ?? 'home', emailSubject: t.emailSubject ?? '', emailBody: t.emailBody ?? '', priority: t.defaultPriority }));
              }}
            >
              <option value="">— şablonsuz —</option>
              {templates.data?.items.filter((t) => t.status === 'active').map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
              ))}
            </select>
          </Field>
          <Field label="Başlık" help={`${f.title.length} / 40 karakter · emoji yok`}>
            <input className={inputCls} value={f.title} onChange={(e) => set('title', e.target.value)} />
          </Field>
          <Field label="Gövde" help={`${f.body.length} / 150 karakter · Android 2 satırdan sonra kısaltır`}>
            <textarea className={`${inputCls} min-h-24`} value={f.body} onChange={(e) => set('body', e.target.value)} />
          </Field>
          <Field label="Değişkenler">
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.map((v) => (
                <Chip key={v} label={`{{${v}}}`} onClick={() => set('body', `${f.body}{{${v}}}`)} />
              ))}
            </div>
          </Field>
          <Field label="CTA etiketi (isteğe bağlı)">
            <input className={inputCls} value={f.ctaLabel} onChange={(e) => set('ctaLabel', e.target.value)} placeholder="Denemeyi gör" />
          </Field>
          <Field label="Dokununca açılacak ekran" help={param ? `Parametre: ${param} · min sürüm ${links.data?.targets.find((t) => t.target === f.target)?.minAppVersion ?? ''}` : undefined}>
            <div className="grid gap-2 sm:grid-cols-2">
              <select className={inputCls} value={f.target} onChange={(e) => { set('target', e.target.value); set('targetParam', ''); }}>
                {(links.data?.targets ?? [{ target: 'home', param: null, minAppVersion: '' }]).map((t) => (
                  <option key={t.target} value={t.target}>{TARGET_LABEL[t.target] ?? t.target}</option>
                ))}
              </select>
              {param && (links.data?.options.length ? (
                <select className={inputCls} value={f.targetParam} onChange={(e) => set('targetParam', e.target.value)}>
                  <option value="">— seç —</option>
                  {links.data.options.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input className={inputCls} value={f.targetParam} onChange={(e) => set('targetParam', e.target.value)} placeholder={param} />
              ))}
            </div>
          </Field>
          {emailOn ? (
            <div className="space-y-3 rounded-lg bg-slate-50 p-3">
              <Field label="E-posta konusu"><input className={inputCls} value={f.emailSubject} onChange={(e) => set('emailSubject', e.target.value)} placeholder="Boşsa başlık kullanılır" /></Field>
              <Field label="E-posta gövdesi (markdown)"><textarea className={`${inputCls} min-h-24`} value={f.emailBody} onChange={(e) => set('emailBody', e.target.value)} placeholder="Boşsa gövde metni + CTA bağlantısı" /></Field>
            </div>
          ) : (
            <div className="rounded-lg bg-slate-100 p-3 text-xs text-slate-600">
              <div className="font-medium text-slate-700">E-posta kanalı kapalı</div>
              Açılırsa konu ve markdown gövde burada görünür; şablonun e-posta sürümü kullanılır.
            </div>
          )}
          <Warnings items={warnings} />
        </Card>

        {/* Hedefleme */}
        <Card className="space-y-4">
          <div>
            <h2 className="text-base font-semibold">Hedefleme</h2>
            <p className="text-xs text-slate-500">Kitle tablosu saatlik yenilenir.</p>
          </div>
          <div className="space-y-2">
            {([
              ['all', 'Herkes', 'aktif hesaplar'],
              ['segment', 'Segment / kural kurucu', 'kayıtlı segment ya da VE/VEYA ağacı'],
              ['users', 'Kullanıcı listesi', 'en çok 500 kullanıcı id'],
              ['testers', 'Testerlar', 'Ayarlar › Testerlar'],
            ] as const).map(([k, l, s]) => (
              <label key={k} className="flex items-start gap-2 text-sm">
                <input type="radio" className="mt-1" checked={f.audienceMode === k} onChange={() => set('audienceMode', k)} />
                <span><span className="font-medium">{l}</span><span className="block text-xs text-slate-500">{s}</span></span>
              </label>
            ))}
          </div>
          {f.audienceMode === 'segment' && (
            <div className="space-y-3">
              <Field label="Kayıtlı segment">
                <select className={inputCls} value={f.segmentId} onChange={(e) => set('segmentId', e.target.value)}>
                  <option value="">— kural kurucu kullan —</option>
                  {segments.data?.items.filter((s) => s.status === 'active').map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({fmtInt(s.lastCount)})</option>
                  ))}
                </select>
              </Field>
              {!f.segmentId && segments.data && <RuleBuilder group={f.rules} fields={segments.data.fields} onChange={(g) => set('rules', g)} />}
            </div>
          )}
          {f.audienceMode === 'users' && (
            <Field label="Kullanıcı id listesi (satır başına bir)">
              <textarea className={`${inputCls} min-h-24 font-mono text-xs`} value={f.userIds} onChange={(e) => set('userIds', e.target.value)} />
            </Field>
          )}
          {f.audienceMode === 'testers' && (
            <p className="text-xs text-slate-500">{isAdmin ? `${testers.data?.length ?? 0} tester` : 'Tester listesini admin yönetir.'}</p>
          )}
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            {estimate.isFetching ? 'Kitle hesaplanıyor…' : estimate.data ? (
              <>
                <div className="font-semibold">Tahmini kitle: {fmtInt(estimate.data.total)} kişi</div>
                <div className="text-xs">push {fmtInt(estimate.data.push)} · yalnız kutu {fmtInt(estimate.data.inboxOnly)} · e-posta {fmtInt(estimate.data.email)}
                  {estimate.data.refreshedAt ? ` · kitle ${new Date(estimate.data.refreshedAt).toLocaleTimeString('tr-TR', { timeStyle: 'short' })}` : ' · kitle tablosu henüz yenilenmedi'}</div>
              </>
            ) : 'Tahmin için hedef seç.'}
          </div>
          {preview && (
            <div className="space-y-2 text-xs">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Prova · örnek 10 kullanıcı (maskeli)</div>
              {preview.sample.map((s, i) => (
                <div key={i} className="text-slate-600">{s.email} · {s.lastActiveDays ?? '—'} gün · {s.isPremium ? 'premium' : 'ücretsiz'} · {s.platforms.join('/') || 'cihaz yok'}</div>
              ))}
              <div className="rounded-lg border border-slate-200 p-2">
                <div className="font-medium text-slate-800">{preview.rendered.title}</div>
                <div className="text-slate-600">{preview.rendered.body}</div>
                <div className="mt-1 text-slate-500">route {preview.rendered.route || '(aç)'} · web {preview.rendered.webPath}</div>
              </div>
              <Warnings items={preview.warnings} />
            </div>
          )}
        </Card>

        {/* Önizleme */}
        <Card className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">Önizleme</h2>
            <p className="text-xs text-slate-500">Canlı güncellenir.</p>
          </div>
          <PhonePreview title={f.title} body={f.body} emailSubject={f.emailSubject} emailEnabled={emailOn} />
        </Card>
      </div>

      {/* Alt çubuk */}
      <Card className="space-y-3">
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Zamanlama">
            <div className="flex gap-1.5">
              <Chip label="Şimdi" selected={f.sendMode === 'now'} onClick={() => set('sendMode', 'now')} />
              <Chip label="Zamanla" selected={f.sendMode === 'scheduled'} onClick={() => set('sendMode', 'scheduled')} />
              <span className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-400" title="F3">Akıllı (F3)</span>
            </div>
          </Field>
          {f.sendMode === 'scheduled' && (
            <Field label="Tarih · saat (TR)"><input type="datetime-local" className={inputCls} value={f.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} /></Field>
          )}
          <Field label="Öncelik">
            <select className={inputCls} value={f.priority} onChange={(e) => set('priority', e.target.value as Priority)}>
              {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => (
                <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
              ))}
            </select>
          </Field>
          <Field label="Dönüşüm olayı">
            <select className={inputCls} value={f.conversionEvent} onChange={(e) => set('conversionEvent', e.target.value)}>
              {CONVERSIONS.map((c) => (
                <option key={c} value={c}>{c || '— yok —'}</option>
              ))}
            </select>
          </Field>
          <Field label="TTL (saat)"><input type="number" min={1} max={168} className={`${inputCls} w-24`} value={f.ttlHours} onChange={(e) => set('ttlHours', Number(e.target.value))} /></Field>
          <div className="flex items-center gap-2 pb-2 text-sm"><Toggle checked={f.respectQuietHours} onChange={(v) => set('respectQuietHours', v)} label="Sessiz saatlere uy" /> Sessiz saatlere uy</div>
          <div className="flex items-center gap-2 pb-2 text-sm"><Toggle checked={f.countTowardCaps} onChange={(v) => set('countTowardCaps', v)} label="Günlük kapıya sayılsın" /> Günlük kapıya sayılsın</div>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
          <button type="button" disabled={busy} onClick={() => save.mutate()} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50">Taslak kaydet</button>
          <button type="button" disabled={busy || !canSend} onClick={() => doPreview.mutate()} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50">Prova</button>
          <button type="button" disabled={busy || !canSend} onClick={() => testSend.mutate()} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50">Test gönder</button>
          <button
            type="button"
            disabled={busy || !canSend || !isAdmin || (f.sendMode === 'scheduled' && !f.scheduledAt)}
            title={isAdmin ? undefined : 'Gönderme yetkisi yalnız admin'}
            onClick={() => setConfirm(f.sendMode === 'scheduled' ? 'schedule' : 'send')}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {f.sendMode === 'scheduled' ? 'Zamanla' : `Gönder${estimate.data ? ` · ${fmtInt(estimate.data.total)}` : ''}`}
          </button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm === 'schedule' ? 'Kampanyayı zamanla' : 'Kampanyayı gönder'}
        body={
          <>
            <p><strong>{fmtInt(estimate.data?.total ?? 0)}</strong> kişiye {f.channels.map((c) => CHANNEL_LABEL[c]).join(' + ')} olarak{confirm === 'schedule' ? ` ${new Date(f.scheduledAt).toLocaleString('tr-TR')} tarihinde` : ' şimdi'} gönderilecek.</p>
            <p className="mt-1 text-xs">Sessiz saat, günlük kapı ve tercih kuralları kişi başına uygulanır; alıcı sayısı gönderim anında yeniden doğrulanır.</p>
          </>
        }
        confirmLabel={confirm === 'schedule' ? 'Zamanla' : 'Gönder'}
        busy={send.isPending}
        onConfirm={() => send.mutate(confirm === 'schedule' ? 'schedule' : 'send_now')}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}

/** Oturumdaki rol: gönder/iptal düğmeleri yalnız admin. */
export function useIsAdmin() {
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<{ roles: string[] }>('/me'), staleTime: 300_000 });
  return me.data?.roles.includes('admin') ?? false;
}

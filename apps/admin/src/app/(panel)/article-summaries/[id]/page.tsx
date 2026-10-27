'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import { VERIFICATION_LABEL, type ArticleSummaryDetail, type VerificationStatus } from '@/lib/types';

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

/** Düzenleme taslağı: listeler satır başına, yapılı alanlar JSON (editör tek tek alanı görür, bütünü bozmaz). */
interface Draft {
  title: string;
  shortSummary: string;
  detailed: string;
  keyPoints: string;
  conditions: string;
  exceptions: string;
  examReminders: string;
  timeLimits: string;
  numericalValues: string;
  authorityAndLimits: string;
  relatedLegislation: string;
  derivedNumbers: string;
  counterNumbers: string;
}

const lines = (a: string[] | null | undefined) => (a ?? []).join('\n');
const json = (v: unknown) => (Array.isArray(v) && v.length ? JSON.stringify(v, null, 1) : '');

function toDraft(s: ArticleSummaryDetail): Draft {
  return {
    title: s.title,
    shortSummary: s.shortSummary,
    detailed: s.detailed ?? '',
    keyPoints: lines(s.keyPoints),
    conditions: lines(s.conditions),
    exceptions: lines(s.exceptions),
    examReminders: lines(s.examReminders),
    timeLimits: json(s.timeLimits),
    numericalValues: json(s.numericalValues),
    authorityAndLimits: json(s.authorityAndLimits),
    relatedLegislation: json(s.relatedLegislation),
    derivedNumbers: json(s.derivedNumbers),
    counterNumbers: s.counterNumbers.join(', '),
  };
}

function fromDraft(d: Draft): Record<string, unknown> {
  const list = (s: string) =>
    s
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean);
  const parse = (s: string, alan: string) => {
    if (!s.trim()) return [];
    try {
      const v = JSON.parse(s);
      if (!Array.isArray(v)) throw new Error('dizi değil');
      return v;
    } catch (e) {
      throw new Error(`${alan}: geçerli JSON dizisi değil (${(e as Error).message})`);
    }
  };
  return {
    title: d.title.trim(),
    shortSummary: d.shortSummary.trim(),
    detailed: d.detailed.trim() || undefined,
    keyPoints: list(d.keyPoints),
    conditions: list(d.conditions),
    exceptions: list(d.exceptions),
    examReminders: list(d.examReminders),
    timeLimits: parse(d.timeLimits, 'Süreler'),
    numericalValues: parse(d.numericalValues, 'Sayılar'),
    authorityAndLimits: parse(d.authorityAndLimits, 'Yetki ve sınırlar'),
    relatedLegislation: parse(d.relatedLegislation, 'İlgili mevzuat'),
    derivedNumbers: parse(d.derivedNumbers, 'Türetilmiş sayılar'),
    counterNumbers: d.counterNumbers
      .split(/[,\s]+/)
      .filter(Boolean)
      .map(Number)
      .filter((n) => Number.isFinite(n)),
  };
}

/**
 * Madde özeti inceleme ekranı (Doc 54): solda özet alanları (düzenlenebilir), sağda resmî madde metni;
 * altta doğrulama satırları. Her kaydetme sunucuda yeniden doğrulanır; geçmeyen özet kaydedilmez.
 * Yayın/yayından alma/silme yalnız admin; eskimiş ya da "tazeleme gerekli" özet yayınlanamaz.
 */
export default function ArticleSummaryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [me, setMe] = useState<{ roles: string[] } | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [showChecks, setShowChecks] = useState(false);

  useEffect(() => {
    api<{ roles: string[] }>('/me').then(setMe).catch(() => setMe({ roles: [] }));
  }, []);
  const isAdmin = me?.roles.includes('admin') ?? false;

  const q = useQuery({ queryKey: ['admin-article-summary', id], queryFn: () => api<ArticleSummaryDetail>(`/admin/article-summaries/${id}`) });
  const s = q.data;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-article-summary', id] });
    qc.invalidateQueries({ queryKey: ['admin-article-summaries-laws'] });
    qc.invalidateQueries({ queryKey: ['admin-article-summaries-law'] });
    qc.invalidateQueries({ queryKey: ['admin-article-summaries-stale'] });
  };
  const ok = (text: string) => setNotice({ kind: 'ok', text });
  const err = (e: unknown) => setNotice({ kind: 'err', text: e instanceof Error ? e.message : 'Bir şeyler ters gitti.' });

  const save = useMutation({
    mutationFn: (body: unknown) => api(`/admin/article-summaries/${id}`, { method: 'PATCH', body }),
    onSuccess: () => {
      invalidate();
      setEditing(false);
      setDraft(null);
      ok('Özet kaydedildi ve doğrulandı; eskime damgası kalktı.');
    },
    onError: err,
  });
  const verification = useMutation({
    mutationFn: (status: VerificationStatus) => api(`/admin/article-summaries/${id}/verification`, { method: 'POST', body: { status } }),
    onSuccess: () => {
      invalidate();
      ok('Mevzuat doğrulama durumu güncellendi.');
    },
    onError: err,
  });
  const publish = useMutation({
    mutationFn: () => api(`/admin/article-summaries/${id}/publish`, { method: 'POST' }),
    onSuccess: () => {
      invalidate();
      ok('Özet yayınlandı — madde sayfasında ve okuyucuda resmî metnin altında.');
    },
    onError: err,
  });
  const unpublish = useMutation({
    mutationFn: () => api(`/admin/article-summaries/${id}/unpublish`, { method: 'POST' }),
    onSuccess: () => {
      invalidate();
      ok('Yayından alındı (incelemede).');
    },
    onError: err,
  });
  const remove = useMutation({
    mutationFn: () => api(`/admin/article-summaries/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-article-summaries-laws'] });
      router.push(s ? `/article-summaries/law/${s.article.lawSlug}` : '/article-summaries');
    },
    onError: err,
  });

  if (q.isLoading) return <Spinner />;
  if (q.error || !s) return <ErrorBox error={q.error ?? new Error('Özet bulunamadı.')} onRetry={() => q.refetch()} />;

  const canPublish = isAdmin && s.status !== 'published' && !s.staleSince && s.validation.ok && s.verificationStatus !== 'needs_refresh';
  const publishHint = !isAdmin ? 'Yayın kararı admin yetkisi ister' : s.staleSince ? 'Madde metni tazelenmiş; önce yeniden incele' : !s.validation.ok ? `${s.validation.issues.length} kusur var` : s.verificationStatus === 'needs_refresh' ? 'Tazeleme gerekli' : '';

  const submit = () => {
    if (!draft) return;
    try {
      save.mutate(fromDraft(draft));
    } catch (e) {
      err(e);
    }
  };

  return (
    <div>
      <PageHeader
        title={`${s.article.lawName} — md ${s.article.articleNo}`}
        subtitle={`${s.title} · v${s.version} · ${s.sourceLabel}${s.generatedBy ? ` · ${s.generatedBy}` : ''}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/article-summaries/law/${s.article.lawSlug}`} className="text-sm text-slate-600 hover:underline">
              ← {s.article.lawName.split(' ')[0]}
            </Link>
            <StatusBadge status={s.status} />
            {s.staleSince && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">eskimiş · {fmt(s.staleSince)}</span>}
          </div>
        }
      />

      {notice && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm whitespace-pre-line ${notice.kind === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {notice.text}
          <button onClick={() => setNotice(null)} className="ml-3 underline">
            kapat
          </button>
        </div>
      )}

      {/* Karar şeridi */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-xs text-slate-500">Doğrulama:</span>
          {s.validation.ok ? <span className="font-medium text-emerald-700">geçti</span> : <span className="font-medium text-red-700">{s.validation.issues.length} kusur</span>}
          <button onClick={() => setShowChecks((v) => !v)} className="text-xs text-slate-500 underline">
            {showChecks ? 'satırları gizle' : 'satırları göster'}
          </button>
          <span className="mx-1 text-slate-300">|</span>
          <span className="text-xs text-slate-500">Mevzuat kontrolü:</span>
          <select
            value={s.verificationStatus}
            onChange={(e) => verification.mutate(e.target.value as VerificationStatus)}
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
          >
            {(Object.keys(VERIFICATION_LABEL) as VerificationStatus[]).map((k) => (
              <option key={k} value={k}>
                {VERIFICATION_LABEL[k]}
              </option>
            ))}
          </select>
          {s.verifiedAt && <span className="text-xs text-slate-500">{fmt(s.verifiedAt)}</span>}
          <span className="text-xs text-slate-400">· madde sürümü {s.articleVersionNo ?? '—'} · metin {fmt(s.article.lastVerifiedAt)}</span>
          <div className="ml-auto flex flex-wrap gap-2">
            {s.status !== 'published' ? (
              <button onClick={() => publish.mutate()} disabled={!canPublish || publish.isPending} title={publishHint} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
                Yayınla
              </button>
            ) : (
              <button onClick={() => unpublish.mutate()} disabled={!isAdmin || unpublish.isPending} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
                Yayından al
              </button>
            )}
            {isAdmin && s.status !== 'published' && (
              <button onClick={() => confirm('Bu özet silinsin mi?') && remove.mutate()} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700">
                Sil
              </button>
            )}
          </div>
        </div>
        {showChecks && (
          <ul className="mt-3 max-h-64 overflow-auto rounded-lg bg-slate-50 p-3 font-mono text-xs">
            {s.validation.lines.map((l, i) => (
              <li key={i} className={l.startsWith('✗') ? 'text-red-700' : 'text-slate-600'}>
                {l}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Sol: özet */}
        <div>
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Özet {s.repealed && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">mülga kaydı</span>}</h2>
              {!editing ? (
                <button
                  onClick={() => {
                    setDraft(toDraft(s));
                    setEditing(true);
                  }}
                  className="text-sm text-slate-600 underline"
                >
                  düzenle
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={submit} disabled={save.isPending} className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
                    {save.isPending ? 'Doğrulanıyor…' : 'Kaydet'}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setDraft(null);
                    }}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  >
                    Vazgeç
                  </button>
                </div>
              )}
            </div>

            {editing && draft ? (
              <div className="space-y-3">
                <Field label="Başlık" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} rows={1} />
                <Field label="Kısa özet" value={draft.shortSummary} onChange={(v) => setDraft({ ...draft, shortSummary: v })} rows={3} />
                {!s.repealed && (
                  <>
                    <Field label="Ayrıntılı açıklama (kalın ** ve liste - dışında biçim yok)" value={draft.detailed} onChange={(v) => setDraft({ ...draft, detailed: v })} rows={10} />
                    <Field label="Temel noktalar (satır başına bir)" value={draft.keyPoints} onChange={(v) => setDraft({ ...draft, keyPoints: v })} rows={5} />
                    <Field label="Şartlar (satır başına bir)" value={draft.conditions} onChange={(v) => setDraft({ ...draft, conditions: v })} rows={3} />
                    <Field label="İstisnalar (satır başına bir)" value={draft.exceptions} onChange={(v) => setDraft({ ...draft, exceptions: v })} rows={3} />
                    <Field label="Sınav hatırlatmaları (satır başına bir)" value={draft.examReminders} onChange={(v) => setDraft({ ...draft, examReminders: v })} rows={3} />
                    <Field label='Süreler — JSON [{"label","value","ref"}]' value={draft.timeLimits} onChange={(v) => setDraft({ ...draft, timeLimits: v })} rows={4} mono />
                    <Field label='Sayılar — JSON [{"label","value","ref"}]' value={draft.numericalValues} onChange={(v) => setDraft({ ...draft, numericalValues: v })} rows={4} mono />
                    <Field label='Yetki ve sınırlar — JSON [{"authority","limit","ref"}]' value={draft.authorityAndLimits} onChange={(v) => setDraft({ ...draft, authorityAndLimits: v })} rows={4} mono />
                    <Field label='İlgili mevzuat — JSON [{"law","article","note","verified"}]' value={draft.relatedLegislation} onChange={(v) => setDraft({ ...draft, relatedLegislation: v })} rows={3} mono />
                    <Field label='Türetilmiş sayılar — JSON [{"value","expr","refs"}]' value={draft.derivedNumbers} onChange={(v) => setDraft({ ...draft, derivedNumbers: v })} rows={3} mono />
                    <Field label="Karşı örnek sayılar (virgülle; metinde GEÇMEMELİ)" value={draft.counterNumbers} onChange={(v) => setDraft({ ...draft, counterNumbers: v })} rows={1} mono />
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-base font-semibold">{s.title}</div>
                  <p className="mt-1 text-slate-800">{s.shortSummary}</p>
                </div>
                {!s.repealed && (
                  <>
                    {s.detailed && <Block label="Ayrıntılı açıklama"><p className="whitespace-pre-line text-slate-700">{s.detailed}</p></Block>}
                    <ListBlock label="Temel noktalar" items={s.keyPoints} />
                    <ListBlock label="Şartlar" items={s.conditions} />
                    <RowsBlock label="Süreler" rows={s.timeLimits} />
                    <RowsBlock label="Sayılar" rows={s.numericalValues} />
                    {s.authorityAndLimits && s.authorityAndLimits.length > 0 && (
                      <Block label="Yetki ve sınırlar">
                        <ul className="space-y-1">
                          {s.authorityAndLimits.map((a, i) => (
                            <li key={i}>
                              <span className="font-medium">{a.authority}</span>
                              {a.ref && <span className="ml-1 text-xs text-slate-400">({a.ref})</span>} — <span className="text-slate-700">{a.limit}</span>
                            </li>
                          ))}
                        </ul>
                      </Block>
                    )}
                    <ListBlock label="İstisnalar" items={s.exceptions} />
                    <ListBlock label="Sınav hatırlatmaları" items={s.examReminders} tone="amber" />
                    {s.relatedLegislation && s.relatedLegislation.length > 0 && (
                      <Block label="İlgili mevzuat">
                        <ul className="space-y-1">
                          {s.relatedLegislation.map((r, i) => (
                            <li key={i}>
                              <span className="font-medium">{r.law}</span>
                              {r.article ? ` md ${r.article}` : ''}
                              {r.note && <span className="text-slate-600"> — {r.note}</span>}
                              <span className={`ml-2 rounded px-1.5 py-0.5 text-xs ${r.verified ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{r.verified ? 'doğrulandı' : 'doğrulanmadı'}</span>
                            </li>
                          ))}
                        </ul>
                      </Block>
                    )}
                    {((s.derivedNumbers && s.derivedNumbers.length > 0) || s.counterNumbers.length > 0) && (
                      <Block label="Sayı kanıtı">
                        <div className="font-mono text-xs text-slate-600">
                          {(s.derivedNumbers ?? []).map((d, i) => (
                            <div key={i}>
                              {d.value} = {d.expr}
                              {d.note ? ` · ${d.note}` : ''}
                            </div>
                          ))}
                          {s.counterNumbers.length > 0 && <div>karşı örnek: {s.counterNumbers.join(', ')}</div>}
                        </div>
                      </Block>
                    )}
                  </>
                )}
                <div className="text-xs text-slate-400">
                  Oluşturuldu {fmt(s.createdAt)} · güncellendi {fmt(s.updatedAt)}
                  {s.publishedAt ? ` · yayın ${fmt(s.publishedAt)}` : ''}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Sağ: resmî metin */}
        <div>
          <Card className="sticky top-4">
            <h2 className="text-sm font-semibold">
              Resmî madde metni — md {s.article.articleNo}
              {s.article.title && <span className="ml-2 font-normal text-slate-500">{s.article.title}</span>}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {s.article.sourceUrl ? (
                <a href={s.article.sourceUrl} target="_blank" rel="noreferrer" className="underline">
                  mevzuat.gov.tr
                </a>
              ) : (
                'kaynak yok'
              )}
              {s.article.effectiveInfo ? ` · ${s.article.effectiveInfo}` : ''}
              {s.article.lastVerifiedAt ? ` · ${fmt(s.article.lastVerifiedAt)} itibarıyla` : ''}
            </p>
            <div className="mt-3 max-h-[70vh] overflow-auto whitespace-pre-line text-sm leading-relaxed text-slate-800">{s.article.text}</div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, rows, mono }: { label: string; value: string; onChange: (v: string) => void; rows: number; mono?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        spellCheck={!mono}
        className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm ${mono ? 'font-mono text-xs' : ''}`}
      />
    </label>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      {children}
    </div>
  );
}

function ListBlock({ label, items, tone }: { label: string; items: string[]; tone?: 'amber' }) {
  if (!items.length) return null;
  return (
    <Block label={label}>
      <ul className={`list-disc space-y-1 pl-5 ${tone === 'amber' ? 'rounded-lg border-l-2 border-amber-400 bg-amber-50 py-2 pr-2 text-amber-900' : 'text-slate-700'}`}>
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </Block>
  );
}

function RowsBlock({ label, rows }: { label: string; rows: { label: string; value: string; ref?: string }[] | null }) {
  if (!rows?.length) return null;
  return (
    <Block label={label}>
      <table className="w-full text-sm">
        <tbody className="divide-y divide-slate-100">
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="py-1 pr-3 text-slate-600">{r.label}</td>
              <td className="py-1 pr-3 font-medium">{r.value}</td>
              <td className="py-1 text-xs text-slate-400">{r.ref ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Block>
  );
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import type { LessonAdminDetail, LessonBlock } from '@/lib/types';

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

/**
 * Ders inceleme (Doc 57): solda en son sürümün gövdesi (okuyucu düzeninde), sağda künye, kaynaklar, inceleme
 * kaydı ve doğrulama satırları. Yayın: en son sürüm doğrulamayı geçmeli ve inceleme kaydı dolu olmalı; yalnız admin.
 */
export default function LessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [me, setMe] = useState<{ roles: string[] } | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ title: string; goal: string; sourceLabel: string; readingMinutes: number } | null>(null);
  const [versionNo, setVersionNo] = useState<number | null>(null);
  useEffect(() => {
    api<{ roles: string[] }>('/me').then(setMe).catch(() => setMe({ roles: [] }));
  }, []);
  const isAdmin = me?.roles.includes('admin') ?? false;

  const q = useQuery({ queryKey: ['admin-lesson', id], queryFn: () => api<LessonAdminDetail>(`/admin/lessons/${id}`) });
  const d = q.data;
  const invalidate = () => { qc.invalidateQueries({ queryKey: ['admin-lesson', id] }); qc.invalidateQueries({ queryKey: ['admin-lessons'] }); };
  const ok = (text: string) => setNotice({ kind: 'ok', text });
  const err = (e: unknown) => setNotice({ kind: 'err', text: e instanceof Error ? e.message : 'Bir şeyler ters gitti.' });
  const saveNote = useMutation({ mutationFn: (reviewNote: string) => api(`/admin/lessons/${id}/review-note`, { method: 'PATCH', body: { reviewNote } }), onSuccess: () => { invalidate(); setNote(null); ok('İnceleme kaydı güncellendi.'); }, onError: err });
  const saveMeta = useMutation({ mutationFn: (body: NonNullable<typeof meta>) => api(`/admin/lessons/${id}`, { method: 'PATCH', body }), onSuccess: () => { invalidate(); setMeta(null); ok('Künye güncellendi.'); }, onError: err });
  const publish = useMutation({ mutationFn: () => api<{ version: number }>(`/admin/lessons/${id}/publish`, { method: 'POST' }), onSuccess: (r) => { invalidate(); ok(`Yayınlandı: sürüm ${r.version}. Uygulamada Konu oku › Konu anlatımı altında.`); }, onError: err });
  const unpublish = useMutation({ mutationFn: () => api(`/admin/lessons/${id}/unpublish`, { method: 'POST' }), onSuccess: () => { invalidate(); ok('Yayından alındı (incelemede).'); }, onError: err });

  if (q.isLoading) return <Spinner />;
  if (q.error || !d) return <ErrorBox error={q.error ?? new Error('Ders bulunamadı.')} onRetry={() => q.refetch()} />;
  const latest = d.versions[0] ?? null;
  const shown = d.versions.find((v) => v.versionNo === (versionNo ?? latest?.versionNo)) ?? latest;
  const canPublish = isAdmin && d.validation.ok && (d.status !== 'published' || (latest && latest.versionNo > d.version));
  const publishHint = !isAdmin ? 'Yayın admin yetkisi ister' : !d.validation.ok ? `${d.validation.issues.length} kusur var` : '';

  return (
    <div>
      <PageHeader
        title={d.title}
        subtitle={`${d.section.title} · ders ${d.sortOrder} · ${d.slug} · ${d.sourceLabel}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/lessons" className="text-sm text-slate-600 hover:underline">← Konu Anlatımı</Link>
            <StatusBadge status={d.status} />
            {latest && latest.versionNo > d.version && d.status === 'published' ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">yayında v{d.version}, bekleyen v{latest.versionNo}</span> : null}
          </div>
        }
      />
      {notice && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm whitespace-pre-line ${notice.kind === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {notice.text}<button onClick={() => setNotice(null)} className="ml-3 underline">kapat</button>
        </div>
      )}

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-xs text-slate-500">Doğrulama:</span>
          {d.validation.ok ? <span className="font-medium text-emerald-700">geçti</span> : <span className="font-medium text-red-700">{d.validation.issues.length} kusur</span>}
          <span className="text-xs text-slate-400">· en son sürüm v{d.latestVersionNo ?? '—'} · yayındaki v{d.version} · {d.readingMinutes} dk</span>
          <div className="ml-auto flex gap-2">
            {d.status === 'published' && !(latest && latest.versionNo > d.version) ? (
              <button onClick={() => unpublish.mutate()} disabled={!isAdmin || unpublish.isPending} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">Yayından al</button>
            ) : (
              <button onClick={() => publish.mutate()} disabled={!canPublish || publish.isPending} title={publishHint} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">{latest && latest.versionNo > d.version && d.status === 'published' ? `v${latest.versionNo}'i yayınla` : 'Yayınla'}</button>
            )}
          </div>
        </div>
        <ul className="mt-3 max-h-56 overflow-auto rounded-lg bg-slate-50 p-3 font-mono text-xs">{d.validation.lines.map((l, i) => <li key={i} className={l.startsWith('✗') ? 'text-red-700' : 'text-slate-600'}>{l}</li>)}</ul>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div>
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Gövde {shown ? `· v${shown.versionNo} · ${fmt(shown.createdAt)}` : ''}</h2>
              {d.versions.length > 1 && (
                <select value={shown?.versionNo ?? ''} onChange={(e) => setVersionNo(Number(e.target.value))} className="rounded-lg border border-slate-300 px-2 py-1 text-xs">
                  {d.versions.map((v) => <option key={v.id} value={v.versionNo}>v{v.versionNo}{v.versionNo === d.version && d.status === 'published' ? ' (yayında)' : ''}</option>)}
                </select>
              )}
            </div>
            <p className="mb-4 text-sm text-slate-700"><span className="text-xs font-medium uppercase tracking-wide text-slate-500">Hedef · </span>{d.goal}</p>
            {shown ? shown.body.sections.map((s, i) => (
              <section key={i} className="mb-5">
                <h3 className="mb-2 text-base font-semibold">{s.title}</h3>
                <div className="space-y-3 text-sm text-slate-800">{s.blocks.map((b, j) => <Block key={j} b={b} />)}</div>
              </section>
            )) : <p className="text-sm text-slate-500">Sürüm yok.</p>}
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-semibold">Künye</h2>{!meta ? <button onClick={() => setMeta({ title: d.title, goal: d.goal, sourceLabel: d.sourceLabel, readingMinutes: d.readingMinutes })} className="text-xs underline">düzenle</button> : null}</div>
            {meta ? (
              <div className="space-y-2 text-sm">
                <input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                <textarea value={meta.goal} onChange={(e) => setMeta({ ...meta, goal: e.target.value })} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                <input value={meta.sourceLabel} onChange={(e) => setMeta({ ...meta, sourceLabel: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs" />
                <label className="block text-xs">Okuma süresi (dk)<input type="number" min={1} value={meta.readingMinutes} onChange={(e) => setMeta({ ...meta, readingMinutes: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
                <div className="flex gap-2"><button onClick={() => saveMeta.mutate(meta)} className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white">Kaydet</button><button onClick={() => setMeta(null)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">Vazgeç</button></div>
              </div>
            ) : (
              <dl className="text-sm">
                <dt className="text-xs text-slate-500">Kaynak künyesi (yalnız panel)</dt><dd className="mb-2 font-mono text-xs">{d.sourceLabel}</dd>
                <dt className="text-xs text-slate-500">Bölüm</dt><dd className="mb-2">{d.section.title} · {d.section.isPremium ? 'Premium' : 'Açık'} · <StatusBadge status={d.section.status} /></dd>
                <dt className="text-xs text-slate-500">Oluşturuldu / güncellendi / yayın</dt><dd className="text-xs text-slate-600">{fmt(d.createdAt)} · {fmt(d.updatedAt)} · {fmt(d.publishedAt)}</dd>
              </dl>
            )}
          </Card>
          <Card>
            <h2 className="mb-2 text-sm font-semibold">Kaynaklar</h2>
            <ul className="space-y-1 text-sm">
              {d.sources.map((s) => (
                <li key={s.id} className="flex items-start gap-2">
                  <span className={`mt-0.5 rounded px-1.5 py-0.5 text-xs ${s.kind === 'book' ? 'bg-violet-50 text-violet-700' : s.kind === 'article' ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-600'}`}>{s.kind === 'book' ? 'kitap' : s.kind === 'article' ? 'madde' : 'URL'}</span>
                  <span className="min-w-0 flex-1">{s.url ? <a href={s.url} target="_blank" rel="noreferrer" className="underline">{s.label}</a> : s.label}{s.page ? <span className="ml-1 text-xs text-slate-500">{s.page}</span> : null}<span className="ml-2 text-xs text-slate-400">{s.isPublic ? 'kullanıcıya açık' : 'yalnız panel'}</span></span>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-semibold">İnceleme kaydı (en son sürüm)</h2>{note === null ? <button onClick={() => setNote(latest?.reviewNote ?? '')} className="text-xs underline">düzenle</button> : null}</div>
            <p className="mb-2 text-xs text-slate-500">Kaynak/anlam kontrolü: kim, ne baktı, neyi düzeltti. Yayın kapısı için zorunlu; betik teori ve tarih iddialarını doğrulayamaz.</p>
            {note !== null ? (
              <>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={6} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <div className="mt-2 flex gap-2"><button onClick={() => saveNote.mutate(note)} className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white">Kaydet</button><button onClick={() => setNote(null)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">Vazgeç</button></div>
              </>
            ) : (
              <p className="whitespace-pre-line text-sm text-slate-700">{latest?.reviewNote || <span className="text-red-700">Boş — yayın için doldur.</span>}</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Block({ b }: { b: LessonBlock }) {
  if (b.kind === 'text') return <p className="whitespace-pre-line">{kalin(b.text)}</p>;
  return (
    <table className="w-full text-sm">
      <thead><tr>{b.headers.map((h, i) => <th key={i} className="border-b border-slate-200 py-1 pr-3 text-left text-xs font-medium text-slate-500">{h}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-100">{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="py-1 pr-3 align-top">{c}</td>)}</tr>)}</tbody>
    </table>
  );
}

/** Gövdede yalnız kalın (**…**) ve satır başı liste var; kalını <strong> yapar. */
function kalin(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith('**') && p.endsWith('**') ? <strong key={i} className="font-semibold text-slate-900">{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>));
}

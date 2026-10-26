'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import {
  SUMMARY_BLOCK_LABEL,
  type SummaryBlockDetail,
  type SummaryBlockType,
  type SummaryRow,
  type SummaryUnitDetail,
} from '@/lib/types';

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const TYPE_TONE: Record<SummaryBlockType, string> = {
  concept: 'bg-sky-50 text-sky-700 border-sky-200',
  rule: 'bg-slate-100 text-slate-700 border-slate-200',
  numbers: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  compare: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  trap: 'bg-rose-50 text-rose-700 border-rose-200',
  exam_stats: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  bridge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const ROW_KEYS: Partial<Record<SummaryBlockType, string[]>> = {
  numbers: ['label', 'value'],
  compare: ['aspect', 'left', 'right'],
};
const ROW_HEAD: Record<string, string> = { label: 'Konu', value: 'Değer', aspect: 'Yön', left: 'Sol', right: 'Sağ' };

interface BlockDraft {
  title: string;
  body: string;
  rows: SummaryRow[];
  articleRefs: string;
  counterNumbers: string;
  derivedNumbers: string;
}

function toDraft(b: SummaryBlockDetail): BlockDraft {
  return {
    title: b.title ?? '',
    body: b.body ?? '',
    rows: (b.rows ?? []).map((r) => ({ ...r })),
    articleRefs: b.articleRefs.map((a) => a.no).join(', '),
    counterNumbers: b.counterNumbers.join(', '),
    derivedNumbers: b.derivedNumbers?.length ? JSON.stringify(b.derivedNumbers, null, 1) : '',
  };
}

function parseList(s: string): string[] {
  return s
    .split(/[,\s]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/**
 * Ünite düzenleyici (Doc 53 §4 adım 4): solda kartlar (düzenle, sırala, arşivle, ekle), sağda
 * referans madde metinleri yan yana. Her kaydetme sunucuda yeniden doğrulanır; geçmeyen kart
 * kaydedilmez. Yayın/yayından alma/silme yalnız admin.
 */
export default function SummaryUnitPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [me, setMe] = useState<{ roles: string[] } | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<BlockDraft | null>(null);
  const [showChecks, setShowChecks] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState<SummaryBlockType | null>(null);
  const [metaEdit, setMetaEdit] = useState(false);
  const [meta, setMeta] = useState({ title: '', subtitle: '', readingMinutes: 10, isPremium: false });

  useEffect(() => {
    api<{ roles: string[] }>('/me').then(setMe).catch(() => setMe({ roles: [] }));
  }, []);
  const isAdmin = me?.roles.includes('admin') ?? false;

  const q = useQuery({ queryKey: ['admin-summary', id], queryFn: () => api<SummaryUnitDetail>(`/admin/summaries/${id}`) });
  const unit = q.data;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-summary', id] });
    qc.invalidateQueries({ queryKey: ['admin-summaries'] });
    qc.invalidateQueries({ queryKey: ['admin-summaries-stale'] });
  };
  const ok = (text: string) => setNotice({ kind: 'ok', text });
  const err = (e: unknown) => setNotice({ kind: 'err', text: e instanceof Error ? e.message : 'Bir şeyler ters gitti.' });

  const saveBlock = useMutation({
    mutationFn: ({ blockId, body }: { blockId: string; body: unknown }) =>
      api(`/admin/summaries/blocks/${blockId}`, { method: 'PATCH', body }),
    onSuccess: () => {
      invalidate();
      setEditing(null);
      setDraft(null);
      ok('Kart kaydedildi ve doğrulandı.');
    },
    onError: err,
  });
  const addBlock = useMutation({
    mutationFn: (body: unknown) => api(`/admin/summaries/${id}/blocks`, { method: 'POST', body }),
    onSuccess: () => {
      invalidate();
      setAdding(null);
      setDraft(null);
      ok('Kart eklendi.');
    },
    onError: err,
  });
  const archiveBlock = useMutation({
    mutationFn: (blockId: string) => api(`/admin/summaries/blocks/${blockId}/archive`, { method: 'POST' }),
    onSuccess: () => {
      invalidate();
      ok('Kart arşivlendi.');
    },
    onError: err,
  });
  const reorder = useMutation({
    mutationFn: (blockIds: string[]) => api(`/admin/summaries/${id}/reorder`, { method: 'POST', body: { blockIds } }),
    onSuccess: invalidate,
    onError: err,
  });
  const refreshStats = useMutation({
    mutationFn: () => api<{ totalQuestions: number }>(`/admin/summaries/${id}/refresh-stats`, { method: 'POST' }),
    onSuccess: (r) => {
      invalidate();
      ok(`İstatistikler yenilendi: ${r.totalQuestions} bağlı soru.`);
    },
    onError: err,
  });
  const publish = useMutation({
    mutationFn: () => api(`/admin/summaries/${id}/publish`, { method: 'POST' }),
    onSuccess: () => {
      invalidate();
      ok('Ünite yayınlandı.');
    },
    onError: err,
  });
  const unpublish = useMutation({
    mutationFn: () => api(`/admin/summaries/${id}/unpublish`, { method: 'POST' }),
    onSuccess: () => {
      invalidate();
      ok('Ünite yayından alındı (incelemede).');
    },
    onError: err,
  });
  const remove = useMutation({
    mutationFn: () => api(`/admin/summaries/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-summaries'] });
      router.push('/summaries');
    },
    onError: err,
  });
  const updateMeta = useMutation({
    mutationFn: (body: unknown) => api(`/admin/summaries/${id}`, { method: 'PATCH', body }),
    onSuccess: () => {
      invalidate();
      setMetaEdit(false);
      ok('Ünite bilgileri kaydedildi.');
    },
    onError: err,
  });

  const articleByNo = useMemo(() => new Map((unit?.articles ?? []).map((a) => [a.no, a])), [unit?.articles]);

  if (q.isLoading) return <Spinner />;
  if (q.error || !unit) return <ErrorBox error={q.error ?? new Error('Ünite yok')} onRetry={() => q.refetch()} />;

  const startEdit = (b: SummaryBlockDetail) => {
    setAdding(null);
    setEditing(b.id);
    setDraft(toDraft(b));
  };
  const startAdd = (type: SummaryBlockType) => {
    setEditing(null);
    setAdding(type);
    setDraft({ title: '', body: '', rows: ROW_KEYS[type] ? [{ ...Object.fromEntries(ROW_KEYS[type]!.map((k) => [k, ''])), refs: [] }] : [], articleRefs: '', counterNumbers: '', derivedNumbers: '' });
  };
  const draftBody = (type: SummaryBlockType) => {
    if (!draft) return null;
    let derivedNumbers: unknown = null;
    if (draft.derivedNumbers.trim()) {
      try {
        derivedNumbers = JSON.parse(draft.derivedNumbers);
      } catch {
        setNotice({ kind: 'err', text: 'Türetilmiş sayılar geçerli JSON değil.' });
        return null;
      }
    }
    const hasRows = Boolean(ROW_KEYS[type]);
    return {
      title: draft.title.trim() || null,
      body: hasRows ? null : draft.body,
      rows: hasRows ? draft.rows.map((r) => ({ ...r, refs: parseList(String((r as { refs?: unknown }).refs ? (Array.isArray(r.refs) ? r.refs.join(',') : String(r.refs)) : '')) })) : null,
      articleRefs: parseList(draft.articleRefs),
      counterNumbers: parseList(draft.counterNumbers).map(Number).filter((n) => Number.isFinite(n)),
      derivedNumbers,
    };
  };

  const move = (idx: number, dir: -1 | 1) => {
    const ids = unit.blocks.map((b) => b.id);
    const j = idx + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    reorder.mutate(ids);
  };

  const staleCount = unit.blocks.filter((b) => b.staleSince).length;
  const canPublish = isAdmin && unit.status !== 'published' && staleCount === 0 && unit.validation.ok;

  return (
    <div>
      <div className="mb-2 text-xs text-slate-500">
        <Link href="/summaries" className="hover:underline">
          Konu Özetleri
        </Link>{' '}
        › {unit.topic.courseName} › {unit.topic.name}
      </div>
      <PageHeader
        title={unit.title}
        subtitle={`${unit.legislation.shortName ?? unit.legislation.name} md ${unit.articleFrom}–${unit.articleTo} · ${unit.readingMinutes} dk · v${unit.version} · ${unit.slug}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={unit.status} />
            <button onClick={() => refreshStats.mutate()} disabled={refreshStats.isPending} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50">
              İstatistikleri yenile
            </button>
            {isAdmin && unit.status === 'published' && (
              <button onClick={() => unpublish.mutate()} className="rounded-lg border border-amber-300 px-3 py-1.5 text-sm text-amber-800 hover:bg-amber-50">
                Yayından al
              </button>
            )}
            {isAdmin && unit.status !== 'published' && (
              <button
                onClick={() => publish.mutate()}
                disabled={!canPublish || publish.isPending}
                title={!canPublish ? (staleCount ? `${staleCount} eskimiş kart var` : !unit.validation.ok ? `${unit.validation.fails} kusur var` : '') : ''}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Yayınla
              </button>
            )}
            {isAdmin && unit.status !== 'published' && (
              <button
                onClick={() => {
                  if (confirm('Ünite silinsin mi? (yumuşak silme)')) remove.mutate();
                }}
                className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
              >
                Sil
              </button>
            )}
          </div>
        }
      />

      {notice && (
        <div
          className={`mb-4 whitespace-pre-line rounded-lg border px-4 py-3 text-sm ${
            notice.kind === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {notice.text}
          <button onClick={() => setNotice(null)} className="ml-3 underline">
            kapat
          </button>
        </div>
      )}

      <Card className="mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="text-sm">
            <div className="text-xs text-slate-500">Kaynak etiketi (yalnız panelde görünür)</div>
            <div className="mt-0.5 inline-block rounded bg-violet-50 px-2 py-0.5 text-xs text-violet-700">{unit.sourceLabel}</div>
            {unit.generatedBy && <div className="mt-1 text-xs text-slate-500">Üretim: {unit.generatedBy}</div>}
            <div className="mt-1 text-xs text-slate-500">
              {unit.isPremium ? 'Premium ünite' : 'Açık ünite'} · {unit.blocks.length} kart · doğrulama{' '}
              {unit.validation.ok ? <span className="text-emerald-700">geçti</span> : <span className="text-red-700">{unit.validation.fails} kusur</span>}
              {staleCount > 0 && <span className="ml-2 text-red-700">{staleCount} eskimiş</span>} · güncellendi {fmt(unit.updatedAt)}
            </div>
          </div>
          <button
            onClick={() => {
              setMeta({ title: unit.title, subtitle: unit.subtitle ?? '', readingMinutes: unit.readingMinutes, isPremium: unit.isPremium });
              setMetaEdit((v) => !v);
            }}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            {metaEdit ? 'Vazgeç' : 'Ünite bilgilerini düzenle'}
          </button>
        </div>
        {metaEdit && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Başlık
              <input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm">
              Alt başlık
              <input value={meta.subtitle} onChange={(e) => setMeta({ ...meta, subtitle: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm">
              Okuma süresi (dk)
              <input type="number" min={1} max={120} value={meta.readingMinutes} onChange={(e) => setMeta({ ...meta, readingMinutes: Number(e.target.value) })} className="mt-1 w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="flex items-center gap-2 self-end text-sm">
              <input type="checkbox" checked={meta.isPremium} onChange={(e) => setMeta({ ...meta, isPremium: e.target.checked })} />
              Premium (dersin ilk 2 ünitesi açık kalır)
            </label>
            <div className="sm:col-span-2">
              <button onClick={() => updateMeta.mutate({ ...meta, subtitle: meta.subtitle || null })} disabled={updateMeta.isPending} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                Kaydet
              </button>
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* ── Kartlar ── */}
        <div>
          {unit.blocks.map((b, idx) => {
            const isEditing = editing === b.id && draft;
            const rowKeys = ROW_KEYS[b.type];
            return (
              <Card key={b.id} className={`mb-3 ${b.staleSince ? 'border-red-300' : ''} ${!b.validation.ok ? 'border-amber-300' : ''}`}>
                <div id={b.id} className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${TYPE_TONE[b.type]}`}>{SUMMARY_BLOCK_LABEL[b.type]}</span>
                    {b.articleRefs.map((a) => (
                      <a key={a.no} href={`#md-${a.no}`} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700 hover:bg-slate-200" title={a.title ?? ''}>
                        md {a.no}
                      </a>
                    ))}
                    {b.generated && <span className="text-xs text-slate-400">betik üretimi</span>}
                    {b.staleSince && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">eskimiş · {fmt(b.staleSince)}</span>}
                    {!b.validation.ok && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">{b.validation.issues.length} kusur</span>}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <button onClick={() => move(idx, -1)} disabled={idx === 0} className="rounded px-2 py-1 hover:bg-slate-100 disabled:opacity-30" title="Yukarı">↑</button>
                    <button onClick={() => move(idx, 1)} disabled={idx === unit.blocks.length - 1} className="rounded px-2 py-1 hover:bg-slate-100 disabled:opacity-30" title="Aşağı">↓</button>
                    <button onClick={() => setShowChecks((s) => ({ ...s, [b.id]: !s[b.id] }))} className="rounded px-2 py-1 hover:bg-slate-100">
                      {showChecks[b.id] ? 'doğrulamayı gizle' : 'doğrulama'}
                    </button>
                    {!b.generated && !isEditing && (
                      <button onClick={() => startEdit(b)} className="rounded px-2 py-1 font-medium hover:bg-slate-100">
                        düzenle
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm('Kart arşivlensin mi?')) archiveBlock.mutate(b.id);
                      }}
                      className="rounded px-2 py-1 text-red-600 hover:bg-red-50"
                    >
                      arşivle
                    </button>
                  </div>
                </div>

                {showChecks[b.id] && (
                  <ul className="mt-2 rounded-lg bg-slate-50 p-2 font-mono text-xs text-slate-700">
                    {b.validation.lines.map((l, i) => (
                      <li key={i} className={l.startsWith('✗') ? 'text-red-700' : ''}>
                        {l}
                      </li>
                    ))}
                  </ul>
                )}

                {!isEditing && (
                  <div className="mt-2">
                    {b.title && <h3 className="text-sm font-semibold">{b.title}</h3>}
                    {b.body && <MarkdownLite text={b.body} />}
                    {b.rows && b.rows.length > 0 && <RowsTable rows={b.rows} type={b.type} />}
                  </div>
                )}

                {isEditing && draft && (
                  <BlockForm
                    type={b.type}
                    draft={draft}
                    onChange={setDraft}
                    busy={saveBlock.isPending}
                    onCancel={() => {
                      setEditing(null);
                      setDraft(null);
                    }}
                    onSave={() => {
                      const body = draftBody(b.type);
                      if (body) saveBlock.mutate({ blockId: b.id, body });
                    }}
                  />
                )}
                {rowKeys && !isEditing && null}
              </Card>
            );
          })}

          <Card className="mb-3 border-dashed">
            {!adding ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-slate-500">Kart ekle:</span>
                {(['concept', 'rule', 'numbers', 'compare', 'trap'] as SummaryBlockType[]).map((t) => (
                  <button key={t} onClick={() => startAdd(t)} className={`rounded-full border px-3 py-1 text-xs font-medium ${TYPE_TONE[t]}`}>
                    + {SUMMARY_BLOCK_LABEL[t]}
                  </button>
                ))}
              </div>
            ) : (
              draft && (
                <>
                  <div className="mb-2 text-sm font-semibold">Yeni {SUMMARY_BLOCK_LABEL[adding]} kartı</div>
                  <BlockForm
                    type={adding}
                    draft={draft}
                    onChange={setDraft}
                    busy={addBlock.isPending}
                    onCancel={() => {
                      setAdding(null);
                      setDraft(null);
                    }}
                    onSave={() => {
                      const body = draftBody(adding);
                      if (body) addBlock.mutate({ ...body, type: adding });
                    }}
                  />
                </>
              )
            )}
          </Card>
        </div>

        {/* ── Madde metinleri ── */}
        <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <Card>
            <h2 className="text-sm font-semibold">Referans maddeler</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {unit.legislation.name}. Kartlardaki sayı ve iddiaları bu metinlerle karşılaştır; betik yalnız sayıları görür.
            </p>
            <div className="mt-3 space-y-4">
              {[...articleByNo.values()]
                .sort((a, b) => Number(a.no) - Number(b.no))
                .map((a) => (
                  <div key={a.no} id={`md-${a.no}`} className="scroll-mt-4">
                    <div className="text-xs font-semibold text-slate-700">
                      Madde {a.no}
                      {a.title ? ` — ${a.title.replace(/^\d+\.\s*|^[A-Z]\.\s*/, '')}` : ''}
                    </div>
                    <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-600">{a.text}</p>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function BlockForm({
  type,
  draft,
  onChange,
  onSave,
  onCancel,
  busy,
}: {
  type: SummaryBlockType;
  draft: BlockDraft;
  onChange: (d: BlockDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const rowKeys = ROW_KEYS[type];
  const setRow = (i: number, k: string, v: string) => {
    const rows = draft.rows.map((r, j) => (j === i ? { ...r, [k]: v } : r));
    onChange({ ...draft, rows });
  };
  return (
    <div className="mt-3 space-y-3">
      <label className="block text-sm">
        Başlık
        <input value={draft.title} onChange={(e) => onChange({ ...draft, title: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </label>
      {!rowKeys && (
        <label className="block text-sm">
          Metin <span className="text-xs text-slate-500">(kalın için **…**, liste için satır başı {'"- "'} ya da {'"1. "'})</span>
          <textarea value={draft.body} onChange={(e) => onChange({ ...draft, body: e.target.value })} rows={8} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
      )}
      {rowKeys && (
        <div className="text-sm">
          Satırlar
          <table className="mt-1 w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500">
                {rowKeys.map((k) => (
                  <th key={k} className="pb-1 pr-2 font-medium">
                    {ROW_HEAD[k] ?? k}
                  </th>
                ))}
                <th className="pb-1 pr-2 font-medium">md</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {draft.rows.map((r, i) => (
                <tr key={i}>
                  {rowKeys.map((k) => (
                    <td key={k} className="pr-2 pb-1">
                      <input value={String(r[k] ?? '')} onChange={(e) => setRow(i, k, e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1" />
                    </td>
                  ))}
                  <td className="pr-2 pb-1">
                    <input
                      value={Array.isArray(r.refs) ? r.refs.join(', ') : String(r.refs ?? '')}
                      onChange={(e) => setRow(i, 'refs', e.target.value)}
                      placeholder="84, 75"
                      className="w-24 rounded border border-slate-300 px-2 py-1"
                    />
                  </td>
                  <td className="pb-1">
                    <button onClick={() => onChange({ ...draft, rows: draft.rows.filter((_, j) => j !== i) })} className="px-1 text-red-600">
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={() => onChange({ ...draft, rows: [...draft.rows, { ...Object.fromEntries(rowKeys.map((k) => [k, ''])), refs: [] }] })}
            className="mt-1 text-xs text-slate-600 underline"
          >
            + satır
          </button>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          Madde referansları <span className="text-xs text-slate-500">(virgülle: 84, 75)</span>
          <input value={draft.articleRefs} onChange={(e) => onChange({ ...draft, articleRefs: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm">
          Karşı örnek sayılar <span className="text-xs text-slate-500">(kartın {'"yanlış"'} dediği; metinde geçmemeli)</span>
          <input value={draft.counterNumbers} onChange={(e) => onChange({ ...draft, counterNumbers: e.target.value })} placeholder="2, 6" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
      </div>
      <label className="block text-sm">
        Türetilmiş sayılar <span className="text-xs text-slate-500">(JSON: {'[{"value":301,"expr":"floor(600 / 2) + 1","refs":["75","84"]}]'})</span>
        <textarea value={draft.derivedNumbers} onChange={(e) => onChange({ ...draft, derivedNumbers: e.target.value })} rows={2} spellCheck={false} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs" />
      </label>
      <div className="flex gap-2">
        <button onClick={onSave} disabled={busy} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {busy ? 'Doğrulanıyor…' : 'Kaydet ve doğrula'}
        </button>
        <button onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
          Vazgeç
        </button>
      </div>
    </div>
  );
}

function RowsTable({ rows, type }: { rows: SummaryRow[]; type: SummaryBlockType }) {
  const keys = ROW_KEYS[type] ?? Object.keys(rows[0] ?? {}).filter((k) => k !== 'refs');
  return (
    <table className="mt-2 w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-slate-500">
          {keys.map((k) => (
            <th key={k} className="py-1 pr-3 font-medium">
              {ROW_HEAD[k] ?? k}
            </th>
          ))}
          <th className="py-1 font-medium">md</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((r, i) => (
          <tr key={i}>
            {keys.map((k) => (
              <td key={k} className="py-1 pr-3 align-top">
                {String(r[k] ?? '')}
              </td>
            ))}
            <td className="py-1 align-top text-xs text-slate-500">{Array.isArray(r.refs) ? r.refs.join(', ') : ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Kart gövdesi: kalın (**…**) ve satır başı liste ("- ", "1. "); başka markdown yok. Bir paragraf içinde
 *  "**Başlık:**" satırını izleyen liste satırları ayrı liste olarak basılır. */
function MarkdownLite({ text }: { text: string }) {
  const paras = text.split(/\n\s*\n/);
  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>,
    );
  const isItem = (l: string) => /^\s*(-|\d+\.)\s/.test(l);
  return (
    <div className="mt-1 space-y-2 text-sm leading-relaxed text-slate-700">
      {paras.map((p, i) => {
        const lines = p.split('\n');
        // Ardışık satırları metin / liste gruplarına böl.
        const groups: { list: boolean; lines: string[] }[] = [];
        for (const l of lines) {
          const last = groups[groups.length - 1];
          if (last && last.list === isItem(l)) last.lines.push(l);
          else groups.push({ list: isItem(l), lines: [l] });
        }
        return (
          <div key={i} className="space-y-1">
            {groups.map((g, j) => {
              if (!g.list) return <p key={j}>{inline(g.lines.join(' '))}</p>;
              const ordered = /^\s*\d+\./.test(g.lines[0]);
              const Tag = ordered ? 'ol' : 'ul';
              return (
                <Tag key={j} className={`${ordered ? 'list-decimal' : 'list-disc'} pl-5`}>
                  {g.lines.map((l, k) => (
                    <li key={k}>{inline(l.replace(/^\s*(-|\d+\.)\s/, ''))}</li>
                  ))}
                </Tag>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

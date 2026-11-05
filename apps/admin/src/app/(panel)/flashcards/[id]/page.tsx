'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FlashcardForm, KindBadge, ValidationLines, detailToDraft, draftToBody, type FlashcardDraft } from '@/components/flashcard-form';
import { Card, ErrorBox, PageHeader, Spinner, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import { VERIFICATION_LABEL, type FlashcardDetail, type SummaryUnitListItem, type VerificationStatus } from '@/lib/types';

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const ACTION_LABEL: Record<string, string> = {
  'flashcard.create': 'oluşturuldu',
  'flashcard.update': 'düzenlendi',
  'flashcard.archive': 'arşivlendi',
  'flashcard.publish': 'yayınlandı',
  'flashcard.unpublish': 'yayından alındı',
  'flashcard.delete': 'silindi',
  'flashcard.verification': 'mevzuat kontrolü işaretlendi',
  'flashcard.import': 'içe aktarıldı',
};

/**
 * Kart detayı / düzenleme (Doc 56 §8.2; Figma 163:1565): başlık + rozetler, karar şeridi (yayın
 * kapısı gerekçeleri, mevzuat kontrolü), form (her kayıt sunucuda yeniden doğrulanır), doğrulama
 * raporu, geçmiş; sağda yapışkan referans maddeler. Yayın/yayından alma/silme yalnız admin.
 */
export default function FlashcardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [me, setMe] = useState<{ roles: string[] } | null>(null);
  const [draft, setDraft] = useState<FlashcardDraft | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    api<{ roles: string[] }>('/me').then(setMe).catch(() => setMe({ roles: [] }));
  }, []);
  const isAdmin = me?.roles.includes('admin') ?? false;

  const q = useQuery({ queryKey: ['admin-flashcard', id], queryFn: () => api<FlashcardDetail>(`/admin/flashcards/${id}`) });
  const d = q.data;
  const units = useQuery({
    queryKey: ['admin-summaries'],
    queryFn: () => api<SummaryUnitListItem[]>('/admin/summaries'),
    enabled: Boolean(d),
  });
  const unitOptions = (units.data ?? []).filter((u) => u.topicId === d?.topicId).map((u) => ({ slug: u.slug, title: u.title }));

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-flashcard', id] });
    qc.invalidateQueries({ queryKey: ['admin-flashcards'] });
    qc.invalidateQueries({ queryKey: ['admin-flashcards-stats'] });
    qc.invalidateQueries({ queryKey: ['admin-flashcards-stale'] });
  };
  const ok = (text: string) => setNotice({ kind: 'ok', text });
  const err = (e: unknown) => setNotice({ kind: 'err', text: e instanceof Error ? e.message : 'Bir şeyler ters gitti.' });

  const save = useMutation({
    mutationFn: (body: unknown) => api(`/admin/flashcards/${id}`, { method: 'PATCH', body }),
    onSuccess: () => {
      invalidate();
      setDraft(null);
      ok('Kart kaydedildi ve doğrulandı; referanslar güncel madde sürümüne bağlandı.');
    },
    onError: err,
  });
  const verification = useMutation({
    mutationFn: (status: VerificationStatus) => api(`/admin/flashcards/${id}/verification`, { method: 'POST', body: { status } }),
    onSuccess: () => {
      invalidate();
      ok('Mevzuat kontrolü güncellendi.');
    },
    onError: err,
  });
  const publish = useMutation({
    mutationFn: () => api(`/admin/flashcards/${id}/publish`, { method: 'POST' }),
    onSuccess: () => {
      invalidate();
      ok('Kart yayınlandı.');
    },
    onError: err,
  });
  const unpublish = useMutation({
    mutationFn: () => api(`/admin/flashcards/${id}/unpublish`, { method: 'POST' }),
    onSuccess: () => {
      invalidate();
      ok('Kart yayından alındı (incelemede).');
    },
    onError: err,
  });
  const archive = useMutation({
    mutationFn: () => api(`/admin/flashcards/${id}/archive`, { method: 'POST' }),
    onSuccess: () => {
      invalidate();
      ok('Kart arşivlendi.');
    },
    onError: err,
  });
  const remove = useMutation({
    mutationFn: () => api(`/admin/flashcards/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-flashcards'] });
      router.push('/flashcards');
    },
    onError: err,
  });

  if (q.isLoading) return <Spinner />;
  if (q.error || !d) return <ErrorBox error={q.error ?? new Error('Kart yok')} onRetry={() => q.refetch()} />;

  const editing = draft != null;
  const canPublish = isAdmin && d.gate.canPublish;

  return (
    <div>
      <div className="mb-2 text-xs text-slate-500">
        <Link href="/flashcards" className="hover:underline">
          Bilgi Kartları
        </Link>{' '}
        › {d.courseName} › {d.topicName}
        {d.unit ? ` › ${d.unit.title}` : ''}
      </div>
      <PageHeader
        title={d.front}
        subtitle={`v${d.version} · ${d.legislation?.shortName ?? d.legislation?.name ?? 'mevzuat yok'} md ${d.articles.map((a) => a.no).join(', ')} · güncellendi ${fmt(d.updatedAt)}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={d.status} />
            <KindBadge kind={d.kind} />
            {d.staleSince && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">eskimiş · {fmt(d.staleSince)}</span>}
            {d.openReportCount > 0 && (
              <Link href="/reports?kind=flashcards" className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 hover:bg-amber-200" title="Kullanıcı hata bildirimi; Hata Bildirimleri › Bilgi kartları">
                🚩 {d.openReportCount} açık bildirim
              </Link>
            )}
            {d.status !== 'archived' && (
              <button
                onClick={() => {
                  if (confirm(d.status === 'published' ? 'Yayındaki kart arşivlensin mi? Kullanıcı kuyruklarından düşer.' : 'Kart arşivlensin mi?')) archive.mutate();
                }}
                disabled={archive.isPending || (d.status === 'published' && !isAdmin)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                Arşivle
              </button>
            )}
            {isAdmin && d.status === 'published' && (
              <button onClick={() => unpublish.mutate()} disabled={unpublish.isPending} className="rounded-lg border border-amber-300 px-3 py-1.5 text-sm text-amber-800 hover:bg-amber-50 disabled:opacity-50">
                Yayından al
              </button>
            )}
            {isAdmin && d.status !== 'published' && (
              <button
                onClick={() => publish.mutate()}
                disabled={!canPublish || publish.isPending || editing}
                title={!d.gate.canPublish ? d.gate.reasons.join(' ') : editing ? 'Önce kaydet' : ''}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Yayınla
              </button>
            )}
            {isAdmin && d.status !== 'published' && (
              <button
                onClick={() => {
                  if (confirm('Kart silinsin mi? (yumuşak silme)')) remove.mutate();
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
        <div className={`mb-4 whitespace-pre-line rounded-lg border px-4 py-3 text-sm ${notice.kind === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {notice.text}
          <button onClick={() => setNotice(null)} className="ml-3 underline">
            kapat
          </button>
        </div>
      )}

      {/* Karar şeridi */}
      <Card className={`mb-4 ${d.gate.canPublish ? 'border-emerald-200' : 'border-amber-300'}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="text-sm">
            <div className="font-semibold">{d.status === 'published' ? 'Yayında' : d.gate.canPublish ? 'Yayına hazır' : 'Yayın kapısı kapalı'}</div>
            {d.gate.reasons.length > 0 && d.status !== 'published' && (
              <ul className="mt-1 list-disc pl-5 text-xs text-amber-800">
                {d.gate.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
            {!isAdmin && d.status !== 'published' && <p className="mt-1 text-xs text-slate-500">Yalnız admin yayınlar; sen düzenleyip mevzuat kontrolünü işaretleyebilirsin.</p>}
            {d.synthetic && <p className="mt-1 text-xs text-violet-700">AI kaynaklı kart: betik sayıları doğrular, tuzak/olumsuz iddiaları insan okur; yayın kapısı diğer kartlarla aynı.</p>}
          </div>
          <label className="text-sm">
            Mevzuat kontrolü
            <select
              value={d.verificationStatus}
              onChange={(e) => verification.mutate(e.target.value as VerificationStatus)}
              disabled={verification.isPending}
              className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {(Object.keys(VERIFICATION_LABEL) as VerificationStatus[]).map((v) => (
                <option key={v} value={v}>
                  {VERIFICATION_LABEL[v]}
                </option>
              ))}
            </select>
            {d.verifiedAt && <span className="mt-1 block text-xs text-slate-500">doğrulandı {fmt(d.verifiedAt)}</span>}
          </label>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-4">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Kart</h2>
              {!editing ? (
                <button onClick={() => setDraft(detailToDraft(d))} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
                  Düzenle
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setDraft(null)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
                    Vazgeç
                  </button>
                  <button
                    onClick={() => {
                      const r = draftToBody(draft);
                      if ('error' in r) return setNotice({ kind: 'err', text: r.error });
                      save.mutate(r.body);
                    }}
                    disabled={save.isPending}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {save.isPending ? 'Doğrulanıyor…' : 'Kaydet ve doğrula'}
                  </button>
                </div>
              )}
            </div>
            {editing ? (
              <FlashcardForm draft={draft} onChange={setDraft} disabled={save.isPending} unitOptions={unitOptions} />
            ) : (
              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Ön yüz</dt>
                  <dd className="font-medium">{d.front}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Arka yüz</dt>
                  <dd className="whitespace-pre-line">{d.back}</dd>
                </div>
                {d.explanation && (
                  <div>
                    <dt className="text-xs text-slate-500">Açıklama</dt>
                    <dd className="whitespace-pre-line text-slate-700">{d.explanation}</dd>
                  </div>
                )}
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-600">
                  <span>Zorluk {d.difficulty}</span>
                  <span>Referanslar: {d.articles.map((a) => `md ${a.no}${a.relation === 'primary' ? ' (birincil)' : ''}`).join(', ')}</span>
                  {d.counterNumbers.length > 0 && <span>Karşı örnek: {d.counterNumbers.join(', ')}</span>}
                  {d.derivedNumbers && d.derivedNumbers.length > 0 && <span>Türetilmiş: {d.derivedNumbers.map((n) => `${n.value} = ${n.expr}`).join('; ')}</span>}
                </div>
              </dl>
            )}
          </Card>

          <Card>
            <h2 className="text-sm font-semibold">
              Doğrulama raporu ·{' '}
              {d.validation.ok ? <span className="text-emerald-700">geçti</span> : <span className="text-red-700">{d.validation.issues.length} kusur</span>}
            </h2>
            <div className="mt-2">
              <ValidationLines lines={d.validation.lines} />
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold">Kaynak ve geçmiş</h2>
            <div className="mt-2 text-xs text-slate-600">
              <span className="rounded bg-violet-50 px-1.5 py-0.5 text-violet-700">{d.sourceLabel}</span>
              <span className="ml-2 text-slate-400">yalnız panelde görünür</span>
              {d.generatedBy && <div className="mt-1">Üretim: {d.generatedBy}</div>}
              <div className="mt-1">
                Oluşturuldu {fmt(d.createdAt)}
                {d.publishedAt ? ` · yayınlandı ${fmt(d.publishedAt)}` : ''}
              </div>
            </div>
            {d.history.length > 0 && (
              <ul className="mt-3 divide-y divide-slate-100 text-xs">
                {d.history.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-2 py-1.5">
                    <span>
                      <span className="font-medium">{ACTION_LABEL[h.action] ?? h.action}</span>
                      <span className="ml-2 text-slate-500">{h.actorEmail}</span>
                    </span>
                    <span className="text-slate-500">{fmt(h.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <Card>
            <h2 className="text-sm font-semibold">Referans maddeler</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {d.legislation?.name ?? 'Mevzuat'}. Cevap ve açıklamadaki her sayı ve iddiayı bu metinle karşılaştır; betik yalnız sayıları görür.
            </p>
            <div className="mt-3 space-y-4">
              {d.articles.map((a) => (
                <div key={a.no}>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700">
                    Madde {a.no}
                    {a.title ? ` — ${a.title.replace(/^\d+\.\s*|^[A-Z]\.\s*/, '')}` : ''}
                    {a.relation === 'primary' && <span className="rounded bg-slate-100 px-1.5 py-0.5 font-normal text-slate-600">birincil</span>}
                    {a.currentVersionNo != null && a.versionNo != null && a.currentVersionNo !== a.versionNo && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 font-normal text-red-700">
                        metin güncellendi (v{a.versionNo} → v{a.currentVersionNo})
                      </span>
                    )}
                  </div>
                  {a.text ? <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-600">{a.text}</p> : <p className="mt-1 text-xs text-red-700">Madde metni bulunamadı.</p>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

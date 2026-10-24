'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type {
  ExamAdjustment,
  ExamAdjustmentAction,
  ExamAdjustmentPreview,
  ExamStats,
} from '@/lib/types';

const net = (n: number | null | undefined) => (n == null ? '—' : n.toFixed(2).replace('.', ','));
const dur = (s: number | null) => (s == null ? '—' : `${Math.floor(s / 60)} dk`);

/**
 * Deneme istatistiği ve soru iptali (Doc 50 §2.3, Figma A-istatistik).
 * Soru analizi: doğru oranı, şık dağılımı, süre, açık hata bildirimi, "anahtar şüpheli".
 * İptal: önizleme (etki cümlesi) → uygula → yeniden puanlama + sıralama + bildirim.
 */
export default function ExamStatsPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'dikkat' | 'hepsi'>('dikkat');
  const [open, setOpen] = useState<string | null>(null);
  const [dlg, setDlg] = useState<{ questionId: string; no: number } | null>(null);
  const [action, setAction] = useState<ExamAdjustmentAction>('credit_all');
  const [reason, setReason] = useState('');
  const [notify, setNotify] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const stats = useQuery({ queryKey: ['admin-exam-stats', id], queryFn: () => api<ExamStats>(`/admin/exams/${id}/stats`) });
  const adjustments = useQuery({
    queryKey: ['admin-exam-adjustments', id],
    queryFn: () => api<ExamAdjustment[]>(`/admin/exams/${id}/adjustments`),
  });
  const preview = useQuery({
    queryKey: ['admin-exam-adj-preview', id, dlg?.questionId, action],
    queryFn: () =>
      api<ExamAdjustmentPreview>(`/admin/exams/${id}/adjustments/preview`, {
        method: 'POST',
        body: { questionId: dlg!.questionId, action, reason: 'önizleme' },
      }),
    enabled: dlg != null,
  });
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-exam-stats', id] });
    qc.invalidateQueries({ queryKey: ['admin-exam-adjustments', id] });
    qc.invalidateQueries({ queryKey: ['admin-exam', id] });
  };
  const apply = useMutation({
    mutationFn: () =>
      api<{ changed: number; rescored: number; rankingsRefrozen: boolean }>(`/admin/exams/${id}/adjustments`, {
        method: 'POST',
        body: { questionId: dlg!.questionId, action, reason, notify },
      }),
    onSuccess: (r) => {
      invalidate();
      setDlg(null);
      setReason('');
      setNotice(`İptal uygulandı: ${r.changed}/${r.rescored} resmî çözüm yeniden puanlandı${r.rankingsRefrozen ? ', sıralama yeniden donduruldu' : ''}.`);
    },
  });
  const revert = useMutation({
    mutationFn: (adjustmentId: string) =>
      api<{ changed: number }>(`/admin/exams/${id}/adjustments/${adjustmentId}/revert`, { method: 'POST' }),
    onSuccess: (r) => {
      invalidate();
      setNotice(`İptal geri alındı; ${r.changed} çözüm yeniden puanlandı.`);
    },
  });

  if (stats.isPending) return <Spinner />;
  if (stats.isError) return <ErrorBox error={stats.error} onRetry={() => stats.refetch()} />;
  const s = stats.data;
  const rows = s.questions.filter((q) => (filter === 'hepsi' ? true : q.attention));
  const maxBucket = Math.max(1, ...s.distribution.map((d) => d.count));

  return (
    <>
      <PageHeader
        title={s.exam.title}
        subtitle={`${s.exam.publishMode === 'takvimli' ? 'Haftalık' : 'Serbest'} · ${
          s.exam.rankingsComputedAt
            ? `sıralama ${new Date(s.exam.rankingsComputedAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}'de donduruldu`
            : 'sıralama canlı'
        }`}
        action={
          <div className="flex gap-2">
            <Link href={`/exams/${id}?adim=4`} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50">
              Ayarlar ve sorular
            </Link>
            <button type="button" onClick={() => stats.refetch()} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50">
              Yenile
            </button>
          </div>
        }
      />
      {notice && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>}
      {(apply.isError || revert.isError) && (
        <div className="mb-4">
          <ErrorBox error={apply.error ?? revert.error} />
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {(
          [
            ['Başlayan', s.summary.started],
            ['Tamamlayan', s.summary.completed],
            ['Devam eden', s.summary.inProgress],
            ['Süre doldu', s.summary.timeouts],
            ['Tekrar çözüm', s.summary.practice],
            ['Ortalama net', net(s.summary.meanScore)],
            ['Medyan net', net(s.summary.medianScore)],
            ['Medyan süre', dur(s.summary.medianDurationSeconds)],
          ] as [string, string | number][]
        ).map(([k, v]) => (
          <Card key={k} className="p-4">
            <div className="text-xs text-slate-500">{k}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{v}</div>
          </Card>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Net dağılımı</h2>
          {s.distribution.length === 0 ? (
            <p className="text-sm text-slate-500">Henüz tamamlanan resmî çözüm yok.</p>
          ) : (
            <div className="flex h-32 items-end gap-1">
              {s.distribution.map((d) => (
                <div key={d.from} className="flex flex-1 flex-col items-center gap-1" title={`${d.from}–${d.to}: ${d.count}`}>
                  <span className="text-[10px] tabular-nums text-slate-500">{d.count}</span>
                  <div className="w-full rounded-t bg-indigo-400" style={{ height: `${Math.max(4, (d.count / maxBucket) * 96)}px` }} />
                  <span className="text-[10px] tabular-nums text-slate-400">{d.from}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Etkin iptaller</h2>
          {adjustments.data?.filter((a) => !a.revertedAt).length ? (
            <ul className="space-y-2 text-sm">
              {adjustments.data
                .filter((a) => !a.revertedAt)
                .map((a) => (
                  <li key={a.id} className="rounded-lg border border-slate-200 p-2">
                    <div className="line-clamp-2 text-xs text-slate-600">{a.stem}</div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium">{a.action === 'credit_all' ? 'Herkese doğru' : 'Hesaptan çıkarıldı'}</span>
                      <button type="button" onClick={() => revert.mutate(a.id)} disabled={revert.isPending} className="text-indigo-700 hover:underline disabled:opacity-50">
                        Geri al
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">İptal yok.</p>
          )}
        </Card>
      </div>

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-700">Soru analizi</h2>
        <div className="flex gap-2 text-sm">
          {(
            [
              ['dikkat', `Dikkat isteyenler (${s.questions.filter((q) => q.attention).length})`],
              ['hepsi', `Tümü (${s.questions.length})`],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={`rounded-full border px-3 py-1 ${filter === k ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-3 py-3 font-medium">Soru</th>
                <th className="px-3 py-3 text-right font-medium">Doğru %</th>
                <th className="px-3 py-3 text-right font-medium">Boş</th>
                <th className="px-3 py-3 text-right font-medium">Süre</th>
                <th className="px-3 py-3 font-medium">İşaret</th>
                <th className="px-3 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">Bu süzgeçte soru yok.</td>
                </tr>
              )}
              {rows.map((q) => (
                <QuestionRow
                  key={q.questionId}
                  q={q}
                  open={open === q.questionId}
                  onToggle={() => setOpen(open === q.questionId ? null : q.questionId)}
                  onCancel={() => {
                    setDlg({ questionId: q.questionId, no: q.no });
                    setAction('credit_all');
                  }}
                  total={s.summary.completed}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {dlg && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4" role="dialog" aria-modal="true" aria-label="Soru iptali">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold">Soru {dlg.no} — iptal</h3>
            <p className="mt-1 text-xs text-slate-500">Puanlama kuralı değişir; etkilenen resmî çözümler yeniden puanlanır, donmuş sıralama yeniden hesaplanır.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {(
                [
                  ['credit_all', 'Herkese doğru say', 'Kimsenin neti düşmez (varsayılan).'],
                  ['exclude', 'Hesaptan çıkar', 'Soru toplamdan düşer; yanlış yapanın neti artar.'],
                ] as [ExamAdjustmentAction, string, string][]
              ).map(([v, t, d]) => (
                <label key={v} className={`cursor-pointer rounded-lg border p-3 text-sm ${action === v ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
                  <input type="radio" className="mr-2" checked={action === v} onChange={() => setAction(v)} />
                  <span className="font-medium">{t}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{d}</span>
                </label>
              ))}
            </div>
            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
              {preview.isPending ? 'Etki hesaplanıyor…' : preview.data ? preview.data.sentence : 'Önizleme alınamadı.'}
              {preview.data?.frozen ? <span className="block text-xs text-slate-500">Sıralama donmuş; uygulanınca yeniden hesaplanır.</span> : null}
            </div>
            <label className="mt-3 block text-sm font-medium">
              Gerekçe
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Örn: iki şık da doğru kabul edilebilir (md 91/1 lafzı)"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
              <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
              Etkilenen adaylara &quot;netin güncellendi&quot; bildirimi gönder
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setDlg(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => apply.mutate()}
                disabled={apply.isPending || reason.trim().length < 5}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {apply.isPending ? 'Uygulanıyor…' : 'İptali uygula'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function QuestionRow({
  q,
  open,
  onToggle,
  onCancel,
  total,
}: {
  q: ExamStats['questions'][number];
  open: boolean;
  onToggle: () => void;
  onCancel: () => void;
  total: number;
}) {
  const answered = Math.max(1, total - q.blank);
  return (
    <>
      <tr className={`hover:bg-slate-50 ${q.attention ? 'bg-amber-50/40' : ''}`}>
        <td className="px-4 py-2.5 text-xs font-bold text-slate-400">{q.no}</td>
        <td className="px-3 py-2.5">
          <div className="line-clamp-1">{q.stem}</div>
          <div className="text-xs text-slate-400">{q.course} / {q.topic}</div>
        </td>
        <td className={`px-3 py-2.5 text-right tabular-nums ${q.correctRate != null && q.correctRate < 25 ? 'text-red-700' : ''}`}>
          {q.correctRate != null ? `%${q.correctRate}` : '—'}
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums">{q.blank}</td>
        <td className="px-3 py-2.5 text-right tabular-nums">{q.avgSeconds != null ? `${q.avgSeconds} sn` : '—'}</td>
        <td className="px-3 py-2.5">
          <div className="flex flex-wrap gap-1 text-[11px]">
            {q.keySuspect && <span className="rounded bg-red-100 px-1.5 py-0.5 font-medium text-red-700">anahtar şüpheli</span>}
            {q.openReports > 0 && <span className="rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-800">{q.openReports} bildirim</span>}
            {q.adjustment && <span className="rounded bg-slate-200 px-1.5 py-0.5 font-medium text-slate-700">{q.adjustment === 'credit_all' ? 'herkese doğru' : 'hesaptan çıktı'}</span>}
          </div>
        </td>
        <td className="px-3 py-2.5 text-right whitespace-nowrap">
          <button type="button" onClick={onToggle} className="mr-3 text-indigo-700 hover:underline">
            {open ? 'Kapat' : 'İncele'}
          </button>
          {!q.adjustment && (
            <button type="button" onClick={onCancel} className="text-slate-600 hover:underline">
              İptal et
            </button>
          )}
        </td>
      </tr>
      {open && (
        <tr className="bg-slate-50/60">
          <td />
          <td colSpan={6} className="px-3 py-3">
            <p className="mb-2 text-sm">{q.stem}</p>
            <ul className="grid gap-1 sm:grid-cols-2">
              {q.optionShare.map((o) => (
                <li key={o.optionId} className="flex items-center gap-2 text-xs">
                  <span className={`w-5 font-semibold ${o.isCorrect ? 'text-emerald-700' : 'text-slate-500'}`}>{o.label}</span>
                  <div className="h-2 flex-1 rounded bg-slate-200">
                    <div className={`h-2 rounded ${o.isCorrect ? 'bg-emerald-500' : 'bg-slate-400'}`} style={{ width: `${Math.round((o.count / answered) * 100)}%` }} />
                  </div>
                  <span className="w-12 text-right tabular-nums text-slate-600">{o.count}</span>
                </li>
              ))}
            </ul>
            <Link href={`/questions/${q.questionId}`} className="mt-2 inline-block text-xs font-medium text-indigo-700 hover:underline">
              Soru bankasında aç →
            </Link>
          </td>
        </tr>
      )}
    </>
  );
}

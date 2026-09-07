'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import type { AdminPastExamDetail, AdminPastExamQuestion, PastExamCozulebilirlik } from '@/lib/types';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://paemisyon.com';

/** Sorunun public sayfada gerçekten görünüp görünmeyeceği. */
function gorunurMu(q: AdminPastExamQuestion) {
  return q.publicly && q.versionStatus === 'published';
}

/** Çıkmış sınav detayı (Doc 36): üstveri, yayın aksiyonu, soru görünürlüğü. */
export default function PastExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [me, setMe] = useState<{ roles: string[] } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api<{ roles: string[] }>('/me')
      .then(setMe)
      .catch(() => setMe({ roles: [] }));
  }, []);
  const isAdmin = me?.roles.includes('admin') ?? false;

  const q = useQuery({
    queryKey: ['admin-past-exam', id],
    queryFn: () => api<AdminPastExamDetail>(`/admin/past-exams/${id}`),
  });

  const durum = useMutation({
    mutationFn: (status: 'draft' | 'published' | 'archived') =>
      api(`/admin/past-exams/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: (_d, status) => {
      setNotice(status === 'published' ? 'Dönem yayına alındı.' : 'Dönem yayından kaldırıldı.');
      qc.invalidateQueries({ queryKey: ['admin-past-exam', id] });
      qc.invalidateQueries({ queryKey: ['admin-past-exams'] });
    },
  });

  const motor = useMutation({
    mutationFn: () =>
      api<{ examId: string; soru: number; dakika: number }>(
        `/admin/past-exams/${id}/motora-bagla`,
        { method: 'POST' },
      ),
    onSuccess: (r) => {
      setNotice(
        `Motora bağlandı: ${r.soru} soru, ${r.dakika} dk. "Sınav gibi çöz" artık çalışıyor.`,
      );
      qc.invalidateQueries({ queryKey: ['admin-past-exam', id] });
      qc.invalidateQueries({ queryKey: ['admin-past-exams'] });
    },
  });

  const premium = useMutation({
    mutationFn: (v: boolean) =>
      api(`/admin/past-exams/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isPremium: v }),
      }),
    onSuccess: (_d, v) => {
      setNotice(
        v
          ? 'Dönem Premium’a alındı. Public SEO sayfası etkilenmez.'
          : 'Dönem herkese açıldı.',
      );
      qc.invalidateQueries({ queryKey: ['admin-past-exam', id] });
      qc.invalidateQueries({ queryKey: ['admin-past-exams'] });
    },
  });

  const soru = useMutation({
    mutationFn: (v: { questionId: string; publicly?: boolean; cancelled?: boolean }) =>
      api(`/admin/past-exams/${id}/questions/${v.questionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ publicly: v.publicly, cancelled: v.cancelled }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-past-exam', id] }),
  });

  if (q.isPending) return <Spinner />;
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;

  const s = q.data;
  const acik = s.questions.filter((x) => x.publicly);
  const gorunen = s.questions.filter(gorunurMu);
  const url = `${SITE}/paem-cikmis-sorular/${s.slug}`;

  return (
    <>
      <PageHeader
        title={s.name}
        subtitle={`${s.institution}${s.heldOn ? ` · ${new Date(s.heldOn).toLocaleDateString('tr-TR')}` : ''}`}
        action={
          isAdmin ? (
            <button
              onClick={() => durum.mutate(s.status === 'published' ? 'draft' : 'published')}
              disabled={durum.isPending}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                s.status === 'published' ? 'bg-slate-600 hover:bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {s.status === 'published' ? 'Yayından kaldır' : 'Yayına al'}
            </button>
          ) : undefined
        }
      />

      {notice && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{notice}</div>
      )}

      <CozulebilirlikKutusu
        c={s.cozulebilirlik}
        isAdmin={isAdmin}
        pending={motor.isPending}
        onBagla={() => motor.mutate()}
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span>
            Durum: <StatusBadge status={s.status} />
          </span>
          <span className="text-slate-600">
            Tür: <b>{s.kind === 'resmi' ? 'Çıkmış sınav' : 'Konu analizi'}</b>
          </span>
          <span className="text-slate-600">
            Sınavdaki soru: <b>{s.questionCount ?? '—'}</b>
          </span>
          <label
            className="flex cursor-pointer items-center gap-2 text-slate-600"
            title="Açıkken hem 'Sınav gibi çöz' hem 'Çalışma modu' Premium ister. Public SEO sayfası (dönem başına birkaç soru) her zaman açık kalır."
          >
            <input
              type="checkbox"
              checked={s.isPremium}
              disabled={!isAdmin || premium.isPending}
              onChange={(e) => premium.mutate(e.target.checked)}
            />
            Premium&apos;a özel
          </label>
          <span className="text-slate-600">
            Bankaya bağlı: <b>{s.questions.length}</b>
          </span>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-indigo-700 hover:underline"
          >
            Sayfayı aç ↗
          </a>
        </div>
        {s.summary && <p className="mt-3 text-sm text-slate-600">{s.summary}</p>}
      </Card>

      {s.kind === 'analiz' ? (
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-800">Konu dağılımı</h2>
          <p className="mb-3 text-sm text-slate-500">
            Bu dönem yayımlanmadı; bankada sorusu yok. Sayfanın tek içeriği aşağıdaki dağılım.
          </p>
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {Object.entries(s.analysis?.dersDagilim ?? {}).map(([ders, adet]) => (
              <li key={ders} className="flex justify-between border-b border-slate-50 py-1">
                <span className="text-slate-600">{ders}</span>
                <b className="text-slate-800">{adet}</b>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Sorular · sitede açık {acik.length}, gerçekten görünen {gorunen.length}
            </h2>
            {acik.length !== gorunen.length && (
              <span className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                {acik.length - gorunen.length} soru public işaretli ama sürümü onay kuyruğunda —
                sayfada görünmüyor
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                  <th className="px-5 py-3 font-medium">#</th>
                  <th className="px-3 py-3 font-medium">Soru</th>
                  <th className="px-3 py-3 font-medium">Ders / Konu</th>
                  <th className="px-3 py-3 font-medium">Sürüm</th>
                  <th className="px-3 py-3 font-medium">Açıklama</th>
                  <th className="px-3 py-3 font-medium">Sitede</th>
                  <th className="px-3 py-3 font-medium">İptal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {s.questions.map((x) => (
                  <tr key={x.questionId} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-500">{x.orderNo}</td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/questions/${x.questionId}`}
                        className="text-indigo-700 hover:underline"
                      >
                        {x.stem || '(metin yok)'}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      {x.course}
                      <br />
                      {x.topic}
                    </td>
                    <td className="px-3 py-3">
                      {x.versionStatus ? <StatusBadge status={x.versionStatus} /> : '—'}
                    </td>
                    <td className="px-3 py-3">
                      {x.hasExplanation ? (
                        <span className="text-emerald-600">var</span>
                      ) : (
                        <span className="text-amber-600">yok</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={x.publicly}
                          disabled={soru.isPending || x.cancelled}
                          onChange={(e) =>
                            soru.mutate({ questionId: x.questionId, publicly: e.target.checked })
                          }
                        />
                        {x.publicly && x.versionStatus !== 'published' && (
                          <span className="text-xs text-amber-600" title="Sürümü yayında değil">
                            görünmüyor
                          </span>
                        )}
                      </label>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={x.cancelled}
                        disabled={soru.isPending}
                        title="Sınavda iptal edilmiş soru: gösterilir, puanlanmaz"
                        onChange={(e) =>
                          soru.mutate({ questionId: x.questionId, cancelled: e.target.checked })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}

/**
 * Uygulamada çözülebilirlik tanısı (Doc 36 §7.2).
 *
 * "Yayına aldım ama uygulamada çözülemiyor" sorusunun cevabı dört ayrı yerde
 * saklıydı: tür, yayın durumu, soru sürümleri, motor bağı. Panelde tek yerde
 * ve açıkça yazılmalı — kimse dördünü akılda tutamaz.
 */
function CozulebilirlikKutusu({
  c,
  isAdmin,
  pending,
  onBagla,
}: {
  c: PastExamCozulebilirlik;
  isAdmin: boolean;
  pending: boolean;
  onBagla: () => void;
}) {
  if (c.cozulebilir) {
    return (
      <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <b>Uygulamada çözülebilir.</b> {c.yayindaSoru} soru sette
        {c.iptalSoru > 0 ? ` (${c.iptalSoru} iptal soru sete girmez)` : ''}. iOS,
        Android ve web bu dönemi otomatik gösterir — uygulama güncellemesi
        gerekmez.
      </div>
    );
  }
  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <b>Uygulamada henüz çözülemiyor.</b>
      <ul className="mt-1 list-disc space-y-0.5 pl-5">
        {c.engeller.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
      {isAdmin && c.motoraBaglanabilir && (
        <button
          onClick={onBagla}
          disabled={pending}
          className="mt-3 rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50"
        >
          {pending ? 'Bağlanıyor…' : 'Deneme motoruna bağla'}
        </button>
      )}
    </div>
  );
}

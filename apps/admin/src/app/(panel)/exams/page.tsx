'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import type { AdminExamListItem } from '@/lib/types';

type Filter = 'hepsi' | 'serbest' | 'takvimli' | 'draft' | 'archived';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });

function durum(e: AdminExamListItem, now: number): { label: string; cls: string } | null {
  if (e.status !== 'published') return null;
  if (e.publishMode === 'takvimli') {
    if (now < +new Date(e.startAt)) return { label: 'Planlandı', cls: 'bg-indigo-100 text-indigo-700' };
    if (e.endAt && now >= +new Date(e.endAt))
      return e.practiceAfterEnd
        ? { label: 'Pratik açık', cls: 'bg-slate-100 text-slate-600' }
        : { label: 'Kapandı', cls: 'bg-slate-100 text-slate-500' };
    return { label: 'Pencere açık', cls: 'bg-emerald-100 text-emerald-800' };
  }
  if (e.endAt && now >= +new Date(e.endAt)) return { label: 'Kapandı', cls: 'bg-slate-100 text-slate-500' };
  return { label: 'Yayında', cls: 'bg-emerald-100 text-emerald-800' };
}

/** Denemeler listesi (Doc 50 A0): mod, tarih, durum, katılımcı, ortalama net, anahtarlar. */
export default function ExamsPage() {
  const [filter, setFilter] = useState<Filter>('hepsi');
  // Sayfa açılış anı: durum rozetleri ve "sıradaki haftalık" buna göre (saf render).
  const [now] = useState(() => Date.now());
  const q = useQuery({
    queryKey: ['admin-exams'],
    queryFn: () => api<AdminExamListItem[]>('/admin/exams'),
  });

  const rows = (q.data ?? []).filter((e) =>
    filter === 'hepsi'
      ? e.status !== 'archived'
      : filter === 'draft'
        ? e.status === 'draft'
        : filter === 'archived'
          ? e.status === 'archived'
          : e.publishMode === filter && e.status !== 'archived',
  );
  const nextWeekly = (q.data ?? [])
    .filter((e) => e.status === 'published' && e.publishMode === 'takvimli' && +new Date(e.startAt) > now)
    .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))[0];

  return (
    <>
      <PageHeader
        title="Denemeler"
        subtitle={
          q.data
            ? `${q.data.filter((e) => e.status !== 'archived').length} deneme · ${q.data.filter((e) => e.status === 'draft').length} taslak${
                nextWeekly ? ` · sıradaki haftalık: ${fmtDate(nextWeekly.startAt)}` : ''
              }`
            : 'Serbest ve haftalık denemeler — yayınlanmadan webde görünmez'
        }
        action={
          <Link
            href="/exams/new"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Yeni deneme
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ['hepsi', 'Tümü'],
            ['serbest', 'Serbest'],
            ['takvimli', 'Haftalık'],
            ['draft', 'Taslak'],
            ['archived', 'Arşiv'],
          ] as [Filter, string][]
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={`rounded-full border px-3 py-1 text-sm ${
              filter === k ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {q.isPending ? (
        <Spinner />
      ) : q.isError ? (
        <ErrorBox error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                  <th className="px-5 py-3 font-medium">Ad</th>
                  <th className="px-3 py-3 font-medium">Mod</th>
                  <th className="px-3 py-3 font-medium">Tarih</th>
                  <th className="px-3 py-3 font-medium">Durum</th>
                  <th className="px-3 py-3 text-right font-medium">Katılımcı</th>
                  <th className="px-3 py-3 text-right font-medium">Ort. net</th>
                  <th className="px-3 py-3 font-medium">Premium</th>
                  <th className="px-3 py-3 font-medium">Anlık GB</th>
                  <th className="px-3 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((e) => {
                  const d = durum(e, now);
                  return (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Link href={`/exams/${e.id}`} className="font-medium text-indigo-700 hover:underline">
                          {e.title}
                        </Link>
                        <div className="text-xs text-slate-400">
                          {e.questionCount} soru · {e.durationMinutes} dk
                          {e.difficulty ? ` · ${e.difficulty}` : ''}
                        </div>
                      </td>
                      <td className="px-3 py-3">{e.publishMode === 'takvimli' ? 'Haftalık' : 'Serbest'}</td>
                      <td className="px-3 py-3 text-slate-600">
                        {e.publishMode === 'takvimli' ? fmtDate(e.startAt) : e.status === 'published' ? `${fmtDate(e.startAt)} · yayında` : '—'}
                      </td>
                      <td className="px-3 py-3">
                        {d ? (
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${d.cls}`}>{d.label}</span>
                        ) : (
                          <StatusBadge status={e.status} />
                        )}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{e.participantCount || '—'}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{e.avgScore != null ? e.avgScore.toFixed(1) : '—'}</td>
                      <td className="px-3 py-3">{e.isPremium ? 'Evet' : 'Hayır'}</td>
                      <td className="px-3 py-3">{e.liveAnswerReveal ? 'Açık' : 'Kapalı'}</td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        {e.status === 'published' && (
                          <Link href={`/exams/${e.id}/istatistik`} className="mr-3 font-medium text-indigo-700 hover:underline">
                            İstatistik
                          </Link>
                        )}
                        <Link href={`/exams/${e.id}`} className="font-medium text-indigo-700 hover:underline">
                          {e.status === 'draft' ? 'Düzenle' : 'Aç'}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-slate-500">
                      Bu süzgeçte deneme yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}

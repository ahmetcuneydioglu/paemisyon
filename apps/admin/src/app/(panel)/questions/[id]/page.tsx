'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner, StatusBadge } from '@/components/ui';
import { QuestionForm, type QuestionFormValue } from '@/components/question-form';
import { api } from '@/lib/api';
import type { QuestionDetail } from '@/lib/types';

/** Soru detayı: düzenleme (yeni taslak sürüm) + editoryal akış + sürüm geçmişi (Doc 9 §4). */
export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [me, setMe] = useState<{ roles: string[] } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api<{ roles: string[] }>('/me').then(setMe).catch(() => setMe({ roles: [] }));
  }, []);

  const q = useQuery({
    queryKey: ['question', id],
    queryFn: () => api<QuestionDetail>(`/admin/questions/${id}`),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['question', id] });
    qc.invalidateQueries({ queryKey: ['questions'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const update = useMutation({
    mutationFn: (v: QuestionFormValue) =>
      api<QuestionDetail>(`/admin/questions/${id}`, { method: 'PATCH', body: v }),
    onSuccess: () => {
      invalidate();
      setNotice('Kaydedildi.');
    },
  });

  const action = useMutation({
    mutationFn: ({ act, note }: { act: 'submit' | 'approve' | 'reject' | 'archive'; note?: string }) =>
      api<unknown>(`/admin/questions/${id}/${act}`, { method: 'POST', body: note ? { note } : undefined }),
    onSuccess: (_, vars) => {
      if (vars.act === 'archive') {
        router.replace('/questions');
        return;
      }
      invalidate();
      setNotice(
        vars.act === 'submit' ? 'İncelemeye gönderildi.' : vars.act === 'approve' ? 'Yayınlandı ✅' : 'Taslağa geri alındı.',
      );
    },
  });

  if (q.isPending) return <Spinner />;
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;

  const d = q.data;
  const latest = d.versions[0];
  const isAdmin = me?.roles.includes('admin') ?? false;

  const initial: QuestionFormValue = {
    topicId: d.topicId,
    stem: latest.stem,
    explanation: latest.explanation ?? '',
    difficulty: latest.difficulty,
    articleNo: d.articleNo ?? '',
    options: latest.options.map((o) => ({ label: o.label, text: o.text, isCorrect: o.isCorrect })),
  };

  return (
    <>
      <PageHeader
        title={`Soru — ${d.topic.course.name} / ${d.topic.name}`}
        subtitle={`Güncel sürüm v${latest.versionNo}`}
        action={<StatusBadge status={latest.status} />}
      />

      {notice && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}
      {(update.isError || action.isError) && (
        <div className="mb-4">
          <ErrorBox error={update.error ?? action.error} />
        </div>
      )}

      {/* Editoryal akış aksiyonları (Doc 9 §4.3) */}
      <div className="mb-6 flex flex-wrap gap-2">
        {latest.status === 'draft' && (
          <button
            onClick={() => action.mutate({ act: 'submit' })}
            disabled={action.isPending}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
          >
            İncelemeye Gönder
          </button>
        )}
        {latest.status === 'in_review' && isAdmin && (
          <>
            <button
              onClick={() => action.mutate({ act: 'approve' })}
              disabled={action.isPending}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              ✓ Onayla ve Yayınla
            </button>
            <button
              onClick={() => {
                const note = window.prompt('Ret nedeni (editöre iletilir):') ?? undefined;
                action.mutate({ act: 'reject', note });
              }}
              disabled={action.isPending}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              ✕ Reddet
            </button>
          </>
        )}
        {latest.status === 'in_review' && !isAdmin && (
          <span className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">
            Admin onayı bekleniyor…
          </span>
        )}
        {isAdmin && (
          <button
            onClick={() => {
              if (window.confirm('Soru arşivlenecek ve yayından kalkacak. Emin misin?')) {
                action.mutate({ act: 'archive' });
              }
            }}
            disabled={action.isPending}
            className="ml-auto rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Arşivle
          </button>
        )}
      </div>

      <QuestionForm
        key={latest.id /* sürüm değişince formu tazele */}
        initial={initial}
        submitLabel={
          latest.status === 'published' || latest.status === 'archived'
            ? 'Yeni Taslak Sürüm Oluştur'
            : 'Kaydet'
        }
        busy={update.isPending}
        onSubmit={(v) => update.mutate(v)}
      />

      {/* Sürüm geçmişi */}
      <h2 className="mb-3 mt-10 text-sm font-semibold text-slate-700">Sürüm geçmişi</h2>
      <Card className="p-0">
        <ul className="divide-y divide-slate-100">
          {d.versions.map((v) => (
            <li key={v.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="font-medium">v{v.versionNo}</span>
                <StatusBadge status={v.status} />
                <span className="max-w-md truncate text-slate-500">{v.stem}</span>
              </div>
              <time className="text-xs text-slate-400">
                {new Date(v.publishedAt ?? v.createdAt).toLocaleString('tr-TR')}
              </time>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

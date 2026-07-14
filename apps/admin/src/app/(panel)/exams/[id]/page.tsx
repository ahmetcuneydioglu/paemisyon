'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner, StatusBadge } from '@/components/ui';
import { ExamForm, type ExamFormValue } from '@/components/exam-form';
import { ExamQuestionPicker, type PickedQuestion } from '@/components/exam-question-picker';
import { api } from '@/lib/api';
import type { AdminExamDetail, ExamResults } from '@/lib/types';

/** Deneme detayı: meta + soru seti (taslakta) + yayın aksiyonları + sonuçlar. */
export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [me, setMe] = useState<{ roles: string[] } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [picked, setPicked] = useState<PickedQuestion[] | null>(null);

  useEffect(() => {
    api<{ roles: string[] }>('/me').then(setMe).catch(() => setMe({ roles: [] }));
  }, []);
  const isAdmin = me?.roles.includes('admin') ?? false;

  const q = useQuery({
    queryKey: ['admin-exam', id],
    queryFn: () => api<AdminExamDetail>(`/admin/exams/${id}`),
  });

  // Soru seçici durumunu sunucudan tohumla (bir kez).
  useEffect(() => {
    if (q.data && picked === null) {
      setPicked(
        q.data.questions.map((x) => ({
          questionId: x.questionId,
          stem: x.stem,
          topicName: x.topicName,
        })),
      );
    }
  }, [q.data, picked]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-exam', id] });
    qc.invalidateQueries({ queryKey: ['admin-exams'] });
  };

  const update = useMutation({
    mutationFn: (v: ExamFormValue) =>
      api<AdminExamDetail>(`/admin/exams/${id}`, { method: 'PATCH', body: v }),
    onSuccess: () => {
      invalidate();
      setNotice('Kaydedildi.');
    },
  });

  const saveQuestions = useMutation({
    mutationFn: (ids: string[]) =>
      api<AdminExamDetail>(`/admin/exams/${id}/questions`, {
        method: 'PATCH',
        body: { questionIds: ids },
      }),
    onSuccess: () => {
      invalidate();
      setNotice('Soru seti kaydedildi.');
    },
  });

  const action = useMutation({
    mutationFn: (act: 'publish' | 'unpublish' | 'archive') =>
      api<unknown>(`/admin/exams/${id}/${act}`, { method: 'POST' }),
    onSuccess: (_, act) => {
      if (act === 'archive') {
        router.replace('/exams');
        return;
      }
      invalidate();
      setNotice(act === 'publish' ? 'Yayınlandı ✅ — webde görünür.' : 'Taslağa alındı.');
    },
  });

  const results = useQuery({
    queryKey: ['admin-exam-results', id],
    queryFn: () => api<ExamResults>(`/admin/exams/${id}/results`),
    enabled: isAdmin && q.data?.status === 'published' && (q.data?.attemptCount ?? 0) > 0,
  });

  if (q.isPending) return <Spinner />;
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  const exam = q.data;
  const isDraft = exam.status === 'draft';

  const initial: ExamFormValue = {
    title: exam.title,
    description: exam.description ?? '',
    startAt: exam.startAt,
    durationMinutes: exam.durationMinutes,
    isPremium: exam.isPremium,
    liveAnswerReveal: exam.liveAnswerReveal,
    questionsOpenAfterEnd: exam.questionsOpenAfterEnd,
  };

  return (
    <>
      <PageHeader
        title={exam.title}
        subtitle={`${exam.questions.length} soru · ${exam.attemptCount} katılım`}
        action={<StatusBadge status={exam.status} />}
      />

      {notice && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}
      {(update.isError || saveQuestions.isError || action.isError) && (
        <div className="mb-4">
          <ErrorBox error={update.error ?? saveQuestions.error ?? action.error} />
        </div>
      )}

      {/* Yayın aksiyonları */}
      <div className="mb-6 flex flex-wrap gap-2">
        {isDraft && isAdmin && (
          <button
            onClick={() => {
              if (
                window.confirm(
                  `"${exam.title}" yayınlanacak: soru sürümleri SABİTLENİR ve deneme webde görünür. Devam?`,
                )
              )
                action.mutate('publish');
            }}
            disabled={action.isPending || exam.questions.length === 0}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            ✓ Yayınla
          </button>
        )}
        {exam.status === 'published' && isAdmin && (
          <button
            onClick={() => action.mutate('unpublish')}
            disabled={action.isPending}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
            title="Yalnız katılım yokken mümkündür"
          >
            Yayından Kaldır
          </button>
        )}
        {isAdmin && exam.status !== 'archived' && (
          <button
            onClick={() => {
              if (window.confirm('Deneme arşivlenecek (webden kalkar, katılımlar korunur). Emin misin?'))
                action.mutate('archive');
            }}
            disabled={action.isPending}
            className="ml-auto rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Arşivle
          </button>
        )}
      </div>

      {/* Meta form */}
      <Card className="mb-6">
        <ExamForm
          key={exam.id + exam.status}
          initial={initial}
          submitLabel="Kaydet"
          busy={update.isPending}
          disabled={exam.status === 'archived'}
          onSubmit={(v) => update.mutate(v)}
        />
      </Card>

      {/* Soru seti */}
      <h2 className="mb-3 text-sm font-semibold text-slate-700">
        Soru Seti {!isDraft && '(yayınlandı — sürümler sabit, düzenlenemez)'}
      </h2>
      {isDraft ? (
        <>
          <ExamQuestionPicker value={picked ?? []} onChange={setPicked} />
          <button
            onClick={() => saveQuestions.mutate((picked ?? []).map((p) => p.questionId))}
            disabled={saveQuestions.isPending}
            className="mt-3 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saveQuestions.isPending ? 'Kaydediliyor…' : `Soru Setini Kaydet (${picked?.length ?? 0})`}
          </button>
        </>
      ) : (
        <Card className="p-0">
          <ol className="divide-y divide-slate-50">
            {exam.questions.map((x) => (
              <li key={x.questionId} className="flex items-center gap-3 px-4 py-2 text-sm">
                <span className="w-6 text-xs font-bold text-slate-400">{x.order}.</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate">{x.stem}</div>
                  <div className="text-xs text-slate-400">
                    {x.courseName} / {x.topicName} · sabit v{x.pinnedVersionNo}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* Sonuçlar */}
      {results.data && (
        <>
          <h2 className="mb-3 mt-8 text-sm font-semibold text-slate-700">Sonuçlar</h2>
          <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card>
              <div className="text-sm text-slate-500">Tamamlayan</div>
              <div className="mt-1 text-2xl font-semibold">{results.data.summary.completed}</div>
            </Card>
            <Card>
              <div className="text-sm text-slate-500">Devam eden</div>
              <div className="mt-1 text-2xl font-semibold">{results.data.summary.inProgress}</div>
            </Card>
            <Card>
              <div className="text-sm text-slate-500">Ortalama Net</div>
              <div className="mt-1 text-2xl font-semibold">
                {results.data.summary.avgScore?.toFixed(2) ?? '—'}
              </div>
            </Card>
            <Card>
              <div className="text-sm text-slate-500">En Yüksek Net</div>
              <div className="mt-1 text-2xl font-semibold">
                {results.data.summary.maxScore?.toFixed(2) ?? '—'}
              </div>
            </Card>
          </div>
          <Card className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                  <th className="px-5 py-3 font-medium">#</th>
                  <th className="px-3 py-3 font-medium">Kullanıcı</th>
                  <th className="px-3 py-3 font-medium">Net</th>
                  <th className="px-3 py-3 font-medium">D / Y / B</th>
                  <th className="px-3 py-3 font-medium">Bitirme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {results.data.participants.map((p) => (
                  <tr key={p.rank}>
                    <td className="px-5 py-2.5">{p.rank}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium">{p.displayName}</div>
                      <div className="text-xs text-slate-400">{p.email}</div>
                    </td>
                    <td className="px-3 py-2.5 font-semibold">{p.score.toFixed(2)}</td>
                    <td className="px-3 py-2.5">
                      {p.correctCount} / {p.wrongCount} / {p.blankCount}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">
                      {p.completedAt ? new Date(p.completedAt).toLocaleString('tr-TR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </>
  );
}

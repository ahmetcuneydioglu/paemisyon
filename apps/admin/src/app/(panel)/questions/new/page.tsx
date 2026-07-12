'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { PageHeader, ErrorBox } from '@/components/ui';
import { QuestionForm, emptyQuestion, type QuestionFormValue } from '@/components/question-form';
import { api } from '@/lib/api';
import type { QuestionDetail } from '@/lib/types';

export default function NewQuestionPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (v: QuestionFormValue) =>
      api<QuestionDetail>('/admin/questions', { method: 'POST', body: v }),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['questions'] });
      router.replace(`/questions/${d.id}`);
    },
  });

  return (
    <>
      <PageHeader title="Yeni Soru" subtitle="Taslak olarak oluşturulur; onaydan sonra yayına çıkar" />
      {create.isError && <div className="mb-4"><ErrorBox error={create.error} /></div>}
      <QuestionForm
        initial={emptyQuestion()}
        submitLabel="Taslak Oluştur"
        busy={create.isPending}
        onSubmit={(v) => create.mutate(v)}
      />
    </>
  );
}

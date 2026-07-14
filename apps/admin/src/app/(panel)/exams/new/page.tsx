'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ErrorBox, PageHeader } from '@/components/ui';
import { ExamForm, emptyExam, type ExamFormValue } from '@/components/exam-form';
import { api } from '@/lib/api';
import type { AdminExamDetail } from '@/lib/types';

export default function NewExamPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (v: ExamFormValue) =>
      api<AdminExamDetail>('/admin/exams', { method: 'POST', body: v }),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['admin-exams'] });
      router.replace(`/exams/${d.id}`);
    },
  });

  return (
    <>
      <PageHeader
        title="Yeni Deneme"
        subtitle="Taslak olarak oluşturulur; soruları bağlayıp yayınlayınca webde görünür"
      />
      {create.isError && (
        <div className="mb-4">
          <ErrorBox error={create.error} />
        </div>
      )}
      <ExamForm
        initial={emptyExam()}
        submitLabel="Taslak Oluştur"
        busy={create.isPending}
        onSubmit={(v) => create.mutate(v)}
      />
    </>
  );
}

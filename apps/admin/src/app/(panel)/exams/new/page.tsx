'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ErrorBox, PageHeader } from '@/components/ui';
import { ExamIdentityForm, emptyExam, type ExamFormValue } from '@/components/exam-form';
import { ExamWizardStepper } from '@/components/exam-wizard-stepper';
import { api } from '@/lib/api';
import type { AdminExamDetail, CatalogModule } from '@/lib/types';

/** Yeni deneme — sihirbaz 1. adım (Doc 50 A1). Taslak oluşur, 2. adıma geçilir. */
export default function NewExamPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const modules = useQuery({
    queryKey: ['catalog-tree'],
    queryFn: () => api<CatalogModule[]>('/admin/catalog/tree'),
  });

  const create = useMutation({
    mutationFn: (v: ExamFormValue) =>
      api<AdminExamDetail>('/admin/exams', { method: 'POST', body: v }),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['admin-exams'] });
      router.replace(`/exams/${d.id}?adim=2`);
    },
  });

  // Tek aktif sınav türü varsa otomatik seçili gelir.
  const active = (modules.data ?? []).filter((m) => m.isActive);
  const initial = { ...emptyExam(), examTypeId: active.length === 1 ? active[0].id : null };

  return (
    <>
      <PageHeader title="Yeni deneme" subtitle="Taslak olarak oluşturulur; sorular ve yayın sonraki adımlarda" />
      <ExamWizardStepper active={1} examId={null} />
      {create.isError && (
        <div className="mb-4">
          <ErrorBox error={create.error} />
        </div>
      )}
      {modules.isPending ? null : (
        <ExamIdentityForm
          initial={initial}
          modules={modules.data ?? []}
          submitLabel="Devam: Ayarlar"
          busy={create.isPending}
          onSubmit={(v) => create.mutate(v)}
        />
      )}
    </>
  );
}

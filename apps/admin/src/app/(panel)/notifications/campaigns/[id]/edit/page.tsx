'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { CampaignForm, fromCampaign, useIsAdmin } from '@/components/notifications/campaign-form';
import type { Campaign } from '@/app/(panel)/notifications/types';

export default function EditCampaignPage() {
  const { id } = useParams<{ id: string }>();
  const isAdmin = useIsAdmin();
  const q = useQuery({ queryKey: ['notif-campaign', id], queryFn: () => api<Campaign>(`/admin/notifications/campaigns/${id}`) });
  if (q.isPending) return <Spinner />;
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  const editable = q.data.status === 'draft' || q.data.status === 'scheduled';
  return (
    <div>
      <PageHeader title={q.data.name} subtitle={editable ? 'Taslak düzenleniyor' : 'Bu durumda düzenlenemez; kopyalayıp yeni kampanya aç.'} />
      {editable ? <CampaignForm initial={fromCampaign(q.data)} campaignId={id} isAdmin={isAdmin} /> : null}
    </div>
  );
}

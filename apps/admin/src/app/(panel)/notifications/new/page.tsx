'use client';

import { PageHeader } from '@/components/ui';
import { CampaignForm, emptyForm, useIsAdmin } from '@/components/notifications/campaign-form';

/** Yeni bildirim (Doc 52 §12): editor hazırlar ve test gönderir, admin gönderir. */
export default function NewNotificationPage() {
  const isAdmin = useIsAdmin();
  return (
    <div>
      <PageHeader title="Yeni bildirim" subtitle="Taslak olarak kaydedilir; prova ve test gönderimi herkes, gerçek gönderim yalnız admin." />
      <CampaignForm initial={emptyForm()} campaignId={null} isAdmin={isAdmin} />
    </div>
  );
}

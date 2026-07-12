'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { DashboardOverview } from '@/lib/types';

const ACTION_TR: Record<string, string> = {
  'question.create': 'Soru oluşturdu',
  'question.update': 'Soru düzenledi',
  'question.submit_review': 'İncelemeye gönderdi',
  'question.approve': 'Soruyu onayladı',
  'question.reject': 'Soruyu reddetti',
  'question.archive': 'Soruyu arşivledi',
  'question.import': 'Toplu soru aktardı',
  'course.create': 'Ders oluşturdu',
  'course.update': 'Ders düzenledi',
  'course.delete': 'Ders sildi',
  'topic.create': 'Konu oluşturdu',
  'topic.update': 'Konu düzenledi',
  'topic.delete': 'Konu sildi',
  'user.suspend': 'Kullanıcı askıya aldı',
  'user.activate': 'Kullanıcı aktifleştirdi',
  'user.grant_premium': 'Premium verdi',
  'user.revoke_premium': 'Premium geri aldı',
};

export default function DashboardPage() {
  const q = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<DashboardOverview>('/admin/dashboard'),
  });

  if (q.isPending) return <Spinner />;
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  const d = q.data;

  const stats = [
    { label: 'Toplam kullanıcı', value: d.users.total, sub: `+${d.users.new7d} son 7 gün` },
    { label: 'Bugün aktif', value: d.users.activeToday, sub: 'soru çözen' },
    { label: 'Premium üye', value: d.revenue.premiumUsers, sub: `${d.revenue.activeSubscriptions} aktif abonelik` },
    { label: 'Yayındaki soru', value: d.content.questionVersions.published ?? 0, sub: `${d.content.questionVersions.draft ?? 0} taslak` },
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Platform özeti" />

      {d.content.pendingReview > 0 && (
        <Link
          href="/review"
          className="mb-6 block rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 hover:bg-amber-100"
        >
          ⏳ <strong>{d.content.pendingReview} soru</strong> onay bekliyor — incelemek için tıkla.
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <div className="text-sm text-slate-500">{s.label}</div>
            <div className="mt-1 text-2xl font-semibold">{s.value}</div>
            <div className="mt-0.5 text-xs text-slate-400">{s.sub}</div>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold text-slate-700">Son işlemler</h2>
      <Card className="p-0">
        {d.recentActivity.length === 0 ? (
          <div className="p-5 text-sm text-slate-500">Henüz işlem yok.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {d.recentActivity.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <span className="font-medium">{a.actorEmail}</span>{' '}
                  <span className="text-slate-600">{ACTION_TR[a.action] ?? a.action}</span>
                </div>
                <time className="text-xs text-slate-400">
                  {new Date(a.createdAt).toLocaleString('tr-TR')}
                </time>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

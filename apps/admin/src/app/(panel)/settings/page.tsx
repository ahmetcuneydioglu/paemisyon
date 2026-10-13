'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';

/** GET/PATCH /admin/settings yanıtı — sunucudaki SETTING_KEYS ile birebir. */
type Settings = {
  showQuestionSource: boolean;
  coachCikmisSinavKarti: boolean;
  mobilAnasayfaV2: boolean;
};

const SETTINGS: { key: keyof Settings; label: string; help: string }[] = [
  {
    key: 'mobilAnasayfaV2',
    label: 'Mobil yeni anasayfa herkese açık',
    help:
      'Kapalıyken yeni "Bugün" ekranını yalnız admin hesapları görür (Doc 48). ' +
      'Açınca tüm mobil kullanıcılar ~1 dk içinde yeni ekrana geçer; kapatınca eski ekrana dönerler.',
  },
  {
    key: 'coachCikmisSinavKarti',
    label: 'Bugün ekranında "Çıkmış sınavlar" kartı',
    help: 'Çıkmış sınav ekranını içeren mağaza sürümü yayına çıkmadan açmayın (Doc 36 §7.2).',
  },
  {
    key: 'showQuestionSource',
    label: 'Kaynak etiketini kullanıcıya göster',
    help: 'Varsayılan kapalı (4 Eyl 2026 kararı). Denemede ayardan bağımsız her zaman gizlidir.',
  },
];

/** Uygulama ayarları — tüm aç/kapa anahtarları tek yerde (değişiklik ~1 dk'da yansır). */
export default function SettingsPage() {
  const qc = useQueryClient();
  const settings = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api<Settings>('/admin/settings'),
  });
  const update = useMutation({
    mutationFn: (patch: Partial<Settings>) =>
      api<Settings>('/admin/settings', { method: 'PATCH', body: patch }),
    onSuccess: (r) => qc.setQueryData(['admin-settings'], r),
  });

  return (
    <div>
      <PageHeader
        title="Ayarlar"
        subtitle="Uygulama genelindeki aç/kapa anahtarları. Değişiklik en geç 1 dakikada tüm kullanıcılara yansır."
      />
      {settings.isLoading && <Spinner />}
      {settings.error && <ErrorBox error={settings.error} onRetry={() => settings.refetch()} />}
      {settings.data && (
        <Card className="divide-y divide-slate-100 p-0">
          {SETTINGS.map(({ key, label, help }) => (
            <label key={key} className="flex cursor-pointer items-start gap-3 px-5 py-4 hover:bg-slate-50">
              <input
                type="checkbox"
                className="mt-1"
                checked={settings.data[key]}
                disabled={update.isPending}
                onChange={(e) => update.mutate({ [key]: e.target.checked })}
              />
              <span>
                <span className="block text-sm font-medium">{label}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{help}</span>
              </span>
            </label>
          ))}
        </Card>
      )}
      {update.error && <div className="mt-4"><ErrorBox error={update.error} /></div>}
    </div>
  );
}

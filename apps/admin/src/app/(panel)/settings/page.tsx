'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';

/** GET/PATCH /admin/settings yanıtı — sunucudaki SETTING_KEYS ile birebir. */
type Settings = {
  showQuestionSource: boolean;
  coachCikmisSinavKarti: boolean;
  mobilAnasayfaV2: boolean;
  flashcardsEnabled: boolean;
  /** Ücretsiz adayın günlük kart hakkı (Doc 56 §3h); 0 = sınırsız, Premium hep sınırsız. */
  flashcardsFreeDailyLimit: number;
};

type BoolKey = 'showQuestionSource' | 'coachCikmisSinavKarti' | 'mobilAnasayfaV2' | 'flashcardsEnabled';
const SETTINGS: { key: BoolKey; label: string; help: string }[] = [
  {
    key: 'mobilAnasayfaV2',
    label: 'Mobil yeni anasayfa herkese açık',
    help:
      'Kapalıyken yeni "Bugün" ekranını yalnız admin ve beta hesapları görür (Doc 48). ' +
      'Açınca, ekranı içeren sürümü (1.1.0+4 ve sonrası) kullananlar ~1 dk içinde yeni ekrana geçer; ' +
      'eski sürümdekiler eski ekranda kalır. Kapatınca herkes eski ekrana döner.',
  },
  {
    key: 'flashcardsEnabled',
    label: 'Bilgi kartları herkese açık',
    help:
      'Kapalıyken bilgi kartlarını yalnız admin ve beta hesapları görür; ders/konu odalarında kart ' +
      'satırı çizilmez (Doc 56). Yayında kart yoksa açmanın anlamı yok: önce panelden kart yayınlayın.',
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
      {settings.data && (
        <Card className="mt-4">
          <GunlukKartHakki value={settings.data.flashcardsFreeDailyLimit} busy={update.isPending} onSave={(n) => update.mutate({ flashcardsFreeDailyLimit: n })} />
        </Card>
      )}
      {update.error && <div className="mt-4"><ErrorBox error={update.error} /></div>}
    </div>
  );
}

/** Ücretsiz günlük kart hakkı (Doc 56 §3h): sayı alanı + Kaydet; 0 = sınırsız. Premium bu sınırı görmez. */
function GunlukKartHakki({ value, busy, onSave }: { value: number; busy: boolean; onSave: (n: number) => void }) {
  const [taslak, setTaslak] = useState(String(value));
  const n = Number(taslak);
  const gecerli = Number.isInteger(n) && n >= 0 && n <= 1000;
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="text-sm font-medium">Ücretsiz günlük kart hakkı</div>
        <p className="mt-0.5 max-w-xl text-xs text-slate-500">
          Ücretsiz aday günde en çok bu kadar farklı bilgi kartı puanlayabilir; hak dolunca oynatıcı Premium teklifi gösterir (Doc 56 §3h).
          Premium sınırsız. 0 yazarsanız herkes sınırsız olur. Değişiklik yaklaşık bir dakikada yansır.
        </p>
      </div>
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (gecerli) onSave(n);
        }}
      >
        <input
          type="number"
          min={0}
          max={1000}
          value={taslak}
          onChange={(e) => setTaslak(e.target.value)}
          aria-label="Ücretsiz günlük kart hakkı"
          className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        />
        <span className="text-xs text-slate-500">kart / gün</span>
        <button type="submit" disabled={busy || !gecerli || n === value} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
          Kaydet
        </button>
      </form>
    </div>
  );
}

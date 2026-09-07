'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { AdminPlan, PlanLimitEtkisi } from '@/lib/types';

const girdi = 'rounded border border-slate-300 px-2 py-1 text-sm';

/**
 * Planlar (Doc 9 devamı, 7 Eyl 2026) — fiyat ve günlük soru limiti tek yerden.
 *
 * Limit zaten veritabanındaydı ve sunucu onu 60 sn önbellekle okuyordu; eksik
 * olan yalnız bu sayfaydı. Değer ancak elle SQL ya da script'le
 * değiştirilebiliyordu.
 */
export default function PlansPage() {
  const [notice, setNotice] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => api<AdminPlan[]>('/admin/plans'),
  });

  return (
    <>
      <PageHeader
        title="Planlar"
        subtitle="Fiyat ve ücretsiz katmanın günlük soru limiti — değişiklik en geç 1 dakikada tüm istemcilere yansır"
      />

      {notice && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {notice}
        </div>
      )}
      {hata && (
        <div className="mb-4 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-800">{hata}</div>
      )}

      <Card className="mb-4 bg-amber-50">
        <p className="text-sm text-amber-900">
          <b>Buradaki fiyat yalnız web sayfalarında gösterilir.</b> Uygulama içi
          satın almada adayın ödediği tutarı App Store Connect ve Google Play
          Console belirler; oradaki fiyatı değiştirmeden buradaki sayıyı
          değiştirirsen web ile mağaza birbirini tutmaz.
        </p>
      </Card>

      {q.isPending ? (
        <Spinner />
      ) : q.isError ? (
        <ErrorBox error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <div className="space-y-3">
          {q.data.map((p) => (
            <PlanKarti
              key={p.id}
              plan={p}
              onOk={setNotice}
              onHata={setHata}
            />
          ))}
        </div>
      )}
    </>
  );
}

function PlanKarti({
  plan,
  onOk,
  onHata,
}: {
  plan: AdminPlan;
  onOk: (m: string) => void;
  onHata: (m: string) => void;
}) {
  const qc = useQueryClient();
  const [ad, setAd] = useState(plan.name);
  const [fiyat, setFiyat] = useState(plan.price?.toString() ?? '');
  const [limit, setLimit] = useState(plan.dailyQuestionLimit?.toString() ?? '');
  const [iosId, setIosId] = useState(plan.storeProductIdIos ?? '');
  const [androidId, setAndroidId] = useState(plan.storeProductIdAndroid ?? '');
  const [etki, setEtki] = useState<PlanLimitEtkisi | null>(null);

  const kaydet = useMutation({
    mutationFn: () =>
      api<AdminPlan>(`/admin/plans/${plan.id}`, {
        method: 'PATCH',
        body: {
          name: ad,
          price: fiyat.trim() === '' ? null : Number(fiyat),
          dailyQuestionLimit: limit.trim() === '' ? null : Number(limit),
          storeProductIdIos: iosId.trim() === '' ? null : iosId.trim(),
          storeProductIdAndroid: androidId.trim() === '' ? null : androidId.trim(),
        },
      }),
    onError: (e) => onHata(e instanceof Error ? e.message : 'Kaydedilemedi.'),
    onSuccess: () => {
      onHata('');
      onOk(`${plan.name} güncellendi. En geç 1 dakikada yansır.`);
      setEtki(null);
      qc.invalidateQueries({ queryKey: ['admin-plans'] });
    },
  });

  const aktiflik = useMutation({
    mutationFn: (v: boolean) =>
      api<AdminPlan>(`/admin/plans/${plan.id}`, { method: 'PATCH', body: { isActive: v } }),
    onError: (e) => onHata(e instanceof Error ? e.message : 'Değiştirilemedi.'),
    onSuccess: (_d, v) => {
      onOk(v ? `${plan.name} açıldı.` : `${plan.name} kapatıldı.`);
      qc.invalidateQueries({ queryKey: ['admin-plans'] });
    },
  });

  /**
   * Limit DÜŞÜRÜLÜYORSA önce etkisini sor. Limit her cevapta canlı okunuyor,
   * yani düşürmek gün ORTASINDA da geçerli: bugün 20 soru çözmüş ücretsiz
   * kullanıcı 15'e inince anında duvara çarpar. Körlemesine karar verilmesin.
   */
  async function limitKontrol(yeni: string) {
    setLimit(yeni);
    const n = Number(yeni);
    if (!plan.limitKaynagi || !Number.isInteger(n) || n < 1) return setEtki(null);
    if (plan.dailyQuestionLimit == null || n >= plan.dailyQuestionLimit) return setEtki(null);
    try {
      setEtki(await api<PlanLimitEtkisi>(`/admin/plans/limit-etkisi?limit=${n}`));
    } catch {
      setEtki(null); // etki hesaplanamazsa kaydetme yine engellenmez
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3">
        <code className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
          {plan.key}
        </code>
        {plan.limitKaynagi && (
          <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
            Günlük limit bu satırda
          </span>
        )}
        <span className="text-xs text-slate-500">
          {plan.period} · {plan.subscriptionCount} abonelik
        </span>
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={plan.isActive}
            // Ücretsiz plan kapatılamaz: limit bu satırda yaşıyor, kapanırsa
            // sunucu emniyet ağı değerine düşer ve panelden yönetilemez.
            disabled={plan.limitKaynagi || aktiflik.isPending}
            onChange={(e) => aktiflik.mutate(e.target.checked)}
          />
          Aktif
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Ad
          <input className={girdi} value={ad} onChange={(e) => setAd(e.target.value)} />
        </label>

        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Fiyat ({plan.currency}) — boş = ücretsiz
          <input
            className={girdi}
            type="number"
            step="0.01"
            min="0"
            value={fiyat}
            onChange={(e) => setFiyat(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Günlük soru limiti {plan.limitKaynagi ? '' : '— premium sınırsız, boş bırak'}
          <input
            className={girdi}
            type="number"
            min="1"
            max="1000"
            value={limit}
            disabled={!plan.limitKaynagi}
            onChange={(e) => limitKontrol(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-slate-500">
          iOS ürün kimliği
          <input className={girdi} value={iosId} onChange={(e) => setIosId(e.target.value)} />
        </label>

        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Android ürün kimliği
          <input
            className={girdi}
            value={androidId}
            onChange={(e) => setAndroidId(e.target.value)}
          />
        </label>
      </div>

      {etki && (
        <div className="mt-3 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-900">
          Limit {etki.mevcutLimit} → {etki.yeniLimit}. Bugün aktif{' '}
          <b>{etki.bugunAktifKullanici}</b> kullanıcıdan{' '}
          <b>{etki.aninaDuvaraCarpacak}</b> tanesi kaydettiğin anda duvara çarpar
          — limit her cevapta canlı okunuyor, gün ortasında da geçerli.
        </div>
      )}

      <div className="mt-3">
        <button
          onClick={() => kaydet.mutate()}
          disabled={kaydet.isPending}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
        >
          {kaydet.isPending ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </div>
    </Card>
  );
}

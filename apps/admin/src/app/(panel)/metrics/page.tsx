'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { HomeV2Metrics, HomeV2Scope, HomeV2SourceDay } from '@/lib/types';

/** Tur kanalları: tablo sütunu ve çubuk rengi; sıra burada belirlenir. */
const KANALLAR: { key: string; label: string; bar: string }[] = [
  { key: 'home_task', label: 'Ana görev', bar: 'bg-indigo-600' },
  { key: 'home_weak_topic', label: 'Zayıf konu', bar: 'bg-violet-400' },
  { key: 'home_suggestion', label: 'Öneri', bar: 'bg-sky-400' },
  { key: 'notif', label: 'Bildirim', bar: 'bg-amber-400' },
  { key: 'diger', label: 'Diğer', bar: 'bg-slate-300' },
];

const KAPSAM: Record<HomeV2Scope, string> = {
  coach: 'Koç turu',
  topic: 'Konu',
  course: 'Ders',
  wrongs: 'Yanlışlar',
};

const ODAK: Record<string, string> = {
  topic: 'Konu',
  course: 'Ders',
  wrongs: 'Yanlışlar',
  coach: 'Koç',
};

const ARALIKLAR = [7, 14, 30] as const;
const GUN_MS = 86_400_000;

type Sayim = Pick<HomeV2SourceDay, 'started' | 'completed' | 'abandoned' | 'inProgress'>;
const SIFIR: Sayim = { started: 0, completed: 0, abandoned: 0, inProgress: 0 };

const yuzde = (pay: number, payda: number) =>
  payda > 0 ? `%${Math.round((pay / payda) * 100)}` : '—';

function topla(satirlar: Sayim[]): Sayim {
  return satirlar.reduce(
    (t, s) => ({
      started: t.started + s.started,
      completed: t.completed + s.completed,
      abandoned: t.abandoned + s.abandoned,
      inProgress: t.inProgress + s.inProgress,
    }),
    SIFIR,
  );
}

/** Penceredeki uygulama günleri, bugünden geriye (boş günler de satır olur). */
function gunler(from: string, days: number): string[] {
  const bas = Date.parse(`${from}T00:00:00Z`);
  return Array.from({ length: days }, (_, i) =>
    new Date(bas + i * GUN_MS).toISOString().slice(0, 10),
  ).reverse();
}

const gunEtiketi = (gun: string) =>
  new Date(`${gun}T00:00:00Z`).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
    timeZone: 'UTC',
  });

/** Bilinen kanallar sabit sırada; veride beklenmeyen bir kanal varsa sona eklenir. */
function kanallar(daily: HomeV2SourceDay[]) {
  const bilinen = new Set(KANALLAR.map((k) => k.key));
  const ek = [...new Set(daily.map((d) => d.source))].filter((s) => !bilinen.has(s)).sort();
  return [...KANALLAR, ...ek.map((key) => ({ key, label: key, bar: 'bg-slate-500' }))];
}

/** Yeni mobil anasayfanın izlenmesi (Doc 48 Faz 5) — salt okuma. */
export default function MetricsPage() {
  const [days, setDays] = useState<number>(14);
  const q = useQuery({
    queryKey: ['metrics', 'home-v2', days],
    queryFn: () => api<HomeV2Metrics>(`/admin/metrics/home-v2?days=${days}`),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Anasayfa Metrikleri"
        subtitle="Yeni mobil “Bugün” ekranı (Doc 48) — salt okuma"
        action={<AralikSecici value={days} onChange={setDays} />}
      />
      {q.isPending ? (
        <Spinner />
      ) : q.isError ? (
        <ErrorBox error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <div className={`transition-opacity ${q.isPlaceholderData ? 'opacity-60' : ''}`}>
          <Pano m={q.data} />
        </div>
      )}
    </>
  );
}

function AralikSecici({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div
      role="group"
      aria-label="Zaman aralığı"
      className="flex shrink-0 rounded-lg border border-slate-300 bg-white p-0.5 text-sm"
    >
      {ARALIKLAR.map((n) => (
        <button
          key={n}
          type="button"
          aria-pressed={value === n}
          onClick={() => onChange(n)}
          className={`rounded-md px-3 py-1.5 ${
            value === n ? 'bg-indigo-600 font-medium text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          {n} gün
        </button>
      ))}
    </div>
  );
}

function Pano({ m }: { m: HomeV2Metrics }) {
  const sutunlar = kanallar(m.daily);
  const hucre = new Map(m.daily.map((d) => [`${d.day}|${d.source}`, d.started]));
  const satirlar = gunler(m.from, m.days).map((gun) => {
    const sayilar = sutunlar.map((k) => hucre.get(`${gun}|${k.key}`) ?? 0);
    return { gun, sayilar, toplam: sayilar.reduce((a, b) => a + b, 0) };
  });
  const enYogun = Math.max(1, ...satirlar.map((s) => s.toplam));
  const kanalSonucu = sutunlar.map((k) => ({
    ...k,
    ...topla(m.daily.filter((d) => d.source === k.key)),
  }));
  const ev = topla(m.daily.filter((d) => d.source.startsWith('home_')));
  const kapsamToplami = m.homeScope.reduce((t, s) => t + s.started, 0);
  const { open, usersWithMultiple, oldestActivityDays } = m.halfTours;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <div className="text-sm text-slate-500">Yeni anasayfayı gören</div>
          <div className="mt-1 text-2xl font-semibold">
            {m.cohort.flagOn ? 'Herkes' : `${m.cohort.betaOrAdminUsers} kişi`}
          </div>
          <div className="mt-0.5 text-xs text-slate-400">
            {m.cohort.flagOn ? 'bayrak açık' : 'bayrak kapalı · admin + beta'} ·{' '}
            <Link href="/settings" className="underline hover:text-slate-600">
              Ayarlar
            </Link>
          </div>
        </Card>
        <Card>
          <div className="text-sm text-slate-500">Ana sayfadan tur</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{ev.started}</div>
          <div className="mt-0.5 text-xs text-slate-400">
            {yuzde(ev.completed, ev.started)} tamamlandı · son {m.days} gün
          </div>
        </Card>
        <Card>
          <div className="text-sm text-slate-500">Açık yarım tur</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{open}</div>
          <div className="mt-0.5 text-xs text-slate-400">
            {oldestActivityDays == null
              ? 'açık tur yok'
              : `en eskisi ${oldestActivityDays} gündür sessiz · 7. günde kapanır`}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-slate-500">Birden çok açık turu olan</div>
          <div
            className={`mt-1 text-2xl font-semibold tabular-nums ${
              usersWithMultiple > 0 ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            {usersWithMultiple}
          </div>
          <div className="mt-0.5 text-xs text-slate-400">
            beklenen 0 — tek aktif tur kuralı {usersWithMultiple > 0 ? 'delinmiş' : 'sağlam'}
          </div>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold text-slate-700">
        Günlük tur başlatma — kanala göre
      </h2>
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs whitespace-nowrap text-slate-500">
                <th scope="col" className="px-5 py-3 font-medium">
                  Gün
                </th>
                {sutunlar.map((k) => (
                  <th key={k.key} scope="col" className="px-3 py-3 text-right font-medium">
                    <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${k.bar}`} aria-hidden />
                    {k.label}
                  </th>
                ))}
                <th scope="col" className="px-3 py-3 text-right font-medium">
                  Toplam
                </th>
                {/* Dağılım çubuğu yalnız görseldir; sayılar hücrelerde. */}
                <td aria-hidden className="w-1/4 px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {satirlar.map((s, i) => (
                <tr key={s.gun}>
                  <th
                    scope="row"
                    className="whitespace-nowrap px-5 py-2.5 text-left text-xs font-normal text-slate-500"
                  >
                    {gunEtiketi(s.gun)}
                    {i === 0 && <span className="ml-1 text-slate-400">(bugün)</span>}
                  </th>
                  {s.sayilar.map((n, j) => (
                    <td
                      key={sutunlar[j].key}
                      className={`px-3 py-2.5 text-right tabular-nums ${n === 0 ? 'text-slate-300' : ''}`}
                    >
                      {n}
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-right font-medium tabular-nums">{s.toplam}</td>
                  <td aria-hidden className="px-5 py-2.5">
                    <div className="flex h-2 min-w-24 overflow-hidden rounded-full bg-slate-100">
                      {s.sayilar.map((n, j) =>
                        n > 0 ? (
                          <div
                            key={sutunlar[j].key}
                            className={sutunlar[j].bar}
                            style={{ width: `${(n / enYogun) * 100}%` }}
                          />
                        ) : null,
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <h2 className="mb-3 mt-8 text-sm font-semibold text-slate-700">
        Kanal başına sonuç — son {m.days} gün
      </h2>
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs whitespace-nowrap text-slate-500">
                <th scope="col" className="px-5 py-3 font-medium">
                  Kanal
                </th>
                <th scope="col" className="px-3 py-3 text-right font-medium">
                  Başlatılan
                </th>
                <th scope="col" className="px-3 py-3 text-right font-medium">
                  Tamamlanan
                </th>
                <th scope="col" className="px-3 py-3 text-right font-medium">
                  Terk edilen
                </th>
                <th scope="col" className="px-3 py-3 text-right font-medium">
                  Süren
                </th>
                <th scope="col" className="w-1/4 px-5 py-3 font-medium">
                  Tamamlama
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {kanalSonucu.map((k) => (
                <tr key={k.key}>
                  <th scope="row" className="whitespace-nowrap px-5 py-2.5 text-left font-normal">
                    <span className={`mr-2 inline-block h-2 w-2 rounded-full ${k.bar}`} aria-hidden />
                    {k.label}
                  </th>
                  <td className="px-3 py-2.5 text-right tabular-nums">{k.started}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{k.completed}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{k.abandoned}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{k.inProgress}</td>
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 min-w-16 flex-1 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: k.started > 0 ? `${(k.completed / k.started) * 100}%` : 0 }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs tabular-nums text-slate-500">
                        {yuzde(k.completed, k.started)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-slate-700">Ana sayfa turlarının kapsamı</h2>
          <p className="mt-0.5 text-xs text-slate-400">Odağın gerçek kullanımı — son {m.days} gün</p>
          {m.homeScope.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Bu aralıkta ana sayfadan tur başlatılmadı.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {m.homeScope.map((s) => (
                <li key={s.scope}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0">{KAPSAM[s.scope] ?? s.scope}</span>
                    <span className="shrink-0 whitespace-nowrap tabular-nums text-slate-500">
                      {s.started} tur · {yuzde(s.completed, s.started)} tamamlandı
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                    <div
                      className="h-full bg-indigo-600"
                      style={{ width: `${(s.started / kapsamToplami) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="text-sm font-semibold text-slate-700">Bugünün odak seçimleri</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Koç dışı odak seçen kullanıcılar — koç varsayılandır, kayıt tutmaz
          </p>
          {m.focusToday.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Bugün koç dışı odak seçen yok.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100 text-sm">
              {m.focusToday.map((f) => (
                <li key={f.kind} className="flex justify-between py-2">
                  <span>{ODAK[f.kind] ?? f.kind}</span>
                  <span className="tabular-nums text-slate-500">{f.users} kişi</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold text-slate-700">Tanımlar</h2>
      <Card>
        <ul className="list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-slate-500">
          <li>
            Gün TR 04.00’te döner — uygulamanın gün tanımı: gece nöbetinde çözülen soru o günün
            emeğidir.
          </li>
          <li>
            Tablolar alıştırma, yanlış tekrarı ve günün quizini sayar; deneme, kişisel deneme ve
            arşiv çözümü dahil değildir.
          </li>
          <li>
            <strong className="font-medium text-slate-600">Diğer</strong>: kanal bildirmeyen her
            tur — web, katalog ve eski mobil anasayfa.
          </li>
          <li>
            “Devam et” yeni tur açmaz: yarım tur ilk açıldığı kanalda sayılır, bitince o kanalın
            tamamlananına geçer.
          </li>
          <li>
            <strong className="font-medium text-slate-600">Terk edilen</strong>: yeni tur başlarken
            kapanan (tek aktif tur kuralı) ya da 7 gün sessiz kalıp gece kapanan tur. Çözülen
            cevaplar ilerlemeye yazılır.
          </li>
          <li>
            <strong className="font-medium text-slate-600">Kapsam</strong>: koç turu kapsamsızdır
            (koç ve dönüş reçeteleri); konu, Hazırlık’taki zayıf konu satırını da içerir.
          </li>
        </ul>
      </Card>
    </>
  );
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import type { SummaryStaleItem, SummaryUnitListItem } from '@/lib/types';

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

interface ImportResult {
  unitId: string;
  slug: string;
  blocks: number;
  totalQuestions: number;
}

/**
 * Konu Özetleri (Doc 53 §6 admin): ders › konu › ünite listesi, eskimiş kart kuyruğu,
 * JSON içe aktarma (betik çıktısı). Yayın kararı ünite sayfasında ve yalnız admin.
 */
export default function SummariesPage() {
  const qc = useQueryClient();
  const [me, setMe] = useState<{ roles: string[] } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [json, setJson] = useState('');
  const [replace, setReplace] = useState(false);
  const [importError, setImportError] = useState<{ message: string; issues: string[] } | null>(null);

  useEffect(() => {
    api<{ roles: string[] }>('/me').then(setMe).catch(() => setMe({ roles: [] }));
  }, []);

  const units = useQuery({ queryKey: ['admin-summaries'], queryFn: () => api<SummaryUnitListItem[]>('/admin/summaries') });
  const stale = useQuery({ queryKey: ['admin-summaries-stale'], queryFn: () => api<SummaryStaleItem[]>('/admin/summaries/stale') });

  const doImport = useMutation({
    mutationFn: (body: unknown) => api<ImportResult>(`/admin/summaries/import${replace ? '?replace=1' : ''}`, { method: 'POST', body }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['admin-summaries'] });
      setNotice(`✅ ${r.slug} içe aktarıldı: ${r.blocks} kart, ${r.totalQuestions} bağlı soru. Durum: incelemede.`);
      setJson('');
      setImportOpen(false);
      setImportError(null);
    },
    // Sunucu kusurları mesaja satır satır ekler; ilk satır başlık, kalanı liste.
    onError: (e: unknown) => {
      const [message, ...issues] = (e instanceof Error ? e.message : 'İçe aktarma başarısız.').split('\n');
      setImportError({ message, issues });
    },
  });

  const grouped = useMemo(() => {
    const m = new Map<string, { course: string; topic: string; topicId: string; items: SummaryUnitListItem[] }>();
    for (const u of units.data ?? []) {
      const key = u.topicId;
      (m.get(key) ?? m.set(key, { course: u.courseName, topic: u.topicName, topicId: u.topicId, items: [] }).get(key)!).items.push(u);
    }
    return [...m.values()];
  }, [units.data]);

  const submitImport = () => {
    setImportError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      setImportError({ message: 'Geçerli JSON değil.', issues: [] });
      return;
    }
    doImport.mutate(parsed);
  };

  const total = units.data?.length ?? 0;
  const published = units.data?.filter((u) => u.status === 'published').length ?? 0;
  const inReview = units.data?.filter((u) => u.status === 'in_review').length ?? 0;
  const staleCount = stale.data?.length ?? 0;

  return (
    <div>
      <PageHeader
        title="Konu Özetleri"
        subtitle="Maddeye çivilenmiş kart dizileri (Doc 53). Üretim modeldir, yayın insanındır."
        action={
          <button
            onClick={() => setImportOpen((v) => !v)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            {importOpen ? 'Kapat' : 'JSON içe aktar'}
          </button>
        }
      />

      {notice && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
          <button onClick={() => setNotice(null)} className="ml-3 underline">
            kapat
          </button>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Ünite" value={total} />
        <Stat label="Yayında" value={published} tone="emerald" />
        <Stat label="İncelemede" value={inReview} tone="amber" />
        <Stat label="Eskimiş kart" value={staleCount} tone={staleCount ? 'red' : undefined} />
      </div>

      {importOpen && (
        <Card className="mb-6">
          <h2 className="text-sm font-semibold">Ünite JSON&apos;u</h2>
          <p className="mt-1 text-xs text-slate-500">
            <code>scripts/ozet-uret.ts</code> ya da elle hazırlanmış ünite dosyası (<code>{'{ unit, blocks }'}</code>). Sunucu her kartı
            madde metinlerine karşı doğrular; geçmeyen ünite yazılmaz. İstatistik ve köprü kartları veriden doldurulur.
          </p>
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            spellCheck={false}
            rows={12}
            placeholder='{"unit": {...}, "blocks": [...]}'
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
          />
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
              Aynı slug varsa üzerine yaz (kartlar yenilenir, sürüm artar)
            </label>
            <button
              onClick={submitImport}
              disabled={doImport.isPending || !json.trim()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {doImport.isPending ? 'Doğrulanıyor…' : 'İçe aktar'}
            </button>
          </div>
          {importError && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <div className="font-medium">{importError.message}</div>
              {importError.issues.length > 0 && (
                <ul className="mt-1 list-disc pl-5 text-xs">
                  {importError.issues.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>
      )}

      {stale.data && stale.data.length > 0 && (
        <Card className="mb-6 border-red-200">
          <h2 className="text-sm font-semibold text-red-800">Eskimiş kartlar</h2>
          <p className="mt-1 text-xs text-slate-500">
            Referans verdiği madde metni değişti. Kart düzenlenip kaydedilince damga kalkar; eskimiş kartı olan ünite yayınlanamaz.
          </p>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {stale.data.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <Link href={`/summaries/${s.unit.id}#${s.id}`} className="font-medium hover:underline">
                    {s.title ?? '(başlıksız)'}
                  </Link>
                  <span className="ml-2 text-xs text-slate-500">
                    {s.unit.title} · md {s.articles.map((a) => a.no).join(', ')}
                  </span>
                </div>
                <span className="text-xs text-slate-500">{fmt(s.staleSince)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {units.isLoading && <Spinner />}
      {units.error && <ErrorBox error={units.error} onRetry={() => units.refetch()} />}
      {units.data && units.data.length === 0 && (
        <Card>
          <p className="text-sm text-slate-600">
            Henüz ünite yok. Pilot: <code>docs/53-konu-ozetleri/pilot/anayasa-yasama-1.json</code> dosyasını içe aktar ya da{' '}
            <code>npx tsx scripts/ozet-yukle.ts</code> çalıştır.
          </p>
        </Card>
      )}

      {grouped.map((g) => (
        <Card key={g.topicId} className="mb-4">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">
              <span className="text-slate-500">{g.course} › </span>
              {g.topic}
            </h2>
            <span className="text-xs text-slate-500">{g.items.length} ünite</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="py-1 pr-3 font-medium">#</th>
                  <th className="py-1 pr-3 font-medium">Ünite</th>
                  <th className="py-1 pr-3 font-medium">Madde</th>
                  <th className="py-1 pr-3 font-medium">Kart</th>
                  <th className="py-1 pr-3 font-medium">Durum</th>
                  <th className="py-1 pr-3 font-medium">Erişim</th>
                  <th className="py-1 pr-3 font-medium">Güncellendi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {g.items.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-2 pr-3 text-slate-400">{u.sortOrder}</td>
                    <td className="min-w-[18rem] py-2 pr-3">
                      <Link href={`/summaries/${u.id}`} className="font-medium hover:underline">
                        {u.title}
                      </Link>
                      <div className="text-xs text-slate-500">
                        {u.slug} · v{u.version} · {u.readingMinutes} dk
                        {me?.roles.includes('admin') || me?.roles.includes('editor') ? (
                          <span className="ml-2 rounded bg-violet-50 px-1.5 py-0.5 text-violet-700">{u.sourceLabel}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap text-slate-600">
                      {u.legislationName} {u.articleFrom}–{u.articleTo}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {u.blocks}
                      {u.staleBlocks > 0 && (
                        <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">{u.staleBlocks} eskimiş</span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="py-2 pr-3 text-xs">
                      {u.isPremium ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">Premium</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">Açık</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap text-xs text-slate-500">{fmt(u.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'emerald' | 'amber' | 'red' }) {
  const cls =
    tone === 'emerald'
      ? 'text-emerald-700'
      : tone === 'amber'
        ? 'text-amber-700'
        : tone === 'red'
          ? 'text-red-700'
          : 'text-slate-900';
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-semibold ${cls}`}>{value}</div>
    </div>
  );
}

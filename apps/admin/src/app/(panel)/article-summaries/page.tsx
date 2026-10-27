'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { ArticleSummaryLawRow, ArticleSummaryStaleItem } from '@/lib/types';

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

interface ImportResult {
  id: string;
  lawSlug: string;
  articleNo: string;
  replaced: boolean;
}

/**
 * Madde Özetleri (Doc 54): kanun bazında kapsama, eskimiş özet kuyruğu, JSON içe aktarma (betik çıktısı,
 * tek madde ya da liste). Üretim modeldir, yayın insanındır; yayın kararı madde sayfasında ve yalnız admin.
 */
export default function ArticleSummariesPage() {
  const qc = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [json, setJson] = useState('');
  const [replace, setReplace] = useState(false);
  const [importError, setImportError] = useState<{ message: string; issues: string[] } | null>(null);

  const laws = useQuery({ queryKey: ['admin-article-summaries-laws'], queryFn: () => api<ArticleSummaryLawRow[]>('/admin/article-summaries/laws') });
  const stale = useQuery({ queryKey: ['admin-article-summaries-stale'], queryFn: () => api<ArticleSummaryStaleItem[]>('/admin/article-summaries/stale') });

  const doImport = useMutation({
    mutationFn: (body: unknown) => api<ImportResult[]>(`/admin/article-summaries/import${replace ? '?replace=1' : ''}`, { method: 'POST', body }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['admin-article-summaries-laws'] });
      qc.invalidateQueries({ queryKey: ['admin-article-summaries-law'] });
      setNotice(`✅ ${r.length} madde özeti içe aktarıldı (${r.filter((x) => x.replaced).length} yenilendi): md ${r.map((x) => x.articleNo).join(', ')}. Durum: incelemede.`);
      setJson('');
      setImportOpen(false);
      setImportError(null);
    },
    onError: (e: unknown) => {
      const [message, ...issues] = (e instanceof Error ? e.message : 'İçe aktarma başarısız.').split('\n');
      setImportError({ message, issues });
    },
  });

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

  const tot = (k: keyof ArticleSummaryLawRow) => (laws.data ?? []).reduce((s, l) => s + (l[k] as number), 0);

  return (
    <div>
      <PageHeader
        title="Madde Özetleri"
        subtitle="Madde başına bir özet, resmî metnin altında (Doc 54). Üretim modeldir, yayın insanındır."
        action={
          <button onClick={() => setImportOpen((v) => !v)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
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
        <Stat label="Özetli madde" value={tot('summarized')} />
        <Stat label="Yayında" value={tot('published')} tone="emerald" />
        <Stat label="İncelemede" value={tot('inReview')} tone="amber" />
        <Stat label="Eskimiş" value={stale.data?.length ?? 0} tone={stale.data?.length ? 'red' : undefined} />
      </div>

      {importOpen && (
        <Card className="mb-6">
          <h2 className="text-sm font-semibold">Madde özeti JSON&apos;u</h2>
          <p className="mt-1 text-xs text-slate-500">
            <code>scripts/madde-ozeti-uret.ts</code> çıktısı: tek madde nesnesi ya da liste. Sunucu her özeti madde metnine karşı doğrular
            (sayılar, atıflar, mülga kuralı); geçmeyen madde yazılmaz. Toplu yükleme için <code>scripts/madde-ozeti-yukle.ts</code>.
          </p>
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            spellCheck={false}
            rows={12}
            placeholder='{"lawSlug": "...", "articleNo": "16", "title": "...", ...}'
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
          />
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
              Maddenin özeti varsa üzerine yaz (sürüm artar, incelemeye döner)
            </label>
            <button onClick={submitImport} disabled={doImport.isPending || !json.trim()} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
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
          <h2 className="text-sm font-semibold text-red-800">Eskimiş özetler</h2>
          <p className="mt-1 text-xs text-slate-500">
            Madde metni tazelendi. Özet yeniden incelenip kaydedilince damga kalkar; eskimiş özet yayınlanamaz.
          </p>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {stale.data.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <Link href={`/article-summaries/${s.id}`} className="font-medium hover:underline">
                    {s.law?.shortName ?? s.law?.name} md {s.articleNo} — {s.title}
                  </Link>
                </div>
                <span className="text-xs text-slate-500">{fmt(s.staleSince)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {laws.isLoading && <Spinner />}
      {laws.error && <ErrorBox error={laws.error} onRetry={() => laws.refetch()} />}
      {laws.data && laws.data.length === 0 && (
        <Card>
          <p className="text-sm text-slate-600">
            Henüz madde özeti yok. Örnek: <code>docs/54-pvsk-madde-ozetleri/ornek/pvsk-md-16.json</code> dosyasını içe aktar ya da{' '}
            <code>npx tsx scripts/madde-ozeti-yukle.ts &lt;dizin&gt;</code> çalıştır.
          </p>
        </Card>
      )}

      {laws.data && laws.data.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="py-1 pr-3 font-medium">Mevzuat</th>
                  <th className="py-1 pr-3 font-medium">Madde</th>
                  <th className="py-1 pr-3 font-medium">Özetli</th>
                  <th className="py-1 pr-3 font-medium">Yayında</th>
                  <th className="py-1 pr-3 font-medium">İncelemede</th>
                  <th className="py-1 pr-3 font-medium">Eskimiş</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {laws.data.map((l) => (
                  <tr key={l.slug} className="hover:bg-slate-50">
                    <td className="py-2 pr-3">
                      <Link href={`/article-summaries/law/${l.slug}`} className="font-medium hover:underline">
                        {l.name}
                      </Link>
                      <div className="text-xs text-slate-500">{l.slug}</div>
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{l.articles}</td>
                    <td className="py-2 pr-3 tabular-nums">
                      {l.summarized}
                      <span className="ml-1 text-xs text-slate-400">%{Math.round((100 * l.summarized) / Math.max(1, l.articles))}</span>
                    </td>
                    <td className="py-2 pr-3 tabular-nums text-emerald-700">{l.published}</td>
                    <td className="py-2 pr-3 tabular-nums text-amber-700">{l.inReview}</td>
                    <td className="py-2 pr-3 tabular-nums">{l.stale > 0 ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">{l.stale}</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'emerald' | 'amber' | 'red' }) {
  const cls = tone === 'emerald' ? 'text-emerald-700' : tone === 'amber' ? 'text-amber-700' : tone === 'red' ? 'text-red-700' : 'text-slate-900';
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-semibold ${cls}`}>{value}</div>
    </div>
  );
}

'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { Card, ErrorBox, PageHeader } from '@/components/ui';
import { config } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import type { CatalogModule } from '@/lib/types';

interface ImportReport {
  totalRows: number;
  valid: { rowNo: number; stem: string; options: { label: string; isCorrect: boolean }[] }[];
  errors: { rowNo: number; message: string }[];
  imported: number;
  dryRun: boolean;
  /** PDF kitapçıktan otomatik saptanan kaynak (öneri — düzenlenebilir). */
  detectedSource?: string | null;
}

/** Şablon CSV'si (UTF-8 BOM + ; ayraç — TR Excel'de sorunsuz açılır). */
function downloadTemplate() {
  const rows = [
    'soru;A;B;C;D;E;dogru;aciklama;zorluk',
    'TBMM üye tam sayısı kaçtır?;550;600;500;450;;B;2017 anayasa değişikliğiyle 600 olmuştur.;kolay',
    'Örnek: beş şıklı soru?;şık 1;şık 2;şık 3;şık 4;şık 5;E;açıklama buraya (opsiyonel);orta',
  ];
  const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'paemisyon-soru-sablonu.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

/** multipart upload — api() JSON gövdesi kurduğu için burada ham fetch kullanılır. */
async function uploadImport(params: {
  topicId: string;
  file: File;
  dryRun: boolean;
  skipErrors: boolean;
  source?: string;
}): Promise<ImportReport> {
  const { data } = await supabase().auth.getSession();
  const form = new FormData();
  form.append('file', params.file);
  const qs = new URLSearchParams({
    topicId: params.topicId,
    dryRun: params.dryRun ? '1' : '0',
    skipErrors: params.skipErrors ? '1' : '0',
  });
  if (params.source?.trim()) qs.set('source', params.source.trim());
  const res = await fetch(`${config.apiBaseUrl}/admin/questions/import?${qs}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${data.session?.access_token ?? ''}` },
    body: form,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error?.message ?? `Yükleme başarısız (${res.status}).`);
  return json.data as ImportReport;
}

export default function ImportPage() {
  const [topicId, setTopicId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [skipErrors, setSkipErrors] = useState(false);
  const [source, setSource] = useState('');
  const [done, setDone] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const tree = useQuery({
    queryKey: ['catalog-tree'],
    queryFn: () => api<CatalogModule[]>('/admin/catalog/tree'),
  });

  const preview = useMutation({
    mutationFn: (f: File) => uploadImport({ topicId, file: f, dryRun: true, skipErrors: false }),
    onSuccess: (r) => {
      setReport(r);
      // PDF kitapçıktan saptanan kaynak — alan boşsa öneri olarak doldur.
      if (r.detectedSource) setSource((cur) => cur || r.detectedSource!);
    },
  });

  const doImport = useMutation({
    mutationFn: () => uploadImport({ topicId, file: file!, dryRun: false, skipErrors, source }),
    onSuccess: (r) => {
      setReport(r);
      setDone(r.imported);
    },
  });

  function onFileChange(f: File | null) {
    setFile(f);
    setReport(null);
    setDone(null);
    if (f && topicId) preview.mutate(f);
  }

  const canImport = !!file && !!topicId && !!report && report.valid.length > 0 && done == null;

  return (
    <>
      <PageHeader
        title="Toplu Soru İçe Aktarma"
        subtitle="CSV, Excel (.xlsx) veya resmî sınav kitapçığı PDF'i — aktarılan sorular doğrudan yayına ÇIKMAZ, onay kuyruğuna düşer"
        action={
          <button onClick={downloadTemplate} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
            📄 Şablonu indir
          </button>
        }
      />

      <Card className="max-w-3xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Hedef konu</label>
            <select
              value={topicId}
              onChange={(e) => {
                setTopicId(e.target.value);
                setReport(null);
                setDone(null);
                if (file && e.target.value) preview.mutate(file);
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Konu seç…</option>
              {tree.data?.map((m) =>
                m.courses.map((c) =>
                  c.topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {m.name} / {c.name} / {t.name}
                    </option>
                  )),
                ),
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Dosya (.csv / .xlsx / .pdf)</label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.pdf"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <p className="mt-1 text-xs text-slate-400">
              CSV/Excel sütunları: soru, A, B, C, D, (E), dogru, (aciklama), (zorluk). PDF: MEB/ÖDSGM
              kitapçık formatı — sorular ve cevap anahtarı otomatik ayrıştırılır. En fazla 500 soru.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium">Kaynak etiketi (opsiyonel)</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="30 Kasım 2025 Adalet Bakanlığı GYS — Zabıt Kâtibi"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-slate-400">
              Sorunun geldiği sınav/yıl. PDF yüklersen kitapçıktan otomatik önerilir. Kullanıcıya
              gösterimi Sorular sayfasındaki anahtardan açılıp kapanır.
            </p>
          </div>
        </div>
      </Card>

      {(preview.isError || doImport.isError) && (
        <div className="mt-4 max-w-3xl">
          <ErrorBox error={preview.error ?? doImport.error} />
        </div>
      )}
      {preview.isPending && <p className="mt-4 text-sm text-slate-500">Dosya inceleniyor…</p>}

      {report && (
        <div className="mt-6 max-w-3xl space-y-4">
          {/* Özet */}
          <div className="flex gap-4 text-sm">
            <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800">
              ✓ {report.valid.length} geçerli
            </span>
            {report.errors.length > 0 && (
              <span className="rounded-full bg-red-100 px-3 py-1 font-medium text-red-700">
                ✕ {report.errors.length} hatalı
              </span>
            )}
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
              {report.totalRows} satır
            </span>
          </div>

          {/* Hatalar */}
          {report.errors.length > 0 && (
            <Card className="border-red-200 p-0">
              <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm font-medium text-red-800">
                Hatalı satırlar {done == null && '— düzeltip yeniden yükle ya da atlayarak aktar'}
              </div>
              <ul className="max-h-56 divide-y divide-slate-50 overflow-y-auto">
                {report.errors.map((e) => (
                  <li key={e.rowNo} className="px-4 py-2 text-sm">
                    <span className="font-mono text-xs text-slate-400">satır {e.rowNo}</span>{' '}
                    {e.message}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Geçerli önizleme */}
          {report.valid.length > 0 && done == null && (
            <Card className="p-0">
              <div className="border-b border-slate-100 px-4 py-2 text-sm font-medium">
                Önizleme (ilk 5)
              </div>
              <ul className="divide-y divide-slate-50">
                {report.valid.slice(0, 5).map((v) => (
                  <li key={v.rowNo} className="px-4 py-2 text-sm">
                    <span className="font-mono text-xs text-slate-400">satır {v.rowNo}</span>{' '}
                    {v.stem}{' '}
                    <span className="text-xs text-emerald-700">
                      (doğru: {v.options.find((o) => o.isCorrect)?.label})
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Aksiyon */}
          {done == null ? (
            <div className="flex items-center gap-4">
              <button
                disabled={!canImport || doImport.isPending || (report.errors.length > 0 && !skipErrors)}
                onClick={() => doImport.mutate()}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {doImport.isPending
                  ? 'Aktarılıyor…'
                  : `${report.valid.length} soruyu onay kuyruğuna aktar`}
              </button>
              {report.errors.length > 0 && (
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={skipErrors}
                    onChange={(e) => setSkipErrors(e.target.checked)}
                  />
                  Hatalı satırları atlayarak aktar
                </label>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              ✅ {done} soru onay kuyruğuna aktarıldı.{' '}
              <Link href="/review" className="font-medium underline">
                Onay kuyruğuna git →
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}

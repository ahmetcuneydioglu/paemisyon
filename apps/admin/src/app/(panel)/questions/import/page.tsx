'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { Card, ErrorBox, PageHeader } from '@/components/ui';
import { config } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import type { CatalogModule } from '@/lib/types';

const UNASSIGNED = '__none__';

interface PreviewRow {
  rowNo: number;
  stem: string;
  options: { label: string; isCorrect: boolean }[];
  suggestedTopicId: string | null;
  suggestedTopicName: string | null;
  matchedKeyword: string | null;
}
interface ModuleTopic {
  id: string;
  name: string;
  courseName: string;
}
interface PreviewReport {
  totalRows: number;
  valid: PreviewRow[];
  errors: { rowNo: number; message: string }[];
  detectedSource: string | null;
  moduleTopics: ModuleTopic[];
}
interface ImportResult {
  imported: number;
  skipped: number;
  errors: { rowNo: number; message: string }[];
}

/** Şablon CSV'si (UTF-8 BOM + ; ayraç — TR Excel'de sorunsuz açılır). */
function downloadTemplate() {
  const rows = [
    'soru;A;B;C;D;E;dogru;aciklama;zorluk',
    'TBMM üye tam sayısı kaçtır?;550;600;500;450;;B;;kolay',
    'Örnek: beş şıklı soru?;şık 1;şık 2;şık 3;şık 4;şık 5;E;;orta',
  ];
  const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'paemisyon-soru-sablonu.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function authHeader() {
  const { data } = await supabase().auth.getSession();
  return `Bearer ${data.session?.access_token ?? ''}`;
}

async function previewUpload(moduleId: string, file: File): Promise<PreviewReport> {
  const form = new FormData();
  form.append('file', file);
  const qs = new URLSearchParams({ moduleId, dryRun: '1' });
  const res = await fetch(`${config.apiBaseUrl}/admin/questions/import?${qs}`, {
    method: 'POST',
    headers: { Authorization: await authHeader() },
    body: form,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error?.message ?? `Önizleme başarısız (${res.status}).`);
  return json.data as PreviewReport;
}

async function importUpload(params: {
  moduleId: string;
  file: File;
  assignments: Record<number, string>;
  source: string;
  skipErrors: boolean;
}): Promise<ImportResult> {
  const form = new FormData();
  form.append('file', params.file);
  form.append('assignments', JSON.stringify(params.assignments));
  const qs = new URLSearchParams({
    moduleId: params.moduleId,
    skipErrors: params.skipErrors ? '1' : '0',
  });
  if (params.source.trim()) qs.set('source', params.source.trim());
  const res = await fetch(`${config.apiBaseUrl}/admin/questions/import?${qs}`, {
    method: 'POST',
    headers: { Authorization: await authHeader() },
    body: form,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error?.message ?? `İçe aktarma başarısız (${res.status}).`);
  return json.data as ImportResult;
}

export default function ImportPage() {
  const [moduleId, setModuleId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewReport | null>(null);
  const [assignments, setAssignments] = useState<Record<number, string>>({});
  const [source, setSource] = useState('');
  const [skipErrors, setSkipErrors] = useState(false);
  const [done, setDone] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const tree = useQuery({
    queryKey: ['catalog-tree'],
    queryFn: () => api<CatalogModule[]>('/admin/catalog/tree'),
  });
  const activeModules = (tree.data ?? []).filter((m) => m.isActive);

  const previewMut = useMutation({
    mutationFn: (f: File) => previewUpload(moduleId, f),
    onSuccess: (r) => {
      setPreview(r);
      const init: Record<number, string> = {};
      for (const row of r.valid) if (row.suggestedTopicId) init[row.rowNo] = row.suggestedTopicId;
      setAssignments(init);
      if (r.detectedSource) setSource((cur) => cur || r.detectedSource!);
    },
  });

  const importMut = useMutation({
    mutationFn: () => importUpload({ moduleId, file: file!, assignments, source, skipErrors }),
    onSuccess: setDone,
  });

  function onFileChange(f: File | null) {
    setFile(f);
    setPreview(null);
    setAssignments({});
    setDone(null);
    if (f && moduleId) previewMut.mutate(f);
  }

  const topicName = useMemo(() => {
    const m = new Map<string, string>();
    preview?.moduleTopics.forEach((t) => m.set(t.id, `${t.courseName} / ${t.name}`));
    return m;
  }, [preview]);

  const unassignedCount = preview ? preview.valid.filter((r) => !assignments[r.rowNo]).length : 0;
  const canImport =
    !!preview &&
    preview.valid.length > 0 &&
    unassignedCount === 0 &&
    (preview.errors.length === 0 || skipErrors) &&
    done == null;

  return (
    <>
      <PageHeader
        title="Toplu Soru İçe Aktarma"
        subtitle="CSV, Excel veya resmî sınav kitapçığı PDF'i — sorular konuya göre sınıflandırılıp onay kuyruğuna düşer"
        action={
          <button onClick={downloadTemplate} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
            📄 Şablonu indir
          </button>
        }
      />

      <Card className="max-w-3xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Hedef çalışma alanı (modül)</label>
            <select
              value={moduleId}
              onChange={(e) => {
                setModuleId(e.target.value);
                setPreview(null);
                setDone(null);
                if (file && e.target.value) previewMut.mutate(file);
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Modül seç…</option>
              {activeModules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Sorular bu modülün konularına sınıflandırılır. Konu eşleşme desenlerini İçerik Ağacı’ndan yönetebilirsin.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium">Dosya (.csv / .xlsx / .pdf)</label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.pdf"
              disabled={!moduleId}
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-slate-400">
              PDF: MEB/ÖDSGM kitapçık formatı — sorular, şıklar ve cevap anahtarı otomatik ayrıştırılır. En fazla 500 soru.
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
              PDF yüklersen kitapçıktan otomatik önerilir. Gösterimi Sorular sayfasındaki anahtardan açılır/kapanır.
            </p>
          </div>
        </div>
      </Card>

      {(previewMut.isError || importMut.isError) && (
        <div className="mt-4 max-w-3xl">
          <ErrorBox error={previewMut.error ?? importMut.error} />
        </div>
      )}
      {previewMut.isPending && (
        <p className="mt-4 text-sm text-slate-500">Dosya inceleniyor ve sınıflandırılıyor…</p>
      )}

      {preview && done == null && (
        <div className="mt-6 max-w-4xl space-y-4">
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800">
              ✓ {preview.valid.length} soru
            </span>
            <span
              className={`rounded-full px-3 py-1 font-medium ${
                unassignedCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {unassignedCount > 0 ? `⚠ ${unassignedCount} konu atanmadı` : '✓ hepsi sınıflandırıldı'}
            </span>
            {preview.errors.length > 0 && (
              <span className="rounded-full bg-red-100 px-3 py-1 font-medium text-red-700">
                ✕ {preview.errors.length} hatalı (görsel/tablo olabilir)
              </span>
            )}
          </div>

          <RangeAssign
            topics={preview.moduleTopics}
            onAssign={(from, to, topicId) =>
              setAssignments((cur) => {
                const next = { ...cur };
                for (const r of preview.valid) {
                  if (r.rowNo >= from && r.rowNo <= to) next[r.rowNo] = topicId;
                }
                return next;
              })
            }
          />

          <ClassifyList
            rows={preview.valid}
            topics={preview.moduleTopics}
            assignments={assignments}
            topicName={topicName}
            onChange={(rowNo, topicId) =>
              setAssignments((cur) => {
                const next = { ...cur };
                if (topicId) next[rowNo] = topicId;
                else delete next[rowNo];
                return next;
              })
            }
          />

          {preview.errors.length > 0 && (
            <Card className="border-red-200 p-0">
              <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm font-medium text-red-800">
                Hatalı satırlar — düzeltip yeniden yükle ya da atlayarak aktar
              </div>
              <ul className="max-h-40 divide-y divide-slate-50 overflow-y-auto">
                {preview.errors.map((e) => (
                  <li key={e.rowNo} className="px-4 py-2 text-sm">
                    <span className="font-mono text-xs text-slate-400">#{e.rowNo}</span> {e.message}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <button
              disabled={!canImport || importMut.isPending}
              onClick={() => importMut.mutate()}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {importMut.isPending
                ? 'Aktarılıyor…'
                : `${preview.valid.length} soruyu onay kuyruğuna aktar`}
            </button>
            {unassignedCount > 0 && (
              <span className="text-sm text-amber-700">Önce tüm sorulara konu ata.</span>
            )}
            {preview.errors.length > 0 && (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={skipErrors} onChange={(e) => setSkipErrors(e.target.checked)} />
                Hatalı satırları atla
              </label>
            )}
          </div>
        </div>
      )}

      {done && (
        <div className="mt-6 max-w-3xl rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          ✅ {done.imported} soru onay kuyruğuna aktarıldı
          {done.skipped > 0 ? `, ${done.skipped} hatalı satır atlandı` : ''}.{' '}
          <Link href="/review" className="font-medium underline">
            Onay kuyruğuna git →
          </Link>
        </div>
      )}
    </>
  );
}

/** Ardışık soru aralığını tek konuya atar (MEB kitapçıklarında konular bloklu). */
function RangeAssign({
  topics,
  onAssign,
}: {
  topics: ModuleTopic[];
  onAssign: (from: number, to: number, topicId: string) => void;
}) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [topicId, setTopicId] = useState('');
  const ready = from !== '' && to !== '' && topicId !== '';
  return (
    <Card className="bg-slate-50">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500">Aralık ata: baştan</label>
          <input
            type="number"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            placeholder="1"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">sona</label>
          <input
            type="number"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            placeholder="6"
          />
        </div>
        <div className="min-w-52 flex-1">
          <label className="block text-xs font-medium text-slate-500">konu</label>
          <TopicSelect topics={topics} value={topicId} onChange={setTopicId} />
        </div>
        <button
          disabled={!ready}
          onClick={() => onAssign(Number(from), Number(to), topicId)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
        >
          Ata
        </button>
      </div>
    </Card>
  );
}

/** Konuya göre gruplu sınıflandırma listesi. Atanmamışlar en üstte, sarı. */
function ClassifyList({
  rows,
  topics,
  assignments,
  topicName,
  onChange,
}: {
  rows: PreviewRow[];
  topics: ModuleTopic[];
  assignments: Record<number, string>;
  topicName: Map<string, string>;
  onChange: (rowNo: number, topicId: string) => void;
}) {
  const groups = new Map<string, PreviewRow[]>();
  for (const r of rows) {
    const key = assignments[r.rowNo] ?? UNASSIGNED;
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }
  const orderedKeys = [
    ...(groups.has(UNASSIGNED) ? [UNASSIGNED] : []),
    ...[...groups.keys()].filter((k) => k !== UNASSIGNED),
  ];

  return (
    <div className="space-y-3">
      {orderedKeys.map((key) => {
        const rs = groups.get(key)!;
        const rng = `${rs[0].rowNo}–${rs[rs.length - 1].rowNo}`;
        const isUnassigned = key === UNASSIGNED;
        return (
          <Card key={key} className={`p-0 ${isUnassigned ? 'border-amber-300' : ''}`}>
            <div
              className={`flex items-center justify-between border-b px-4 py-2 text-sm font-medium ${
                isUnassigned ? 'border-amber-100 bg-amber-50 text-amber-800' : 'border-slate-100'
              }`}
            >
              <span>
                {isUnassigned ? '⚠ Konu atanmadı' : topicName.get(key)} · {rs.length} soru{' '}
                <span className="font-normal opacity-70">(#{rng})</span>
              </span>
            </div>
            <ul className="divide-y divide-slate-50">
              {rs.map((r) => (
                <li key={r.rowNo} className="flex items-center gap-3 px-4 py-2">
                  <span className="font-mono text-xs text-slate-400">#{r.rowNo}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{r.stem}</span>
                  {r.matchedKeyword && (
                    <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-600">
                      {r.matchedKeyword}
                    </span>
                  )}
                  <div className="w-56 shrink-0">
                    <TopicSelect
                      topics={topics}
                      value={assignments[r.rowNo] ?? ''}
                      onChange={(v) => onChange(r.rowNo, v)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}

/** Konu dropdown'ı — derse göre gruplu (optgroup). */
function TopicSelect({
  topics,
  value,
  onChange,
}: {
  topics: ModuleTopic[];
  value: string;
  onChange: (v: string) => void;
}) {
  const byCourse = new Map<string, ModuleTopic[]>();
  for (const t of topics) {
    const arr = byCourse.get(t.courseName) ?? [];
    arr.push(t);
    byCourse.set(t.courseName, arr);
  }
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
    >
      <option value="">Konu seç…</option>
      {[...byCourse.entries()].map(([course, ts]) => (
        <optgroup key={course} label={course}>
          {ts.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { ValidationLines } from '@/components/flashcard-form';
import { Card, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import type { FlashcardImportPreview, FlashcardImportResult } from '@/lib/types';

/**
 * Deste JSON içe aktarma (Doc 56 §8.2): önce dry-run (her kartın doğrulama satırları), sonra yazma.
 * Girdi `scripts/kart-uret.ts` çıktısı ya da elle hazırlanmış `{ deck, cards }`. Geçmeyen deste
 * yazılmaz; yazılanlar incelemede açılır. `replace`: aynı konu + ünite + kaynak etiketindeki
 * yayımlanmamış ve çalışılmamış kartlar yenilenir.
 */
export default function FlashcardImportPage() {
  const qc = useQueryClient();
  const [json, setJson] = useState('');
  const [replace, setReplace] = useState(false);
  const [preview, setPreview] = useState<FlashcardImportPreview | null>(null);
  const [result, setResult] = useState<FlashcardImportResult | null>(null);
  const [error, setError] = useState<{ message: string; issues: string[] } | null>(null);

  const parse = (): unknown | null => {
    setError(null);
    try {
      return JSON.parse(json);
    } catch {
      setError({ message: 'Geçerli JSON değil.', issues: [] });
      return null;
    }
  };
  const onError = (e: unknown) => {
    const [message, ...issues] = (e instanceof Error ? e.message : 'İşlem başarısız.').split('\n');
    setError({ message: message ?? 'İşlem başarısız.', issues });
  };

  const dryRun = useMutation({
    mutationFn: (body: unknown) => api<FlashcardImportPreview>('/admin/flashcards/import?dryRun=1', { method: 'POST', body }),
    onSuccess: (r) => {
      setPreview(r);
      setResult(null);
    },
    onError,
  });
  const doImport = useMutation({
    mutationFn: (body: unknown) => api<FlashcardImportResult>(`/admin/flashcards/import${replace ? '?replace=1' : ''}`, { method: 'POST', body }),
    onSuccess: (r) => {
      setResult(r);
      setPreview(null);
      qc.invalidateQueries({ queryKey: ['admin-flashcards'] });
      qc.invalidateQueries({ queryKey: ['admin-flashcards-stats'] });
    },
    onError,
  });

  return (
    <div>
      <div className="mb-2 text-xs text-slate-500">
        <Link href="/flashcards" className="hover:underline">
          Bilgi Kartları
        </Link>{' '}
        › JSON içe aktar
      </div>
      <PageHeader title="Deste içe aktar" subtitle="Önce doğrula: her kartın referans ve sayı denetimi satır satır görünür. Geçmeyen deste yazılmaz; yazılan kartlar incelemede açılır." />

      <Card className="mb-4">
        <textarea
          value={json}
          onChange={(e) => {
            setJson(e.target.value);
            setPreview(null);
            setResult(null);
          }}
          spellCheck={false}
          rows={14}
          placeholder='{"deck": {"topicId": "…", "legislationSlug": "t-c-anayasasi", "unitSlug": "anayasa-yasama-1", "sourceLabel": "AI bilgi kartı — …"}, "cards": [...]}'
          className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
        />
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <button
            onClick={() => {
              const b = parse();
              if (b) dryRun.mutate(b);
            }}
            disabled={dryRun.isPending || !json.trim()}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            {dryRun.isPending ? 'Doğrulanıyor…' : 'Doğrula (yazmaz)'}
          </button>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
            Aynı konu + ünite + kaynaktaki yayımlanmamış kartları yenile
          </label>
          <button
            onClick={() => {
              const b = parse();
              if (b) doImport.mutate(b);
            }}
            disabled={doImport.isPending || !preview?.ok}
            title={!preview ? 'Önce doğrula' : !preview.ok ? 'Kusurlu deste yazılmaz' : ''}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {doImport.isPending ? 'Yazılıyor…' : 'İçe aktar (incelemede)'}
          </button>
        </div>
        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <div className="font-medium">{error.message}</div>
            {error.issues.length > 0 && (
              <ul className="mt-1 list-disc pl-5 text-xs">
                {error.issues.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        {result && (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            ✅ {result.created} kart yazıldı{result.removed ? ` (${result.removed} eski kart yenilendi)` : ''}. Durum: incelemede.{' '}
            <Link href="/flashcards" className="underline">
              Listeye git
            </Link>
          </div>
        )}
      </Card>

      {preview && (
        <Card>
          <h2 className="text-sm font-semibold">
            {preview.legislationName} · {preview.count} kart ·{' '}
            {preview.ok ? <span className="text-emerald-700">geçti</span> : <span className="text-red-700">{preview.fails} kusur</span>}
          </h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {preview.cards.map((c) => (
              <li key={c.index} className="py-2">
                <div className="text-sm">
                  <span className="text-slate-400">{c.index + 1}.</span> <span className={c.ok ? '' : 'text-red-700'}>{c.front}</span>{' '}
                  <span className="text-xs text-slate-500">[{c.kind}]</span>
                </div>
                <div className="mt-1">
                  <ValidationLines lines={c.lines} note={false} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-500">Betik yalnız referans ve sayıları denetler; tuzak kartlarındaki olumsuz iddiaları ve anlamı insan okur.</p>
        </Card>
      )}
    </div>
  );
}

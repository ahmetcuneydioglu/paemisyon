'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { EMPTY_DRAFT, FlashcardForm, draftToBody, type FlashcardDraft } from '@/components/flashcard-form';
import { Card, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import type { CatalogModule, SummaryUnitListItem } from '@/lib/types';

const INPUT = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

/**
 * Yeni kart (editör girişi, Doc 56 §8.2): ders › konu, ünite etiketi (isteğe bağlı; mevzuat slug'ını
 * üniteden alır), mevzuat slug'ı, kart alanları. Sunucu madde metinlerine karşı doğrular; geçmeyen
 * kart yazılmaz. Kaynak etiketi "Editör" (+ not); AI ön eki yalnız betik/içe aktarma yoluyla.
 */
export default function NewFlashcardPage() {
  const router = useRouter();
  const [topicId, setTopicId] = useState('');
  const [legislationSlug, setLegislationSlug] = useState('');
  const [sourceNote, setSourceNote] = useState('');
  const [draft, setDraft] = useState<FlashcardDraft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);

  const tree = useQuery({ queryKey: ['catalog-tree'], queryFn: () => api<CatalogModule[]>('/admin/catalog/tree') });
  const units = useQuery({ queryKey: ['admin-summaries'], queryFn: () => api<SummaryUnitListItem[]>('/admin/summaries') });
  const legislation = useQuery({
    queryKey: ['admin-legislation', topicId],
    queryFn: () => api<{ slug: string | null }>(`/admin/legislation?topicId=${topicId}`).catch(() => ({ slug: null })),
    enabled: Boolean(topicId),
  });

  const topics = useMemo(() => {
    const seen = new Set<string>();
    const out: { id: string; label: string }[] = [];
    for (const m of tree.data ?? [])
      for (const c of m.courses)
        for (const t of c.topics) {
          if (seen.has(t.id)) continue;
          seen.add(t.id);
          out.push({ id: t.id, label: `${c.name} / ${t.name}` });
        }
    return out;
  }, [tree.data]);
  const unitOptions = (units.data ?? []).filter((u) => u.topicId === topicId).map((u) => ({ slug: u.slug, title: u.title, legislationSlug: u.legislationSlug }));
  const secilenUnite = unitOptions.find((u) => u.slug === draft.unitSlug);
  // Mevzuat slug'ı: elle girilen > ünitenin kanunu > konunun mevzuatı.
  const etkinSlug = legislationSlug.trim() || secilenUnite?.legislationSlug || legislation.data?.slug || '';

  const create = useMutation({
    mutationFn: (body: unknown) => api<{ id: string }>('/admin/flashcards', { method: 'POST', body }),
    onSuccess: (r) => router.push(`/flashcards/${r.id}`),
    onError: (e: unknown) => setError(e instanceof Error ? e.message : 'Kart oluşturulamadı.'),
  });

  const submit = () => {
    setError(null);
    if (!topicId) return setError('Konu seç.');
    if (!etkinSlug) return setError('Mevzuat slug\'ı gerekli (ünite seçince kendiliğinden dolar).');
    const r = draftToBody(draft);
    if ('error' in r) return setError(r.error);
    create.mutate({
      ...r.body,
      topicId,
      legislationSlug: etkinSlug,
      sourceLabel: sourceNote.trim() ? `Editör — ${sourceNote.trim()}` : 'Editör',
    });
  };

  return (
    <div>
      <div className="mb-2 text-xs text-slate-500">
        <Link href="/flashcards" className="hover:underline">
          Bilgi Kartları
        </Link>{' '}
        › Yeni kart
      </div>
      <PageHeader title="Yeni kart" subtitle="Her kart en az bir resmî maddeye bağlanır; cevaptaki sayılar madde metninde geçmeli. Kart incelemede açılır, yayın admin kararıdır." />

      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            Konu
            <select
              value={topicId}
              onChange={(e) => {
                setTopicId(e.target.value);
                setDraft((d) => ({ ...d, unitSlug: '' }));
              }}
              className={INPUT}
            >
              <option value="">Seç…</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Mevzuat slug&apos;ı
            <input value={legislationSlug} onChange={(e) => setLegislationSlug(e.target.value)} placeholder={etkinSlug || 't-c-anayasasi'} className={`${INPUT} font-mono`} />
            <span className="mt-1 block text-xs text-slate-500">{etkinSlug ? `Kullanılacak: ${etkinSlug}` : 'Ünite seçince ya da konunun mevzuatı varsa kendiliğinden dolar.'}</span>
          </label>
          <label className="block text-sm">
            Kaynak notu <span className="text-xs text-slate-500">(isteğe bağlı; etiket {'"Editör — <not>"'} olur)</span>
            <input value={sourceNote} onChange={(e) => setSourceNote(e.target.value)} maxLength={150} placeholder="ör. ders notu, 5 Kas" className={INPUT} />
          </label>
        </div>
      </Card>

      <Card>
        <FlashcardForm draft={draft} onChange={setDraft} disabled={create.isPending} unitOptions={unitOptions} />
        {error && <div className="mt-3 whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="mt-4 flex gap-2">
          <button onClick={submit} disabled={create.isPending} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {create.isPending ? 'Doğrulanıyor…' : 'Oluştur ve doğrula'}
          </button>
          <Link href="/flashcards" className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
            Vazgeç
          </Link>
        </div>
      </Card>
    </div>
  );
}

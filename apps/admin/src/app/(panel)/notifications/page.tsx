'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';

interface QuestionItem {
  id: string;
  topicName: string;
  courseName: string;
  stem: string;
}
interface SendResult {
  ok: boolean;
  sent?: number;
  failed?: number;
  cleaned?: number;
  error?: string;
}

const ROUTES = [
  { value: 'daily-quiz', label: 'Günün Sorusu ekranı (önerilen)' },
  { value: '', label: 'Yalnız uygulamayı aç' },
] as const;

/** Push gönderimi (Faz 2): tüm cihazlara bildirim — istersen bir sorudan doldur. */
export default function NotificationsPage() {
  const [title, setTitle] = useState('Günün Sorusu 🎯');
  const [body, setBody] = useState('');
  const [route, setRoute] = useState<string>('daily-quiz');
  const [search, setSearch] = useState('');
  const [result, setResult] = useState<SendResult | null>(null);

  // Soru arama: yayındaki sorulardan seç → metin otomatik dolar.
  const questions = useQuery({
    queryKey: ['notif-questions', search],
    queryFn: () =>
      api<{ items: QuestionItem[] }>(
        `/admin/questions?status=published&search=${encodeURIComponent(search)}`,
      ),
    enabled: search.trim().length >= 3,
  });

  const send = useMutation({
    mutationFn: () =>
      api<SendResult>('/admin/notifications/send', {
        method: 'POST',
        body: { title, body, route: route || undefined },
      }),
    onSuccess: (r) => setResult(r),
  });

  function fillFromQuestion(q: QuestionItem) {
    const teaser = q.stem.replace(/\s+/g, ' ').trim();
    setBody(teaser.length > 140 ? `${teaser.slice(0, 140).trimEnd()}…` : teaser);
    setTitle('Günün Sorusu 🎯');
    setRoute('daily-quiz');
    setSearch('');
  }

  function confirmSend() {
    if (!title.trim() || !body.trim()) return;
    const ok = window.confirm(
      `Bu bildirim TÜM kayıtlı cihazlara gönderilecek:\n\n${title}\n${body}\n\nGönderilsin mi?`,
    );
    if (ok) send.mutate();
  }

  return (
    <>
      <PageHeader
        title="Bildirim Gönder"
        subtitle="Tüm cihazlara anlık push — dokunuş, seçtiğin ekrana derin bağlantıyla iner"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ── Sol: mesaj formu ── */}
        <Card>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Başlık</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={60}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Metin</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                maxLength={170}
                placeholder="Bildirim metni — kısa ve merak uyandıran…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-slate-400">{body.length}/170</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Dokununca açılacak ekran</label>
              <select
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {ROUTES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={confirmSend}
              disabled={send.isPending || !title.trim() || !body.trim()}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {send.isPending ? 'Gönderiliyor…' : 'Tüm cihazlara gönder'}
            </button>

            {result &&
              (result.ok ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  ✅ {result.sent} cihaza gönderildi
                  {result.failed ? `, ${result.failed} başarısız` : ''}
                  {result.cleaned ? ` (${result.cleaned} ölü token temizlendi)` : ''}.
                </div>
              ) : (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {result.error ?? 'Gönderilemedi.'}
                </div>
              ))}
            {send.isError && <ErrorBox error={send.error} />}
          </div>
        </Card>

        {/* ── Sağ: sorudan doldur ── */}
        <Card>
          <h2 className="mb-1 text-sm font-semibold text-slate-700">Sorudan doldur</h2>
          <p className="mb-3 text-xs text-slate-500">
            Yayındaki bir soruyu ara; seçince metin, sorunun köküyle dolar (dokunan Günün
            Sorusu ekranına iner).
          </p>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Soru kökünde ara (en az 3 harf)…"
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          {questions.isFetching ? (
            <Spinner />
          ) : questions.isError ? (
            <ErrorBox error={questions.error} />
          ) : (
            <div className="space-y-2">
              {(questions.data?.items ?? []).slice(0, 8).map((q) => (
                <button
                  key={q.id}
                  onClick={() => fillFromQuestion(q)}
                  className="block w-full rounded-lg border border-slate-200 p-3 text-left text-sm hover:border-blue-400 hover:bg-blue-50"
                >
                  <span className="mb-1 block text-xs text-slate-400">
                    {q.courseName} / {q.topicName}
                  </span>
                  {q.stem.slice(0, 160)}
                  {q.stem.length > 160 ? '…' : ''}
                </button>
              ))}
              {search.trim().length >= 3 &&
                !questions.isFetching &&
                (questions.data?.items ?? []).length === 0 && (
                  <p className="text-sm text-slate-400">Sonuç yok.</p>
                )}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

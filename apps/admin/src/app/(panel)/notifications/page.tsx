'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';

interface QuestionItem {
  id: string;
  topicName: string;
  courseName: string;
  /// Liste ucu kökü latestVersion içinde döndürür (üst düzey stem YOK).
  latestVersion: { stem: string } | null;
}
interface QuestionDetail {
  id: string;
  topic: { name: string; course: { name: string } };
  currentVersionId: string | null;
  versions: {
    id: string;
    status: string;
    stem: string;
    explanation: string | null;
    options: { id: string; label: string; text: string; isCorrect: boolean }[];
  }[];
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
  const [selected, setSelected] = useState<QuestionItem | null>(null);
  const [explanation, setExplanation] = useState('');
  const [explanationDirty, setExplanationDirty] = useState(false);
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

  // Seçilen sorunun tam hâli (şıklar + doğru + açıklama) — önizleme/düzenleme.
  const detail = useQuery({
    queryKey: ['notif-question-detail', selected?.id],
    queryFn: () => api<QuestionDetail>(`/admin/questions/${selected!.id}`),
    enabled: selected != null,
  });
  const published =
    detail.data?.versions.find((v) => v.id === detail.data?.currentVersionId) ??
    detail.data?.versions[0] ??
    null;

  const saveExplanation = useMutation({
    mutationFn: () =>
      api(`/admin/questions/${selected!.id}/explanation`, {
        method: 'PATCH',
        body: { explanation },
      }),
    onSuccess: () => setExplanationDirty(false),
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
    const teaser = (q.latestVersion?.stem ?? '').replace(/\s+/g, ' ').trim();
    setBody(teaser.length > 140 ? `${teaser.slice(0, 140).trimEnd()}…` : teaser);
    setTitle('Günün Sorusu 🎯');
    setRoute(`question:${q.id}`);
    setSearch('');
    setSelected(q);
    setExplanation('');
    setExplanationDirty(false);
  }

  // Detay yüklenince açıklamayı doldur (kullanıcı yazmaya başladıysa ezme).
  if (published != null && !explanationDirty && explanation !== (published.explanation ?? '')) {
    setExplanation(published.explanation ?? '');
  }

  async function confirmSend() {
    if (!title.trim() || !body.trim()) return;
    if (selected != null && explanationDirty) {
      // Açıklama düzenlendi → önce soruya KAYDET (banka güncellenir), sonra gönder.
      await saveExplanation.mutateAsync();
    }
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
            {selected && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-blue-500">
                    Seçilen soru · {selected.courseName} / {selected.topicName} — dokunan
                    kullanıcı BU soruyu çözer, ardından açıklama görür
                  </span>
                  <button
                    onClick={() => {
                      setSelected(null);
                      setRoute('daily-quiz');
                    }}
                    className="shrink-0 text-xs text-slate-400 hover:text-slate-600"
                  >
                    Kaldır
                  </button>
                </div>
                {detail.isFetching ? (
                  <Spinner />
                ) : published ? (
                  <>
                    <p className="mb-2 font-medium text-slate-800">{published.stem}</p>
                    <ul className="mb-3 space-y-1">
                      {published.options.map((o) => (
                        <li
                          key={o.id}
                          className={
                            o.isCorrect
                              ? 'rounded bg-emerald-100 px-2 py-1 font-medium text-emerald-800'
                              : 'px-2 py-1 text-slate-600'
                          }
                        >
                          {o.label}) {o.text} {o.isCorrect ? '✓' : ''}
                        </li>
                      ))}
                    </ul>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Açıklama {published.explanation ? '' : '— YOK, buradan ekle (soruya da kaydedilir)'}
                    </label>
                    <textarea
                      value={explanation}
                      onChange={(e) => {
                        setExplanation(e.target.value);
                        setExplanationDirty(true);
                      }}
                      rows={3}
                      placeholder="Doğru cevabın kısa, öğretici açıklaması…"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                    {explanationDirty && (
                      <p className="mt-1 text-xs text-amber-600">
                        Değişti — gönderirken soruya otomatik kaydedilecek.
                      </p>
                    )}
                    {saveExplanation.isError && <ErrorBox error={saveExplanation.error} />}
                  </>
                ) : null}
              </div>
            )}
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
                  {(q.latestVersion?.stem ?? '(kök yok)').slice(0, 160)}
                  {(q.latestVersion?.stem ?? '').length > 160 ? '…' : ''}
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

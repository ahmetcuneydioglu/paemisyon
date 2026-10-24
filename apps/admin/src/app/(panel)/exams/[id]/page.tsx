'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner, StatusBadge } from '@/components/ui';
import {
  ExamIdentityForm,
  ExamSettingsForm,
  toFormValue,
  type ExamFormValue,
} from '@/components/exam-form';
import { ExamWizardStepper, type WizardStep } from '@/components/exam-wizard-stepper';
import { ExamQuestionPicker, type PickedQuestion } from '@/components/exam-question-picker';
import { api } from '@/lib/api';
import type {
  AdminExamDetail,
  CatalogModule,
  ExamAutofillReport,
  ExamPublishCheck,
} from '@/lib/types';

type AutofillResponse = AdminExamDetail & { autofill: ExamAutofillReport };

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

/**
 * Deneme sihirbazı (Doc 50 A1–A4): ?adim=1 Kimlik · 2 Ayarlar · 3 Sorular · 4 Önizleme ve yayın.
 * Yayındaki deneme aynı sayfada salt okunur özet + istatistik bağlantısıyla açılır.
 */
/** useSearchParams Suspense ister (Next 16 ön-işleme). */
export default function ExamDetailPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ExamWizard />
    </Suspense>
  );
}

function ExamWizard() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const step = (Math.min(4, Math.max(1, Number(sp.get('adim') ?? '1'))) || 1) as WizardStep;
  const go = (n: WizardStep) => router.replace(`/exams/${id}?adim=${n}`);

  const [me, setMe] = useState<{ roles: string[] } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [picked, setPicked] = useState<PickedQuestion[] | null>(null);
  const [afCount, setAfCount] = useState(100);
  const [announce, setAnnounce] = useState(true);

  useEffect(() => {
    api<{ roles: string[] }>('/me').then(setMe).catch(() => setMe({ roles: [] }));
  }, []);
  const isAdmin = me?.roles.includes('admin') ?? false;

  const q = useQuery({
    queryKey: ['admin-exam', id],
    queryFn: () => api<AdminExamDetail>(`/admin/exams/${id}`),
  });
  const modules = useQuery({
    queryKey: ['catalog-tree'],
    queryFn: () => api<CatalogModule[]>('/admin/catalog/tree'),
  });
  const check = useQuery({
    queryKey: ['admin-exam-check', id, q.data?.questions.length, q.data?.examTypeId, q.data?.endAt],
    queryFn: () => api<ExamPublishCheck>(`/admin/exams/${id}/publish-check`),
    enabled: !!q.data && (step === 3 || step === 4),
  });

  // Soru seçici: kullanıcı düzenlemediyse (null) sunucudaki set gösterilir; effect yok.
  const serverPicked: PickedQuestion[] =
    q.data?.questions.map((x) => ({ questionId: x.questionId, stem: x.stem, topicName: x.topicName })) ?? [];
  const currentPicked = picked ?? serverPicked;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-exam', id] });
    qc.invalidateQueries({ queryKey: ['admin-exams'] });
    qc.invalidateQueries({ queryKey: ['admin-exam-check', id] });
  };

  const update = useMutation({
    mutationFn: (v: ExamFormValue) => api<AdminExamDetail>(`/admin/exams/${id}`, { method: 'PATCH', body: v }),
    onSuccess: (_, v) => {
      invalidate();
      setNotice('Kaydedildi.');
      if (step === 1) go(2);
      else if (step === 2) go(3);
      void v;
    },
  });

  const autofill = useMutation({
    mutationFn: (onlyMissing: boolean) =>
      api<AutofillResponse>(`/admin/exams/${id}/autofill`, {
        method: 'POST',
        body: { moduleId: q.data?.examTypeId, questionCount: afCount, onlyMissing },
      }),
    onSuccess: (res) => {
      invalidate();
      setPicked(null); // sunucudaki yeni set gösterilsin
      const eksik = res.autofill.missing.map((m) => `${m.section} ${m.need} eksik`).join(', ');
      setNotice(
        res.autofill.missing.length > 0
          ? `${res.autofill.filled} soru seçildi; bankada yetmedi: ${eksik}.`
          : `${res.autofill.filled} soru resmî dağılıma göre seçildi.`,
      );
    },
  });

  const saveQuestions = useMutation({
    mutationFn: (ids: string[]) =>
      api<AdminExamDetail>(`/admin/exams/${id}/questions`, { method: 'PATCH', body: { questionIds: ids } }),
    onSuccess: () => {
      invalidate();
      setNotice('Soru seti kaydedildi.');
    },
  });

  const action = useMutation({
    mutationFn: (act: 'publish' | 'unpublish' | 'archive') =>
      api<unknown>(`/admin/exams/${id}/${act}`, { method: 'POST', body: act === 'publish' ? { announce } : undefined }),
    onSuccess: (_, act) => {
      if (act === 'archive') {
        router.replace('/exams');
        return;
      }
      invalidate();
      setNotice(act === 'publish' ? `Yayınlandı ✅${announce ? ' ve cihazlara duyuruldu 📣' : ''}.` : 'Taslağa alındı.');
    },
  });

  if (q.isPending || modules.isPending) return <Spinner />;
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  const exam = q.data;
  const isDraft = exam.status === 'draft';
  const form = toFormValue(exam);
  const mods = modules.data ?? [];
  const moduleName = mods.find((m) => m.id === exam.examTypeId)?.name ?? null;
  const anyError = update.error ?? saveQuestions.error ?? action.error ?? autofill.error;

  return (
    <>
      <PageHeader
        title={isDraft ? 'Yeni deneme' : exam.title}
        subtitle={
          isDraft
            ? `${exam.title} · taslak`
            : `${exam.publishMode === 'takvimli' ? 'Haftalık' : 'Serbest'} · ${exam.questions.length} soru · ${exam.attemptCount} oturum`
        }
        action={
          <div className="flex items-center gap-3">
            {!isDraft && (
              <Link href={`/exams/${id}/istatistik`} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50">
                İstatistik ve soru iptali
              </Link>
            )}
            <StatusBadge status={exam.status} />
          </div>
        }
      />
      <ExamWizardStepper active={step} examId={id} />

      {notice && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>}
      {anyError ? (
        <div className="mb-4">
          <ErrorBox error={anyError} />
        </div>
      ) : null}

      {/* 1 — Kimlik */}
      {step === 1 && (
        <Card>
          <ExamIdentityForm
            key={exam.id + exam.status}
            initial={form}
            modules={mods}
            submitLabel={isDraft ? 'Devam: Ayarlar' : 'Kaydet'}
            busy={update.isPending}
            disabled={exam.status === 'archived'}
            onSubmit={(v) => update.mutate(v)}
          />
          {!isDraft && (
            <p className="mt-3 text-xs text-slate-400">
              Yayındaki denemede ad, açıklama, zorluk ve kapanış tarihi değiştirilebilir; soru seti sabittir.
            </p>
          )}
        </Card>
      )}

      {/* 2 — Ayarlar */}
      {step === 2 && (
        <Card>
          <ExamSettingsForm
            key={exam.id + exam.status + exam.publishMode}
            value={form}
            disabled={exam.status === 'archived'}
            busy={update.isPending}
            submitLabel={isDraft ? 'Devam: Sorular' : 'Kaydet'}
            onSubmit={(v) => update.mutate(v)}
          />
        </Card>
      )}

      {/* 3 — Sorular */}
      {step === 3 && (
        <>
          <div className="mb-4 flex flex-wrap items-start gap-4">
            <Card className="min-w-72 flex-1 basis-80">
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-sm font-semibold text-slate-700">Ders dağılımı</h2>
                <span className="text-xs text-slate-400">seçili / hedef</span>
              </div>
              {!exam.examTypeId ? (
                <p className="text-sm text-amber-700">
                  Sınav türü seçilmedi — <Link href={`/exams/${id}?adim=1`} className="underline">1. adımda</Link> seç; dağılım ve otomatik doldurma ona göre.
                </p>
              ) : check.data ? (
                <ul className="divide-y divide-slate-100 text-sm">
                  {check.data.distribution.map((d) => (
                    <li key={d.section} className="flex items-center justify-between py-1.5">
                      <span>{d.section}</span>
                      <span className={`tabular-nums font-medium ${d.count >= d.target ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {d.count}/{d.target}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">Hesaplanıyor…</p>
              )}
              {isDraft && exam.examTypeId && (
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Hedef</label>
                    <input
                      type="number"
                      min={5}
                      max={200}
                      value={afCount}
                      onChange={(e) => setAfCount(Number(e.target.value))}
                      className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => autofill.mutate(true)}
                    disabled={autofill.isPending}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                    title="Mevcut seti koru, eksik dersleri tamamla"
                  >
                    Otomatik tamamla
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentPicked.length === 0 || window.confirm('Mevcut soru seti otomatik üretilen setle DEĞİŞTİRİLECEK. Devam?'))
                        autofill.mutate(false);
                    }}
                    disabled={autofill.isPending}
                    className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
                  >
                    {autofill.isPending ? 'Seçiliyor…' : 'Baştan doldur'}
                  </button>
                  <p className="basis-full text-xs text-slate-400">
                    Hedefler resmî dağılımdır; en az kullanılmış yayınlı sorular önce, son 4 haftada çıkanlar dışarıda.
                  </p>
                </div>
              )}
            </Card>
            <Card className="basis-64">
              <div className="text-xs font-medium text-slate-500">Seçili soru</div>
              <div className="mt-1 text-3xl font-semibold tabular-nums">
                {currentPicked.length}
                <span className="text-base font-normal text-slate-400"> / {afCount}</span>
              </div>
              <Link href={`/exams/${id}/inceleme`} className="mt-3 inline-block text-sm font-medium text-indigo-700 hover:underline">
                Soruları tam gör / gözden geçir →
              </Link>
              <p className="mt-2 text-xs text-slate-400">Kaynak etiketi yalnız panelde görünür; soru sürümü yayında sabitlenir.</p>
            </Card>
          </div>

          {isDraft ? (
            <>
              <ExamQuestionPicker value={currentPicked} onChange={setPicked} />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => saveQuestions.mutate(currentPicked.map((p) => p.questionId))}
                  disabled={saveQuestions.isPending}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saveQuestions.isPending ? 'Kaydediliyor…' : `Soru setini kaydet (${currentPicked.length})`}
                </button>
                <button
                  type="button"
                  onClick={() => go(4)}
                  className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  Devam: Önizleme
                </button>
              </div>
            </>
          ) : (
            <Card className="p-0">
              <ol className="divide-y divide-slate-50">
                {exam.questions.map((x) => (
                  <li key={x.questionId} className="flex items-center gap-3 px-4 py-2 text-sm">
                    <span className="w-6 text-xs font-bold text-slate-400">{x.order}.</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{x.stem}</div>
                      <div className="text-xs text-slate-400">{x.courseName} / {x.topicName} · sabit v{x.pinnedVersionNo}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </>
      )}

      {/* 4 — Önizleme ve yayın */}
      {step === 4 && (
        <div className="grid items-start gap-4 lg:grid-cols-[1fr_24rem]">
          <div className="space-y-4">
            <Card>
              <h2 className="mb-2 text-sm font-semibold text-slate-700">Özet</h2>
              <dl className="divide-y divide-slate-100 text-sm">
                {(
                  [
                    ['Ad', exam.title],
                    ['Mod', exam.publishMode === 'takvimli' ? 'Haftalık (takvimli)' : 'Serbest'],
                    [exam.publishMode === 'takvimli' ? 'Açılış' : 'Yayın anı', fmt(exam.startAt)],
                    [exam.publishMode === 'takvimli' ? 'Pencere kapanışı' : 'Yeni çözüme kapanış', exam.endAt ? `${fmt(exam.endAt)}${exam.publishMode === 'takvimli' ? ' · sonuçlar bu anda açıklanır' : ''}` : 'Süresiz'],
                    ['Süre', `${exam.durationMinutes} dk`],
                    ['Sınav türü', moduleName ?? 'Seçilmedi'],
                    ['Soru', `${exam.questions.length}${check.data ? ` · ${check.data.distribution.every((d) => d.count === d.target) ? 'resmî dağılıma uygun' : 'dağılım sapıyor'}` : ''}`],
                    ["Premium'a özel", exam.isPremium ? 'Evet' : 'Hayır'],
                    ['Anlık geri bildirim', exam.liveAnswerReveal ? 'Açık (resmî çözüm)' : 'Kapalı (resmî çözüm) · tekrar çözümde açık'],
                    ['Bitince pratik', exam.practiceAfterEnd ? 'Açık' : 'Kapalı'],
                    ['Bildirim', exam.remindEnabled ? 'Hatırlatma ve sonuç bildirimi açık' : 'Kapalı'],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[11rem_1fr] gap-3 py-2">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>

            <Card>
              <h2 className="mb-2 text-sm font-semibold text-slate-700">Yayın kontrolü</h2>
              {check.isPending ? (
                <p className="text-xs text-slate-400">Kontrol ediliyor…</p>
              ) : check.data ? (
                <ul className="space-y-1.5 text-sm">
                  {check.data.blockers.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-red-700">
                      <span aria-hidden>✕</span>
                      {b}
                    </li>
                  ))}
                  {check.data.warnings.map((w) => (
                    <li key={w} className="flex items-start gap-2 text-amber-700">
                      <span aria-hidden>!</span>
                      {w}
                    </li>
                  ))}
                  {check.data.ok && check.data.warnings.length === 0 && (
                    <li className="flex items-start gap-2 text-emerald-700">
                      <span aria-hidden>✓</span>
                      Engel ve uyarı yok; soru paketi yayında üretilir.
                    </li>
                  )}
                  {check.data.ok && check.data.blockers.length === 0 && (
                    <li className="flex items-start gap-2 text-emerald-700">
                      <span aria-hidden>✓</span>
                      {check.data.questionCount} soru yayınlı sürümde, sürümler yayında sabitlenir.
                    </li>
                  )}
                </ul>
              ) : (
                <ErrorBox error={check.error} onRetry={() => check.refetch()} />
              )}
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Adayın göreceği kart</div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex flex-wrap gap-1.5 text-xs">
                  {exam.publishMode === 'takvimli' ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
                      {new Date(exam.startAt).toLocaleString('tr-TR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : null}
                  {exam.difficulty ? <span className="rounded-full bg-slate-200 px-2 py-0.5 font-medium text-slate-700 capitalize">{exam.difficulty}</span> : null}
                  {exam.isPremium ? <span className="rounded-full bg-violet-100 px-2 py-0.5 font-medium text-violet-700">Premium</span> : null}
                </div>
                <div className="font-semibold">{exam.title || 'Deneme adı'}</div>
                <div className="text-xs text-slate-500">
                  {exam.questions.length} soru · {exam.durationMinutes} dk
                </div>
                {exam.description ? <p className="mt-1 line-clamp-2 text-xs text-slate-600">{exam.description}</p> : null}
                <div className="mt-3 rounded-lg bg-white px-3 py-2 text-center text-sm font-medium text-slate-700 shadow-sm">
                  {exam.publishMode === 'takvimli' ? 'Hatırlat' : 'Başla'}
                </div>
              </div>
            </Card>

            <Card>
              {isDraft ? (
                <>
                  <p className="mb-3 text-xs text-slate-500">
                    Yayınlayınca deneme adayların Denemeler ekranında görünür{exam.publishMode === 'takvimli' ? ' ve hatırlatma planlanır' : ''}. Soru seti yayından sonra değişmez; soru iptali İstatistik ekranından yapılır.
                  </p>
                  <label className="mb-3 flex items-center gap-1.5 text-xs text-slate-600">
                    <input type="checkbox" checked={announce} onChange={(e) => setAnnounce(e.target.checked)} />
                    📣 Yayınlarken cihazlara duyur
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`"${exam.title}" yayınlanacak: soru sürümleri SABİTLENİR ve deneme webde görünür.${announce ? '\n\n📣 Kayıtlı tüm cihazlara duyuru gidecek.' : ''} Devam?`))
                            action.mutate('publish');
                        }}
                        disabled={action.isPending || !check.data?.ok}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        ✓ Yayınla
                      </button>
                    ) : (
                      <p className="text-xs text-slate-500">Yayınlama yalnız admin rolünde.</p>
                    )}
                    <Link href="/exams" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">
                      Taslak olarak bırak
                    </Link>
                  </div>
                </>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {exam.status === 'published' && isAdmin && (
                    <button
                      type="button"
                      onClick={() => action.mutate('unpublish')}
                      disabled={action.isPending}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
                      title="Yalnız katılım yokken mümkündür"
                    >
                      Yayından kaldır
                    </button>
                  )}
                  {isAdmin && exam.status !== 'archived' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Deneme arşivlenecek (webden kalkar, katılımlar korunur). Emin misin?')) action.mutate('archive');
                      }}
                      disabled={action.isPending}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Arşivle
                    </button>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

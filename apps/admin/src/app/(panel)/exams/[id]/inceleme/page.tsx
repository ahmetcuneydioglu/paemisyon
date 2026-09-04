'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import type { ExamReview, ExamReviewQuestion, ExamReviewFlag } from '@/lib/types';

/**
 * Yayın öncesi gözden geçirme.
 *
 * Neden var: soru seti panelde tek satıra kırpılmış köklerden ibaretti; 100
 * soruluk otomatik seti yayınlamadan önce OKUMAK mümkün değildi. 2 Eylül 2026
 * denemesinde müfredat dışı sorular bu körlük yüzünden yayına gitti.
 *
 * Tasarım kararı: okuma ve düzenleme AYNI ekranda. Ayrı bir HTML dökümü,
 * "14, 37, 82'yi sil" notunu başka bir ekrana taşımayı gerektirir — 100 soruda
 * hata tam orada çıkar. Yazdırma için ayrı çıktı da gerekmez: sayfa print
 * CSS'iyle PDF'e basılır.
 */

const BAYRAK_METNI: Record<ExamReviewFlag, { etiket: string; aciklama: string; ton: string }> = {
  'kaynak-yok': {
    etiket: 'kaynak yok',
    aciklama: 'Bu soruda kaynak etiketi boş — adaya "çıkmış soru" güvencesi verilemez.',
    ton: 'bg-amber-100 text-amber-800',
  },
  'aciklama-yok': {
    etiket: 'açıklama yok',
    aciklama: 'Sınav bitince aday bu soruda hiçbir geri bildirim görmez.',
    ton: 'bg-amber-100 text-amber-800',
  },
  'daha-once-kullanildi': {
    etiket: 'daha önce çıktı',
    aciklama: 'Bu soru yayınlanmış başka bir denemede de sorulmuş.',
    ton: 'bg-sky-100 text-sky-800',
  },
  'benzer-kok': {
    etiket: 'benzer kök',
    aciklama: 'Bu sette başka bir sorunun kökü neredeyse aynı — kopya olabilir.',
    ton: 'bg-red-100 text-red-700',
  },
  'madde-yok': {
    etiket: 'madde bağı yok',
    aciklama: 'Mevzuat dersi olduğu hâlde soruya kanun maddesi bağlanmamış.',
    ton: 'bg-slate-100 text-slate-600',
  },
  'sik-bozuk': {
    etiket: 'şık bozuk',
    aciklama: 'Tek doğru şık yok — bu soru sınava GİRMEMELİ.',
    ton: 'bg-red-100 text-red-700',
  },
};

type Suzgec = 'hepsi' | 'bayrakli' | ExamReviewFlag;

export default function ExamReviewPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [suzgec, setSuzgec] = useState<Suzgec>('hepsi');
  const [ders, setDers] = useState<string>('hepsi');
  const [notice, setNotice] = useState<string | null>(null);
  const [islemde, setIslemde] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ['admin-exam-inceleme', id],
    queryFn: () => api<ExamReview>(`/admin/exams/${id}/inceleme`),
  });

  const cikar = useMutation({
    mutationFn: ({ questionId, yerine }: { questionId: string; yerine: boolean }) =>
      api<ExamReview>(
        `/admin/exams/${id}/questions/${questionId}${yerine ? '?yerine=1' : ''}`,
        { method: 'DELETE' },
      ),
    onMutate: ({ questionId }) => setIslemde(questionId),
    onSuccess: (yeni, degisken) => {
      qc.setQueryData(['admin-exam-inceleme', id], yeni);
      // refetchType 'all': deneme detayı şu an EKRANDA DEĞİL (arka planda pasif).
      // Sade invalidate pasif sorguyu yalnız bayatlatır; kullanıcı "Denemeye dön"
      // dediğinde 15 sn'lik staleTime penceresinde eski set görünebiliyordu.
      qc.invalidateQueries({ queryKey: ['admin-exam', id], refetchType: 'all' });
      setNotice(
        degisken.yerine
          ? 'Soru değiştirildi — yerine aynı alandan yeni soru geldi.'
          : 'Soru setten çıkarıldı.',
      );
    },
    onError: (e) => setNotice(e instanceof Error ? e.message : 'İşlem başarısız.'),
    onSettled: () => setIslemde(null),
  });

  const sayimlar = useMemo(() => {
    const m = new Map<ExamReviewFlag, number>();
    for (const s of q.data?.questions ?? []) {
      for (const b of s.bayraklar) m.set(b, (m.get(b) ?? 0) + 1);
    }
    return m;
  }, [q.data]);

  if (q.isLoading) return <Spinner />;
  if (q.error || !q.data) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;

  const veri = q.data;
  const taslak = veri.exam.status === 'draft';
  const bayrakli = veri.questions.filter((s) => s.bayraklar.length > 0).length;

  const gorunen = veri.questions.filter((s) => {
    if (ders !== 'hepsi' && s.courseName !== ders) return false;
    if (suzgec === 'hepsi') return true;
    if (suzgec === 'bayrakli') return s.bayraklar.length > 0;
    return s.bayraklar.includes(suzgec);
  });

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          title={`Gözden geçir — ${veri.exam.title}`}
          subtitle={`${veri.questionCount} soru · ${bayrakli} soruda bayrak var`}
          action={
            <div className="flex items-center gap-3">
              <StatusBadge status={veri.exam.status} />
              <button
                onClick={() => window.print()}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Yazdır / PDF
              </button>
              <Link
                href={`/exams/${id}`}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Denemeye dön
              </Link>
            </div>
          }
        />

        {!taslak && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            Bu deneme yayında — sürümler sabitlendi, set değiştirilemez. Aşağıdaki metinler
            adayın gördüğünün birebir aynısı.
          </div>
        )}
        {notice && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {notice}
          </div>
        )}

        <Card className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Ders dağılımı
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip aktif={ders === 'hepsi'} onClick={() => setDers('hepsi')}>
              Hepsi ({veri.questionCount})
            </Chip>
            {veri.dersDagilimi.map((d) => (
              <Chip
                key={d.courseName}
                aktif={ders === d.courseName}
                onClick={() => setDers(d.courseName)}
              >
                {d.courseName} ({d.count})
              </Chip>
            ))}
          </div>

          <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Bayraklar
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip aktif={suzgec === 'hepsi'} onClick={() => setSuzgec('hepsi')}>
              Hepsi
            </Chip>
            <Chip aktif={suzgec === 'bayrakli'} onClick={() => setSuzgec('bayrakli')}>
              Bayraklı ({bayrakli})
            </Chip>
            {([...sayimlar.entries()] as [ExamReviewFlag, number][])
              .sort((a, b) => b[1] - a[1])
              .map(([b, n]) => (
                <Chip key={b} aktif={suzgec === b} onClick={() => setSuzgec(b)}>
                  {BAYRAK_METNI[b].etiket} ({n})
                </Chip>
              ))}
          </div>
        </Card>
      </div>

      {/* Yazdırmada görünen başlık */}
      <div className="mb-4 hidden print:block">
        <h1 className="text-lg font-bold">{veri.exam.title}</h1>
        <p className="text-sm text-slate-500">{veri.questionCount} soru · cevap anahtarı işaretli</p>
      </div>

      <div className="space-y-3">
        {gorunen.map((s) => (
          <SoruKarti
            key={s.questionId}
            soru={s}
            taslak={taslak}
            islemde={islemde === s.questionId}
            onDegistir={() => cikar.mutate({ questionId: s.questionId, yerine: true })}
            onCikar={() => {
              if (window.confirm(`${s.order}. soru setten çıkarılsın mı? (yerine yenisi GELMEZ)`))
                cikar.mutate({ questionId: s.questionId, yerine: false });
            }}
          />
        ))}
        {gorunen.length === 0 && (
          <Card>
            <p className="text-sm text-slate-500">Bu süzgeçle eşleşen soru yok.</p>
          </Card>
        )}
      </div>
    </>
  );
}

function Chip({
  aktif,
  onClick,
  children,
}: {
  aktif: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        aktif ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

function SoruKarti({
  soru,
  taslak,
  islemde,
  onDegistir,
  onCikar,
}: {
  soru: ExamReviewQuestion;
  taslak: boolean;
  islemde: boolean;
  onDegistir: () => void;
  onCikar: () => void;
}) {
  return (
    <Card className="break-inside-avoid print:border-slate-300 print:shadow-none">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="text-xs font-bold text-slate-400">{soru.order}.</span>
          <span className="ml-2 text-xs text-slate-500">
            {soru.courseName} / {soru.topicName}
            {soru.articleNo && ` · md. ${soru.articleNo}`}
          </span>
        </div>
        {taslak && (
          <div className="flex shrink-0 gap-2 print:hidden">
            <button
              onClick={onDegistir}
              disabled={islemde}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-50"
            >
              {islemde ? 'İşleniyor…' : 'Değiştir'}
            </button>
            <button
              onClick={onCikar}
              disabled={islemde}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Çıkar
            </button>
          </div>
        )}
      </div>

      {soru.bayraklar.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {soru.bayraklar.map((b) => (
            <span
              key={b}
              title={BAYRAK_METNI[b].aciklama}
              className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${BAYRAK_METNI[b].ton}`}
            >
              {BAYRAK_METNI[b].etiket}
            </span>
          ))}
        </div>
      )}

      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{soru.stem}</p>

      <ul className="mt-3 space-y-1">
        {soru.options.map((o) => (
          <li
            key={o.id}
            className={`flex gap-2 rounded px-2 py-1 text-sm ${
              o.isCorrect ? 'bg-emerald-50 font-medium text-emerald-900' : 'text-slate-700'
            }`}
          >
            <span className="w-5 shrink-0 font-bold">{o.label})</span>
            <span className="whitespace-pre-wrap">{o.text}</span>
            {o.isCorrect && <span className="ml-auto shrink-0 text-xs">✓ doğru</span>}
          </li>
        ))}
      </ul>

      <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <div>
          <span className="font-semibold text-slate-600">Kaynak:</span>{' '}
          {soru.sourceLabel || <span className="text-amber-700">— yok —</span>}
        </div>
        <div>
          <span className="font-semibold text-slate-600">Açıklama:</span>{' '}
          {soru.explanation ? (
            <span className="whitespace-pre-wrap">{soru.explanation}</span>
          ) : (
            <span className="text-amber-700">— yok —</span>
          )}
        </div>
        <div className="print:hidden">
          {soru.usageCount} denemede kullanıldı
          {soru.lastUsedIn &&
            ` · en son: ${soru.lastUsedIn.title} (${new Date(soru.lastUsedIn.startAt).toLocaleDateString('tr-TR')})`}
          {' · '}sürüm v{soru.versionNo}
        </div>
      </div>
    </Card>
  );
}

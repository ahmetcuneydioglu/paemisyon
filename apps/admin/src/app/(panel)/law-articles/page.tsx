'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { config } from '@/lib/config';
import { supabase } from '@/lib/supabase';

/** Toplu PDF içe aktarma raporu (API importPdf yanıtı). */
interface ImportReport {
  lawName: string;
  parsedCount: number;
  duplicates: string[];
  taggedCount: number;
  toWriteCount: number;
  skippedPublished: string[];
  missing: string[];
  written: number;
  published: boolean;
  dryRun: boolean;
}

/** Multipart PDF yükleme (api() JSON gövde gönderdiği için ayrı fetch). */
async function uploadLawPdf(
  topicId: string,
  file: File,
  opts: { all: boolean; publish: boolean; dryRun: boolean; sourceUrl: string },
): Promise<ImportReport> {
  const form = new FormData();
  form.append('file', file);
  if (opts.sourceUrl.trim()) form.append('sourceUrl', opts.sourceUrl.trim());
  const qs = new URLSearchParams({
    topicId,
    all: opts.all ? '1' : '0',
    publish: opts.publish ? '1' : '0',
    dryRun: opts.dryRun ? '1' : '0',
  });
  const { data } = await supabase().auth.getSession();
  const res = await fetch(`${config.apiBaseUrl}/admin/law-articles/import?${qs}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${data.session?.access_token ?? ''}` },
    body: form,
  });
  const json = (await res.json().catch(() => null)) as
    | { data?: ImportReport; error?: { message?: string } }
    | null;
  if (!res.ok) throw new Error(json?.error?.message ?? `İçe aktarma başarısız (${res.status}).`);
  return json!.data as ImportReport;
}

/** Kanun (topic) kapsama özeti — worklist. */
interface LawSummary {
  topicId: string;
  name: string;
  courseName: string;
  taggedArticles: number;
  published: number;
  drafts: number;
  missing: number;
}

type ArticleStatus = 'draft' | 'in_review' | 'published' | 'archived' | null;

/** Bir maddenin durumu (etiketli soru ∪ girilmiş metin). */
interface ArticleRow {
  articleNo: string;
  questionCount: number;
  id: string | null;
  status: ArticleStatus;
  hasText: boolean;
  text: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  effectiveInfo: string | null;
  lastVerifiedAt: string | null;
  updatedAt: string | null;
}

interface ArticlesResponse {
  topicId: string;
  name: string;
  articles: ArticleRow[];
}

/**
 * Resmî madde metni yönetimi (Doc 25 §4 adım 3). Editör metni girer/düzeltir
 * (taslak); YAYIN yalnız admin'de. Metin AI ile üretilmez — birebir resmî metin,
 * kaynak her zaman görünür. İçe aktarma script'i (import-law-articles) taslakları
 * doldurur; burada doğrulanıp yayınlanır.
 */
interface LawLite {
  topicId: string;
  name: string;
  courseName: string;
}

/** Etiketli olmayan/yeni madde için sentetik satır (editör metinsiz açılır). */
function syntheticArticle(articleNo: string): ArticleRow {
  return {
    articleNo,
    questionCount: 0,
    id: null,
    status: null,
    hasText: false,
    text: null,
    sourceName: null,
    sourceUrl: null,
    effectiveInfo: null,
    lastVerifiedAt: null,
    updatedAt: null,
  };
}

export default function LawArticlesPage() {
  const [topicId, setTopicId] = useState<string | null>(null);
  const [selectedNo, setSelectedNo] = useState<string | null>(null);
  const [manualNo, setManualNo] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [lawSearch, setLawSearch] = useState('');

  const me = useQuery({ queryKey: ['me'], queryFn: () => api<{ roles: string[] }>('/me') });
  const isAdmin = me.data?.roles.includes('admin') ?? false;

  const laws = useQuery({
    queryKey: ['law-articles', 'laws'],
    queryFn: () => api<LawSummary[]>('/admin/law-articles/laws'),
  });

  const searching = lawSearch.trim().length >= 2;
  const allLaws = useQuery({
    queryKey: ['law-articles', 'all-laws', lawSearch.trim()],
    queryFn: () =>
      api<LawLite[]>(`/admin/law-articles/all-laws?search=${encodeURIComponent(lawSearch.trim())}`),
    enabled: searching,
  });

  const articles = useQuery({
    queryKey: ['law-articles', topicId],
    queryFn: () => api<ArticlesResponse>(`/admin/law-articles?topicId=${topicId}`),
    enabled: topicId != null,
  });

  // Seçim: elle girilen madde (sentetik) öncelikli; yoksa listeden seçili.
  const selected =
    manualNo != null
      ? (articles.data?.articles.find((a) => a.articleNo === manualNo) ?? syntheticArticle(manualNo))
      : (articles.data?.articles.find((a) => a.articleNo === selectedNo) ?? null);

  const pickLaw = (id: string) => {
    setTopicId(id);
    setSelectedNo(null);
    setManualNo(null);
  };
  const addManual = () => {
    const raw = manualInput.trim();
    if (!raw) return;
    const inList = articles.data?.articles.find((a) => a.articleNo === raw);
    if (inList) {
      setSelectedNo(raw);
      setManualNo(null);
    } else {
      setManualNo(raw);
      setSelectedNo(null);
    }
    setManualInput('');
  };

  return (
    <>
      <PageHeader
        title="Madde Metinleri"
        subtitle="Resmî kanun madde metinleri — birebir metin, kaynak görünür; yayın yalnız admin"
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[280px_1fr]">
        {/* Sol: kanun arama + worklist (etiketli) / tüm kanunlar (arama) */}
        <Card className="max-h-[55vh] overflow-y-auto p-0 md:max-h-[78vh]">
          <div className="sticky top-0 border-b border-slate-100 bg-white p-2">
            <input
              value={lawSearch}
              onChange={(e) => setLawSearch(e.target.value)}
              placeholder="Kanun ara (tüm kanunlar)…"
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
            />
          </div>

          {searching ? (
            allLaws.isPending ? (
              <div className="p-5">
                <Spinner />
              </div>
            ) : allLaws.isError ? (
              <div className="p-5">
                <ErrorBox error={allLaws.error} onRetry={() => allLaws.refetch()} />
              </div>
            ) : allLaws.data.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">Eşleşen kanun yok.</p>
            ) : (
              <ul className="divide-y divide-slate-50">
                {allLaws.data.map((l) => (
                  <li key={l.topicId}>
                    <button
                      onClick={() => pickLaw(l.topicId)}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 ${
                        l.topicId === topicId ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <div className="font-medium text-slate-800">{l.name}</div>
                      <div className="text-xs text-slate-500">{l.courseName}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : laws.isPending ? (
            <div className="p-5">
              <Spinner />
            </div>
          ) : laws.isError ? (
            <div className="p-5">
              <ErrorBox error={laws.error} onRetry={() => laws.refetch()} />
            </div>
          ) : laws.data.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">
              Soru etiketli kanun yok. Yukarıdan arayarak herhangi bir kanunu seçebilirsin.
            </p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {laws.data.map((l) => {
                const active = l.topicId === topicId;
                return (
                  <li key={l.topicId}>
                    <button
                      onClick={() => pickLaw(l.topicId)}
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-slate-50 ${
                        active ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <div className="font-medium text-slate-800">{l.name}</div>
                      <div className="text-xs text-slate-500">{l.courseName}</div>
                      <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-800">
                          {l.published} yayın
                        </span>
                        {l.drafts > 0 && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-800">
                            {l.drafts} taslak
                          </span>
                        )}
                        {l.missing > 0 && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">
                            {l.missing} eksik
                          </span>
                        )}
                        <span className="px-1 text-slate-400">/ {l.taggedArticles} madde</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Sağ: seçili kanunun maddeleri + editör */}
        <div>
          {topicId == null ? (
            <Card>
              <p className="text-sm text-slate-500">Soldan bir kanun seç veya arayarak bul.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              <LawImport topicId={topicId} isAdmin={isAdmin} />
              {articles.isPending ? (
                <Spinner />
              ) : articles.isError ? (
                <ErrorBox error={articles.error} onRetry={() => articles.refetch()} />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_1fr]">
              {/* Madde listesi + "madde no ile ekle" */}
              <Card className="max-h-[45vh] overflow-y-auto p-0 md:max-h-[78vh]">
                <div className="sticky top-0 border-b border-slate-100 bg-white p-2">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      addManual();
                    }}
                    className="flex gap-1.5"
                  >
                    <input
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="Madde no (78, Ek 6…)"
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      className="shrink-0 rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
                    >
                      Ekle
                    </button>
                  </form>
                </div>
                <ul className="divide-y divide-slate-50">
                  {articles.data.articles.map((a) => {
                    const active = manualNo == null && a.articleNo === selectedNo;
                    return (
                      <li key={a.articleNo}>
                        <button
                          onClick={() => {
                            setSelectedNo(a.articleNo);
                            setManualNo(null);
                          }}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                            active ? 'bg-indigo-50' : ''
                          }`}
                        >
                          <span className="font-mono text-slate-700">m.{a.articleNo}</span>
                          <span className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-400">{a.questionCount} soru</span>
                            <StatusDot status={a.status} hasText={a.hasText} />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Card>

              {/* Editör — key ile seçili maddeye göre remount (form state prop'tan başlar) */}
              {selected == null ? (
                <Card>
                  <p className="text-sm text-slate-500">
                    Bir madde seç — metnini gir veya düzenle. Boş maddeler henüz metinsiz.
                  </p>
                </Card>
              ) : (
                <ArticleEditor
                  key={`${topicId}:${selected.articleNo}`}
                  topicId={topicId}
                  article={selected}
                  isAdmin={isAdmin}
                  onSaved={(no) => {
                    // Kaydedilen kanonik madde no'yu seç (elle girilen ham no yerine).
                    setSelectedNo(no);
                    setManualNo(null);
                  }}
                  onDeleted={() => {
                    setSelectedNo(null);
                    setManualNo(null);
                  }}
                />
              )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Toplu PDF içe aktarma — mevzuat.gov.tr resmî PDF'i yükle, tüm maddeler otomatik
 * bölünüp kaydedilsin (CLI'sız). Önizle (dryRun) → İçe aktar. Yayın yalnız admin.
 */
function LawImport({ topicId, isAdmin }: { topicId: string; isAdmin: boolean }) {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [all, setAll] = useState(true);
  const [publish, setPublish] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [report, setReport] = useState<ImportReport | null>(null);

  const run = useMutation({
    mutationFn: (dryRun: boolean) => {
      if (!file) throw new Error('Önce bir PDF seç.');
      return uploadLawPdf(topicId, file, { all, publish, dryRun, sourceUrl });
    },
    onSuccess: (data) => {
      setReport(data);
      if (!data.dryRun) qc.invalidateQueries({ queryKey: ['law-articles'] });
    },
  });

  return (
    <Card>
      <h3 className="font-semibold text-slate-800">PDF ile toplu içe aktar</h3>
      <p className="mt-1 text-xs text-slate-500">
        mevzuat.gov.tr&apos;den kanunun PDF&apos;ini indir (MevzuatMetin/…pdf) ve yükle — tüm
        maddeler otomatik bölünüp kaydedilir. Metin birebir resmî; kaynak görünür.
      </p>
      <input
        type="file"
        accept="application/pdf,.pdf,.txt"
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          setReport(null);
        }}
        className="mt-3 block text-sm"
      />
      <input
        value={sourceUrl}
        onChange={(e) => setSourceUrl(e.target.value)}
        placeholder="Kaynak URL (mevzuat.gov.tr sayfası) — isteğe bağlı"
        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
      />
      <div className="mt-2 flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} />
          Tüm maddeler (soru etiketi şartsız)
        </label>
        {isAdmin && (
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={publish}
              onChange={(e) => setPublish(e.target.checked)}
            />
            Doğrudan yayınla
          </label>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => run.mutate(true)}
          disabled={!file || run.isPending}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          Önizle (yazmaz)
        </button>
        <button
          onClick={() => run.mutate(false)}
          disabled={!file || run.isPending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          {run.isPending ? 'İşleniyor…' : publish ? 'İçe aktar + yayınla' : 'İçe aktar (taslak)'}
        </button>
      </div>
      {run.isError && (
        <div className="mt-3">
          <ErrorBox error={run.error} />
        </div>
      )}
      {report && (
        <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          <div className="font-medium">
            {report.dryRun
              ? 'Önizleme'
              : report.written > 0
                ? `${report.written} madde ${report.published ? 'YAYINLANDI' : 'taslak yazıldı'}`
                : 'Yazılacak madde yok'}
          </div>
          <ul className="mt-1 space-y-0.5 text-xs text-slate-500">
            <li>Çözümlenen madde: {report.parsedCount}</li>
            <li>
              Yazılacak: {report.toWriteCount}
              {report.dryRun ? '' : ` · yazıldı: ${report.written}`}
            </li>
            {report.duplicates.length > 0 && (
              <li>Mükerrer/artık (atlandı): {report.duplicates.join(', ')}</li>
            )}
            {report.skippedPublished.length > 0 && (
              <li>Yayınlanmış (ezilmedi): {report.skippedPublished.join(', ')}</li>
            )}
            {!all && <li>Soru etiketli madde: {report.taggedCount}</li>}
          </ul>
          {report.dryRun && (
            <p className="mt-1 text-xs text-slate-400">Sayı doğruysa “İçe aktar” ile yaz.</p>
          )}
        </div>
      )}
    </Card>
  );
}

/**
 * Madde editörü — SEÇİLEN maddeye `key` ile bağlıdır: seçim değişince remount olur
 * ve form state'i prop'tan bir kez başlar (effect'le senkron GEREKMEZ). Mutasyonlar
 * burada; başarıda law-articles sorguları invalidate edilir.
 */
function ArticleEditor({
  topicId,
  article,
  isAdmin,
  onSaved,
  onDeleted,
}: {
  topicId: string;
  article: ArticleRow;
  isAdmin: boolean;
  onSaved: (articleNo: string) => void;
  onDeleted: () => void;
}) {
  const qc = useQueryClient();
  const [text, setText] = useState(article.text ?? '');
  const [sourceName, setSourceName] = useState(article.sourceName ?? 'mevzuat.gov.tr');
  const [sourceUrl, setSourceUrl] = useState(article.sourceUrl ?? '');
  const [effectiveInfo, setEffectiveInfo] = useState(article.effectiveInfo ?? '');

  const invalidate = () => qc.invalidateQueries({ queryKey: ['law-articles'] });

  const save = useMutation({
    mutationFn: () =>
      api<{ id: string; status: string; articleNo: string }>('/admin/law-articles', {
        method: 'PATCH',
        body: {
          topicId,
          articleNo: article.articleNo,
          text,
          sourceName: sourceName || undefined,
          sourceUrl: sourceUrl || undefined,
          effectiveInfo: effectiveInfo || undefined,
        },
      }),
    onSuccess: (res) => {
      onSaved(res.articleNo);
      invalidate();
    },
  });
  const publish = useMutation({
    mutationFn: (id: string) => api(`/admin/law-articles/${id}/publish`, { method: 'POST' }),
    onSuccess: invalidate,
  });
  const unpublish = useMutation({
    mutationFn: (id: string) => api(`/admin/law-articles/${id}/unpublish`, { method: 'POST' }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/admin/law-articles/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      onDeleted();
      invalidate();
    },
  });

  const mutationError = save.error ?? publish.error ?? unpublish.error ?? remove.error ?? null;

  return (
    <Card>
      {mutationError && (
        <div className="mb-3">
          <ErrorBox error={mutationError} />
        </div>
      )}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">
          Madde {article.articleNo}{' '}
          <span className="ml-1 text-xs font-normal text-slate-500">
            {article.questionCount} soru
          </span>
        </h3>
        <StatusBadge status={article.status} />
      </div>

      <label className="mb-1 block text-xs font-medium text-slate-500">
        Resmî madde metni (birebir — özet/AI yok)
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={14}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-[13px] leading-relaxed outline-none focus:border-indigo-500"
        placeholder="Madde metnini mevzuat.gov.tr&apos;den birebir yapıştır…"
      />

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Kaynak</label>
          <input
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Yürürlük/işlenme notu
          </label>
          <input
            value={effectiveInfo}
            onChange={(e) => setEffectiveInfo(e.target.value)}
            placeholder="ör. 5/7/2022 değişikliği işlenmiş"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
        </div>
      </div>
      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Kaynak bağlantısı (mevzuat.gov.tr URL)
        </label>
        <input
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://www.mevzuat.gov.tr/…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
      </div>

      {article.lastVerifiedAt && (
        <p className="mt-2 text-xs text-slate-400">
          Son doğrulama: {new Date(article.lastVerifiedAt).toLocaleString('tr-TR')}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <button
          onClick={() => save.mutate()}
          disabled={!text.trim() || save.isPending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          {save.isPending ? 'Kaydediliyor…' : 'Taslağı kaydet'}
        </button>

        {isAdmin && article.id && article.status !== 'published' && (
          <button
            onClick={() => publish.mutate(article.id!)}
            disabled={publish.isPending}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
          >
            Yayınla
          </button>
        )}
        {isAdmin && article.id && article.status === 'published' && (
          <button
            onClick={() => unpublish.mutate(article.id!)}
            disabled={unpublish.isPending}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            Yayından al
          </button>
        )}
        {isAdmin && article.id && (
          <button
            onClick={() => {
              if (window.confirm(`Madde ${article.articleNo} metni silinsin mi?`)) {
                remove.mutate(article.id!);
              }
            }}
            disabled={remove.isPending}
            className="ml-auto text-sm text-red-600 hover:underline disabled:opacity-40"
          >
            Sil
          </button>
        )}
      </div>

      {!isAdmin && (
        <p className="mt-2 text-xs text-slate-400">
          Yayınlama yetkisi admin&apos;dedir; kaydettiğin taslağı admin doğrulayıp yayınlar.
        </p>
      )}
    </Card>
  );
}

/** Liste noktası: yayın (yeşil) · taslak (sarı) · metinsiz (boş halka). */
function StatusDot({ status, hasText }: { status: ArticleStatus; hasText: boolean }) {
  if (!hasText) return <span className="text-slate-300">○</span>;
  if (status === 'published') return <span className="text-emerald-500">●</span>;
  return <span className="text-amber-500">●</span>;
}

function StatusBadge({ status }: { status: ArticleStatus }) {
  if (status === 'published') {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
        Yayında
      </span>
    );
  }
  if (status == null) {
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
        Metinsiz
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
      Taslak
    </span>
  );
}

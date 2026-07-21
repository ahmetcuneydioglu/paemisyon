'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';

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
export default function LawArticlesPage() {
  const [topicId, setTopicId] = useState<string | null>(null);
  const [selectedNo, setSelectedNo] = useState<string | null>(null);

  const me = useQuery({ queryKey: ['me'], queryFn: () => api<{ roles: string[] }>('/me') });
  const isAdmin = me.data?.roles.includes('admin') ?? false;

  const laws = useQuery({
    queryKey: ['law-articles', 'laws'],
    queryFn: () => api<LawSummary[]>('/admin/law-articles/laws'),
  });

  const articles = useQuery({
    queryKey: ['law-articles', topicId],
    queryFn: () => api<ArticlesResponse>(`/admin/law-articles?topicId=${topicId}`),
    enabled: topicId != null,
  });

  const selected = articles.data?.articles.find((a) => a.articleNo === selectedNo) ?? null;

  return (
    <>
      <PageHeader
        title="Madde Metinleri"
        subtitle="Resmî kanun madde metinleri — birebir metin, kaynak görünür; yayın yalnız admin"
      />

      <div className="grid grid-cols-[300px_1fr] gap-5">
        {/* Sol: kanun listesi + kapsama */}
        <Card className="max-h-[75vh] overflow-y-auto p-0">
          {laws.isPending ? (
            <div className="p-5">
              <Spinner />
            </div>
          ) : laws.isError ? (
            <div className="p-5">
              <ErrorBox error={laws.error} onRetry={() => laws.refetch()} />
            </div>
          ) : laws.data.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">
              Henüz madde etiketli soru yok. Önce sorulara madde numarası atanmalı.
            </p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {laws.data.map((l) => {
                const active = l.topicId === topicId;
                return (
                  <li key={l.topicId}>
                    <button
                      onClick={() => {
                        setTopicId(l.topicId);
                        setSelectedNo(null);
                      }}
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
              <p className="text-sm text-slate-500">Soldan bir kanun seç.</p>
            </Card>
          ) : articles.isPending ? (
            <Spinner />
          ) : articles.isError ? (
            <ErrorBox error={articles.error} onRetry={() => articles.refetch()} />
          ) : (
            <div className="grid grid-cols-[220px_1fr] gap-4">
              {/* Madde listesi */}
              <Card className="max-h-[75vh] overflow-y-auto p-0">
                <ul className="divide-y divide-slate-50">
                  {articles.data.articles.map((a) => {
                    const active = a.articleNo === selectedNo;
                    return (
                      <li key={a.articleNo}>
                        <button
                          onClick={() => setSelectedNo(a.articleNo)}
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
                  onDeleted={() => setSelectedNo(null)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
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
  onDeleted,
}: {
  topicId: string;
  article: ArticleRow;
  isAdmin: boolean;
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
      api('/admin/law-articles', {
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
    onSuccess: invalidate,
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

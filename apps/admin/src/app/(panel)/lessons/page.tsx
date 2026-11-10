'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import type { CatalogModule, LessonSectionAdminRow } from '@/lib/types';

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

interface ImportForm {
  sectionSlug: string;
  sectionTitle: string;
  sectionSubtitle: string;
  courseId: string;
  topicId: string;
  slug: string;
  sortOrder: number;
  bookLabel: string;
  bookPage: string;
  articles: string;
  markdown: string;
}

const BOS: ImportForm = { sectionSlug: '', sectionTitle: '', sectionSubtitle: '', courseId: '', topicId: '', slug: '', sortOrder: 1, bookLabel: '', bookPage: '', articles: '', markdown: '' };

/**
 * Konu Anlatımı (Doc 57): bölüm → ders listesi, markdown'dan içe aktarma (önce doğrula, sonra yaz).
 * Kaynak kitap künyesi (sourceLabel) yalnız burada görünür; yayın kararı ders sayfasında ve yalnız admin.
 */
export default function LessonsPage() {
  const qc = useQueryClient();
  const [me, setMe] = useState<{ roles: string[] } | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<ImportForm>(BOS);
  const [check, setCheck] = useState<{ parsed: { title: string; goal: string; sections: number }; validation: { ok: boolean; issues: string[]; lines: string[] } } | null>(null);
  useEffect(() => {
    api<{ roles: string[] }>('/me').then(setMe).catch(() => setMe({ roles: [] }));
  }, []);
  const isAdmin = me?.roles.includes('admin') ?? false;

  const sections = useQuery({ queryKey: ['admin-lessons'], queryFn: () => api<LessonSectionAdminRow[]>('/admin/lessons') });
  const tree = useQuery({ queryKey: ['admin-catalog-tree'], queryFn: () => api<CatalogModule[]>('/admin/catalog/tree'), enabled: open });
  const courses = useMemo(() => {
    const m = new Map<string, { id: string; name: string; topics: { id: string; name: string }[] }>();
    for (const mod of tree.data ?? []) for (const c of mod.courses) if (!m.has(c.id)) m.set(c.id, { id: c.id, name: c.name, topics: c.topics.map((t) => ({ id: t.id, name: t.name })) });
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [tree.data]);
  const topics = courses.find((c) => c.id === f.courseId)?.topics ?? [];

  const body = () => ({
    section: { slug: f.sectionSlug.trim(), title: f.sectionTitle.trim(), subtitle: f.sectionSubtitle.trim() || null, courseId: f.courseId, topicId: f.topicId || null, sortOrder: 0 },
    slug: f.slug.trim(),
    sortOrder: Number(f.sortOrder) || 1,
    markdown: f.markdown,
    book: { label: f.bookLabel.trim(), page: f.bookPage.trim() || null },
    articles: f.articles.split(/[,\s]+/).map((x) => x.trim()).filter(Boolean),
  });
  const err = (e: unknown) => setNotice({ kind: 'err', text: e instanceof Error ? e.message : 'Bir şeyler ters gitti.' });
  const dry = useMutation({
    mutationFn: () => api<NonNullable<typeof check>>('/admin/lessons/import-markdown?dry=1', { method: 'POST', body: body() }),
    onSuccess: (r) => { setCheck(r); setNotice(null); },
    onError: err,
  });
  const doImport = useMutation({
    mutationFn: () => api<{ slug: string; versionNo: number; replaced: boolean; pendingVersion: boolean }>('/admin/lessons/import-markdown', { method: 'POST', body: body() }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['admin-lessons'] });
      setNotice({ kind: 'ok', text: `✅ ${r.slug} yazıldı: sürüm ${r.versionNo}${r.replaced ? ' (yeni sürüm)' : ''}${r.pendingVersion ? ' · yayındaki sürüm değişmedi, yayın için ders sayfasından onayla' : ' · durum: incelemede'}.` });
      setCheck(null);
      setF((p) => ({ ...p, slug: '', markdown: '', sortOrder: p.sortOrder + 1 }));
    },
    onError: err,
  });
  const premium = useMutation({
    mutationFn: ({ id, isPremium }: { id: string; isPremium: boolean }) => api(`/admin/lessons/sections/${id}`, { method: 'PATCH', body: { isPremium } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-lessons'] }),
    onError: err,
  });
  const unpublishSection = useMutation({
    mutationFn: (id: string) => api(`/admin/lessons/sections/${id}/unpublish`, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-lessons'] }); setNotice({ kind: 'ok', text: 'Bölüm ve dersleri yayından alındı.' }); },
    onError: err,
  });

  const total = (sections.data ?? []).reduce((n, s) => n + s.lessons.length, 0);
  const published = (sections.data ?? []).reduce((n, s) => n + s.lessons.filter((l) => l.status === 'published').length, 0);
  const field = (k: keyof ImportForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div>
      <PageHeader
        title="Konu Anlatımı"
        subtitle="Kaynak kitaptan özgün anlatım: bölüm → ders → sürüm (Doc 57). Üretim editoryaldir, yayın insanındır."
        action={
          <button onClick={() => setOpen((v) => !v)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            {open ? 'Kapat' : 'Markdown içe aktar'}
          </button>
        }
      />

      {notice && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm whitespace-pre-line ${notice.kind === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {notice.text}
          <button onClick={() => setNotice(null)} className="ml-3 underline">kapat</button>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Bölüm" value={sections.data?.length ?? 0} />
        <Stat label="Ders" value={total} />
        <Stat label="Yayında" value={published} tone="emerald" />
        <Stat label="İncelemede" value={total - published} tone="amber" />
      </div>

      {open && (
        <Card className="mb-6">
          <h2 className="text-sm font-semibold">Markdown&apos;dan ders</h2>
          <p className="mt-1 text-xs text-slate-500">
            Dosya düzeni: <code># Başlık</code>, <code>Hedef: …</code> satırı, <code>## alt başlık</code> bölümleri (metin, <code>- </code> listeler, <code>|</code> tablolar), sonda <code>## Kaynak ve inceleme notları</code> (URL&apos;li satır kamuya açık kaynak, diğerleri inceleme kaydı). Kitap künyesi yalnız panelde kalır; madde atıfları <code>t-c-anayasasi:175</code> biçiminde.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs">Ders (müfredat)
              <select value={f.courseId} onChange={field('courseId')} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm">
                <option value="">Seç…</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="text-xs">Konu (isteğe bağlı; konu odasında görünür)
              <select value={f.topicId} onChange={field('topicId')} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm">
                <option value="">—</option>
                {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <label className="text-xs">Bölüm slug<input value={f.sectionSlug} onChange={field('sectionSlug')} placeholder="anayasa-turleri" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            <label className="text-xs">Bölüm başlığı<input value={f.sectionTitle} onChange={field('sectionTitle')} placeholder="Anayasa Türleri" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            <label className="text-xs sm:col-span-2">Bölüm alt başlığı<input value={f.sectionSubtitle} onChange={field('sectionSubtitle')} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            <label className="text-xs">Ders slug<input value={f.slug} onChange={field('slug')} placeholder="yazili-ve-yazisiz-anayasa" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            <label className="text-xs">Sıra<input type="number" min={1} value={f.sortOrder} onChange={field('sortOrder')} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            <label className="text-xs">Kaynak kitap künyesi (yalnız panel)<input value={f.bookLabel} onChange={field('bookLabel')} placeholder="THEMIS Anayasa Hukuku, 24. baskı, 2020" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            <label className="text-xs">Sayfa<input value={f.bookPage} onChange={field('bookPage')} placeholder="s.22–23" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            <label className="text-xs sm:col-span-2">Madde kaynakları (virgülle; sayı denetimi bunlara göre)<input value={f.articles} onChange={field('articles')} placeholder="t-c-anayasasi:4, t-c-anayasasi:175" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          </div>
          <textarea value={f.markdown} onChange={field('markdown')} spellCheck={false} rows={14} placeholder={'# Yazılı ve yazısız anayasa\n\nHedef: …\n\n## Yazılı anayasa\n…'} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs" />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button onClick={() => dry.mutate()} disabled={dry.isPending || !f.markdown.trim()} className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-50">{dry.isPending ? 'Doğrulanıyor…' : 'Doğrula'}</button>
            <button onClick={() => doImport.mutate()} disabled={doImport.isPending || !check?.validation.ok} title={!check ? 'Önce doğrula' : !check.validation.ok ? 'Kusurlar var' : ''} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{doImport.isPending ? 'Yazılıyor…' : 'İncelemeye yaz'}</button>
          </div>
          {check && (
            <div className={`mt-3 rounded-lg border p-3 text-sm ${check.validation.ok ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
              <div className="font-medium">{check.parsed.title} — {check.parsed.sections} bölüm · {check.validation.ok ? 'doğrulama geçti' : `${check.validation.issues.length} kusur`}</div>
              <div className="text-xs text-slate-600">{check.parsed.goal}</div>
              <ul className="mt-2 max-h-48 overflow-auto font-mono text-xs">{check.validation.lines.map((l, i) => <li key={i} className={l.startsWith('✗') ? 'text-red-700' : 'text-slate-600'}>{l}</li>)}</ul>
            </div>
          )}
        </Card>
      )}

      {sections.isLoading && <Spinner />}
      {sections.error && <ErrorBox error={sections.error} onRetry={() => sections.refetch()} />}
      {sections.data && sections.data.length === 0 && (
        <Card><p className="text-sm text-slate-600">Henüz bölüm yok. Markdown içe aktar ya da <code>npx tsx scripts/ders-ice-aktar.ts &lt;bölüm-dizini&gt;</code> çalıştır.</p></Card>
      )}
      {sections.data?.map((s) => (
        <Card key={s.id} className="mb-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">{s.title} <span className="ml-2 text-xs font-normal text-slate-500">{s.course.name}{s.topic ? ` › ${s.topic.name}` : ''} · {s.slug}</span></h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <StatusBadge status={s.status} />
                {s.isPremium ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">Premium</span> : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">Açık</span>}
                <span className="text-slate-500">{s.lessons.length} ders</span>
              </div>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <button onClick={() => premium.mutate({ id: s.id, isPremium: !s.isPremium })} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs">{s.isPremium ? 'Açık yap' : 'Premium yap'}</button>
                {s.status === 'published' && <button onClick={() => confirm('Bölüm ve tüm dersleri yayından alınsın mı?') && unpublishSection.mutate(s.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700">Yayından al</button>}
              </div>
            )}
          </div>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500"><th className="py-1 pr-3 font-medium">#</th><th className="py-1 pr-3 font-medium">Ders</th><th className="py-1 pr-3 font-medium">Durum</th><th className="py-1 pr-3 font-medium">Sürüm</th><th className="py-1 pr-3 font-medium">Süre</th><th className="py-1 pr-3 font-medium">Güncellendi</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {s.lessons.map((l, i) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="py-2 pr-3 text-slate-400">{i + 1}</td>
                  <td className="min-w-[16rem] py-2 pr-3"><Link href={`/lessons/${l.id}`} className="font-medium hover:underline">{l.title}</Link><div className="text-xs text-slate-500">{l.slug} <span className="ml-2 rounded bg-violet-50 px-1.5 py-0.5 text-violet-700">{l.sourceLabel}</span></div></td>
                  <td className="py-2 pr-3"><StatusBadge status={l.status} /></td>
                  <td className="py-2 pr-3 text-xs text-slate-600">v{l.version}{l._count.versions > l.version ? <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">yeni sürüm bekliyor</span> : null}</td>
                  <td className="py-2 pr-3 text-xs text-slate-600">{l.readingMinutes} dk</td>
                  <td className="py-2 pr-3 text-xs text-slate-500">{fmt(l.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'emerald' | 'amber' }) {
  const cls = tone === 'emerald' ? 'text-emerald-700' : tone === 'amber' ? 'text-amber-700' : 'text-slate-900';
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-semibold ${cls}`}>{value}</div>
    </div>
  );
}

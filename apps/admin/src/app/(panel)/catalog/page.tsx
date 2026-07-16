'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type {
  Curriculum,
  CurriculumCourse,
  CurriculumSection,
  CurriculumTopic,
} from '@/lib/types';

/**
 * İçerik Ağacı (Doc 21): Sınav Türü → Bölüm (%ağırlık) → Ders (küresel,
 * paylaşımlı) → Konu → Alt Konu. Dersler havuzdan bölümlere bağlanır;
 * aynı ders birden çok sınavda tekrar oluşturulmaz.
 */
export default function CatalogPage() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['curriculum'] });
  const q = useQuery({ queryKey: ['curriculum'], queryFn: () => api<Curriculum>('/admin/catalog/curriculum') });

  const [openCourses, setOpenCourses] = useState<Record<string, boolean>>({});
  const [showPool, setShowPool] = useState(false);

  if (q.isPending) return <Spinner />;
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;

  const { examTypes, coursePool } = q.data;
  const courseById = new Map(coursePool.map((c) => [c.id, c]));

  return (
    <>
      <PageHeader
        title="İçerik Ağacı"
        subtitle="Sınav Türü → Bölüm → Ders → Konu → Alt Konu · dersler küresel havuzdan paylaşılır"
        action={
          <button
            onClick={() => setShowPool((v) => !v)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            {showPool ? 'Ders havuzunu gizle' : `Ders havuzu (${coursePool.length})`}
          </button>
        }
      />

      {showPool && <CoursePool pool={coursePool} openCourses={openCourses} setOpenCourses={setOpenCourses} invalidate={invalidate} />}

      <div className="space-y-6">
        {examTypes.map((e) => (
          <Card key={e.id}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">
                {e.name}
                <span className="ml-2 text-xs font-normal text-slate-400">({e.key})</span>
                {!e.isActive && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">pasif</span>}
                <WeightBadge total={e.weightTotal} />
              </h2>
              <AddSection examTypeId={e.id} invalidate={invalidate} />
            </div>
            {e.sections.length === 0 && <p className="text-sm text-slate-400">Henüz bölüm yok.</p>}
            <div className="space-y-2">
              {e.sections.map((s, i) => (
                <SectionRow
                  key={s.id}
                  section={s}
                  examTypeId={e.id}
                  courseById={courseById}
                  pool={coursePool}
                  openCourses={openCourses}
                  setOpenCourses={setOpenCourses}
                  invalidate={invalidate}
                  onMove={(dir) => reorder(e.sections, i, dir, 'section', invalidate)}
                />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function WeightBadge({ total }: { total: number }) {
  const ok = total === 100;
  return (
    <span
      className={`ml-3 rounded-full px-2 py-0.5 text-xs font-medium ${
        ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
      }`}
      title={ok ? 'Ağırlıklar %100' : 'Ağırlık toplamı %100 değil'}
    >
      %{total}
    </span>
  );
}

/** Bölüm satırı: ad + ağırlık + sıra + bağlı dersler (çıkar) + ders bağla. */
function SectionRow({
  section,
  examTypeId,
  courseById,
  pool,
  openCourses,
  setOpenCourses,
  invalidate,
  onMove,
}: {
  section: CurriculumSection;
  examTypeId: string;
  courseById: Map<string, CurriculumCourse>;
  pool: CurriculumCourse[];
  openCourses: Record<string, boolean>;
  setOpenCourses: (fn: (p: Record<string, boolean>) => Record<string, boolean>) => void;
  invalidate: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const save = useMutation({
    mutationFn: (body: { name: string; weightPercent: number }) =>
      api(`/admin/catalog/sections/${section.id}`, {
        method: 'PATCH',
        body: { examTypeId, ...body, sortOrder: section.sortOrder },
      }),
    onSuccess: invalidate,
    onError: alertErr,
  });
  const del = useMutation({
    mutationFn: () => api(`/admin/catalog/sections/${section.id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
    onError: alertErr,
  });
  const attach = useMutation({
    mutationFn: (courseId: string) =>
      api(`/admin/catalog/sections/${section.id}/courses`, { method: 'POST', body: { courseId } }),
    onSuccess: invalidate,
    onError: alertErr,
  });
  const detach = useMutation({
    mutationFn: (courseId: string) =>
      api(`/admin/catalog/sections/${section.id}/courses/${courseId}`, { method: 'DELETE' }),
    onSuccess: invalidate,
    onError: alertErr,
  });

  const attachedIds = new Set(section.courses.map((c) => c.id));
  const available = pool.filter((c) => !attachedIds.has(c.id));

  return (
    <div className="rounded-lg border border-slate-100 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-col gap-0.5">
          <button onClick={() => onMove(-1)} className="text-xs text-slate-400 hover:text-slate-700">▲</button>
          <button onClick={() => onMove(1)} className="text-xs text-slate-400 hover:text-slate-700">▼</button>
        </div>
        <button
          onClick={() => {
            const name = window.prompt('Bölüm adı:', section.name);
            if (name && name !== section.name) save.mutate({ name, weightPercent: section.weightPercent });
          }}
          className="font-medium hover:underline"
        >
          {section.name}
        </button>
        <label className="flex items-center gap-1 text-xs text-slate-500">
          %
          <input
            type="number"
            defaultValue={section.weightPercent}
            onBlur={(e) => {
              const w = Number(e.target.value);
              if (w !== section.weightPercent) save.mutate({ name: section.name, weightPercent: w });
            }}
            className="w-14 rounded border border-slate-300 px-1.5 py-0.5"
          />
        </label>
        <span className="text-xs text-slate-400">
          {section.courses.reduce((s, c) => s + c.questionCount, 0)} soru
        </span>
        <div className="ml-auto flex items-center gap-2">
          {available.length > 0 && (
            <select
              value=""
              onChange={(e) => e.target.value && attach.mutate(e.target.value)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
            >
              <option value="">+ Ders bağla…</option>
              {available.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => {
              if (window.confirm(`"${section.name}" bölümü silinsin mi? (dersler havuzda kalır)`)) del.mutate();
            }}
            className="text-xs text-red-500 hover:underline"
          >
            Sil
          </button>
        </div>
      </div>

      {/* Bağlı dersler */}
      <div className="mt-2 space-y-2 pl-6">
        {section.courses.map((c) => (
          <CourseBlock
            key={c.id}
            course={courseById.get(c.id) ?? c}
            open={openCourses[c.id] ?? false}
            toggle={() => setOpenCourses((p) => ({ ...p, [c.id]: !(p[c.id] ?? false) }))}
            onDetach={() => detach.mutate(c.id)}
            invalidate={invalidate}
          />
        ))}
        {section.courses.length === 0 && (
          <p className="text-xs text-slate-400">Bu bölüme ders bağlı değil.</p>
        )}
      </div>
    </div>
  );
}

/** Ders bloğu: ad + soru sayısı + paylaşım rozeti; açılınca konu ağacı. */
function CourseBlock({
  course,
  open,
  toggle,
  onDetach,
  invalidate,
}: {
  course: CurriculumCourse;
  open: boolean;
  toggle: () => void;
  onDetach?: () => void;
  invalidate: () => void;
}) {
  const addTopic = useMutation({
    mutationFn: (name: string) =>
      api('/admin/catalog/topics', { method: 'POST', body: { courseId: course.id, name } }),
    onSuccess: invalidate,
    onError: alertErr,
  });
  const shared = course.usedByExamTypeIds.length > 1;

  return (
    <div className="rounded-lg border border-slate-100">
      <div className="flex items-center gap-2 px-3 py-2">
        <button onClick={toggle} className="text-sm font-medium">
          {open ? '▾' : '▸'} {course.name}
        </button>
        <span className="text-xs text-slate-400">{course.topics.length} konu · {course.questionCount} soru</span>
        {shared && (
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-600" title="Birden çok sınavda kullanılıyor">
            paylaşımlı ×{course.usedByExamTypeIds.length}
          </span>
        )}
        <div className="ml-auto flex gap-3 text-xs">
          <button
            onClick={() => {
              const name = window.prompt('Yeni konu adı:');
              if (name) addTopic.mutate(name);
            }}
            className="text-indigo-600 hover:underline"
          >
            + Konu
          </button>
          {onDetach && (
            <button onClick={onDetach} className="text-slate-500 hover:underline" title="Dersi bu bölümden çıkar (ders havuzda kalır)">
              Bağı kaldır
            </button>
          )}
        </div>
      </div>
      {open && (
        <ul className="divide-y divide-slate-50 border-t border-slate-100">
          {course.topics.map((t, i) => (
            <TopicRow
              key={t.id}
              topic={t}
              courseId={course.id}
              depth={0}
              invalidate={invalidate}
              onMove={(dir) => reorder(course.topics, i, dir, 'topic', invalidate)}
            />
          ))}
          {course.topics.length === 0 && <li className="px-3 py-2 text-xs text-slate-400">Henüz konu yok.</li>}
        </ul>
      )}
    </div>
  );
}

/** Konu satırı (özyinelemeli): alt konularıyla. */
function TopicRow({
  topic,
  courseId,
  depth,
  invalidate,
  onMove,
}: {
  topic: CurriculumTopic;
  courseId: string;
  depth: number;
  invalidate: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const patch = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api(`/admin/catalog/topics/${topic.id}`, { method: 'PATCH', body: { courseId, name: topic.name, ...body } }),
    onSuccess: invalidate,
    onError: alertErr,
  });
  const del = useMutation({
    mutationFn: () => api(`/admin/catalog/topics/${topic.id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
    onError: alertErr,
  });
  const addSub = useMutation({
    mutationFn: (name: string) =>
      api('/admin/catalog/topics', { method: 'POST', body: { courseId, parentId: topic.id, name } }),
    onSuccess: invalidate,
    onError: alertErr,
  });

  return (
    <li>
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm" style={{ paddingLeft: 12 + depth * 20 }}>
        <div className="flex flex-col gap-0.5">
          <button onClick={() => onMove(-1)} className="text-[10px] leading-none text-slate-300 hover:text-slate-600">▲</button>
          <button onClick={() => onMove(1)} className="text-[10px] leading-none text-slate-300 hover:text-slate-600">▼</button>
        </div>
        <span>{topic.name}</span>
        <span className="text-xs text-slate-400">{topic.questionCount} soru</span>
        {topic.isPremium && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] text-violet-700">Premium</span>}
        <div className="ml-auto flex gap-3 text-xs">
          <button onClick={() => { const n = window.prompt('Alt konu adı:'); if (n) addSub.mutate(n); }} className="text-indigo-600 hover:underline">+ Alt</button>
          <button
            onClick={() => {
              const cur = topic.matchKeywords.join(', ');
              const input = window.prompt('Eşleşme desenleri (virgülle):', cur);
              if (input !== null) patch.mutate({ matchKeywords: input.split(',').map((s) => s.trim()).filter(Boolean) });
            }}
            className="text-slate-500 hover:underline"
          >
            Eşleşme
          </button>
          <button onClick={() => patch.mutate({ isPremium: !topic.isPremium })} className="text-slate-500 hover:underline">
            {topic.isPremium ? 'Ücretsiz' : 'Premium'}
          </button>
          <button onClick={() => { const n = window.prompt('Konu adı:', topic.name); if (n && n !== topic.name) patch.mutate({ name: n }); }} className="text-slate-500 hover:underline">
            Adı
          </button>
          <button onClick={() => { if (window.confirm(`"${topic.name}" silinsin mi?`)) del.mutate(); }} className="text-red-500 hover:underline">
            Sil
          </button>
        </div>
      </div>
      {topic.matchKeywords.length > 0 && (
        <div className="flex flex-wrap gap-1 pb-1" style={{ paddingLeft: 44 + depth * 20 }}>
          {topic.matchKeywords.map((k) => (
            <span key={k} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">{k}</span>
          ))}
        </div>
      )}
      {topic.children.length > 0 && (
        <ul>
          {topic.children.map((c, i) => (
            <TopicRow
              key={c.id}
              topic={c}
              courseId={courseId}
              depth={depth + 1}
              invalidate={invalidate}
              onMove={(dir) => reorder(topic.children, i, dir, 'topic', invalidate)}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/** Ders havuzu paneli: bölümsüz dahil tüm dersler; yeni ders ekle. */
function CoursePool({
  pool,
  openCourses,
  setOpenCourses,
  invalidate,
}: {
  pool: CurriculumCourse[];
  openCourses: Record<string, boolean>;
  setOpenCourses: (fn: (p: Record<string, boolean>) => Record<string, boolean>) => void;
  invalidate: () => void;
}) {
  const addCourse = useMutation({
    mutationFn: (name: string) => api('/admin/catalog/courses', { method: 'POST', body: { name } }),
    onSuccess: invalidate,
    onError: alertErr,
  });
  const orphans = pool.filter((c) => c.usedByExamTypeIds.length === 0);

  return (
    <Card className="mb-6 border-dashed">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">
          Ders Havuzu <span className="text-xs font-normal text-slate-400">(küresel — bölümlere bağlanır)</span>
        </h2>
        <button
          onClick={() => { const n = window.prompt('Yeni ders adı:'); if (n) addCourse.mutate(n); }}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
        >
          + Ders
        </button>
      </div>
      {orphans.length > 0 && (
        <p className="mb-2 text-xs text-amber-600">
          Hiçbir sınava bağlı olmayan {orphans.length} ders: {orphans.map((c) => c.name).join(', ')}
        </p>
      )}
      <div className="space-y-2">
        {pool.map((c) => (
          <CourseBlock
            key={c.id}
            course={c}
            open={openCourses[c.id] ?? false}
            toggle={() => setOpenCourses((p) => ({ ...p, [c.id]: !(p[c.id] ?? false) }))}
            invalidate={invalidate}
          />
        ))}
      </div>
    </Card>
  );
}

function AddSection({ examTypeId, invalidate }: { examTypeId: string; invalidate: () => void }) {
  const add = useMutation({
    mutationFn: (name: string) => api('/admin/catalog/sections', { method: 'POST', body: { examTypeId, name, weightPercent: 0 } }),
    onSuccess: invalidate,
    onError: alertErr,
  });
  return (
    <button
      onClick={() => { const n = window.prompt('Yeni bölüm adı:'); if (n) add.mutate(n); }}
      className="text-sm font-medium text-indigo-600 hover:underline"
    >
      + Bölüm ekle
    </button>
  );
}

/** Mutasyon hatası mesajını göster (örn. "Bu konuda N soru var"). */
function alertErr(e: unknown) {
  window.alert((e as Error).message);
}

/** Reorder yardımcı: bir öğeyi yukarı/aşağı taşır, yeni sırayı sunucuya yollar. */
function reorder<T extends { id: string }>(
  items: T[],
  index: number,
  dir: -1 | 1,
  entity: 'section' | 'course' | 'topic',
  invalidate: () => void,
) {
  const target = index + dir;
  if (target < 0 || target >= items.length) return;
  const ids = items.map((i) => i.id);
  [ids[index], ids[target]] = [ids[target], ids[index]];
  api('/admin/catalog/reorder', { method: 'PATCH', body: { entity, ids } }).then(invalidate);
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { KindBadge, VerifyBadge } from "@/components/flashcard-form";
import {
  Card,
  ErrorBox,
  PageHeader,
  Spinner,
  Stat,
  StatusBadge,
} from "@/components/ui";
import { api } from "@/lib/api";
import {
  FLASHCARD_KIND_LABEL,
  VERIFICATION_LABEL,
  type CatalogModule,
  type ContentStatus,
  type FlashcardKind,
  type FlashcardListItem,
  type FlashcardPublishManyResult,
  type FlashcardStats,
  type Paged,
  type VerificationStatus,
} from "@/lib/types";

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("tr-TR", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
const kisalt = (s: string, n: number) =>
  s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;

const SELECT = "rounded-lg border border-slate-300 px-3 py-2 text-sm";

/** Durum sekmeleri (6 Kas 2026 kullanıcı isteği): yayındakiler incelemedekilerle aynı tabloya karışmasın. */
const STATUS_TABS: {
  value: ContentStatus | "";
  label: string;
  key?: keyof FlashcardStats;
}[] = [
  { value: "in_review", label: "İncelemede", key: "inReview" },
  { value: "published", label: "Yayında", key: "published" },
  { value: "draft", label: "Taslak", key: "draft" },
  { value: "archived", label: "Arşiv", key: "archived" },
  { value: "", label: "Hepsi", key: "total" },
];
const STATUS_VALUES = new Set<string>([
  "in_review",
  "published",
  "draft",
  "archived",
  "",
]);

/**
 * Bilgi Kartları listesi (Doc 56 §8.2; Figma 163:1306): beş sayaç, eskimiş kuyruğu, filtre çubuğu
 * (ders › konu, durum, tür, mevzuat kontrolü, eskimiş, arama), tablo + checkbox toplu yayın (yalnız
 * admin; her kart kendi yayın kapısından geçer, AI kaynaklı kartlar da toplu yayınlanır — 6 Kas 2026),
 * sayfalama. Kaynak etiketi yalnız panelde.
 */
export default function FlashcardsPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Sekme URL'de taşınır (?status=…): detaydan dönüşte ve yenilemede aynı sekme açılır; varsayılan İncelemede.
  const urlStatus = searchParams.get("status");
  const status: ContentStatus | "" =
    urlStatus == null
      ? "in_review"
      : STATUS_VALUES.has(urlStatus)
        ? (urlStatus as ContentStatus | "")
        : "in_review";
  const setStatus = (v: ContentStatus | "") =>
    router.replace(v ? `/flashcards?status=${v}` : "/flashcards?status=");
  const [me, setMe] = useState<{ roles: string[] } | null>(null);
  const [courseId, setCourseId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [kind, setKind] = useState<FlashcardKind | "">("");
  const [verification, setVerification] = useState<VerificationStatus | "">("");
  const [staleOnly, setStaleOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);

  useEffect(() => {
    api<{ roles: string[] }>("/me")
      .then(setMe)
      .catch(() => setMe({ roles: [] }));
  }, []);
  const isAdmin = me?.roles.includes("admin") ?? false;

  const tree = useQuery({
    queryKey: ["catalog-tree"],
    queryFn: () => api<CatalogModule[]>("/admin/catalog/tree"),
  });
  const courses = useMemo(() => {
    const m = new Map<
      string,
      { id: string; name: string; topics: { id: string; name: string }[] }
    >();
    for (const mod of tree.data ?? [])
      for (const c of mod.courses)
        if (!m.has(c.id))
          m.set(c.id, {
            id: c.id,
            name: c.name,
            topics: c.topics.map((t) => ({ id: t.id, name: t.name })),
          });
    return [...m.values()];
  }, [tree.data]);
  const topics = useMemo(
    () =>
      courseId
        ? (courses.find((c) => c.id === courseId)?.topics ?? [])
        : courses.flatMap((c) =>
            c.topics.map((t) => ({ ...t, name: `${c.name} / ${t.name}` })),
          ),
    [courses, courseId],
  );

  const params = new URLSearchParams();
  if (courseId) params.set("courseId", courseId);
  if (topicId) params.set("topicId", topicId);
  if (status) params.set("status", status);
  if (kind) params.set("kind", kind);
  if (verification) params.set("verification", verification);
  if (staleOnly) params.set("stale", "1");
  if (search) params.set("search", search);
  params.set("page", String(page));
  params.set("pageSize", "25");

  const stats = useQuery({
    queryKey: ["admin-flashcards-stats"],
    queryFn: () => api<FlashcardStats>("/admin/flashcards/stats"),
  });
  const stale = useQuery({
    queryKey: ["admin-flashcards-stale"],
    queryFn: () => api<FlashcardListItem[]>("/admin/flashcards/stale"),
  });
  const list = useQuery({
    queryKey: ["admin-flashcards", params.toString()],
    queryFn: () => api<Paged<FlashcardListItem>>(`/admin/flashcards?${params}`),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-flashcards"] });
    qc.invalidateQueries({ queryKey: ["admin-flashcards-stats"] });
    qc.invalidateQueries({ queryKey: ["admin-flashcards-stale"] });
  };
  const publishMany = useMutation({
    mutationFn: (ids: string[]) =>
      api<FlashcardPublishManyResult>("/admin/flashcards/publish-many", {
        method: "POST",
        body: { ids },
      }),
    onSuccess: (r) => {
      invalidate();
      setSelected(new Set());
      const atlanan = r.skipped.length
        ? ` · ${r.skipped.length} atlandı: ${r.skipped
            .map((s) => s.reason)
            .filter((v, i, a) => a.indexOf(v) === i)
            .join("; ")}`
        : "";
      setNotice({
        kind: r.published.length ? "ok" : "err",
        text: `${r.published.length} kart yayınlandı${atlanan}`,
      });
    },
    onError: (e: unknown) =>
      setNotice({
        kind: "err",
        text: e instanceof Error ? e.message : "Toplu yayın başarısız.",
      }),
  });

  const rows = list.data?.items ?? [];
  const secilebilir = rows
    .filter((r) => r.status !== "published" && r.status !== "archived")
    .map((r) => r.id);
  const aiSecili = rows.filter((r) => selected.has(r.id) && r.synthetic).length;
  const hepsiSecili =
    secilebilir.length > 0 && secilebilir.every((id) => selected.has(id));
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const totalPages = list.data
    ? Math.max(1, Math.ceil(list.data.total / list.data.pageSize))
    : 1;
  const resetPage = () => {
    setPage(1);
    setSelected(new Set());
  };

  return (
    <div>
      <PageHeader
        title="Bilgi Kartları"
        subtitle="Maddeye çivilenmiş soru-cevap kartları (Doc 56). Üretim modeldir, yayın insanındır; her kart kendi yayın kapısından (betik doğrulaması + mevzuat kontrolü) geçer."
        action={
          <div className="flex gap-2">
            <Link
              href="/flashcards/import"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              ⬆ JSON içe aktar
            </Link>
            <Link
              href="/flashcards/new"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              + Yeni kart
            </Link>
          </div>
        }
      />

      {notice && (
        <div
          className={`mb-4 whitespace-pre-line rounded-lg border px-4 py-3 text-sm ${notice.kind === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}
        >
          {notice.text}
          <button onClick={() => setNotice(null)} className="ml-3 underline">
            kapat
          </button>
        </div>
      )}

      {stats.data && stats.data.openReports > 0 && (
        <Link
          href="/reports?kind=flashcards"
          className="mb-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 hover:bg-amber-100"
        >
          <span>
            🚩 {stats.data.openReports} açık kullanıcı bildirimi var — kartları
            incele
          </span>
          <span className="text-xs">Hata Bildirimleri › Bilgi kartları →</span>
        </Link>
      )}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat
          label="Yayında"
          value={stats.data?.published ?? "—"}
          tone="emerald"
        />
        <Stat
          label="İncelemede"
          value={stats.data?.inReview ?? "—"}
          tone="amber"
        />
        <Stat
          label="Eskimiş"
          value={stats.data?.stale ?? "—"}
          tone={stats.data?.stale ? "red" : undefined}
        />
        <Stat
          label="Mevzuat kontrolü bekleyen"
          value={stats.data?.pendingVerification ?? "—"}
          hint={
            stats.data?.needsRefresh
              ? `${stats.data.needsRefresh} yenilenmeli`
              : undefined
          }
        />
        <Stat
          label="Toplam"
          value={stats.data?.total ?? "—"}
          hint={
            stats.data?.archived ? `${stats.data.archived} arşiv` : undefined
          }
        />
      </div>

      {stale.data && stale.data.length > 0 && !staleOnly && (
        <Card className="mb-6 border-red-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-red-800">
                {stale.data.length} eskimiş kart
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Referans verdiği madde metni değişti. Kartı açıp gözden geçir ve
                kaydet; eskimiş kart yayınlanamaz.
              </p>
            </div>
            <button
              onClick={() => {
                setStaleOnly(true);
                resetPage();
              }}
              className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
            >
              Eskimişleri listele
            </button>
          </div>
        </Card>
      )}

      <div
        className="mb-3 flex flex-wrap gap-1 border-b border-slate-200"
        role="tablist"
        aria-label="Kart durumu"
      >
        {STATUS_TABS.map((t) => {
          const active = t.value === status;
          const n = t.key ? stats.data?.[t.key] : undefined;
          return (
            <button
              key={t.label}
              role="tab"
              aria-selected={active}
              onClick={() => {
                setStatus(t.value);
                setSelected(new Set());
                resetPage();
              }}
              className={`-mb-px rounded-t-lg border-b-2 px-3 py-2 text-sm ${active ? "border-indigo-600 font-semibold text-indigo-700" : "border-transparent text-slate-600 hover:text-slate-900"}`}
            >
              {t.label}
              {typeof n === "number" && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 text-xs ${active ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}
                >
                  {n}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput);
            resetPage();
          }}
        >
          <input
            placeholder="Ön/arka yüzde ara…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
        </form>
        <select
          value={courseId}
          onChange={(e) => {
            setCourseId(e.target.value);
            setTopicId("");
            resetPage();
          }}
          className={SELECT}
        >
          <option value="">Tüm dersler</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={topicId}
          onChange={(e) => {
            setTopicId(e.target.value);
            resetPage();
          }}
          className={`max-w-72 ${SELECT}`}
        >
          <option value="">Tüm konular</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          value={kind}
          onChange={(e) => {
            setKind(e.target.value as FlashcardKind | "");
            resetPage();
          }}
          className={SELECT}
        >
          <option value="">Tüm türler</option>
          {(Object.keys(FLASHCARD_KIND_LABEL) as FlashcardKind[]).map((k) => (
            <option key={k} value={k}>
              {FLASHCARD_KIND_LABEL[k]}
            </option>
          ))}
        </select>
        <select
          value={verification}
          onChange={(e) => {
            setVerification(e.target.value as VerificationStatus | "");
            resetPage();
          }}
          className={SELECT}
        >
          <option value="">Mevzuat kontrolü: tümü</option>
          {(Object.keys(VERIFICATION_LABEL) as VerificationStatus[]).map(
            (v) => (
              <option key={v} value={v}>
                {VERIFICATION_LABEL[v]}
              </option>
            ),
          )}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={staleOnly}
            onChange={(e) => {
              setStaleOnly(e.target.checked);
              resetPage();
            }}
          />
          Yalnız eskimiş
        </label>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
          <span>
            {selected.size} seçili
            {aiSecili > 0 ? ` · ${aiSecili} AI kaynaklı` : ""} ·{" "}
            <span className="text-slate-300">
              yalnız admin yayınlar · kapıdan geçemeyen kart gerekçesiyle
              atlanır
            </span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelected(new Set())}
              className="rounded-lg border border-slate-600 px-3 py-1.5 hover:bg-slate-800"
            >
              Seçimi bırak
            </button>
            {isAdmin && (
              <button
                onClick={() => {
                  if (
                    confirm(
                      `${selected.size} kart yayınlanacak${aiSecili > 0 ? ` (${aiSecili} AI kaynaklı)` : ""}. Her kart kendi yayın kapısından geçer; geçemeyen atlanır. Devam?`,
                    )
                  )
                    publishMany.mutate([...selected]);
                }}
                disabled={publishMany.isPending}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 font-medium hover:bg-emerald-500 disabled:opacity-50"
              >
                {publishMany.isPending
                  ? "Yayınlanıyor…"
                  : "Seçilenleri yayınla"}
              </button>
            )}
          </div>
        </div>
      )}

      {list.isLoading && <Spinner />}
      {list.error && (
        <ErrorBox error={list.error} onRetry={() => list.refetch()} />
      )}
      {list.data && rows.length === 0 && (
        <Card>
          <p className="text-sm text-slate-600">
            Bu süzgeçte kart yok. Pilot:{" "}
            <code>docs/56-bilgi-kartlari/pilot/anayasa-yasama-1.json</code>{" "}
            dosyasını içe aktar ya da yeni kart oluştur.
          </p>
        </Card>
      )}
      {rows.length > 0 && (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label="Sayfadaki yayınlanabilir kartları seç"
                      checked={hepsiSecili}
                      disabled={secilebilir.length === 0}
                      onChange={() =>
                        setSelected((s) => {
                          const n = new Set(s);
                          if (hepsiSecili)
                            secilebilir.forEach((id) => n.delete(id));
                          else secilebilir.forEach((id) => n.add(id));
                          return n;
                        })
                      }
                    />
                  </th>
                  <th className="py-2 pr-3 font-medium">Ön yüz</th>
                  <th className="py-2 pr-3 font-medium">Tür</th>
                  <th className="py-2 pr-3 font-medium">Maddeler</th>
                  <th className="py-2 pr-3 font-medium">Konu · ünite</th>
                  <th className="py-2 pr-3 font-medium">Durum</th>
                  <th className="py-2 pr-3 font-medium">
                    Kaynak (yalnız panel)
                  </th>
                  <th className="py-2 pr-3 font-medium">Mevzuat kontrolü</th>
                  <th className="py-2 pr-3 font-medium">Güncellendi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="align-top hover:bg-slate-50">
                    <td className="px-3 py-2">
                      {r.status !== "published" && r.status !== "archived" ? (
                        <input
                          type="checkbox"
                          aria-label="Kartı seç"
                          checked={selected.has(r.id)}
                          onChange={() => toggle(r.id)}
                        />
                      ) : null}
                    </td>
                    <td className="min-w-[20rem] py-2 pr-3">
                      <Link
                        href={`/flashcards/${r.id}`}
                        className="font-medium hover:underline"
                      >
                        {kisalt(r.front, 110)}
                      </Link>
                      <div className="text-xs text-slate-500">
                        {kisalt(r.back, 90)}
                      </div>
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <KindBadge kind={r.kind} />
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex flex-wrap gap-1">
                        {r.articles.map((a) => (
                          <span
                            key={a.no}
                            className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700"
                            title={a.title ?? ""}
                          >
                            md {a.no}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="min-w-[14rem] max-w-[18rem] py-2 pr-3 text-xs text-slate-600">
                      <div
                        className="truncate"
                        title={`${r.courseName} › ${r.topicName}`}
                      >
                        <span className="text-slate-400">
                          {r.courseName} ›{" "}
                        </span>
                        {r.topicName}
                      </div>
                      {r.unit && (
                        <div
                          className="truncate text-slate-500"
                          title={r.unit.title}
                        >
                          {r.unit.title}
                          {r.unit.isPremium ? " · Premium" : ""}
                        </div>
                      )}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <StatusBadge status={r.status} />
                      {r.staleSince && (
                        <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                          eskimiş
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className="inline-block max-w-[14rem] truncate rounded bg-violet-50 px-1.5 py-0.5 text-xs text-violet-700"
                        title={r.sourceLabel}
                      >
                        {r.sourceLabel}
                      </span>
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <VerifyBadge status={r.verificationStatus} />
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap text-xs text-slate-500">
                      {fmt(r.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-sm text-slate-600">
            <span>
              {list.data?.total ?? 0} kart · sayfa {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-300 px-3 py-1 disabled:opacity-40"
              >
                ← Önceki
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-slate-300 px-3 py-1 disabled:opacity-40"
              >
                Sonraki →
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

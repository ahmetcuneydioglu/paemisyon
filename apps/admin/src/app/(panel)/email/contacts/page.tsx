"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Card, ErrorBox, PageHeader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import {
  CONTACT_STATUS,
  type EmailContact,
  type EmailContactStatus,
  fmtDate,
  SOURCE_LABEL,
} from "../types";

type Resp = {
  items: EmailContact[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    byStatus: Partial<Record<EmailContactStatus, number>>;
  };
};

/** Kişiler: durum/kaynak/yıl süzgeci, e-posta araması, elle çıkarma. */
export default function EmailContactsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<"" | EmailContactStatus>("");
  const [source, setSource] = useState("");
  const [year, setYear] = useState("");
  const [tag, setTag] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({ page: String(page), pageSize: "50" });
  if (status) params.set("status", status);
  if (source) params.set("source", source);
  if (year) params.set("legacyYear", year);
  if (tag) params.set("tag", tag);
  if (search) params.set("search", search);

  const q = useQuery({
    queryKey: ["email-contacts", params.toString()],
    queryFn: () => api<Resp>(`/admin/email/contacts?${params}`),
  });
  const unsub = useMutation({
    mutationFn: (id: string) =>
      api(`/admin/email/contacts/${id}/unsubscribe`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-contacts"] }),
  });

  const totalPages = q.data
    ? Math.max(1, Math.ceil(q.data.meta.total / q.data.meta.pageSize))
    : 1;

  return (
    <div>
      <PageHeader
        title="E-posta kişileri"
        subtitle="Liste sorumluluk değil onay kaydıdır; çıkan kişi yeniden abone yapılmaz."
        action={
          <Link href="/email" className="text-sm underline">
            ← Kampanyalar
          </Link>
        }
      />

      <Card className="mb-4">
        <form
          className="flex flex-wrap items-end gap-3 text-sm"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput.trim());
            setPage(1);
          }}
        >
          <label className="block">
            <span className="block text-xs text-slate-500">Durum</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as "" | EmailContactStatus);
                setPage(1);
              }}
              className="mt-1 rounded border border-slate-300 px-2 py-1"
            >
              <option value="">Tümü</option>
              {Object.entries(CONTACT_STATUS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                  {q.data?.meta.byStatus[k as EmailContactStatus] != null
                    ? ` (${q.data.meta.byStatus[k as EmailContactStatus]})`
                    : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs text-slate-500">Kaynak</span>
            <select
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setPage(1);
              }}
              className="mt-1 rounded border border-slate-300 px-2 py-1"
            >
              <option value="">Tümü</option>
              {Object.entries(SOURCE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs text-slate-500">
              Eski kayıt yılı
            </span>
            <select
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setPage(1);
              }}
              className="mt-1 rounded border border-slate-300 px-2 py-1"
            >
              <option value="">Tümü</option>
              {["2023", "2022", "2021", "2020"].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs text-slate-500">Etiket</span>
            <input
              value={tag}
              onChange={(e) => {
                setTag(e.target.value.trim());
                setPage(1);
              }}
              className="mt-1 w-40 rounded border border-slate-300 px-2 py-1"
              placeholder="brevo_first300"
            />
          </label>
          <label className="block grow">
            <span className="block text-xs text-slate-500">
              Ara (e-posta / ad)
            </span>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
              placeholder="ahmet@…"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            Ara
          </button>
        </form>
      </Card>

      <Card>
        {q.isLoading && <Spinner />}
        {q.error && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
        {q.data && (
          <>
            <div className="mb-2 text-xs text-slate-500">
              {q.data.meta.total} kişi · sayfa {q.data.meta.page}/{totalPages}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-slate-500">
                  <tr>
                    <th className="py-2 pr-3">E-posta</th>
                    <th className="py-2 pr-3">Ad</th>
                    <th className="py-2 pr-3">Kaynak</th>
                    <th className="py-2 pr-3">Durum</th>
                    <th className="py-2 pr-3">Konular</th>
                    <th className="py-2 pr-3">Onay</th>
                    <th className="py-2 pr-3">Son gönderim</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {q.data.items.map((c) => (
                    <tr key={c.id} className="border-t border-slate-100">
                      <td className="py-2 pr-3 font-mono text-xs">{c.email}</td>
                      <td className="py-2 pr-3">{c.displayName ?? "—"}</td>
                      <td className="py-2 pr-3 text-xs">
                        {SOURCE_LABEL[c.source] ?? c.source}
                        {c.legacyYear ? ` · ${c.legacyYear}` : ""}
                        {c.tags?.length ? ` · ${c.tags.join(", ")}` : ""}
                        {c.tags?.length ? ` · ${c.tags.join(", ")}` : ""}
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${CONTACT_STATUS[c.status].cls}`}
                        >
                          {CONTACT_STATUS[c.status].label}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-xs">
                        {c.topics.duyuru === false ? (
                          <span className="line-through">duyuru</span>
                        ) : (
                          "duyuru"
                        )}{" "}
                        ·{" "}
                        {c.topics.kampanya === false ? (
                          <span className="line-through">kampanya</span>
                        ) : (
                          "kampanya"
                        )}
                      </td>
                      <td className="py-2 pr-3 text-xs text-slate-500">
                        {fmtDate(c.consentAt)}
                      </td>
                      <td className="py-2 pr-3 text-xs text-slate-500">
                        {fmtDate(c.lastSentAt)}
                      </td>
                      <td className="py-2 text-right">
                        {c.status === "subscribed" && (
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `${c.email} abonelikten çıkarılsın mı?`,
                                )
                              )
                                unsub.mutate(c.id);
                            }}
                            className="text-xs text-red-700 underline"
                          >
                            Çıkar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40"
              >
                Önceki
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40"
              >
                Sonraki
              </button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

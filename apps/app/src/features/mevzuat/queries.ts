import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Mevzuat (public.controller — girişsiz) + kişisel katman (/me/article-*, /me/reading-progress).
 * Metin ve kaynak sunucudan; doğrulama tarihi görünür (Doc 29 §13). Kaynak etiketi ≠ soru
 * kaynağı: burada "kaynak" resmî metnin geldiği yerdir ve gösterilir.
 */
export type LegislationType = "kanun" | "cbk" | "yonetmelik" | "genelge" | "yonerge";

export interface LegislationItem {
  slug: string;
  type: LegislationType;
  number: string | null;
  name: string;
  shortName: string | null;
  articleCount: number;
  readable: boolean;
  questionCount: number;
  lastVerifiedAt: string | null;
  topicId: string | null;
}

export interface LegislationDetail {
  slug: string;
  type: LegislationType;
  number: string | null;
  name: string;
  shortName: string | null;
  topicId: string | null;
  officialSourceUrl: string | null;
  effectiveInfo: string | null;
  lastVerifiedAt: string | null;
  articleCount: number;
  questionCount: number;
  sections: { id: string; parentId: string | null; heading: string; sortOrder: number }[];
  toc: { no: string; slug: string; title: string | null; sectionId: string | null; questionCount: number }[];
}

export interface LawRead {
  slug: string;
  name: string;
  shortName: string | null;
  number: string | null;
  type: LegislationType;
  topicId: string | null;
  articleCount: number;
  source: string;
  sourceUrl: string | null;
  effectiveInfo: string | null;
  verifiedAt: string | null;
  sections: { id: string; parentId: string | null; heading: string; sortOrder: number }[];
  articles: { no: string; slug: string; title: string | null; text: string; sectionId: string | null; questionCount: number }[];
}

export interface MevzuatSearchResult {
  legislation: { slug: string; type: LegislationType; number: string | null; name: string; shortName: string | null; readable: boolean }[];
  /** headline: vurgu ⟪…⟫ işaretleri arasında. */
  articles: { lawSlug: string; lawShort: string | null; no: string; slug: string; title: string | null; headline: string }[];
}

export interface ReadingProgressItem {
  lawSlug: string;
  lawShort: string;
  lawName: string;
  no: string;
  updatedAt: string;
}

export interface ArticleBookmark {
  articleId: string;
  no: string;
  title: string | null;
  lawSlug: string;
  lawShort: string;
  lawName: string;
  createdAt: string;
}

export interface ArticleAnnotations {
  highlights: { id: string; no: string; startOffset: number; endOffset: number; snippet: string }[];
  notes: { no: string; text: string }[];
}

export const mevzuatKeys = {
  list: ["mevzuat", "list"] as const,
  search: (q: string) => ["mevzuat", "search", q] as const,
  detail: (slug: string | null) => ["mevzuat", "detail", slug] as const,
  read: (slug: string | null) => ["mevzuat", "read", slug] as const,
  progress: ["me", "reading-progress"] as const,
  bookmarks: ["me", "article-bookmarks"] as const,
  annotations: (slug: string | null) => ["me", "article-annotations", slug] as const,
};

export const TYPE_LABEL: Record<LegislationType, string> = { kanun: "Kanun", cbk: "CBK", yonetmelik: "Yönetmelik", genelge: "Genelge", yonerge: "Yönerge" };

export function useMevzuatList() {
  return useQuery({ queryKey: mevzuatKeys.list, queryFn: () => api<{ items: LegislationItem[] }>("/public/mevzuat", { auth: false }), staleTime: 2 * 60_000, select: (d) => d.items });
}

export function useMevzuatSearch(q: string) {
  const query = q.trim();
  return useQuery({
    queryKey: mevzuatKeys.search(query),
    queryFn: () => api<MevzuatSearchResult>(`/public/mevzuat/search?q=${encodeURIComponent(query)}`, { auth: false }),
    enabled: query.length >= 2,
    staleTime: 60_000,
  });
}

export function useLegislation(slug: string | null) {
  return useQuery({ queryKey: mevzuatKeys.detail(slug), queryFn: () => api<LegislationDetail>(`/public/mevzuat/${slug}`, { auth: false }), enabled: Boolean(slug), staleTime: 2 * 60_000 });
}

export function useLawRead(slug: string | null) {
  return useQuery({ queryKey: mevzuatKeys.read(slug), queryFn: () => api<LawRead>(`/public/mevzuat/${slug}/oku`, { auth: false }), enabled: Boolean(slug), staleTime: 10 * 60_000, gcTime: 15 * 60_000 });
}

export function useReadingProgress() {
  return useQuery({ queryKey: mevzuatKeys.progress, queryFn: () => api<{ items: ReadingProgressItem[] }>("/me/reading-progress"), select: (d) => d.items });
}

export function useArticleBookmarks() {
  return useQuery({ queryKey: mevzuatKeys.bookmarks, queryFn: () => api<{ items: ArticleBookmark[] }>("/me/article-bookmarks"), select: (d) => d.items });
}

export function useArticleAnnotations(slug: string | null) {
  return useQuery({ queryKey: mevzuatKeys.annotations(slug), queryFn: () => api<ArticleAnnotations>(`/me/article-annotations?lawSlug=${encodeURIComponent(slug ?? "")}`), enabled: Boolean(slug) });
}

/** Madde kaydet/kaldır — iyimser; hata olursa liste yeniden çekilir. */
export function useToggleArticleBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lawSlug, no, on }: { lawSlug: string; no: string; on: boolean }) => api<{ ok: boolean }>("/me/article-bookmarks", { method: on ? "POST" : "DELETE", body: { lawSlug, no } }),
    onSettled: () => void qc.invalidateQueries({ queryKey: mevzuatKeys.bookmarks }),
  });
}

export function useSaveArticleNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lawSlug, no, text }: { lawSlug: string; no: string; text: string }) => api<{ ok: boolean; deleted?: boolean }>("/me/article-notes", { method: "PUT", body: { lawSlug, no, text } }),
    onSuccess: (_r, v) => void qc.invalidateQueries({ queryKey: mevzuatKeys.annotations(v.lawSlug) }),
  });
}

export function useSaveReadingProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lawSlug, no }: { lawSlug: string; no: string }) => api<{ ok: boolean }>("/me/reading-progress", { method: "POST", body: { lawSlug, no } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: mevzuatKeys.progress }),
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Konu anlatımı (Doc 57) — bölüm → ders → sürümlü gövde; sunucudan okunur (/public/lessons/*), ilerleme
 * sunucuda (/me/lessons/progress). Kaynak etiketi ve kitap künyesi yanıta girmez; yalnız kamuya açık
 * kaynaklar (URL, madde) gelir. Premium bölüm kilitliyse gövde null döner.
 */
/** Ders blokları (Doc 57; altı tür). `madde` ve `soru` sunucuda zenginleştirilmiş gelir; kaynak etiketi yoktur. */
export type LessonBlock =
  | { kind: "text"; text: string }
  | { kind: "table"; headers: string[]; rows: string[][] }
  | { kind: "tanim"; term: string; text: string }
  | { kind: "uyari"; text: string }
  | { kind: "ornek"; text: string }
  | { kind: "madde"; law: string; no: string; note?: string; lawName?: string }
  | { kind: "soru"; questionId: string; stem: string; options: { id: string; label: string; text: string }[]; correctOptionId: string | null; explanation: string | null; topicName: string | null };
export interface LessonBodySection {
  title: string;
  blocks: LessonBlock[];
}
export interface LessonProgressInfo {
  offset: number;
  readAt: string | null;
}
export interface LessonListItem {
  slug: string;
  title: string;
  goal: string;
  readingMinutes: number;
  version: number;
  progress: LessonProgressInfo | null;
}
export interface LessonSectionItem {
  slug: string;
  title: string;
  subtitle: string | null;
  isPremium: boolean;
  locked: boolean;
  lessons: LessonListItem[];
}
export interface LessonSource {
  kind: "book" | "url" | "article";
  label: string;
  url: string | null;
  page: string | null;
  lawArticleId: string | null;
}
export interface LessonDetail {
  slug: string;
  title: string;
  goal: string;
  readingMinutes: number;
  version: number;
  section: { slug: string; title: string; isPremium: boolean; lessonCount: number };
  order: number;
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
  locked: boolean;
  body: { sections: LessonBodySection[] } | null;
  sources: LessonSource[];
  progress: LessonProgressInfo | null;
}

/** Listede dersin okuma durumu: okundu (kullanıcı işareti) > devam (konum var) > yok. */
export type LessonReadState = "read" | "resume" | null;
export function lessonReadState(progress: LessonProgressInfo | null): LessonReadState {
  if (progress?.readAt) return "read";
  return progress && progress.offset > 0 ? "resume" : null;
}

export const lessonKeys = {
  sections: (topicId: string | null) => ["lessons", "sections", topicId] as const,
  lesson: (slug: string | null) => ["lessons", "lesson", slug] as const,
};

export function useLessonSections(topicId: string | null) {
  return useQuery({
    queryKey: lessonKeys.sections(topicId),
    queryFn: () => api<{ sections: LessonSectionItem[] }>(`/public/lessons/sections?topicId=${encodeURIComponent(topicId ?? "")}`).then((r) => r.sections),
    enabled: Boolean(topicId),
    staleTime: 60_000,
  });
}

export function useLesson(slug: string | null) {
  return useQuery({
    queryKey: lessonKeys.lesson(slug),
    queryFn: () => api<LessonDetail>(`/public/lessons/${encodeURIComponent(slug ?? "")}`),
    enabled: Boolean(slug),
    staleTime: 5 * 60_000,
  });
}

/** Okuma konumu ve "okudum" — sunucuya yazar; ders ve bölüm listesi önbelleği tazelenir. */
export function useSaveLessonProgress(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { offset: number; read?: boolean }) => api<{ ok: boolean; offset: number; readAt: string | null }>("/me/lessons/progress", { method: "POST", body: { slug, ...p } }),
    onSuccess: (r) => {
      qc.setQueryData<LessonDetail>(lessonKeys.lesson(slug), (d) => (d ? { ...d, progress: { offset: r.offset, readAt: r.readAt } } : d));
      void qc.invalidateQueries({ queryKey: ["lessons", "sections"] });
    },
  });
}

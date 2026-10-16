import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Yanlışlar defteri ve favoriler (review.controller). Listeler sunucuda sınırlı (50 / 100),
 * parametre yok. Ücretsiz planda tekrar turu son 7 günü kapsar — kural sunucuda, burada yalnız
 * sayılar ve başlatma.
 */
export interface WrongAnswerItem {
  questionId: string;
  wrongCount: number;
  stem: string | null;
  topicName: string | null;
}
export interface BookmarkItem {
  questionId: string;
  stem: string | null;
  topicName: string | null;
}

export const reviewKeys = { wrongs: ["review", "wrong-answers"] as const, bookmarks: ["review", "bookmarks"] as const };

export function useWrongAnswers() {
  return useQuery({ queryKey: reviewKeys.wrongs, queryFn: () => api<WrongAnswerItem[]>("/review/wrong-answers") });
}

export function useBookmarks() {
  return useQuery({ queryKey: reviewKeys.bookmarks, queryFn: () => api<BookmarkItem[]>("/review/bookmarks") });
}

export function useSetBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, on }: { questionId: string; on: boolean }) => api<{ bookmarked: boolean }>(`/review/bookmarks/${questionId}`, { method: on ? "POST" : "DELETE" }),
    onMutate: async ({ questionId, on }) => {
      await qc.cancelQueries({ queryKey: reviewKeys.bookmarks });
      const prev = qc.getQueryData<BookmarkItem[]>(reviewKeys.bookmarks);
      if (prev && !on) qc.setQueryData<BookmarkItem[]>(reviewKeys.bookmarks, prev.filter((b) => b.questionId !== questionId));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(reviewKeys.bookmarks, ctx.prev);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: reviewKeys.bookmarks }),
  });
}

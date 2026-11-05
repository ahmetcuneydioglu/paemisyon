import * as SecureStore from "expo-secure-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/AuthProvider";

export interface LessonProgress { offset: number; read: boolean }
export function useLessonProgress(slug: string, version: number) {
  const { session } = useAuth();
  const qc = useQueryClient();
  const storageKey = `lesson.${session?.user.id ?? "guest"}.${version}.${slug}`;
  const queryKey = ["lesson-progress", storageKey];
  const query = useQuery({ queryKey, queryFn: async (): Promise<LessonProgress> => {
    const raw = await SecureStore.getItemAsync(storageKey);
    if (!raw) return { offset: 0, read: false };
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return { offset: 0, read: false };
    const p = value as Partial<LessonProgress>;
    return { offset: typeof p.offset === "number" && Number.isFinite(p.offset) ? Math.max(0, p.offset) : 0, read: p.read === true };
  } });
  const save = useMutation({ mutationFn: async (progress: LessonProgress) => { await SecureStore.setItemAsync(storageKey, JSON.stringify(progress)); return progress; }, onSuccess: p => qc.setQueryData(queryKey, p) });
  return { ...query, save };
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { homeKeys } from "@/features/home/queries";

/**
 * Ben (users.controller /me, coach /me/badges). Üyelik yalnız `isPremium` + `validUntil`;
 * satın alma F5 (IAP). Hesap silme KVKK anonimleştirmesidir (sunucu); istemci yalnız onay alır.
 */
export interface MeFull {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  preferredModule: { id: string; name: string } | null;
  dailyGoal: number;
  targetExamDate: string | null;
  memberSince: string | null;
  roles: string[];
  isPremium: boolean;
  validUntil: string | null;
}

export interface UpdateMeBody {
  displayName?: string;
  preferredModuleId?: string;
  dailyGoal?: number;
  targetExamDate?: string | null;
}

export interface BadgesResponse {
  earnedCount: number;
  totalCount: number;
  items: { key: string; name: string; description: string; earned: boolean; earnedAt: string | null }[];
}

export const meKeys = { badges: ["me", "badges"] as const };

export function useMeFull() {
  return useQuery({ queryKey: homeKeys.me, queryFn: () => api<MeFull>("/me") });
}

export function useBadges() {
  return useQuery({ queryKey: meKeys.badges, queryFn: () => api<BadgesResponse>("/me/badges") });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateMeBody) => api<Partial<MeFull>>("/me", { method: "PATCH", body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: homeKeys.me });
      void qc.invalidateQueries({ queryKey: homeKeys.brief });
      void qc.invalidateQueries({ queryKey: ["me", "dashboard"] });
      void qc.invalidateQueries({ queryKey: ["catalog"] });
    },
  });
}

export function useDeleteMe() {
  return useMutation({ mutationFn: () => api<{ deleted: boolean; authDeleted: boolean }>("/me", { method: "DELETE" }) });
}

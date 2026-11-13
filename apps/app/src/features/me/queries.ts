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
  /** Günlük kart hedefi (Doc 56); null = kartlar bu kullanıcıya kapalı, eski sunucuda yok. */
  flashcardDailyGoal?: number | null;
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
  /** `progress`/`threshold`: rozet kuralının kendi ölçüsü (19/30 gün); eski API'de yok. */
  items: { key: string; name: string; description: string; earned: boolean; earnedAt: string | null; progress?: number; threshold?: number }[];
}

type BadgeItem = BadgesResponse["items"][number];

/** Rozetin kendi ilerleme oranı (0–1); API ölçü vermiyorsa null. */
export function badgeRatio(b: BadgeItem): number | null {
  if (b.earned) return 1;
  if (b.progress == null || !b.threshold) return null;
  return Math.min(1, b.progress / b.threshold);
}

/** Sıradaki rozet: kazanılmamışlar içinde bitişe en yakın olanı (eşitlikte katalog sırası). */
export function nextBadgeOf(items: BadgeItem[]): BadgeItem | null {
  let best: BadgeItem | null = null;
  let bestRatio = -1;
  for (const b of items) {
    if (b.earned) continue;
    const r = badgeRatio(b) ?? 0;
    if (r > bestRatio) {
      best = b;
      bestRatio = r;
    }
  }
  return best;
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

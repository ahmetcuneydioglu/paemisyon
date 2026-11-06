import { useSyncExternalStore } from "react";
import { api } from "@/lib/api";

/**
 * Mağaza değerlendirme istemi (Doc 57). Kural sunucuda: tur/deneme sonucu yanıtında
 * `reviewPrompt` gelirse istemci YALNIZ gösterir ve sonucu bildirir; ne zaman, kime, kaç
 * günde bir sorulacağını bilmez. Metinde yıldız/sayı yok; "Değerlendir" yerel istemi açar.
 */
export type ReviewMoment =
  "streak_30" | "streak_7" | "weekly_top" | "personal_best" | "badge";

export interface ReviewPrompt {
  id: string;
  moment: ReviewMoment;
  label: string;
  title: string;
  body: string;
}

export const reviewPromptApi = {
  /** Sheet sonucu: 'accepted' (yerel istem açıldı) | 'dismissed' (Şimdi değil / kapattı). İdempotent. */
  outcome: (id: string, outcome: "accepted" | "dismissed") =>
    api<{ id: string; outcome: string; changed: boolean }>(
      `/me/review-prompts/${id}`,
      { method: "PATCH", body: { outcome } },
    ),
};

/**
 * Bekleyen istem: sonuç ekranı sunucudan gelen nesneyi buraya bırakır; `ReviewPromptHost`
 * (sekme kabuğu) sonuç ekranı kapanınca gösterir. Bellek içi — uygulama yeniden açılırsa düşer
 * (sunucuda `shown` kaldı; bir sonraki istem sönümden sonra gelir).
 */
let pending: ReviewPrompt | null = null;
const listeners = new Set<() => void>();

export function setPendingReviewPrompt(p: ReviewPrompt | null | undefined) {
  pending = p ?? null;
  for (const l of listeners) l();
}

export function usePendingReviewPrompt(): ReviewPrompt | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => pending,
    () => pending,
  );
}

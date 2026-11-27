import type { DuelPhase } from "./types";

/**
 * Düello saati — SAF. Sayaç cihaz saatine değil sunucu saatine göre çizilir:
 * `offsetMs = sunucu − cihaz`. Karar sunucudadır; bu yalnız gösterimdir.
 */

/** Son kaç saniyede sayaç dikkat rengine geçer. */
export const URGENT_SECONDS = 5;

export interface ClockInput {
  phase: DuelPhase;
  phaseStartedAt: string | null;
  phaseEndsAt: string | null;
  offsetMs: number;
}

export interface ClockView {
  /** Fazın bitmesine kalan süre (ms), 0'ın altına inmez. */
  remainingMs: number;
  /** Ekranda yazan saniye: 0,1 sn kala da "1" görünür, süre bitince "0". */
  seconds: number;
  /** Kalan / toplam (1 → 0); ilerleme çubuğu. */
  fraction: number;
  /** Açık soruda son saniyeler. */
  urgent: boolean;
  /** Yerel saate göre faz süresi doldu (sunucudan yeni durum bekleniyor). */
  expired: boolean;
}

export function clockView(input: ClockInput, deviceNow: number): ClockView {
  const end = input.phaseEndsAt ? Date.parse(input.phaseEndsAt) : null;
  const start = input.phaseStartedAt ? Date.parse(input.phaseStartedAt) : null;
  if (end == null || start == null) return { remainingMs: 0, seconds: 0, fraction: 0, urgent: false, expired: false };
  const now = deviceNow + input.offsetMs;
  const total = Math.max(1, end - start);
  const remainingMs = Math.max(0, Math.min(total, end - now));
  const seconds = Math.ceil(remainingMs / 1000);
  return {
    remainingMs,
    seconds,
    fraction: remainingMs / total,
    urgent: input.phase === "question" && seconds <= URGENT_SECONDS && remainingMs > 0,
    expired: now >= end,
  };
}

/**
 * Saat farkı tahmini. Ölçüm = gerçek fark − ağ gecikmesi olduğundan her ölçüm gerçeğin ALTINDA
 * kalır; en iyi tahmin gelen ölçümlerin en büyüğüdür (gecikmesi en az olan örnek).
 */
export function mergeOffset(previous: number | null, serverNow: string, deviceNow: number): number {
  const measured = Date.parse(serverNow) - deviceNow;
  return previous == null ? measured : Math.max(previous, measured);
}

/** "0:12" — arama süresi, davet geri sayımı. */
export function mmss(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** 7400 → "7,4 sn" */
export function seconds1(ms: number | null | undefined): string {
  if (ms == null) return "–";
  return `${(ms / 1000).toFixed(1).replace(".", ",")} sn`;
}

/** 1036 → "1.036" (tr-TR; Hermes Intl'siz de çalışsın diye elle). */
export function points(n: number): string {
  const s = String(Math.abs(Math.trunc(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return n < 0 ? `−${s}` : s;
}

export function signed(n: number): string {
  return n > 0 ? `+${points(n)}` : n < 0 ? points(n) : "0";
}

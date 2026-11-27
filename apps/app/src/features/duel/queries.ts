import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  DuelHub,
  DuelLeaderboard,
  DuelOpenRoom,
  DuelPlayerRow,
  DuelQueueStatus,
  DuelReview,
  DuelRoomInput,
  DuelScope,
  DuelSnapshot,
} from "./types";

/** Düello veri katmanı (Doc 59). Hak, kural, sıralama ve cümleler sunucudan; istemci yalnız gösterir. */
export const duelKeys = {
  all: ["duel"] as const,
  hub: ["duel", "hub"] as const,
  queue: ["duel", "queue"] as const,
  match: (id: string) => ["duel", "match", id] as const,
  players: (q: string) => ["duel", "players", q] as const,
  rooms: ["duel", "rooms"] as const,
  leaderboard: (mode: string, period: string, scope: string) => ["duel", "leaderboard", mode, period, scope] as const,
  review: (id: string) => ["duel", "review", id] as const,
};

type MatchResponse = DuelSnapshot & { myOptionId: string | null };
const scopeBody = (s: DuelScope) => (s.kind === "mixed" ? { scopeKind: "mixed" } : { scopeKind: s.kind, scopeId: s.id });

/** Merkez. Ekran açıkken yarım dakikada bir yenilenir: bu çağrı aynı zamanda "çevrimiçiyim" sinyalidir. */
export function useDuelHub(enabled = true) {
  return useQuery({ queryKey: duelKeys.hub, queryFn: () => api<DuelHub>("/me/duel"), enabled, staleTime: 5_000, refetchInterval: 30_000 });
}

export function useDuelPlayers(q: string, enabled = true) {
  const term = q.trim();
  return useQuery({
    queryKey: duelKeys.players(term),
    queryFn: () => api<{ items: DuelPlayerRow[]; onlineCount: number }>(`/me/duel/players${term ? `?q=${encodeURIComponent(term)}` : ""}`),
    enabled: enabled && (term.length === 0 || term.length >= 2),
    staleTime: 5_000,
    refetchInterval: term ? false : 30_000,
  });
}

export function useOpenRooms(enabled = true) {
  return useQuery({ queryKey: duelKeys.rooms, queryFn: () => api<DuelOpenRoom[]>("/me/duel/rooms"), enabled, staleTime: 3_000, refetchInterval: 8_000 });
}

export function useDuelLeaderboard(mode: "duel" | "room", period: "week" | "month" | "all", scope: "module" | "all") {
  return useQuery({
    queryKey: duelKeys.leaderboard(mode, period, scope),
    queryFn: () => api<DuelLeaderboard>(`/me/duel/leaderboard?mode=${mode}&period=${period}&scope=${scope}`),
    staleTime: 30_000,
  });
}

export function useDuelReview(matchId: string | null) {
  return useQuery({ queryKey: duelKeys.review(matchId ?? ""), queryFn: () => api<DuelReview>(`/me/duel/matches/${matchId}/review`), enabled: !!matchId, staleTime: Infinity });
}

/** Arama ekranı yoklaması: kaydı canlı tutar; eşleşince `matched`, süre dolunca `timeout` döner. */
export function useDuelQueue(active: boolean) {
  return useQuery({
    queryKey: duelKeys.queue,
    queryFn: () => api<DuelQueueStatus>("/me/duel/queue"),
    enabled: active,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: (query) => (query.state.data?.status === "searching" || !query.state.data ? 2_500 : false),
  });
}

/** Düello mutasyonları tek yerde; her biri merkezi tazeler (hak, aktif maç, davetler). */
export function useDuelActions() {
  const qc = useQueryClient();
  const refresh = () => void qc.invalidateQueries({ queryKey: duelKeys.hub });
  const post = <T,>(path: string, body?: unknown) => api<T>(path, { method: "POST", body: body ?? {} });
  const opts = { onSettled: refresh };
  return {
    enqueue: useMutation({ mutationFn: (scope: DuelScope) => post<DuelQueueStatus>("/me/duel/queue", scopeBody(scope)), ...opts }),
    cancelQueue: useMutation({ mutationFn: () => api<DuelQueueStatus>("/me/duel/queue", { method: "DELETE" }), ...opts }),
    createCode: useMutation({ mutationFn: (scope: DuelScope) => post<MatchResponse>("/me/duel/code", scopeBody(scope)), ...opts }),
    joinCode: useMutation({ mutationFn: (code: string) => post<MatchResponse>("/me/duel/join", { code }), ...opts }),
    invite: useMutation({
      mutationFn: (v: { toUserId: string; scope: DuelScope }) => post<{ id: string; expiresAt: string }>("/me/duel/invitations", { toUserId: v.toUserId, ...scopeBody(v.scope) }),
      onSettled: () => {
        refresh();
        void qc.invalidateQueries({ queryKey: ["duel", "players"] });
      },
    }),
    respond: useMutation({
      mutationFn: (v: { id: string; accept: boolean }) => post<{ status: "accepted" | "declined"; matchId?: string }>(`/me/duel/invitations/${v.id}/respond`, { accept: v.accept }),
      ...opts,
    }),
    cancelInvite: useMutation({
      mutationFn: (id: string) => api<{ cancelled: boolean }>(`/me/duel/invitations/${id}`, { method: "DELETE" }),
      onSettled: () => {
        refresh();
        void qc.invalidateQueries({ queryKey: ["duel", "players"] });
      },
    }),
    createRoom: useMutation({ mutationFn: (dto: DuelRoomInput) => post<MatchResponse>("/me/duel/rooms", dto), ...opts }),
    updateRoom: useMutation({ mutationFn: (v: { id: string; dto: DuelRoomInput }) => api<MatchResponse>(`/me/duel/rooms/${v.id}`, { method: "PATCH", body: v.dto }) }),
    quickRoom: useMutation({ mutationFn: () => post<MatchResponse>("/me/duel/rooms/quick"), ...opts }),
    joinRoom: useMutation({ mutationFn: (id: string) => post<MatchResponse>(`/me/duel/rooms/${id}/join`), ...opts }),
    ready: useMutation({ mutationFn: (v: { id: string; ready: boolean }) => post<MatchResponse>(`/me/duel/rooms/${v.id}/ready`, { ready: v.ready }) }),
    start: useMutation({ mutationFn: (id: string) => post<MatchResponse>(`/me/duel/rooms/${id}/start`) }),
    kick: useMutation({ mutationFn: (v: { id: string; userId: string }) => post<MatchResponse>(`/me/duel/rooms/${v.id}/kick`, { userId: v.userId }) }),
    inviteToRoom: useMutation({
      mutationFn: (v: { id: string; userId: string }) => post<{ id: string }>(`/me/duel/rooms/${v.id}/invitations`, { userId: v.userId }),
      onSettled: () => void qc.invalidateQueries({ queryKey: ["duel", "players"] }),
    }),
    leave: useMutation({ mutationFn: (id: string) => post<{ left: boolean }>(`/me/duel/matches/${id}/leave`), ...opts }),
    block: useMutation({ mutationFn: (userId: string) => post<{ blocked: boolean }>("/me/duel/blocks", { userId }), onSettled: () => void qc.invalidateQueries({ queryKey: duelKeys.all }) }),
  };
}

/**
 * Düello bu kullanıcıya açık mı? (bayrak + rol; karar sunucuda). Giriş noktaları bununla çizilir;
 * kapalıyken sunucu 404 döner ve giriş hiç görünmez. Tek sefer sorulur, yoklanmaz.
 */
export function useDuelEnabled() {
  const q = useQuery({ queryKey: ["duel", "enabled"] as const, queryFn: () => api<DuelHub>("/me/duel").then(() => true), staleTime: 10 * 60_000, retry: false });
  return q.data === true;
}

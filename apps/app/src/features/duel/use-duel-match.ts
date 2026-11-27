import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { ApiError, NetworkError, api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useNow } from "@/lib/use-now";
import { clockView, mergeOffset, type ClockView } from "./clock";
import { duelKeys } from "./queries";
import type { DuelSnapshot, DuelState } from "./types";

/**
 * Canlı maç kancası (Doc 59).
 *
 * Doğruluk kaynağı HER ZAMAN `GET /me/duel/matches/:id`'dir; Supabase Realtime yalnız hızlandırır.
 * Yayın gelmezse (özel kanal açılamadı, ağ değişti) aynı durum yoklamayla alınır — oyun yayına
 * bağlı değildir. Sıra numarası (`seq`) eski yayını eler.
 *
 * Süre sunucudadır: yerel sayaç yalnız gösterimdir. Yerel saate göre faz bitince durum yeniden
 * istenir; bu istek sunucuda maçı ilerletir (kimse yayın almasa da soru kapanır).
 */

export type DuelConnection = "live" | "polling" | "offline";

type MatchResponse = DuelSnapshot & { myOptionId: string | null };
const LIVE: DuelSnapshot["phase"][] = ["countdown", "question", "reveal"];
const ended = (p: DuelSnapshot["phase"]) => p === "finished" || p === "cancelled";

export function useDuelMatch(matchId: string | null) {
  const qc = useQueryClient();
  const key = useMemo(() => duelKeys.match(matchId ?? ""), [matchId]);
  const offset = useRef<number | null>(null);
  const [channelUp, setChannelUp] = useState(false);

  /** Yeni anlık görüntüyü eskisiyle birleştirir: eski `seq` atılır, saat farkı en iyi örnekte kalır. */
  const merge = useCallback((old: DuelState | undefined, next: DuelSnapshot, mine?: string | null): DuelState => {
    if (old && next.seq < old.seq) return old;
    offset.current = mergeOffset(offset.current, next.serverNow, Date.now());
    const sameQuestion = old && old.phase === "question" && next.phase === "question" && old.index === next.index;
    return { ...next, myOptionId: mine !== undefined ? mine : sameQuestion ? old.myOptionId : null, offsetMs: offset.current };
  }, []);

  const query = useQuery<DuelState>({
    queryKey: key,
    enabled: !!matchId,
    staleTime: 0,
    queryFn: async () => {
      const res = await api<MatchResponse>(`/me/duel/matches/${matchId}`);
      return merge(qc.getQueryData<DuelState>(key), res, res.myOptionId);
    },
    // Yayın açıkken seyrek güvence yoklaması; kapalıyken oyunu yoklama taşır.
    refetchInterval: (q) => {
      const s = q.state.data;
      if (!s) return 2_000;
      if (ended(s.phase)) return false;
      if (s.phase === "lobby") return channelUp ? 6_000 : 2_000;
      return channelUp ? 4_000 : 1_200;
    },
    retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 3,
  });
  const state = query.data;

  // Realtime: özel kanal (yalnız bu maçın oyuncusu abone olabilir — RLS, sunucuda).
  useEffect(() => {
    if (!matchId) return;
    let active = true;
    void supabase.realtime.setAuth();
    const channel = supabase
      .channel(`duel:${matchId}`, { config: { private: true } })
      .on("broadcast", { event: "state" }, ({ payload }) => {
        if (!active || !payload || (payload as DuelSnapshot).matchId !== matchId) return;
        qc.setQueryData<DuelState>(key, (old) => merge(old, payload as DuelSnapshot));
      })
      .subscribe((status) => {
        if (active) setChannelUp(status === "SUBSCRIBED");
      });
    return () => {
      active = false;
      setChannelUp(false);
      void supabase.removeChannel(channel);
    };
  }, [matchId, key, merge, qc]);

  // Yerel saate göre faz bitti: sunucudan yeni durumu iste (sunucu maçı ilerletir).
  const refetch = query.refetch;
  useEffect(() => {
    if (!state || !LIVE.includes(state.phase) || !state.phaseEndsAt) return;
    const wait = Date.parse(state.phaseEndsAt) - (Date.now() + state.offsetMs) + (state.phase === "question" ? 550 : 60);
    const t = setTimeout(() => void refetch(), Math.max(0, wait));
    return () => clearTimeout(t);
  }, [state, refetch]);

  // Uygulama ön plana dönünce hemen tazele (arka planda geçen sorular sunucuda işlendi).
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") {
        void supabase.realtime.setAuth();
        void refetch();
      }
    });
    return () => sub.remove();
  }, [refetch]);

  const answer = useMutation({
    mutationFn: (v: { index: number; optionId: string }) => api<MatchResponse>(`/me/duel/matches/${matchId}/answers`, { method: "POST", body: v }),
    onMutate: (v) => {
      // Seçim anında kilitlenir; sunucu reddederse geri alınır.
      const before = qc.getQueryData<DuelState>(key);
      if (before && before.phase === "question" && before.index === v.index) qc.setQueryData<DuelState>(key, { ...before, myOptionId: v.optionId });
      return { before };
    },
    onSuccess: (res) => qc.setQueryData<DuelState>(key, (old) => merge(old, res, res.myOptionId)),
    onError: (_e, v, ctx) => {
      const now = qc.getQueryData<DuelState>(key);
      if (ctx?.before && now && now.phase === "question" && now.index === v.index) qc.setQueryData<DuelState>(key, { ...now, myOptionId: ctx.before.myOptionId });
      void refetch();
    },
  });

  const offline = query.isError && query.error instanceof NetworkError;
  const connection: DuelConnection = offline ? "offline" : channelUp ? "live" : "polling";
  const gone = query.isError && query.error instanceof ApiError && (query.error.status === 403 || query.error.status === 404);

  return { state, isLoading: query.isLoading, connection, gone, error: query.error, refetch, answer };
}

/** Sunucu saatine göre akan sayaç; yalnız süre işleyen fazlarda 100 ms'de bir yenilenir. */
export function useDuelClock(state: Pick<DuelState, "phase" | "phaseStartedAt" | "phaseEndsAt" | "offsetMs"> | undefined): ClockView {
  const running = !!state && LIVE.includes(state.phase);
  const now = useNow(100, running);
  return useMemo(
    () => (state ? clockView(state, now) : { remainingMs: 0, seconds: 0, fraction: 0, urgent: false, expired: false }),
    [state, now],
  );
}

export type DuelInboxEvent = { event: "matched"; matchId: string } | { event: "invite" | "invite_declined" | "invite_cancelled" | "invite_accepted" | "kicked" };

/**
 * Kişisel kanal: eşleşme bulundu, davet geldi/yanıtlandı. Yalnız haber verir; içerik merkezden
 * (GET /me/duel) okunur. Kanal açılamazsa merkez zaten yarım dakikada bir yenilenir.
 */
export function useDuelInbox(userId: string | null | undefined, onEvent?: (e: DuelInboxEvent) => void) {
  const qc = useQueryClient();
  const handler = useRef(onEvent);
  useEffect(() => {
    handler.current = onEvent;
  }, [onEvent]);
  useEffect(() => {
    if (!userId) return;
    void supabase.realtime.setAuth();
    const channel = supabase.channel(`duel-user:${userId}`, { config: { private: true } });
    for (const event of ["matched", "invite", "invite_declined", "invite_cancelled", "invite_accepted", "kicked"] as const) {
      channel.on("broadcast", { event }, ({ payload }) => {
        void qc.invalidateQueries({ queryKey: duelKeys.hub });
        void qc.invalidateQueries({ queryKey: duelKeys.queue });
        if (event === "matched") handler.current?.({ event, matchId: String((payload as { matchId?: string })?.matchId ?? "") });
        else handler.current?.({ event });
      });
    }
    channel.subscribe();
    return () => void supabase.removeChannel(channel);
  }, [userId, qc]);
}

/** Düello (Doc 59) — sunucu sözleşmesi (apps/api/src/modules/duel). İstemci kural bilmez. */

export type DuelPhase = "lobby" | "countdown" | "question" | "reveal" | "finished" | "cancelled";
export type DuelKind = "duel" | "room";
export type DuelScopeKind = "mixed" | "course" | "topic";
export interface DuelScope {
  kind: DuelScopeKind;
  id: string | null;
}

export interface DuelPlayer {
  userId: string;
  name: string;
  avatarUrl: string | null;
  isHost: boolean;
  isReady: boolean;
  /** Maçtan ayrıldı (bağlantı kopması değil). */
  left: boolean;
  /** Yalnız kapanmış soruların toplamı. */
  score: number;
  correctCount: number;
  /** Açık soruyu cevapladı mı? Hangi şık olduğu kapanışa kadar gelmez. */
  answered: boolean;
  placement: number | null;
  outcome: "win" | "loss" | "draw" | null;
  xp: number | null;
  ratingDelta: number | null;
  wrongCount: number;
  blankCount: number;
  avgAnswerMs: number | null;
}

export interface DuelQuestion {
  index: number;
  stem: string;
  mediaUrl: string | null;
  options: { id: string; label: string; text: string }[];
}

export interface DuelReveal {
  correctOptionId: string;
  results: { userId: string; optionId: string | null; isCorrect: boolean; points: number }[];
}

/** Herkese aynı giden anlık görüntü (GET cevabı ve Realtime yayını). */
export interface DuelSnapshot {
  matchId: string;
  kind: DuelKind;
  phase: DuelPhase;
  seq: number;
  serverNow: string;
  phaseStartedAt: string | null;
  phaseEndsAt: string | null;
  index: number;
  questionCount: number;
  secondsPerQuestion: number;
  maxPlayers: number;
  name: string | null;
  isPublic: boolean;
  code: string | null;
  codeExpiresAt: string | null;
  scope: DuelScope;
  players: DuelPlayer[];
  question: DuelQuestion | null;
  reveal: DuelReveal | null;
}

/** İstemcideki maç durumu: anlık görüntü + benim seçimim + sunucu saat farkı. */
export interface DuelState extends DuelSnapshot {
  myOptionId: string | null;
  /** sunucu − cihaz (ms); sayaçlar bununla sunucu saatine göre çizilir. */
  offsetMs: number;
}

export interface DuelInvitation {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  scope: DuelScope;
  roomId: string | null;
  expiresAt: string;
}

export interface DuelStats {
  duels: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number | null;
  currentStreak: number;
  bestStreak: number;
  rating: number;
  rooms: number;
  roomWins: number;
  roomRating: number;
  correctTotal: number;
  avgAnswerMs: number | null;
  xpEarned: number;
}

export interface DuelHub {
  daily: { limit: number; used: number; remaining: number | null; isPremium: boolean };
  activeMatchId: string | null;
  invitations: { incoming: DuelInvitation[]; outgoing: DuelInvitation[] };
  stats: DuelStats;
  rules: {
    duel: { questionCount: number; secondsPerQuestion: number; players: number };
    room: { minPlayers: number; maxPlayers: number; questionCounts: number[]; secondsOptions: number[] };
    searchTimeoutMs: number;
  };
}

export type DuelQueueStatus =
  | { status: "idle" }
  | { status: "timeout" }
  | { status: "matched"; matchId: string }
  | { status: "searching"; since: string; timeoutAt: string };

export interface DuelPlayerRow {
  userId: string;
  name: string;
  avatarUrl: string | null;
  online: boolean;
  inMatch: boolean;
  invited: boolean;
  rating: number;
  winRate: number | null;
}

export interface DuelOpenRoom {
  matchId: string;
  name: string;
  players: number;
  maxPlayers: number;
  scopeLabel: string;
  questionCount: number;
  secondsPerQuestion: number;
}

export interface DuelLeaderboardRow {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  isMe: boolean;
  points: number;
  wins: number;
  played: number;
  winRate: number | null;
}

export interface DuelLeaderboard {
  mode: "duel" | "room";
  period: "week" | "month" | "all";
  scope: "module" | "all";
  pointsLabel: string;
  total: number;
  top: DuelLeaderboardRow[];
  me: DuelLeaderboardRow | null;
  nextLine: string;
}

export interface DuelReviewItem {
  index: number;
  stem: string;
  mediaUrl: string | null;
  options: { id: string; label: string; text: string }[];
  correctOptionId: string;
  myOptionId: string | null;
  myElapsedMs: number | null;
  explanation: string | null;
  relatedArticleRef: { lawSlug: string; no: string; slug: string; label: string; legislationSlug: string | null } | null;
}

export interface DuelReview {
  matchId: string;
  questionCount: number;
  wrongCount: number;
  items: DuelReviewItem[];
}

export interface DuelRoomInput {
  name?: string;
  isPublic?: boolean;
  scopeKind?: DuelScopeKind;
  scopeId?: string;
  questionCount?: number;
  secondsPerQuestion?: number;
  maxPlayers?: number;
}

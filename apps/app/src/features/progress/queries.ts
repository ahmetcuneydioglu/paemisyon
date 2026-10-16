import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Performans (progress.controller). Hepsi girişli, premium kapısı yok. `history.score` sunucudan
 * STRING gelir (Decimal); burada sayıya çevrilir. Eşikler ("yeterli veri yok") istemcide yalnız
 * gösterim içindir; yorum cümlesi üretilmez (F8).
 */
export interface ProgressSummary {
  totalSolved: number;
  totalCorrect: number;
  totalSessions: number;
  accuracy: number;
  currentStreak: number;
  longestStreak: number;
}
export interface TopicProgress {
  topicId: string;
  topicName: string;
  courseName: string;
  solvedCount: number;
  correctCount: number;
  mastery: number;
}
export interface ActivityDay {
  date: string;
  questionsAnswered: number;
}
export interface HistoryItem {
  id: string;
  mode: "practice" | "exam" | "daily" | "review" | "deneme";
  topicId: string | null;
  topicIds: string[];
  totalQuestions: number;
  correctCount: number;
  score: number | null;
  completedAt: string | null;
}
export type LeaderboardPeriod = "today" | "week" | "month" | "all";
export interface LeaderboardRow {
  rank: number;
  isMe: boolean;
  displayName: string;
  avatarUrl: string | null;
  points: number;
  xp: number;
  level: number;
  rankName: string;
  correct: number;
  accuracy: number;
  sessions: number;
  badges: number;
  lastActive: string | null;
}
export interface Leaderboard {
  period: LeaderboardPeriod;
  stats: { totalUsers: number; todayQuizCount: number; totalXp: number; todaysLeader: string | null };
  top: LeaderboardRow[];
  me: LeaderboardRow & { pointsToNext: number | null; nextName: string | null };
}

export const progressKeys = {
  summary: ["progress", "summary"] as const,
  topics: ["progress", "topics"] as const,
  activity: (days: number) => ["progress", "activity", days] as const,
  history: ["progress", "history"] as const,
  leaderboard: (p: LeaderboardPeriod) => ["progress", "leaderboard", p] as const,
};

export function useProgressSummary() {
  return useQuery({ queryKey: progressKeys.summary, queryFn: () => api<ProgressSummary>("/progress/summary") });
}
export function useTopicProgress() {
  return useQuery({ queryKey: progressKeys.topics, queryFn: () => api<TopicProgress[]>("/progress/topics") });
}
export function useActivity(days: number) {
  return useQuery({ queryKey: progressKeys.activity(days), queryFn: () => api<ActivityDay[]>(`/progress/activity?days=${days}`) });
}
export function useHistory() {
  return useQuery({
    queryKey: progressKeys.history,
    queryFn: () => api<(Omit<HistoryItem, "score"> & { score: string | number | null })[]>("/progress/history"),
    select: (rows): HistoryItem[] => rows.map((r) => ({ ...r, score: r.score == null ? null : Number(r.score) })),
  });
}
export function useLeaderboard(period: LeaderboardPeriod) {
  return useQuery({ queryKey: progressKeys.leaderboard(period), queryFn: () => api<Leaderboard>(`/progress/leaderboard?period=${period}`), staleTime: 60_000 });
}

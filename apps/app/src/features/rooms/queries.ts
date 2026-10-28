import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/** Ders/konu odası (Doc 49/14; API rooms.service.ts). Tonlar ve cümleler sunucudan. */
export type Band = "new" | "sparse" | "weak" | "normal" | "strong";

export interface RoomTopic {
  id: string;
  name: string;
  solved: number;
  accuracyPct: number | null;
  band: Band;
  inPlanThisWeek: boolean;
  isPremium: boolean;
  /** Kilit kararı sunucuda: premium içerik && kullanıcı premium değil. */
  locked: boolean;
  isLaw: boolean;
  lawSlug: string | null;
  children: Omit<RoomTopic, "children">[];
}

export interface CourseRoom {
  course: { id: string; name: string; icon: string | null };
  summary: {
    solved: number;
    correct: number;
    accuracyPct: number | null;
    band: Band;
    examWeightPercent: number | null;
    weakest: { topicId: string; name: string; accuracyPct: number | null } | null;
  };
  coach: string | null;
  topics: RoomTopic[];
  tools: {
    wrongCount: number;
    favoriteCount: number;
    legislation: { slug: string; name: string; articleCount: number }[];
  };
}

export interface TopicRoom {
  topic: { id: string; name: string; courseId: string; courseName: string; isPremium: boolean; locked: boolean };
  summary: { solved: number; correct: number; accuracyPct: number | null; band: Band; inPlanThisWeek: boolean; planRemainingMinutes: number | null };
  coach: string | null;
  wrongCount: number;
  favoriteCount: number;
  legislation: { slug: string | null; name: string | null; articleCount: number; articleRange: string | null } | null;
}

export const roomKeys = {
  course: (id: string | null) => ["rooms", "course", id] as const,
  topic: (id: string | null) => ["rooms", "topic", id] as const,
};

export function useCourseRoom(courseId: string | null) {
  return useQuery({ queryKey: roomKeys.course(courseId), queryFn: () => api<CourseRoom>(`/me/course-room/${courseId}`), enabled: Boolean(courseId) });
}

export function useTopicRoom(topicId: string | null) {
  return useQuery({ queryKey: roomKeys.topic(topicId), queryFn: () => api<TopicRoom>(`/me/topic-room/${topicId}`), enabled: Boolean(topicId) });
}

/** Yüzde metni tonu — band sunucudan; istemci eşik bilmez. */
export function bandTone(b: Band): "accentInk" | "success" | "ink" | "subtle" {
  return b === "weak" ? "accentInk" : b === "strong" ? "success" : b === "new" || b === "sparse" ? "subtle" : "ink";
}

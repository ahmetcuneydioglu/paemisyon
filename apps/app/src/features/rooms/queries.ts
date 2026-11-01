import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/** Çalış ana ekranı, ders/konu odası (Doc 49/14, 49/17; API rooms.service.ts). Tonlar ve cümleler sunucudan. */
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
  wrongCount: number;
  favoriteCount: number;
  /** Yayındaki ünite özetleri; tek ünite varsa `firstSlug` doğrudan açılır. */
  units: { count: number; read: number; firstSlug: string | null };
  /** "24 soru · 4 ünite özeti · 6 yanlış" — sunucu kurar. */
  note: string;
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
    summaryUnitCount: number;
    /** Ders testleri (Doc 49/18): seçim sayfasının alt yazısı. */
    tests: { count: number; completed: number; inProgressNumber: number | null };
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

export interface StudyCourse {
  id: string;
  name: string;
  icon: string | null;
  weightPercent: number;
  solved: number;
  accuracyPct: number | null;
  band: Band;
  wrongCount: number;
  favoriteCount: number;
  summaryUnitCount: number;
  /** Kartın tek künyesi ("18 yanlış", "Sınavda %30"…) — sunucu seçer. */
  note: string;
}

export interface StudyHub {
  module: { id: string; name: string } | null;
  /** Taze yarım tur; yoksa şerit çizilmez. */
  resume: { sessionId: string; scopeName: string; answered: number; total: number; detail: string } | null;
  /** Ağırlığa göre sıralı. */
  courses: StudyCourse[];
  totals: { wrongCount: number; favoriteCount: number };
}

export type TestState = "done" | "progress" | "new" | "locked";

export interface CourseTestCard {
  id: string;
  number: number;
  questionCount: number;
  state: TestState;
  /** Tamamlandıysa en iyi yüzde. */
  pct: number | null;
  /** Yarım testte cevap sayısı ve oturum. */
  answered: number | null;
  sessionId: string | null;
}

/** Ders testleri (Doc 49/18; API course-tests.service.ts). Durum, kilit ve bölümleme sunucudan. */
export interface CourseTests {
  course: { id: string; name: string };
  totalQuestions: number;
  seenQuestions: number;
  testCount: number;
  completedTests: number;
  /** Ücretsiz planda kilitli test sayısı (0 = premium). */
  lockedTests: number;
  next: { testId: string; number: number; heading: string | null; answered: number; total: number; sessionId: string | null } | null;
  sections: { heading: string; from: number; to: number; tests: CourseTestCard[] }[];
}

export const roomKeys = {
  all: ["rooms"] as const,
  study: ["rooms", "study"] as const,
  course: (id: string | null) => ["rooms", "course", id] as const,
  tests: (courseId: string | null) => ["rooms", "tests", courseId] as const,
  topic: (id: string | null) => ["rooms", "topic", id] as const,
};

export function useStudyHub(enabled = true) {
  return useQuery({ queryKey: roomKeys.study, queryFn: () => api<StudyHub>("/me/study"), enabled });
}

export function useCourseRoom(courseId: string | null) {
  return useQuery({ queryKey: roomKeys.course(courseId), queryFn: () => api<CourseRoom>(`/me/course-room/${courseId}`), enabled: Boolean(courseId) });
}

export function useCourseTests(courseId: string | null) {
  return useQuery({ queryKey: roomKeys.tests(courseId), queryFn: () => api<CourseTests>(`/me/course-tests/${courseId}`), enabled: Boolean(courseId) });
}

export function useTopicRoom(topicId: string | null) {
  return useQuery({ queryKey: roomKeys.topic(topicId), queryFn: () => api<TopicRoom>(`/me/topic-room/${topicId}`), enabled: Boolean(topicId) });
}

/** Yüzde metni tonu — band sunucudan; istemci eşik bilmez. */
export function bandTone(b: Band): "accentInk" | "success" | "ink" | "subtle" {
  return b === "weak" ? "accentInk" : b === "strong" ? "success" : b === "new" || b === "sparse" ? "subtle" : "ink";
}

/** Çubuk tonu — band sunucudan: zayıf mercan, güçlü yeşil, diğerleri altın. */
export function bandBarTone(b: Band): "danger" | "success" | "accent" {
  return b === "weak" ? "danger" : b === "strong" ? "success" : "accent";
}

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/** Çalış ana ekranı, ders/konu odası (Doc 49/14, 49/17; API rooms.service.ts). Tonlar ve cümleler sunucudan. */
export type Band = "new" | "sparse" | "weak" | "normal" | "strong";

/** Bilgi kartları (Doc 56): oda yanıtındaki sayım; bayrak kapalı ya da kart yoksa null (satır çizilmez). */
export interface FlashcardRoomCounts {
  count: number;
  due: number;
  learned: number;
  /** Kilitli (premium) kart; sayıma girmez. */
  locked: number;
}

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
  /** Yayındaki konu anlatımı dersleri (Doc 57); üniteden bağımsız. Eski sunucuda alan yok. */
  lessons?: { count: number; read: number };
  /** Bilgi kartları (Doc 56); eski sunucuda alan yok. */
  flashcards?: FlashcardRoomCounts | null;
  /** "24 soru · 4 ünite özeti · 6 yanlış" — sunucu kurar. */
  note: string;
  children: Omit<RoomTopic, "children">[];
}

/**
 * Konunun okunacak içeriği: ünite özeti YA DA konu anlatımı dersi. İkisi ayrı yayınlanır; yalnız
 * üniteye bakmak, özeti henüz yayınlanmamış derste dersleri erişilmez bırakıyordu (Ceza Muhakemesi).
 */
type OkunurKonu = Pick<RoomTopic, "units" | "lessons">;
export const topicLessonCount = (t: OkunurKonu) => t.lessons?.count ?? 0;
export const topicHasReading = (t: OkunurKonu) => t.units.count > 0 || topicLessonCount(t) > 0;
/** "6 ders · 4 ünite · 3 okundu" — yalnız var olanlar yazılır. */
export const topicReadingNote = (t: OkunurKonu) => {
  const ders = topicLessonCount(t);
  const okundu = t.units.read + (t.lessons?.read ?? 0);
  return [ders > 0 ? `${ders} ders` : null, t.units.count > 0 ? `${t.units.count} ünite` : null, okundu > 0 ? `${okundu} okundu` : null].filter(Boolean).join(" · ");
};

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
    /** Yayındaki konu anlatımı dersi sayısı (Doc 57); eski sunucuda alan yok. */
    lessonCount?: number;
    /** Bilgi kartları (Doc 56); eski sunucuda alan yok. */
    flashcards?: FlashcardRoomCounts | null;
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
  /** Bilgi kartları (Doc 56); eski sunucuda alan yok. */
  flashcards?: FlashcardRoomCounts | null;
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
  /** Kartın tek künyesi ("18 yanlış", "Sınav ağırlığı %30"…) — sunucu seçer. */
  note: string;
}

export interface StudyHub {
  module: { id: string; name: string } | null;
  /** Taze yarım tur; yoksa şerit çizilmez. */
  resume: { sessionId: string; scopeName: string; answered: number; total: number; detail: string } | null;
  /** Ağırlığa göre sıralı. */
  courses: StudyCourse[];
  totals: { wrongCount: number; favoriteCount: number; /** Vadesi gelen açık kart (Doc 56); bayrak kapalı ya da eski sunucuda yok. */ flashcardsDue?: number | null };
}

export type TestState = "done" | "progress" | "new" | "locked";

export interface CourseTestCard {
  id: string;
  number: number;
  questionCount: number;
  state: TestState;
  /** Tamamlandıysa en iyi denemenin yüzdesi, doğru ve yanlış sayısı. */
  pct: number | null;
  correct: number | null;
  wrong: number | null;
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

/** Test sonucu bağlamı (Doc 49/18 §8): öncelik ve cümle sunucudan; testten açılmayan turda null. */
export interface TestResultContext {
  kind: "course_test";
  test: { id: string; number: number };
  course: { id: string; name: string };
  previousPct: number | null;
  completedTests: number;
  testCount: number;
  lockedTests: number;
  next: { testId: string; number: number; questionCount: number; locked: boolean; cta: string } | null;
  primary: "next" | "wrongs" | "review";
  note: string;
}

export const roomKeys = {
  all: ["rooms"] as const,
  study: ["rooms", "study"] as const,
  course: (id: string | null) => ["rooms", "course", id] as const,
  tests: (courseId: string | null) => ["rooms", "tests", courseId] as const,
  testResult: (sessionId: string | null) => ["rooms", "test-result", sessionId] as const,
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

export function useTestResult(sessionId: string | null, enabled = true) {
  return useQuery({
    queryKey: roomKeys.testResult(sessionId),
    queryFn: () => api<TestResultContext | null>(`/me/course-tests/sessions/${sessionId}/result`),
    enabled: Boolean(sessionId) && enabled,
  });
}

export function useTopicRoom(topicId: string | null) {
  return useQuery({ queryKey: roomKeys.topic(topicId), queryFn: () => api<TopicRoom>(`/me/topic-room/${topicId}`), enabled: Boolean(topicId) });
}

/** Yüzde metni tonu — band sunucudan; istemci eşik bilmez. */
/**
 * Hâkimiyet renk kuralı — metin ve çubuk AYNI tonda (13 Kas 2026: konu satırında yüzde altın,
 * çubuk mercan çiziliyordu; ders kartı ise yüzdeyi mercan yazıyordu). Band sunucudan:
 * zayıf mercan, güçlü yeşil, orta altın; yeni/az veri sönük (tek soruda "%100" vurgulanmaz).
 */
export function bandTone(b: Band): "danger" | "success" | "accentInk" | "subtle" {
  return b === "weak" ? "danger" : b === "strong" ? "success" : b === "new" || b === "sparse" ? "subtle" : "accentInk";
}

/** Çubuk tonu — `bandTone` ile aynı aile; az veri/yeni için `null` (çubuk sönük çizilir). */
export function bandBarTone(b: Band): "danger" | "success" | "accent" | null {
  return b === "weak" ? "danger" : b === "strong" ? "success" : b === "new" || b === "sparse" ? null : "accent";
}

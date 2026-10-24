// /api/v1/exams yanıt tipleri (Doc 18 §7 → Doc 50 §3) — backend ile elle hizalı.

export type ExamState = "upcoming" | "active" | "ended";
/** Doc 50: yayın modu ve durum eksenleri. */
export type ExamPublishMode = "serbest" | "takvimli";
export type ExamAvailability = "upcoming" | "open" | "closed";
export type MyExamState = "new" | "in_progress" | "completed";
export type AttemptRole = "official" | "practice";
export type ExamDifficulty = "kolay" | "orta" | "zor";

export interface ReviewOption {
  id: string;
  label: string;
  text: string;
  isCorrect?: boolean;
}
export interface ReviewQuestion {
  order: number;
  questionId: string;
  versionId: string;
  stem: string;
  mediaUrl: string | null;
  explanation?: string | null;
  /** Soru kaynağı — panel ayarı kapalıysa sunucu null gönderir. */
  source?: string | null;
  options: ReviewOption[];
  selectedOptionId?: string | null;
  /** "Emin değilim" bayrağı — sunucuda kalıcı (Doc 49 S1-C). */
  flagged?: boolean;
  /** Soru iptali (Doc 50): herkese doğru sayıldı / hesaptan çıkarıldı. */
  adjustment?: "credit_all" | "exclude" | null;
}
export interface CourseBreakdownRow {
  sectionId: string | null;
  name: string;
  total: number;
  correct: number;
  wrong: number;
  blank: number;
}
export interface AttemptResult {
  attemptId: string;
  /** Eski alan: sıralamaya girmeyen çözüm (tekrar çözüm, çıkmış sınav). */
  isArchive?: boolean;
  isPersonal?: boolean;
  role: AttemptRole;
  publishMode: ExamPublishMode | null;
  personal: boolean;
  closedReason: "submitted" | "timeout" | null;
  exam: { id: string; title: string; startAt: string; durationMinutes: number };
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  totalQuestions: number;
  /** Takvimli resmî çözüm: pencere kapanana kadar kilitli (Doc 50 M4-d). */
  resultLocked: boolean;
  resultAt: string | null;
  answeredCount?: number;
  correctCount: number | null;
  wrongCount: number | null;
  blankCount: number | null;
  score: number | null;
  rank: {
    available: boolean;
    rank: number | null;
    total: number;
    percentile: number | null;
    reason?: string;
  } | null;
  courses: CourseBreakdownRow[];
  turkey: {
    locked: boolean;
    sample: number;
    minSample: number;
    mean: number | null;
    median: number | null;
    diff: number | null;
  } | null;
  weakTopics: {
    topicId: string;
    topicName: string;
    correct: number;
    wrong: number;
    blank: number;
    total: number;
  }[];
  scoreUpdate: { from: number; to: number; at: string } | null;
  /** Süre yönetimi şeridi (wireframe 11): soru sırasına göre harcanan süre. */
  timing: {
    order: number;
    timeSpentMs: number | null;
    status: "correct" | "wrong" | "blank";
  }[];
  /** Konu kırılımı — en çok kaybettiren üstte. */
  topicBreakdown: {
    topicId: string;
    topicName: string;
    correct: number;
    wrong: number;
    blank: number;
    total: number;
  }[];
  review: ReviewQuestion[];
}
/** GET /exams/attempts/:id/review (Doc 50 M5). */
export interface AttemptReview {
  attemptId: string;
  locked: boolean;
  majorityMissed: number | null;
  items: {
    no: number;
    questionId: string;
    course: string | null;
    topic: string | null;
    status: "correct" | "wrong" | "blank";
    flagged: boolean;
    selectedOptionId: string | null;
    correctOptionId: string | null;
    seconds: number | null;
    turkeyRate: number | null;
    avgSeconds: number | null;
    missedMajority: boolean;
    adjustment: "credit_all" | "exclude" | null;
  }[];
}
export interface RankRow {
  rank: number;
  /** Kısaltılmış ad ("Ahmet C.") — 24 Eki 2026 kararı. */
  name?: string;
  displayName: string;
  correctCount: number | null;
  wrongCount: number;
  blankCount: number | null;
  score: number;
  durationSeconds: number | null;
  isMe: boolean;
  percentile?: number;
}
export interface Leaderboard {
  available: boolean;
  reason?: "result_pending" | "min_sample";
  endAt: string;
  frozenAt?: string | null;
  participantCount?: number;
  minSample?: number;
  top: RankRow[];
  me: RankRow | null;
}
export interface GlobalRankRow {
  rank: number;
  displayName: string;
  avgScore: number;
  attempts: number;
  totalCorrect: number;
  isMe: boolean;
}
export interface MyAttempt {
  attemptId: string;
  exam: {
    id: string;
    title: string;
    startAt: string;
    durationMinutes: number;
    publishMode?: ExamPublishMode;
  } | null;
  role?: AttemptRole | null;
  status: "in_progress" | "completed" | "abandoned";
  closedReason?: "submitted" | "timeout" | null;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  score: number | null;
  startedAt: string;
  completedAt: string | null;
}
/** GET /exams/history/mine (Doc 50 M8). */
export interface ExamHistoryItem {
  attemptId: string;
  examId: string | null;
  title: string;
  publishMode: ExamPublishMode | null;
  role: AttemptRole | "personal" | null;
  completedAt: string | null;
  closedReason: "submitted" | "timeout" | null;
  resultLocked: boolean;
  resultAt: string | null;
  score: number | null;
  rank: number | null;
  totalQuestions: number;
}
export interface ExamHistory {
  trend: {
    locked: boolean;
    points: { attemptId: string; at: string | null; score: number; title: string }[];
    mean: number | null;
    best: number | null;
    delta: number | null;
  };
  denemeler: ExamHistoryItem[];
  haftalik: ExamHistoryItem[];
  kisisel: ExamHistoryItem[];
}

export interface ExamListItem {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  questionCount: number;
  isPremium: boolean;
  questionsOpenAfterEnd: boolean;
  /** Eski alan: bitince çözülebilir mi (artık practiceAfterEnd). */
  archiveOpenAfterEnd: boolean;
  state: ExamState;
  participantCount: number;
  avgScore: number | null;
  myAttempt: {
    id: string;
    status: "in_progress" | "completed" | "abandoned";
  } | null;
  /** En iyi tekrar çözümüm. */
  myArchiveAttempt: {
    id: string;
    status: "completed";
    correctCount: number;
    wrongCount: number;
    blankCount: number;
    completedAt: string | null;
  } | null;

  // ── Doc 50 alanları ──
  publishMode: ExamPublishMode;
  difficulty: ExamDifficulty | null;
  examTypeId: string | null;
  liveAnswerReveal: boolean;
  practiceAfterEnd: boolean;
  availability: ExamAvailability;
  myState: MyExamState;
  canStartOfficial: boolean;
  canStartPractice: boolean;
  my: {
    official: {
      attemptId: string;
      status: "in_progress" | "completed" | "abandoned";
      resultLocked: boolean;
      score: number | null;
      correct: number | null;
      wrong: number | null;
      blank: number | null;
      rank: number | null;
      total: number;
      completedAt: string | null;
    } | null;
    active: {
      attemptId: string;
      role: AttemptRole | null;
      deadlineAt: string | null;
      answered: number;
    } | null;
    practiceCount: number;
    lastPractice: {
      attemptId: string;
      score: number | null;
      completedAt: string | null;
    } | null;
  };
}
/** GET /exams/:id — liste satırı + kurallar ekranı dağılımı. */
export interface ExamDetail extends ExamListItem {
  distribution: { name: string; count: number; weightPercent: number }[];
}

export interface PublicCatalogModule {
  id: string;
  name: string;
  courses: {
    id: string;
    name: string;
    topics: { id: string; name: string }[];
  }[];
}

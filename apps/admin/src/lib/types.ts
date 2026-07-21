// Admin API yanıt tipleri (Doc 7 §4.10). OpenAPI codegen'e geçilene dek elle hizalı.

export type ContentStatus = 'draft' | 'in_review' | 'published' | 'archived';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DashboardOverview {
  users: { total: number; new7d: number; activeToday: number };
  revenue: { activeSubscriptions: number; premiumUsers: number };
  content: { questionVersions: Partial<Record<ContentStatus, number>>; pendingReview: number };
  recentActivity: {
    id: string;
    actorEmail: string;
    action: string;
    entityType: string;
    entityId: string | null;
    createdAt: string;
  }[];
}

export interface CatalogTopic {
  id: string;
  name: string;
  sortOrder: number;
  isPremium: boolean;
  matchKeywords: string[];
  questionCount: number;
}
export interface CatalogCourse {
  id: string;
  name: string;
  sortOrder: number;
  topics: CatalogTopic[];
}
export interface CatalogModule {
  id: string;
  key: string;
  name: string;
  isActive: boolean;
  courses: CatalogCourse[];
}

// ── Müfredat yönetim ağacı (Doc 21) ──
export interface CurriculumTopic {
  id: string;
  name: string;
  sortOrder: number;
  isPremium: boolean;
  matchKeywords: string[];
  questionCount: number;
  children: CurriculumTopic[];
}
export interface CurriculumCourse {
  id: string;
  name: string;
  questionCount: number;
  usedByExamTypeIds: string[];
  topics: CurriculumTopic[];
}
export interface CurriculumSection {
  id: string;
  name: string;
  weightPercent: number;
  sortOrder: number;
  courses: CurriculumCourse[];
}
export interface CurriculumExamType {
  id: string;
  key: string;
  name: string;
  isActive: boolean;
  sections: CurriculumSection[];
  weightTotal: number;
}
export interface Curriculum {
  examTypes: CurriculumExamType[];
  coursePool: CurriculumCourse[];
}

export interface QuestionListItem {
  id: string;
  topicId: string;
  topicName: string;
  courseName: string;
  latestVersion: { versionNo: number; stem: string; status: ContentStatus; createdAt: string } | null;
  publishedVersionNo: number | null;
  createdAt: string;
}
export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface QuestionOption {
  id?: string;
  label: string;
  text: string;
  isCorrect: boolean;
  sortOrder?: number;
}
export interface QuestionVersion {
  id: string;
  versionNo: number;
  stem: string;
  explanation: string | null;
  difficulty: Difficulty;
  status: ContentStatus;
  createdAt: string;
  publishedAt: string | null;
  options: QuestionOption[];
}
export interface QuestionDetail {
  id: string;
  topicId: string;
  /** Madde Atlası (Doc 25 §4): "16", "4/A", "Ek 6"… */
  articleNo: string | null;
  currentVersionId: string | null;
  topic: { id: string; name: string; course: { id: string; name: string } };
  versions: QuestionVersion[];
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  status: 'active' | 'suspended' | 'deleted';
  roles: string[];
  /** Premium GERÇEKTEN aktif mi — süre kontrolü dahil, sunucuda hesaplanır. */
  isPremium: boolean;
  validUntil: string | null;
  /** Premium verilmiş ama süresi dolmuş (yenileme adayı). */
  premiumExpired: boolean;
  createdAt: string;
}

export interface AdminExamListItem {
  id: string;
  title: string;
  startAt: string;
  durationMinutes: number;
  isPremium: boolean;
  status: ContentStatus;
  questionCount: number;
  attemptCount: number;
}

export interface AdminExamQuestion {
  order: number;
  questionId: string;
  stem: string;
  pinnedVersionNo: number;
  topicName: string;
  courseName: string;
}

export interface AdminExamDetail {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  durationMinutes: number;
  isPremium: boolean;
  liveAnswerReveal: boolean;
  questionsOpenAfterEnd: boolean;
  status: ContentStatus;
  attemptCount: number;
  questions: AdminExamQuestion[];
}

export interface ExamResults {
  summary: {
    completed: number;
    inProgress: number;
    avgScore: number | null;
    maxScore: number | null;
  };
  participants: {
    rank: number;
    displayName: string;
    email: string;
    score: number;
    correctCount: number;
    wrongCount: number;
    blankCount: number;
    durationSeconds: number | null;
    completedAt: string | null;
  }[];
}

export interface AuditEntry {
  id: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string | null;
  detail: unknown;
  createdAt: string;
}

// Admin API yanıt tipleri (Doc 7 §4.10). OpenAPI codegen'e geçilene dek elle hizalı.

export type ContentStatus = 'draft' | 'in_review' | 'published' | 'archived';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DashboardOverview {
  users: { total: number; new7d: number; activeToday: number };
  engagement?: { notifSessions7d: number };
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
  /** Ders ikonu — Lucide anahtarı (Doc 48 Faz 6.3); atanmamışsa null. */
  icon: string | null;
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
  /** Ders ikonu — Lucide anahtarı (Doc 48 Faz 6.3; liste `course-icons.ts`).
   *  Atanmamışsa null: istemci açık kitap çizer. */
  icon: string | null;
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
  /** Resmî sınav tarihi "YYYY-MM-DD" (Doc 48 A2); açıklanmamışsa null. */
  examDate: string | null;
  sections: CurriculumSection[];
  weightTotal: number;
}
export interface Curriculum {
  examTypes: CurriculumExamType[];
  coursePool: CurriculumCourse[];
}

/** Kaynak türü (Doc 49 A0): sunucu sourceLabel'dan türetir, istemci kural bilmez. */
export type SourceKind = 'gercek' | 'turetim' | 'ai' | 'yok';
export const SOURCE_KIND_LABEL: Record<SourceKind, string> = {
  gercek: 'Gerçek kaynak',
  turetim: 'Mevzuat türetimi',
  ai: 'AI üretimi',
  yok: 'Kaynaksız',
};

export interface QuestionListItem {
  id: string;
  topicId: string;
  topicName: string;
  courseName: string;
  latestVersion: {
    versionNo: number;
    stem: string;
    status: ContentStatus;
    createdAt: string;
    sourceLabel: string | null;
    reviewNote: string | null;
  } | null;
  sourceKind: SourceKind;
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
  /** Sorunun şekli/grafiği (Doc 36) — metinle anlaşılmayan sorularda zorunlu. */
  mediaUrl: string | null;
  /** Kaynak etiketi (Doc 49 A0): panelde görünür ve düzenlenir; son kullanıcıya ayrı ayar. */
  sourceLabel: string | null;
  /** Ret notu (Doc 49 A0 / T5): reddedilen sürümün üstünde durur. */
  reviewNote: string | null;
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

/** Çıkmış sınav vitrini (Doc 36). `kind` dürüstlük rozetini belirler:
 *  `resmi` gerçek kitapçık, `analiz` yalnız konu dağılımı. */
export type PastExamKind = 'resmi' | 'analiz';

export interface AdminPastExamListItem {
  id: string;
  slug: string;
  name: string;
  institution: string;
  term: number | null;
  heldOn: string | null;
  kind: PastExamKind;
  status: ContentStatus;
  questionCount: number | null;
  /** Bankaya bağlı soru sayısı (`analiz` türünde 0). */
  linked: number;
  publicCount: number;
  cancelledCount: number;
  /** Yayında ve açıklaması olan soru — public sayfaya çıkmaya hazır. */
  readyCount: number;
  /** Public işaretli ama sürümü yayında olmayan soru: sayfada GÖRÜNMEZ. */
  publicNotLive: number;
}

export interface AdminPastExamQuestion {
  questionId: string;
  orderNo: number;
  cancelled: boolean;
  publicly: boolean;
  course: string;
  topic: string;
  stem: string;
  versionStatus: ContentStatus | null;
  hasExplanation: boolean;
}

/** "Uygulamada çözülebilir mi, değilse neden?" — panelde açıkça yazılır. */
export interface PastExamCozulebilirlik {
  cozulebilir: boolean;
  motoraBaglanabilir: boolean;
  yayindaSoru: number;
  iptalSoru: number;
  engeller: string[];
}

export interface AdminPastExamDetail {
  id: string;
  cozulebilirlik: PastExamCozulebilirlik;
  examId: string | null;
  isPremium: boolean;
  slug: string;
  name: string;
  institution: string;
  term: number | null;
  heldOn: string | null;
  kind: PastExamKind;
  status: ContentStatus;
  summary: string | null;
  questionCount: number | null;
  sortOrder: number;
  analysis: { kaynak?: string; uyari?: string; dersDagilim?: Record<string, number>; kanunDagilim?: Record<string, number> } | null;
  questions: AdminPastExamQuestion[];
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
  archiveOpenAfterEnd: boolean;
  status: ContentStatus;
  attemptCount: number;
  questions: AdminExamQuestion[];
}

/** Yayın öncesi gözden geçirme uçları (/admin/exams/:id/inceleme). */
export type ExamReviewFlag =
  | 'kaynak-yok'
  | 'aciklama-yok'
  | 'daha-once-kullanildi'
  | 'benzer-kok'
  | 'madde-yok'
  | 'sik-bozuk';

export interface ExamReviewQuestion {
  order: number;
  questionId: string;
  versionId: string;
  versionNo: number;
  stem: string;
  mediaUrl: string | null;
  explanation: string | null;
  sourceLabel: string | null;
  articleNo: string | null;
  topicId: string;
  topicName: string;
  courseId: string;
  courseName: string;
  options: { id: string; label: string; text: string; isCorrect: boolean }[];
  usageCount: number;
  lastUsedIn: { title: string; startAt: string } | null;
  bayraklar: ExamReviewFlag[];
}

export interface ExamReview {
  exam: {
    id: string;
    title: string;
    status: ContentStatus;
    startAt: string;
    durationMinutes: number;
  };
  questionCount: number;
  dersDagilimi: { courseName: string; count: number }[];
  questions: ExamReviewQuestion[];
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

/** Plan (fiyat + ücretsiz katmanın günlük soru limiti) — /admin/plans. */
export interface AdminPlan {
  id: string;
  key: string;
  name: string;
  price: number | null;
  currency: string;
  period: string;
  dailyQuestionLimit: number | null;
  storeProductIdIos: string | null;
  storeProductIdAndroid: string | null;
  isActive: boolean;
  subscriptionCount: number;
  /** Günlük limitin yaşadığı satır ('free') — panel bunu vurgular ve korur. */
  limitKaynagi: boolean;
}

/** Limit düşürmenin BUGÜNE etkisi — kaydetmeden önce gösterilir. */
export interface PlanLimitEtkisi {
  yeniLimit: number;
  mevcutLimit: number;
  bugunAktifKullanici: number;
  aninaDuvaraCarpacak: number;
}

/** Gün × kaynak tur sayımı — /admin/metrics/home-v2 (Doc 48 Faz 5). */
export interface HomeV2SourceDay {
  /** Uygulama günü (TR 04.00'te döner), YYYY-MM-DD. */
  day: string;
  /** home_task | home_weak_topic | home_suggestion | notif | diger */
  source: string;
  started: number;
  completed: number;
  abandoned: number;
  inProgress: number;
}

/** Ana sayfa turunun kapsamı — odak türleriyle aynı anahtarlar. */
export type HomeV2Scope = 'coach' | 'course' | 'topic' | 'wrongs';

/** Yeni mobil anasayfa metrikleri (Doc 48 Faz 5) — salt okuma. */
export interface HomeV2Metrics {
  days: number;
  /** Pencerenin ilk uygulama günü, YYYY-MM-DD. */
  from: string;
  daily: HomeV2SourceDay[];
  homeScope: { scope: HomeV2Scope; started: number; completed: number }[];
  focusToday: { kind: string; users: number }[];
  halfTours: { open: number; usersWithMultiple: number; oldestActivityDays: number | null };
  cohort: { flagOn: boolean; betaOrAdminUsers: number };
}

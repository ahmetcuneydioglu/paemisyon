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

export type ExamPublishMode = 'serbest' | 'takvimli';
export type ExamDifficulty = 'kolay' | 'orta' | 'zor';

export interface AdminExamListItem {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  durationMinutes: number;
  publishMode: ExamPublishMode;
  difficulty: ExamDifficulty | null;
  isPremium: boolean;
  liveAnswerReveal: boolean;
  practiceAfterEnd: boolean;
  status: ContentStatus;
  questionCount: number;
  /** Toplam oturum (resmî + tekrar). */
  attemptCount: number;
  /** Resmî tamamlanan çözüm. */
  participantCount: number;
  avgScore: number | null;
  rankingsComputedAt: string | null;
  questionPackBuiltAt: string | null;
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
  endAt: string | null;
  durationMinutes: number;
  publishMode: ExamPublishMode;
  difficulty: ExamDifficulty | null;
  examTypeId: string | null;
  isPremium: boolean;
  liveAnswerReveal: boolean;
  questionsOpenAfterEnd: boolean;
  practiceAfterEnd: boolean;
  /** Eski alan adı — practiceAfterEnd ile aynı. */
  archiveOpenAfterEnd: boolean;
  remindEnabled: boolean;
  rankingsComputedAt: string | null;
  questionPackBuiltAt: string | null;
  status: ContentStatus;
  attemptCount: number;
  questions: AdminExamQuestion[];
}

/** GET /admin/exams/:id/publish-check (Doc 50 A4). */
export interface ExamPublishCheck {
  ok: boolean;
  blockers: string[];
  warnings: string[];
  questionCount: number;
  distribution: { section: string; target: number; count: number }[];
}

/** Otomatik doldurma yanıtı. */
export interface ExamAutofillReport {
  requested: number;
  filled: number;
  breakdown: { section: string; target: number; count: number; available: number }[];
  missing: { section: string; need: number }[];
}

/** GET /admin/exams/:id/stats (Doc 50 istatistik). */
export interface ExamStats {
  exam: {
    id: string;
    title: string;
    publishMode: ExamPublishMode;
    status: ContentStatus;
    rankingsComputedAt: string | null;
  };
  summary: {
    started: number;
    completed: number;
    inProgress: number;
    practice: number;
    timeouts: number;
    meanScore: number | null;
    medianScore: number | null;
    medianDurationSeconds: number | null;
    maxScore: number | null;
  };
  distribution: { from: number; to: number; count: number }[];
  questions: {
    no: number;
    questionId: string;
    stem: string;
    course: string;
    topic: string;
    correctRate: number | null;
    blank: number;
    avgSeconds: number | null;
    optionShare: { optionId: string; label: string; isCorrect: boolean; count: number }[];
    openReports: number;
    keySuspect: boolean;
    adjustment: 'credit_all' | 'exclude' | null;
    attention: boolean;
  }[];
  topRanks: { rank: number; score: number }[];
}

export type ExamAdjustmentAction = 'credit_all' | 'exclude';

export interface ExamAdjustment {
  id: string;
  examId: string;
  questionId: string;
  action: ExamAdjustmentAction;
  reason: string;
  actorId: string;
  createdAt: string;
  revertedAt: string | null;
  stem: string;
}

export interface ExamAdjustmentPreview {
  affected: number;
  up: number;
  down: number;
  same: number;
  avgDelta: number;
  frozen: boolean;
  sentence: string;
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

// ── Konu Özetleri (Doc 53) ──
export type SummaryBlockType = 'concept' | 'rule' | 'numbers' | 'compare' | 'trap' | 'exam_stats' | 'bridge';

export interface SummaryUnitListItem {
  id: string;
  slug: string;
  title: string;
  articleFrom: string;
  articleTo: string;
  /** Açık madde listesi (boşsa aralık) ve gösterim etiketi ("75–86" / "1, 2, 4, 4/A, 5"). */
  articleNos: string[];
  articleLabel: string;
  status: ContentStatus;
  isPremium: boolean;
  readingMinutes: number;
  sortOrder: number;
  version: number;
  sourceLabel: string;
  publishedAt: string | null;
  updatedAt: string;
  topicId: string;
  topicName: string;
  courseName: string;
  legislationName: string;
  legislationSlug: string;
  blocks: number;
  staleBlocks: number;
  generatedBlocks: number;
}

export type SummaryRow = Record<string, unknown> & { refs?: string[] };

export interface SummaryBlockValidation {
  index: number;
  type: string;
  title: string;
  ok: boolean;
  lines: string[];
  issues: string[];
}

export interface SummaryBlockDetail {
  id: string;
  type: SummaryBlockType;
  title: string | null;
  body: string | null;
  rows: SummaryRow[] | null;
  derivedNumbers: { value: number; expr: string; refs: string[]; note?: string }[] | null;
  counterNumbers: number[];
  generated: boolean;
  sortOrder: number;
  status: ContentStatus;
  staleSince: string | null;
  updatedAt: string;
  articleRefs: { no: string; title: string | null; versionNo: number | null }[];
  validation: SummaryBlockValidation;
}

export interface SummaryUnitDetail {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  articleFrom: string;
  articleTo: string;
  articleNos: string[];
  articleLabel: string;
  status: ContentStatus;
  isPremium: boolean;
  readingMinutes: number;
  sortOrder: number;
  version: number;
  sourceLabel: string;
  generatedBy: string | null;
  publishedAt: string | null;
  updatedAt: string;
  topic: { id: string; name: string; courseName: string };
  legislation: { id: string; slug: string; name: string; shortName: string | null };
  blocks: SummaryBlockDetail[];
  articles: { no: string; title: string | null; text: string }[];
  validation: { ok: boolean; fails: number };
}

export interface SummaryStaleItem {
  id: string;
  title: string | null;
  type: SummaryBlockType;
  staleSince: string;
  unit: { id: string; slug: string; title: string };
  articles: { no: string; versionNo: number | null }[];
}

export const SUMMARY_BLOCK_LABEL: Record<SummaryBlockType, string> = {
  concept: 'Kavram',
  rule: 'Kural',
  numbers: 'Sayılar',
  compare: 'Karşılaştırma',
  trap: 'Tuzak',
  exam_stats: 'Sınav der ki',
  bridge: 'Köprü',
};

// ── Madde Özetleri (Doc 54): madde başına 1:1 özet, resmî metnin altında ──
export type VerificationStatus = 'pending_review' | 'verified' | 'needs_refresh';

export interface ArticleSummaryLawRow {
  slug: string;
  name: string;
  shortName: string | null;
  articles: number;
  summarized: number;
  published: number;
  inReview: number;
  stale: number;
}

export interface ArticleSummaryListRow {
  lawArticleId: string;
  no: string;
  articleTitle: string | null;
  questionCount: number;
  textVerifiedAt: string | null;
  summary: {
    id: string;
    title: string;
    status: ContentStatus;
    repealed: boolean;
    staleSince: string | null;
    verificationStatus: VerificationStatus;
    verifiedAt: string | null;
    version: number;
    sourceLabel: string;
    updatedAt: string;
  } | null;
}

export interface ArticleSummaryList {
  law: { id: string; name: string; slug: string };
  articles: ArticleSummaryListRow[];
}

export interface ArticleSummaryStaleItem {
  id: string;
  title: string;
  status: ContentStatus;
  staleSince: string | null;
  articleNo: string;
  law: { slug: string; shortName: string | null; name: string } | null;
}

export interface LabeledValue {
  label: string;
  value: string;
  ref?: string;
}

export interface ArticleSummaryDetail {
  id: string;
  lawArticleId: string;
  repealed: boolean;
  title: string;
  shortSummary: string;
  detailed: string | null;
  keyPoints: string[];
  conditions: string[];
  exceptions: string[];
  timeLimits: LabeledValue[] | null;
  numericalValues: LabeledValue[] | null;
  authorityAndLimits: { authority: string; limit: string; ref?: string }[] | null;
  relatedLegislation: { law: string; article: string | null; note?: string; verified: boolean }[] | null;
  examReminders: string[];
  derivedNumbers: { value: number; expr: string; refs?: string[]; note?: string }[] | null;
  counterNumbers: number[];
  articleVersionNo: number | null;
  staleSince: string | null;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  sourceLabel: string;
  status: ContentStatus;
  version: number;
  generatedBy: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  article: {
    id: string;
    articleNo: string;
    title: string | null;
    text: string;
    lastVerifiedAt: string | null;
    effectiveInfo: string | null;
    sourceUrl: string | null;
    lawSlug: string;
    lawName: string;
  };
  validation: { ok: boolean; issues: string[]; lines: string[] };
}

export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  pending_review: 'İnceleme bekliyor',
  verified: 'Mevzuat doğrulandı',
  needs_refresh: 'Tazeleme gerekli',
};

import { config } from "./config";

/**
 * Public (auth'suz) API çağrısı — SEO katmanı (Doc 23). ISR ile önbelleklenir:
 * sayfalar statik üretilir, `revalidate` süresinde arka planda tazelenir.
 */
export async function publicApi<T>(
  path: string,
  revalidateSeconds = 3600,
): Promise<T> {
  const res = await fetch(`${config.apiBaseUrl}${path}`, {
    next: { revalidate: revalidateSeconds },
  });
  const json = (await res.json().catch(() => null)) as { data?: T } | null;
  if (!res.ok || !json?.data)
    throw new Error(`Public API hatası: ${path} (${res.status})`);
  return json.data;
}

/**
 * Boş dönebilen public liste çağrısı — hatayı SESSİZCE boşluğa çevirmez.
 *
 * `.catch(() => [])` kalıbı bir API kesintisini "içerik yok" sayfasına
 * dönüştürüyor ve ISR o boş sayfayı bir saat önbelleğe alıyor. Ölçülen vaka:
 * dağıtım sırasında API henüz ayağa kalkmamışken üretilen çıkmış sınav
 * vitrini, dört dönem yayındayken "Henüz yayında dönem yok" gösterdi.
 *
 * Çözüm: hata durumunda KISA ömürle yeniden denenir; böylece sayfa dakikalar
 * içinde kendini toplar ve çağıran taraf gerçekten boş mu, erişilemedi mi
 * ayırt edebilir.
 */
export async function publicApiList<T>(
  path: string,
  revalidateSeconds = 3600,
): Promise<{ items: T[]; erisilemedi: boolean }> {
  try {
    return { items: await publicApi<T[]>(path, revalidateSeconds), erisilemedi: false };
  } catch {
    try {
      return { items: await publicApi<T[]>(path, 60), erisilemedi: false };
    } catch {
      return { items: [], erisilemedi: true };
    }
  }
}

// ── Tipler (backend public.service ile birebir) ──
export interface QuestionOfDay {
  date: string;
  topic: string;
  versionId: string;
  stem: string;
  options: { id: string; label: string; text: string }[];
}

export interface DailyQuizQuestion {
  questionId: string;
  versionId: string;
  stem: string;
  topic: string;
  options: { id: string; label: string; text: string }[];
}
export interface DailyQuiz {
  date: string;
  count: number;
  questions: DailyQuizQuestion[];
}

/** Fiyat + ücretsiz limit (/public/pricing) — metinler sayıyı gömmez, buradan okur. */
export interface PublicPlan {
  key: string;
  name: string;
  /** Decimal string, ör. "499.99" */
  price: string;
  currency: string;
  period: string;
}
export interface PublicPricing {
  freeDailyLimit: number;
  plans: PublicPlan[];
}

/** Çıkmış sınav vitrini (Doc 36) — backend cikmis-sinav.service ile birebir. */
export interface CikmisSinavOzet {
  slug: string;
  ad: string;
  kurum: string;
  donem: number | null;
  tarih: string | null;
  /**
   * `resmi` = kurumun yayımladığı gerçek kitapçık; sorular bankada.
   * `analiz` = sınav yayımlanmadı, elimizde yalnız konu dağılımı var.
   * Rozet buradan gelir — ikisi asla aynı görünmez.
   */
  tur: "resmi" | "analiz";
  ozet: string | null;
  soruSayisi: number | null;
  acikSoru: number;
  /** Deneme motorundaki karşılığı; "sınav gibi çöz" bunu kullanır. */
  examId: string | null;
  dersDagilimi: { ders: string; adet: number }[];
}

export interface CikmisSinavSoru {
  sira: number;
  iptal: boolean;
  ders: string;
  konu: string;
  kok: string;
  gorselUrl: string | null;
  siklar: { harf: string; metin: string; dogru: boolean }[];
  aciklama: string | null;
  dayanak: { baslik: string; url: string | null }[];
}

/** Aday hatırlatmasından çıkarılan konu analizi (`analiz` türü sınavlar). */
export interface CikmisSinavAnaliz {
  kaynak: string;
  uyari: string;
  dersDagilim: Record<string, number>;
  kanunDagilim?: Record<string, number>;
}

export interface CikmisSinavDetay extends CikmisSinavOzet {
  analiz: CikmisSinavAnaliz | null;
  sorular: CikmisSinavSoru[];
  kapaliSoru: number;
  iptalSayisi: number;
  /** Yarım kalan sınav — girişli uçta gelir (public uçta yoktur). */
  devamEden?: {
    attemptId: string;
    cevaplanan: number;
    toplamSoru: number;
    kalanSaniye: number | null;
  } | null;
  /** Daha önce çözdüyse EN İYİ sonucu. */
  benimSonucum?: {
    attemptId: string;
    correctCount: number;
    wrongCount: number;
    blankCount: number;
    score: number | null;
    totalQuestions: number;
  } | null;
}

export interface LawSummary {
  slug: string;
  /** Girişli derinlik (Doc 27 W2): atlas + tur başlatma için konu kimliği. */
  topicId: string;
  /** Aynı dersteki mevzuatlardan karışık tur başlatmak için ders kimliği. */
  courseId?: string;
  name: string;
  courseName: string;
  questionCount: number;
  /** Yayınlanmış madde metni var mı — "Kanunu oku" için (Doc 25 §4 okuma katmanı). */
  readable?: boolean;
  exams: ExamContext[];
}

export interface ExamContext {
  examKey: string;
  examName: string;
  sectionName: string;
  weightPercent: number;
}

export interface LawDetail extends LawSummary {
  sampleQuestion: {
    stem: string;
    options: { id: string; label: string; text: string; isCorrect: boolean }[];
    explanation: string | null;
    source: string | null;
  } | null;
  /** Madde Isı Haritası (Doc 25 §4): madde → çıkmış soru sayısı, çoktan aza.
   *  hasText: o maddenin yayınlanmış resmî metni var mı (okuma katmanı). */
  articles: { no: string; slug: string; questionCount: number; hasText: boolean }[];
  related: { slug: string; name: string; questionCount: number }[];
}

/** Kanunu oku (Doc 25 §4 okuma katmanı): tüm yayınlanmış maddeler, sırayla. */
export interface LawReading {
  slug: string;
  lawName: string;
  courseName: string;
  articleCount: number;
  source: string;
  sourceUrl: string | null;
  effectiveInfo: string | null;
  verifiedAt: string | null;
  articles: { no: string; slug: string; text: string }[];
}

// ── Mevzuat Merkezi (Doc 29): /public/mevzuat/:slug/oku ──
export interface MevzuatSection {
  id: string;
  parentId: string | null;
  heading: string;
}

export interface MevzuatReading {
  slug: string;
  name: string;
  shortName: string | null;
  number: string | null;
  type: string;
  topicId: string | null;
  articleCount: number;
  source: string;
  sourceUrl: string | null;
  effectiveInfo: string | null;
  verifiedAt: string | null;
  sections: MevzuatSection[];
  articles: {
    no: string;
    slug: string;
    title: string | null;
    text: string;
    sectionId: string | null;
    questionCount: number;
  }[];
}

// ── Liderlik tablosu (Doc 24 §5 gamification): /progress/leaderboard ──
export type LeaderboardPeriod = "today" | "week" | "month" | "all";

export interface LeaderboardRow {
  rank: number;
  isMe: boolean;
  displayName: string;
  avatarUrl: string | null;
  /** Seçili dönemdeki sıralama metriği (dönem içi doğru cevap). */
  points: number;
  /** Ömür-boyu tecrübe puanı (rütbe skoru) — Seviye'yi belirler. */
  xp: number;
  level: number;
  rankName: string;
  correct: number;
  accuracy: number;
  sessions: number;
  badges: number;
  lastActive: string | null;
}

export interface LeaderboardMe extends LeaderboardRow {
  /** Bir üst sırayı geçmek için gereken puan — üstteki oyuncu yüklüyse. */
  pointsToNext: number | null;
  nextName: string | null;
}

export interface LeaderboardBoard {
  period: LeaderboardPeriod;
  stats: {
    totalUsers: number;
    todayQuizCount: number;
    totalXp: number;
    todaysLeader: string | null;
  };
  top: LeaderboardRow[];
  me: LeaderboardMe | null;
}

export interface ExamGuide {
  key: string;
  name: string;
  description: string | null;
  totalQuestions: number;
  sections: {
    name: string;
    weightPercent: number;
    courses: {
      name: string;
      topicCount: number;
      questionCount: number;
      lawTopics: { slug: string; name: string }[];
    }[];
  }[];
}

/** Madde slug'ı — backend articleSlug ile birebir: "4/A" → "4-a", "Ek 6" → "ek-6". */
export function articleSlug(no: string): string {
  return no.toLocaleLowerCase("tr-TR").replace(/[\s/]+/g, "-");
}

export interface LawArticleDetail {
  lawSlug: string;
  topicId: string;
  lawName: string;
  courseName: string;
  no: string;
  slug: string;
  questionCount: number;
  /** Resmî madde metni (yayınlanmışsa) — Doc 25 §4 adım 3. Yoksa null. */
  text: {
    body: string;
    source: string;
    sourceUrl: string | null;
    effectiveInfo: string | null;
    verifiedAt: string | null;
  } | null;
  exams: ExamContext[];
  sources: { source: string; count: number }[];
  previews: string[];
  neighbors: {
    prev: { no: string; slug: string } | null;
    next: { no: string; slug: string } | null;
  };
  siblings: { no: string; slug: string; questionCount: number }[];
}

// ── Madde Atlası (girişli): /catalog/topics/:id/atlas — fetih haritası ──
export interface TopicAtlas {
  topicId: string;
  topicName: string;
  articles: {
    no: string;
    questionCount: number;
    clearedCount: number;
    conquered: boolean;
  }[];
  conqueredCount: number;
}

// ── Devam eden tur çapası (Doc 27 §2.4): /quiz/active-session ──
export interface ActiveSession {
  sessionId: string;
  mode: string;
  totalQuestions: number;
  answeredCount: number;
  startedAt: string;
  scopeName: string | null;
  /** Eski (soru sırası kayıtsız) oturumlarda false — gerçek devam mümkün değil. */
  resumable: boolean;
}

// ── Nöbet çizelgesi (Doc 27 W3/B): /progress/activity ──
export interface ActivityDay {
  date: string; // YYYY-MM-DD (UTC)
  questionsAnswered: number;
}

export interface MeProfile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  preferredModule: { id: string; name: string } | null;
  dailyGoal: number;
  targetExamDate: string | null;
  memberSince: string | null;
  roles: string[];
  isPremium: boolean;
  validUntil: string | null;
}

export interface BadgeCatalog {
  earnedCount: number;
  totalCount: number;
  items: {
    key: string;
    name: string;
    description: string;
    earned: boolean;
    earnedAt: string | null;
  }[];
}

// ── Koç (girişli ana sayfa) — /me/coach yanıtının web'de kullanılan kısmı ──
export interface CoachBrief {
  greeting: { displayName: string | null; isPremium: boolean };
  daysToExam: number | null;
  today: {
    goal: number;
    answered: number;
    streak: { current: number; longest: number; atRisk: boolean };
  };
  primaryAction: { type: string; label: string; route: string };
  cards: {
    type: string;
    priority: number;
    title: string;
    body?: string;
    cta?: { label: string; route: string };
  }[];
  stats?: { totalSolved: number; accuracy: number; totalSessions: number };
  gamification: {
    nextBadge: {
      key: string;
      name: string;
      progress: number;
      target: number;
    } | null;
    /** Rütbe sistemi (Doc 24 §5) — sunucuda hesaplanır (rank.logic). */
    rank?: {
      level: number;
      name: string;
      score: number;
      minScore: number;
      next: { level: number; name: string; minScore: number } | null;
    };
    records: {
      bestNet: number | null;
      longestStreak: number;
      maxDailyQuestions: number;
    };
    weekly: { activeDays: number; goalDays: number };
  };
  /** Haftalık fotoğraf (Doc 27 wireframe 02): ders bazlı mastery değişimi (%). */
  weeklyPhoto?: { courseName: string; deltaPct: number }[];
}

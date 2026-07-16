import { config } from "./config";

/**
 * Public (auth'suz) API çağrısı — SEO katmanı (Doc 23). ISR ile önbelleklenir:
 * sayfalar statik üretilir, `revalidate` süresinde arka planda tazelenir.
 */
export async function publicApi<T>(path: string, revalidateSeconds = 3600): Promise<T> {
  const res = await fetch(`${config.apiBaseUrl}${path}`, {
    next: { revalidate: revalidateSeconds },
  });
  const json = (await res.json().catch(() => null)) as { data?: T } | null;
  if (!res.ok || !json?.data) throw new Error(`Public API hatası: ${path} (${res.status})`);
  return json.data;
}

// ── Tipler (backend public.service ile birebir) ──
export interface QuestionOfDay {
  date: string;
  topic: string;
  versionId: string;
  stem: string;
  options: { id: string; label: string; text: string }[];
}

export interface LawSummary {
  slug: string;
  name: string;
  courseName: string;
  questionCount: number;
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
  /** Madde Isı Haritası (Doc 25 §4): madde → çıkmış soru sayısı, çoktan aza. */
  articles: { no: string; questionCount: number }[];
  related: { slug: string; name: string; questionCount: number }[];
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

// ── Koç (girişli ana sayfa) — /me/coach yanıtının web'de kullanılan kısmı ──
export interface CoachBrief {
  greeting: { displayName: string | null; isPremium: boolean };
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
    nextBadge: { key: string; name: string; progress: number; target: number } | null;
    records: { bestNet: number | null; longestStreak: number; maxDailyQuestions: number };
    weekly: { activeDays: number; goalDays: number };
  };
}

/**
 * Kişisel Koç sözleşmesi (Doc 19 §2-3).
 *
 * İLKE: Kartlar SUNUCUDAN gelir; istemci hiçbir kural bilmez. v1'de kartları
 * deterministik kural motoru üretir; v2'de (Doc 15) AI koç aynı sözleşmeyi
 * doldurur — istemciler değişmez.
 */

export type CoachCardType =
  | 'exam_live'
  | 'exam_in_progress'
  | 'exam_today'
  | 'streak_risk'
  | 'goal_remaining'
  | 'quick_review'
  | 'weak_topic'
  | 'course_trend'
  | 'daily_quiz'
  | 'badge_near'
  | 'new_exam'
  | 'comeback'
  | 'motivation';

export interface CoachCta {
  label: string;
  /** İstemci rota ipucu (go_router/web ortak): /denemeler, /review, /catalog… */
  route: string;
}

export interface CoachCard {
  type: CoachCardType;
  priority: number; // yüksek = önemli; sıralama + primaryAction seçimi
  title: string;
  body?: string;
  cta?: CoachCta;
  /** Tip'e özel ek veri — istemci gerekirse rotayı bununla kurar
   *  (örn. weak_topic → { topicId, topicName } ile quiz başlatır). */
  meta?: Record<string, unknown>;
}

/** Kuralların okuduğu, TEK seferde toplanan gerçek kullanıcı verisi. */
export interface CoachContext {
  now: Date;
  /** Europe/Istanbul saati (0-23) — "akşam 18'den sonra" kuralları için. */
  trHour: number;
  user: {
    id: string;
    displayName: string | null;
    dailyGoal: number;
    isPremium: boolean;
  };
  streak: {
    current: number;
    longest: number;
    /** Dün aktif miydi? (seri riski: dün aktif + bugün 0 soru) */
    activeYesterday: boolean;
  };
  answeredToday: number;
  stats: { totalSolved: number; totalCorrect: number; totalSessions: number };
  /** Çözülmemiş yanlış sayısı (wrong_answers.resolvedAt IS NULL). */
  unresolvedWrongCount: number;
  /** En zayıf konu (çözülen ≥ 10 ve mastery < 0.5 olanlardan en düşüğü). */
  weakestTopic: { topicId: string; name: string; mastery: number } | null;
  exams: {
    /** Şu an penceresi açık deneme (varsa) + kullanıcının durumu. */
    live: {
      id: string;
      title: string;
      endAt: Date;
      attempted: boolean; // completed katılım var
      inProgress: boolean; // yarım oturum var
    } | null;
    /** Bugün başlayacak (henüz başlamamış) yayında deneme. */
    todayUpcoming: {
      id: string;
      title: string;
      startAt: Date;
      questionCount: number;
      durationMinutes: number;
    } | null;
    /** Son 48 saatte yayınlanmış, kullanıcının katılmadığı deneme. */
    newPublished: { id: string; title: string } | null;
    completedCount: number;
    bestNet: number | null;
  };
  dailyQuizPlayed: boolean;
  /** Kazanılmamış rozetlerden tamamlanmaya en yakın olanı. */
  nextBadge: { key: string; name: string; progress: number; target: number } | null;
  weekly: { activeDays: number; goalDays: number };
  maxDailyQuestions: number;
  /** Haftalık snapshot karşılaştırması (±%10 eşiği kuralda). */
  courseTrend: { courseName: string; deltaPct: number } | null;
  /** Son aktiviteden bu yana geçen tam gün; hiç aktivite yoksa null. */
  daysSinceLastActivity: number | null;
}

/** Kural: saf fonksiyon — tetiklenmezse null. Yenisini eklemek = yeni dosya. */
export type CoachRule = (ctx: CoachContext) => CoachCard | null;

/** GET /me/coach yanıtı (Doc 19 §3). */
export interface CoachBrief {
  greeting: { displayName: string | null; isPremium: boolean };
  today: {
    goal: number;
    answered: number;
    streak: { current: number; longest: number; atRisk: boolean };
  };
  primaryAction: CoachCta & { type: CoachCardType | 'default' };
  cards: CoachCard[];
  gamification: {
    nextBadge: CoachContext['nextBadge'];
    records: {
      bestNet: number | null;
      longestStreak: number;
      maxDailyQuestions: number;
    };
    weekly: { activeDays: number; goalDays: number };
  };
}

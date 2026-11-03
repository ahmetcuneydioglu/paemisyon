/**
 * Doc 56 — mağaza değerlendirme istemi: an seçimi, engeller ve metin. SAF mantık;
 * DB erişimi `ReviewPromptService`'te. Kural sunucuda yaşar; istemci yalnız
 * `{ label, title, body }` gösterir ve sonucu bildirir.
 *
 * İlke: fikir soran ön eleme YOK (Google In-App Review politikası); metinde
 * yıldız ya da sayı geçmez; ad her yerde "Paemisyon".
 */

export type ReviewPlatform = 'ios' | 'android';
export type ReviewMoment = 'streak_30' | 'streak_7' | 'weekly_top' | 'personal_best' | 'badge';
export type ReviewOutcome = 'shown' | 'accepted' | 'dismissed';

export const REVIEW_PROMPT_DEFAULTS = {
  /** İki istem arası en az gün (gösterim ya da 'Şimdi değil' sonrası). */
  minGapDays: 30,
  /** 'Değerlendir' denmişse bir sonraki istem için en az gün. */
  afterAcceptDays: 180,
  /** Kayıttan bu yana en az gün. */
  minAccountDays: 3,
  /** En az tamamlanmış tur (bu tur dahil). */
  minSessions: 5,
  /** Son N günde soru bildirimi/şikayet varsa sorulmaz. */
  complaintWindowDays: 14,
  /** Kişisel rekor için en az soru ve en az doğruluk. */
  personalBestMinQuestions: 10,
  personalBestMinPct: 80,
  /** Bu doğruluğun altındaki turda hiçbir an tetiklenmez (seri dahil). */
  badSessionPct: 50,
} as const;

export interface ReviewPromptInput {
  platform: ReviewPlatform | null;
  killSwitch: boolean;
  now: Date;
  userCreatedAt: Date;
  /** Bu tur dahil tamamlanmış tur sayısı. */
  totalSessions: number;
  /** Kullanıcının en son istemi (sonucu ne olursa olsun). */
  lastPrompt: { outcome: ReviewOutcome; createdAt: Date } | null;
  /** Son `complaintWindowDays` içindeki soru bildirimi sayısı. */
  recentComplaints: number;
  session: { mode: string; totalQuestions: number; correctCount: number };
  /** Tur yazıldıktan SONRAKİ seri; `activeToday` = lastActiveDate bugün (UTC gün). */
  streak: { current: number; activeToday: boolean };
  /** Önceki turlardaki en iyi doğruluk (≥ personalBestMinQuestions soruluk); hiç yoksa null. */
  previousBestPct: number | null;
  earnedBadges: number;
  /** Haftalık denemede üst dilim (deneme sonucu yolundan gelir; tur yolunda false). */
  weeklyTop: boolean;
  minGapDays?: number;
  afterAcceptDays?: number;
}

const DAY = 86_400_000;
const daysBetween = (a: Date, b: Date) => (b.getTime() - a.getTime()) / DAY;

export function accuracyPct(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

/** Engeller: hepsi geçilmeli. İlk takılan engelin adı döner (teşhis için), geçtiyse null. */
export function blockedBy(i: ReviewPromptInput): string | null {
  const D = REVIEW_PROMPT_DEFAULTS;
  if (!i.platform) return 'platform';
  if (i.killSwitch) return 'kill_switch';
  if (daysBetween(i.userCreatedAt, i.now) < D.minAccountDays) return 'account_age';
  if (i.totalSessions < D.minSessions) return 'session_count';
  if (i.lastPrompt) {
    const gap =
      i.lastPrompt.outcome === 'accepted'
        ? (i.afterAcceptDays ?? D.afterAcceptDays)
        : (i.minGapDays ?? D.minGapDays);
    if (daysBetween(i.lastPrompt.createdAt, i.now) < gap) return 'cooldown';
  }
  if (i.recentComplaints > 0) return 'recent_complaint';
  if (i.session.mode === 'deneme' && !i.weeklyTop) return 'exam_result';
  if (accuracyPct(i.session.correctCount, i.session.totalQuestions) < D.badSessionPct)
    return 'bad_session';
  return null;
}

/** An seçimi: öncelik sırası sabittir; ilk tutan kazanır. */
export function pickMoment(i: ReviewPromptInput): ReviewMoment | null {
  const D = REVIEW_PROMPT_DEFAULTS;
  if (i.streak.activeToday && i.streak.current === 30) return 'streak_30';
  if (i.streak.activeToday && i.streak.current === 7) return 'streak_7';
  if (i.weeklyTop) return 'weekly_top';
  const pct = accuracyPct(i.session.correctCount, i.session.totalQuestions);
  if (
    i.session.totalQuestions >= D.personalBestMinQuestions &&
    pct >= D.personalBestMinPct &&
    (i.previousBestPct == null || pct > i.previousBestPct)
  )
    return 'personal_best';
  if (i.earnedBadges > 0) return 'badge';
  return null;
}

/** Engeller + an; sorulacaksa an, yoksa null. */
export function evaluate(i: ReviewPromptInput): ReviewMoment | null {
  if (blockedBy(i)) return null;
  return pickMoment(i);
}

export interface ReviewPromptCopy {
  label: string;
  title: string;
  body: string;
}

const BODY_DEFAULT =
  "Paemisyon'la çalışmak hoşuna gidiyorsa mağazadaki değerlendirmen bizim için çok şey ifade eder.";

/** Onaylı metinler (3 Kas 2026): varsayılan = mesaj 3, seri = mesaj 4. */
export function promptCopy(moment: ReviewMoment): ReviewPromptCopy {
  switch (moment) {
    case 'streak_7':
    case 'streak_30': {
      const n = moment === 'streak_7' ? 7 : 30;
      return {
        label: `${n} günlük seri`,
        title: `${n} gündür buradasın.`,
        body: "Bu düzeni Paemisyon'la kurduysan mağazada anlat. Bir sonraki aday belki senin cümlenle başlar.",
      };
    }
    case 'weekly_top':
      return { label: 'Haftalık deneme', title: 'Bu hafta üst dilimdesin.', body: BODY_DEFAULT };
    case 'personal_best':
    case 'badge':
      return { label: 'Bir dakikan var mı?', title: 'Bugün iyi gitti.', body: BODY_DEFAULT };
  }
}

export function normalizePlatform(raw: unknown): ReviewPlatform | null {
  const v = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  return v === 'ios' || v === 'android' ? v : null;
}

/**
 * Deneme durum makinesi — SAF mantık (Doc 50 §3).
 *
 * İki eksen: denemenin ERİŞİLEBİLİRLİĞİ (upcoming/open/closed) ve adayın
 * DURUMU (new/in_progress/completed). Eski istemciler için `legacyState`
 * (upcoming/active/ended) de üretilir — Flutter listesi bunu okur.
 */

export type ExamPublishMode = 'serbest' | 'takvimli';
export type ExamAvailability = 'upcoming' | 'open' | 'closed';
export type MyExamState = 'new' | 'in_progress' | 'completed';
export type LegacyExamState = 'upcoming' | 'active' | 'ended';
export type AttemptRole = 'official' | 'practice';

export interface ExamWindow {
  publishMode: ExamPublishMode;
  startAt: Date;
  endAt: Date | null;
  durationMinutes: number;
  practiceAfterEnd: boolean;
}

/** Takvimlide pencere kapanışı; serbestte "yeni çözüme kapanış" (yoksa null). */
export function examEndAt(exam: ExamWindow): Date | null {
  if (exam.publishMode === 'takvimli') {
    return exam.endAt ?? new Date(exam.startAt.getTime() + exam.durationMinutes * 60_000);
  }
  return exam.endAt;
}

export function availabilityOf(exam: ExamWindow, now = new Date()): ExamAvailability {
  if (now < exam.startAt) return 'upcoming';
  const end = examEndAt(exam);
  if (end && now >= end) return 'closed';
  return 'open';
}

export function legacyStateOf(exam: ExamWindow, now = new Date()): LegacyExamState {
  const a = availabilityOf(exam, now);
  return a === 'upcoming' ? 'upcoming' : a === 'open' ? 'active' : 'ended';
}

export interface MyAttemptSummary {
  officialStatus: 'in_progress' | 'completed' | null;
  practiceInProgress: boolean;
}

export function myStateOf(my: MyAttemptSummary): MyExamState {
  if (my.officialStatus === 'in_progress' || my.practiceInProgress) return 'in_progress';
  if (my.officialStatus === 'completed') return 'completed';
  return 'new';
}

/** Resmî çözüm başlatılabilir mi? */
export function canStartOfficial(
  exam: ExamWindow,
  my: MyAttemptSummary,
  now = new Date(),
): boolean {
  if (availabilityOf(exam, now) !== 'open') return false;
  return my.officialStatus == null;
}

/**
 * Tekrar çözüm başlatılabilir mi? Resmî çözüm BİTMİŞ olmalı (bitmeden tekrar
 * yok); kapanmış takvimli denemede yalnız practiceAfterEnd açıksa.
 */
export function canStartPractice(
  exam: ExamWindow,
  my: MyAttemptSummary,
  now = new Date(),
): boolean {
  const a = availabilityOf(exam, now);
  if (a === 'upcoming') return false;
  if (my.officialStatus === 'in_progress') return false;
  if (a === 'closed') {
    if (exam.publishMode === 'takvimli') return exam.practiceAfterEnd;
    return false; // serbest arşiv tarihi geçti: yeni çözüm yok
  }
  // Açık pencerede tekrar çözüm resmî çözüm bittiyse açılır.
  return my.officialStatus === 'completed';
}

/**
 * Mutlak son tarih: başlangıç + süre; takvimlide pencere kapanışıyla sınırlı.
 * Pencere kapanışına 1 dakikadan az kaldıysa yine de en az 60 sn verilir ki
 * oturum doğar doğmaz ölmesin (aday "girebildim ama kapandı" görmesin).
 */
export function deadlineFor(exam: ExamWindow, role: AttemptRole, startedAt: Date): Date {
  const byDuration = new Date(startedAt.getTime() + exam.durationMinutes * 60_000);
  if (exam.publishMode === 'takvimli' && role === 'official') {
    const end = examEndAt(exam)!;
    const capped = end < byDuration ? end : byDuration;
    const min = new Date(startedAt.getTime() + 60_000);
    return capped < min ? min : capped;
  }
  return byDuration;
}

/** Ağ payı (Doc 50 §3): son tarihten sonraki bu kadar saniye içinde gelen cevap kabul. */
export const DEADLINE_GRACE_SECONDS = 10;

export function isPastDeadline(deadlineAt: Date, now = new Date()): boolean {
  return now.getTime() > deadlineAt.getTime() + DEADLINE_GRACE_SECONDS * 1000;
}

/** Liste sırası (Doc 50 §3): devam eden > yeni > tamamlanan > yaklaşan > kapanan. */
export function listOrder(availability: ExamAvailability, my: MyExamState): number {
  if (my === 'in_progress') return 0;
  if (availability === 'open' && my === 'new') return 1;
  if (my === 'completed' && availability !== 'closed') return 2;
  if (availability === 'upcoming') return 3;
  return 4;
}

/**
 * Sonuç kilidi: takvimli denemede pencere kapanana kadar resmî çözümün sonucu
 * açıklanmaz (herkes aynı anda görür; anahtar sızmaz). Tekrar çözüm hemen açılır.
 */
export function resultLocked(exam: ExamWindow, role: AttemptRole, now = new Date()): boolean {
  if (exam.publishMode !== 'takvimli' || role !== 'official') return false;
  return availabilityOf(exam, now) !== 'closed';
}

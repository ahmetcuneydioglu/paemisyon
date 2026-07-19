import type { Prisma } from '@prisma/client';

/**
 * Günün Quizi — gün-tohumlu 10-soru seçimi (SAF mantık, birim testli).
 *
 * Hem girişli `daily` seansı (quiz.service) hem girişsiz public "Günün Quizi"
 * (public.service) BU mantığı kullanır → herkes o gün AYNI 10 soruyu görür
 * (adil liderlik + tek kaynak). NÖTR konum: quiz.service zaten public.service'ten
 * import ettiği için ortak mantık burada durur (import cycle olmaz).
 */

export const DAILY_QUESTION_COUNT = 10;
export const DAILY_EXAM_KEY = 'paem';

/**
 * Günün quizi havuzu (Doc 21): yayında, premium OLMAYAN, PAEM müfredatına
 * (bölüm→ders) bağlı konuların soruları. Tek tanım — public ve quiz eşit kalır.
 */
export function dailyQuestionPoolWhere(): Prisma.QuestionWhereInput {
  return {
    deletedAt: null,
    currentVersionId: { not: null },
    topic: {
      deletedAt: null,
      isPremium: false,
      course: {
        deletedAt: null,
        sections: {
          some: { section: { deletedAt: null, examType: { key: DAILY_EXAM_KEY } } },
        },
      },
    },
  };
}

/** djb2 — kriptografik değil; gün içi sabit tohum için yeterli. */
export function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Tohumlu (deterministik) örneklem — Fisher-Yates + mulberry32 PRNG. */
export function seededSample<T>(arr: readonly T[], n: number, seed: number): T[] {
  const a = [...arr];
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(n, a.length));
}

/**
 * Bir günün deterministik 10'unu seç. `dateKey` = "YYYY-MM-DD" (UTC).
 * Havuz <10 ise mevcut kadarını döner (seededSample Math.min uygular).
 */
export function pickDailyIds<T extends { id: string }>(pool: readonly T[], dateKey: string): T[] {
  return seededSample(pool, DAILY_QUESTION_COUNT, hashString(dateKey));
}

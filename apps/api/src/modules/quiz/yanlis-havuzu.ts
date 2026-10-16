import type { Prisma } from '@prisma/client';
import { IPTAL_EDILMEMIS } from '../../common/iptal-soru';

/**
 * Yanlış tekrarı turunun havuzu — TEK tanım (Doc 48 A3).
 *
 * Koçun "N çözülmemiş yanlış" sayacı ile yanlış turu aynı süzgeci kullanmalı:
 * sayaç "4 yanlışın var" derken tur "kuyruk temiz" diyemez. Önceden sayaç
 * yalnız "çözülmemiş + iptal değil" bakıyordu; tur ise ücretsiz planda son 7
 * günü, premium konu kapısını ve hedef sınav kapsamını da uyguluyordu.
 */

/** Ücretsiz plan yalnız son 7 günün yanlışlarını tekrar eder (Doc 24 §11). */
export function yanlisTuruBaslangici(
  isPremium: boolean,
  now: number = Date.now(),
): Date | undefined {
  return isPremium ? undefined : new Date(now - 7 * 86_400_000);
}

/** Yanlış kayıtlarının süzgeci (WrongAnswer'ın Question'a ilişkisi yok — iki adım). */
export function yanlisKaydiFiltresi(
  userId: string,
  isPremium: boolean,
  now: number = Date.now(),
): Prisma.WrongAnswerWhereInput {
  const since = yanlisTuruBaslangici(isPremium, now);
  return { userId, resolvedAt: null, ...(since ? { lastWrongAt: { gte: since } } : {}) };
}

/** Yanlışı yapılmış sorulardan turda SORULABİLECEK olanların süzgeci. */
export function yanlisTuruSoruFiltresi(o: {
  isPremium: boolean;
  /** Hedef sınav (kapsam); seçilmemişse tüm müfredat. */
  preferredModuleId: string | null;
}): Prisma.QuestionWhereInput {
  return {
    deletedAt: null,
    currentVersionId: { not: null },
    ...IPTAL_EDILMEMIS,
    topic: {
      ...(o.isPremium ? {} : { isPremium: false }),
      ...(o.preferredModuleId
        ? {
            course: {
              sections: {
                some: { section: { deletedAt: null, examTypeId: o.preferredModuleId } },
              },
            },
          }
        : {}),
    },
  };
}

/**
 * Süresi gelen tekrar kayıtlarının süzgeci (Doc 49 S1-A). Ücretsiz planda pencere yanlış
 * turuyla AYNI (son 7 gün — son görülme tarihine göre); premium süresiz. Soru tarafı süzgeci
 * yine `yanlisTuruSoruFiltresi` (iptal, premium konu, hedef sınav kapsamı).
 */
export function tekrarKaydiFiltresi(
  userId: string,
  isPremium: boolean,
  now: number = Date.now(),
): Prisma.QuestionReviewWhereInput {
  const since = yanlisTuruBaslangici(isPremium, now);
  return {
    userId,
    dueAt: { lte: new Date(now) },
    ...(since ? { lastReviewedAt: { gte: since } } : {}),
  };
}

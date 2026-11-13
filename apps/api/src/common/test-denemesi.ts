import type { Prisma } from '@prisma/client';

/**
 * Prova (test) denemesi görünürlüğü — TEK kural (13 Kas 2026).
 *
 * `exam.testOnly` olan deneme yalnız test hesaplarına (admin, beta rolü) görünür: liste, ayrıntı,
 * başlatma, sıralama, Bugün kartı. Bildirim (yayın duyurusu, hatırlatma) ve genel liderlik
 * test denemesini hiç saymaz. Amaç canlı veritabanı ve gerçek cihazla, kullanıcılar görmeden prova.
 */
export const TEST_ROLLERI = ['admin', 'beta'] as const;

export function testHesabiMi(user?: { roles?: readonly string[] } | null): boolean {
  return Boolean(user?.roles?.some((r) => (TEST_ROLLERI as readonly string[]).includes(r)));
}

/** Kullanıcının görebileceği denemeler süzgeci (`where`'e yayılır). */
export function denemeGorunurluk(
  user?: { roles?: readonly string[] } | null,
): Prisma.ExamWhereInput {
  return testHesabiMi(user) ? {} : { testOnly: false };
}

import type { PrismaClient } from '@prisma/client';
import { gunAnahtari } from './gun';
import { FREE_DAILY_LIMIT_FALLBACK } from './plan.constants';

/**
 * Günün çalışma süresi (Doc 49 S1-D) — `daily_usage.study_seconds`. TEK TANIM:
 * quiz cevabı ve okuyucu ilerlemesi aynı yardımcıyla yazar.
 *
 * Tavanlar istemci saatine güvensizliktendir: arka planda açık kalan ekranın
 * saatleri "çalışma" sayılmaz. Cevap başına 10 dk, okuma kaydı başına 30 dk.
 */
export const CEVAP_SURESI_TAVAN_SN = 600;
export const OKUMA_KAYDI_TAVAN_SN = 1800;

/** ms → saniye; geçersiz/negatif 0, tavan uygulanır (saf). */
export function calismaSaniyesi(
  ms: number | null | undefined,
  tavanSn: number = CEVAP_SURESI_TAVAN_SN,
): number {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return 0;
  return Math.min(tavanSn, Math.round(ms / 1000));
}

/**
 * Günün satırına süre ekler (atomik upsert; satır yoksa açar). Kota sayaçlarına
 * DOKUNMAZ — `daily_limit` yalnız yer tutucu (sayaç kodu kendi değerini yazar).
 * Hata kritik yolu bozmaz: çağıran `void` ile kullanır, hata yutulur.
 */
export async function calismaSuresiEkle(
  prisma: Pick<PrismaClient, '$executeRaw'>,
  userId: string,
  saniye: number,
): Promise<void> {
  if (saniye <= 0) return;
  const today = gunAnahtari();
  try {
    await prisma.$executeRaw`
      INSERT INTO daily_usage (user_id, usage_date, questions_answered, total_answered, daily_limit, study_seconds)
      VALUES (${userId}::uuid, ${today}::date, 0, 0, ${FREE_DAILY_LIMIT_FALLBACK}, ${saniye})
      ON CONFLICT (user_id, usage_date) DO UPDATE
        SET study_seconds = daily_usage.study_seconds + ${saniye}`;
  } catch {
    // en iyi çaba — süre sayacı kritik yolun parçası değil
  }
}

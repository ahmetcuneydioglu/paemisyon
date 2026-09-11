import type { Prisma, PrismaClient } from '@prisma/client';

/**
 * Sınavda İPTAL edilmiş soru hiçbir soru havuzuna girmez (11 Eyl 2026 kararı).
 *
 * İptal bayrağı `PastExamQuestion` üzerinde, yani SINAVA özgü: kurum o soruyu
 * o kitapçıkta puanlamadı. Ama soru bankada konusuna bağlı normal bir soru
 * olarak duruyordu ve alıştırma havuzu yalnız `deletedAt`/`currentVersionId`
 * baktığı için soruyu geçerliymiş gibi soruyor, yanlış sayıyordu. PAEM 9'un
 * 88-90. soruları böyleydi: açıklaması "akıl yürütmenizde hata yok, soruda
 * eksik öncül var" diyen bir soru, aynı ekranda kırmızı yanlış rozetiyle
 * geliyordu. Kurumun geçersiz saydığı soruyu biz doğruymuş gibi ölçemeyiz.
 *
 * Soru bankadan SİLİNMEZ: kendi sınav sayfasında "Sınavda iptal edildi"
 * rozetiyle durmaya devam eder (Doc 36) — orada iptal bilginin kendisidir.
 *
 * Soruyu cevaplatan / seçen her sorguya eklenir; sayımlar da havuzla aynı
 * kalsın diye bunu kullanır. Admin'in tek soru görüntülemesi kapsam dışıdır.
 */
export const IPTAL_EDILMEMIS = {
  pastExams: { none: { cancelled: true } },
} satisfies Prisma.QuestionWhereInput;

/**
 * İptal edilmiş soruların id'leri.
 *
 * `WrongAnswer` ve `Bookmark` Question'a İLİŞKİ taşımaz (yalnız `questionId`
 * kolonu var), dolayısıyla oralarda `IPTAL_EDILMEMIS` kullanılamaz. Yanlış
 * defterinde havuzdan çıkarılmadan önce birikmiş kayıtlar var: sayaç "1 yanlışın
 * var" derken tekrar turu "kuyruk temiz" diyecekti. Küme küçük ve indeksli;
 * bayat kalmasın diye önbelleğe alınmıyor.
 */
export async function iptalSoruIdleri(
  prisma: Pick<PrismaClient, 'pastExamQuestion'>,
): Promise<string[]> {
  const rows = await prisma.pastExamQuestion.findMany({
    where: { cancelled: true },
    select: { questionId: true },
    distinct: ['questionId'],
  });
  return rows.map((r) => r.questionId);
}

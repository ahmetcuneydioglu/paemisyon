import type { PrismaClient } from '@prisma/client';
import type { SessionForProgress } from '../progress/progress.service';

/**
 * Yarım tur kapanışı — TEK çekirdek (Doc 48 B-3/B-4/B-5; 14 Eki 2026 kararı:
 * tek aktif tur). Servis (yeni tur başlarken), günlük cron (7 günden eski)
 * ve geri dönük betik aynı fonksiyonu çağırır.
 *
 * 14 Eki ölçümü: 2.209 yarım tur, 1.683 tamamlanmış; yarım turlardaki 4.353
 * cevap hiçbir ilerlemeye yazılmamıştı. Kapanan tur 'abandoned' olur; çözülen
 * cevaplar emek olarak yazılır, tur sayısına/skora/rozete/seriye girmez.
 */

/** Tek aktif tur kuralının kapsadığı modlar. Deneme, kişisel deneme ve arşiv muaf. */
export const YARIM_TUR_MODLARI = ['practice', 'review', 'daily'] as const;

/** Son cevabı bu süreden eski yarım tur cron'la kapanır. */
export const BAYAT_TUR_GUN = 7;

export interface IlerlemeYazici {
  recordSessionProgress(
    userId: string,
    session: SessionForProgress,
    opts: { countSession: boolean; activity: boolean },
  ): Promise<void>;
}

type Db = Pick<PrismaClient, 'quizSession'>;

/**
 * Bir yarım turu kapatır. Atomik sahiplenme (updateMany … status in_progress):
 * eşzamanlı iki kapanış ya da kapanış + tamamlama yarışında ilerleme TEK kez
 * yazılır. Dönüş: kapandı mı ve geçerli cevap sayısı.
 */
export async function turuTerkEt(
  db: Db,
  ilerleme: IlerlemeYazici,
  sessionId: string,
): Promise<{ kapandi: boolean; cevap: number }> {
  const s = await db.quizSession.findUnique({
    where: { id: sessionId },
    include: { answers: true },
  });
  if (!s || s.status !== 'in_progress') return { kapandi: false, cevap: 0 };

  // Tamamlamayla aynı geçerlilik: yalnız turun soru setindeki cevaplar.
  const order = s.questionOrder;
  const orderSet = Array.isArray(order) && order.length > 0 ? new Set(order as string[]) : null;
  const gecerli = orderSet ? s.answers.filter((a) => orderSet.has(a.questionVersionId)) : s.answers;
  const correctCount = Math.min(gecerli.filter((a) => a.isCorrect === true).length, s.totalQuestions);
  const wrongCount = Math.min(
    gecerli.filter((a) => a.isCorrect === false && a.selectedOptionId != null).length,
    s.totalQuestions - correctCount,
  );

  const claim = await db.quizSession.updateMany({
    where: { id: sessionId, status: 'in_progress' },
    data: {
      status: 'abandoned',
      completedAt: new Date(),
      correctCount,
      wrongCount,
      blankCount: s.totalQuestions - correctCount - wrongCount,
    },
  });
  if (claim.count !== 1) return { kapandi: false, cevap: 0 };

  if (gecerli.length > 0) {
    await ilerleme.recordSessionProgress(
      s.userId,
      {
        topicId: s.topicId,
        correctCount,
        wrongCount,
        answers: gecerli.map((a) => ({
          questionId: a.questionId,
          isCorrect: a.isCorrect,
          selectedOptionId: a.selectedOptionId,
        })),
      },
      { countSession: false, activity: false },
    );
  }
  return { kapandi: true, cevap: gecerli.length };
}

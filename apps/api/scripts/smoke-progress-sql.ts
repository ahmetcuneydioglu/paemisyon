/**
 * Tek seferlik duman testi: recordSessionCompletion'daki unnest'li toplu
 * upsert SQL'lerinin gerçek Postgres'te çalıştığını doğrular. Her şey tek
 * transaction içinde koşar ve SONUNDA GERİ ALINIR (DB'ye kalıcı yazım yok).
 * Çalıştırma: DATABASE_URL'e ?connection_limit=1 ekleyerek.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ select: { id: true } });
  const topic = await prisma.topic.findFirst({ select: { id: true } });
  const question = await prisma.question.findFirst({ select: { id: true } });
  if (!user || !topic || !question) throw new Error('Örnek veri yok.');

  try {
    await prisma.$transaction(async (tx) => {
      const topicIds = [topic.id];
      const solvedArr = [3];
      const correctArr = [2];
      const r1 = await tx.$executeRaw`
        INSERT INTO user_topic_progress
          (user_id, topic_id, solved_count, correct_count, mastery, last_activity_at)
        SELECT ${user.id}::uuid, u.t, u.s, u.c,
               CASE WHEN u.s > 0 THEN u.c::decimal / u.s ELSE 0 END, now()
        FROM unnest(${topicIds}::uuid[], ${solvedArr}::int[], ${correctArr}::int[])
          AS u(t, s, c)
        ON CONFLICT (user_id, topic_id) DO UPDATE SET
          solved_count = user_topic_progress.solved_count + EXCLUDED.solved_count,
          correct_count = user_topic_progress.correct_count + EXCLUDED.correct_count,
          mastery = CASE
            WHEN user_topic_progress.solved_count + EXCLUDED.solved_count > 0
            THEN (user_topic_progress.correct_count + EXCLUDED.correct_count)::decimal
                 / (user_topic_progress.solved_count + EXCLUDED.solved_count)
            ELSE 0 END,
          last_activity_at = now()`;
      const wrongIds = [question.id];
      const r2 = await tx.$executeRaw`
        INSERT INTO wrong_answers (user_id, question_id)
        SELECT ${user.id}::uuid, u.q FROM unnest(${wrongIds}::uuid[]) AS u(q)
        ON CONFLICT (user_id, question_id) DO UPDATE SET
          wrong_count = wrong_answers.wrong_count + 1,
          last_wrong_at = now(),
          resolved_at = NULL`;
      console.log(`OK: topic upsert=${r1} satır, wrong upsert=${r2} satır — geri alınıyor.`);
      throw new Error('ROLLBACK');
    });
  } catch (e) {
    if ((e as Error).message !== 'ROLLBACK') throw e;
    console.log('Rollback tamam — DB değişmedi. SQL geçerli. ✓');
  }
}

main().finally(() => prisma.$disconnect());

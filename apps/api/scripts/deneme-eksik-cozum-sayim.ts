/** Salt okunur: %20 eşiği hangi resmî deneme çözümlerini "eksik" sayar (deneme başına). */
import { PrismaClient } from '@prisma/client';
const url = (process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });
async function main() {
  const rows = await prisma.$queryRaw<{ title: string; publish_mode: string; toplam: number; eksik: number; sifir: number }[]>`
    SELECT e.title, e.publish_mode::text, COUNT(*)::int AS toplam,
      SUM(CASE WHEN a.n < CEIL(qs.total_questions * 0.20) THEN 1 ELSE 0 END)::int AS eksik,
      SUM(CASE WHEN a.n = 0 THEN 1 ELSE 0 END)::int AS sifir
    FROM quiz_sessions qs
    JOIN exams e ON e.id = qs.exam_id
    JOIN LATERAL (SELECT COUNT(*)::int AS n FROM quiz_answers qa WHERE qa.session_id = qs.id AND qa.selected_option_id IS NOT NULL) a ON true
    WHERE qs.mode = 'deneme' AND qs.attempt_role = 'official' AND qs.status = 'completed' AND e.deleted_at IS NULL
    GROUP BY e.id, e.title, e.publish_mode, e.start_at ORDER BY e.start_at DESC LIMIT 20`;
  console.table(rows);
}
main().finally(() => prisma.$disconnect());

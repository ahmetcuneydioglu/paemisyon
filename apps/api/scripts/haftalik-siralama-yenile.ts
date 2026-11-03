/**
 * Takvimli bir denemenin donmuş sıralamasını TÜM resmî çözümlerle yeniden hesaplar
 * (freezeRankings'in betik karşılığı; bildirim göndermez). 3 Kas 2026: Haftalık Deneme-1'in
 * 2. tur katılımcıları eksik kalmıştı. Kullanım: --exam "<başlık öneki>" [--confirm]
 */
import { PrismaClient } from '@prisma/client';
import { rankWithTies } from '../src/modules/exams/exam-scoring.logic';
const url = (process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });
async function main() {
  const i = process.argv.indexOf('--exam');
  const prefix = i >= 0 ? process.argv[i + 1] : 'Haftalık Deneme-1';
  const exam = await prisma.exam.findFirstOrThrow({ where: { publishMode: 'takvimli', title: { startsWith: prefix } }, select: { id: true, title: true, rankingsComputedAt: true } });
  const sessions = await prisma.quizSession.findMany({ where: { examId: exam.id, status: 'completed', attemptRole: 'official' }, include: { user: { select: { deletedAt: true } } } });
  const rows = rankWithTies(sessions.filter((s) => s.user.deletedAt == null).map((s) => ({ key: s.userId, score: s.score != null ? Number(s.score) : 0, wrongCount: s.wrongCount, durationSeconds: s.durationSeconds ?? 0, submittedAt: s.completedAt ?? s.startedAt, sessionId: s.id })));
  const frozen = await prisma.examRanking.count({ where: { examId: exam.id } });
  console.log(`${exam.title}: donmuş ${frozen} satır (${exam.rankingsComputedAt?.toISOString()}), resmî çözüm ${rows.length}`);
  if (!process.argv.includes('--confirm')) { console.log('Prova; --confirm ile yazar.'); return; }
  const now = new Date();
  await prisma.$transaction([
    prisma.examRanking.deleteMany({ where: { examId: exam.id } }),
    prisma.examRanking.createMany({ data: rows.map((r) => ({ examId: exam.id, userId: r.row.key, sessionId: r.row.sessionId, rank: r.rank, score: r.row.score, wrongCount: r.row.wrongCount, durationSeconds: r.row.durationSeconds, submittedAt: r.row.submittedAt, computedAt: now })) }),
    prisma.exam.update({ where: { id: exam.id }, data: { rankingsComputedAt: now } }),
  ]);
  console.log('Yeniden donduruldu:', rows.length);
}
main().finally(() => prisma.$disconnect());

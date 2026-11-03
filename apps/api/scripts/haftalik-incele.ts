/** Salt okunur: takvimli denemeler, pencereleri ve oturum dağılımı (rol, durum, kullanıcı tekrarı). */
import { PrismaClient } from '@prisma/client';
const url = (process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });
async function main() {
  const exams = await prisma.exam.findMany({ where: { publishMode: 'takvimli', deletedAt: null }, orderBy: { startAt: 'desc' }, select: { id: true, title: true, status: true, startAt: true, endAt: true, durationMinutes: true, practiceAfterEnd: true, liveAnswerReveal: true, rankingsComputedAt: true, updatedAt: true, createdAt: true } });
  for (const e of exams) {
    const sessions = await prisma.quizSession.findMany({ where: { examId: e.id }, select: { userId: true, attemptRole: true, status: true, startedAt: true, completedAt: true, closedReason: true } });
    const byUser = new Map<string, typeof sessions>();
    for (const s of sessions) byUser.set(s.userId, [...(byUser.get(s.userId) ?? []), s]);
    const multi = [...byUser.entries()].filter(([, v]) => v.length > 1);
    console.log(`\n${e.title} [${e.status}] ${e.startAt.toISOString()} → ${e.endAt?.toISOString()} ${e.durationMinutes}dk practiceAfterEnd=${e.practiceAfterEnd} rankingsAt=${e.rankingsComputedAt?.toISOString() ?? '-'} updated=${e.updatedAt.toISOString()}`);
    console.log(`  oturum ${sessions.length}, kullanıcı ${byUser.size}; rol/durum:`, sessions.reduce((m, s) => { const k = `${s.attemptRole}/${s.status}`; m[k] = (m[k] ?? 0) + 1; return m; }, {} as Record<string, number>));
    for (const [u, v] of multi.slice(0, 8)) console.log(`  çoklu ${u.slice(0, 8)}:`, v.map((s) => `${s.attemptRole}/${s.status}@${s.startedAt.toISOString().slice(5, 16)}`).join(' | '));
  }
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });

/**
 * Doc 53 F5 — ünite hâkimiyetini geçmiş cevaplardan doldur.
 *
 *   cd apps/api && npx tsx scripts/unite-ilerleme-doldur.ts [--dry]
 *
 * Yayındaki her ünite için: ünitenin konusundaki, madde numarası aralığa düşen soruların
 * cevapları (quiz_answers, is_correct dolu) kullanıcı bazında toplanır ve `user_unit_progress`
 * baştan yazılır (idempotent: önce tablo boşaltılır). Kanca (ProgressService) ile aynı kural:
 * boş cevap sayılmaz, ünitesiz soru sayılmaz. connection_limit=1; backend durdurulmaz
 * (yalnız okuma + tek tablo yazımı).
 */
import { PrismaClient } from '@prisma/client';
import { articleNumber } from '../src/modules/summaries/unite-eslesme';

const DRY = process.argv.includes('--dry');
const url = (process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });

(async () => {
  const units = await prisma.summaryUnit.findMany({
    where: { status: 'published', deletedAt: null },
    select: { id: true, slug: true, topicId: true, articleFrom: true, articleTo: true },
  });
  if (units.length === 0) {
    console.log('Yayında ünite yok; yapılacak iş yok.');
    await prisma.$disconnect();
    return;
  }
  // Konu bazında soru → ünite eşlemesi (madde numarası sayısal aralık).
  const topicIds = [...new Set(units.map((u) => u.topicId))];
  const questions = await prisma.question.findMany({
    where: { topicId: { in: topicIds }, deletedAt: null, articleNo: { not: null } },
    select: { id: true, topicId: true, articleNo: true },
  });
  const unitOfQuestion = new Map<string, string>();
  for (const q of questions) {
    const n = articleNumber(q.articleNo);
    if (n == null) continue;
    const u = units.find((x) => x.topicId === q.topicId && n >= Number(x.articleFrom) && n <= Number(x.articleTo));
    if (u) unitOfQuestion.set(q.id, u.id);
  }
  console.log(`${units.length} ünite · ${questions.length} maddeli soru · ${unitOfQuestion.size} soru üniteye düştü`);

  // Cevaplar: kullanıcı × ünite toplamı (tek sorgu, ham SQL; quiz_answers × quiz_sessions.user_id).
  const qids = [...unitOfQuestion.keys()];
  const rows: { user_id: string; question_id: string; solved: number; correct: number }[] = await prisma.$queryRawUnsafe(
    `select s.user_id, a.question_id, count(*)::int as solved, count(*) filter (where a.is_correct) ::int as correct
       from quiz_answers a join quiz_sessions s on s.id = a.session_id
      where a.question_id = any($1::uuid[]) and a.is_correct is not null and a.selected_option_id is not null
      group by s.user_id, a.question_id`,
    qids,
  );
  const tally = new Map<string, { solved: number; correct: number; last: Date }>();
  for (const r of rows) {
    const unitId = unitOfQuestion.get(r.question_id)!;
    const key = `${r.user_id}|${unitId}`;
    const t = tally.get(key) ?? { solved: 0, correct: 0, last: new Date(0) };
    t.solved += r.solved;
    t.correct += r.correct;
    tally.set(key, t);
  }
  console.log(`${rows.length} kullanıcı×soru satırı → ${tally.size} kullanıcı×ünite satırı`);
  if (DRY) {
    const byUnit = new Map<string, number>();
    for (const k of tally.keys()) byUnit.set(k.split('|')[1]!, (byUnit.get(k.split('|')[1]!) ?? 0) + 1);
    for (const u of units) console.log(`  ${u.slug}: ${byUnit.get(u.id) ?? 0} kullanıcı`);
    await prisma.$disconnect();
    return;
  }
  const entries = [...tally.entries()];
  await prisma.$transaction(async (tx) => {
    await tx.userUnitProgress.deleteMany({});
    const BATCH = 500;
    for (let i = 0; i < entries.length; i += BATCH) {
      const part = entries.slice(i, i + BATCH);
      await tx.userUnitProgress.createMany({
        data: part.map(([k, t]) => {
          const [userId, unitId] = k.split('|') as [string, string];
          return { userId, unitId, solvedCount: t.solved, correctCount: t.correct, mastery: t.solved > 0 ? t.correct / t.solved : 0 };
        }),
        skipDuplicates: true,
      });
    }
  }, { timeout: 120_000 });
  console.log(`Yazıldı: ${entries.length} satır (user_unit_progress baştan).`);
  await prisma.$disconnect();
})();

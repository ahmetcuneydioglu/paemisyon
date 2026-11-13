/** Eskime taraması — aday soruların deneme bağları (SALT OKUMA). npx tsx scripts/eskime-deneme-kontrol.ts <id,id,...> */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
const base = process.env.DATABASE_URL!;
const url = base.includes('connection_limit') ? base.replace(/connection_limit=\d+/, 'connection_limit=1') : `${base}${base.includes('?') ? '&' : '?'}connection_limit=1`;
const p = new PrismaClient({ datasources: { db: { url } } });
(async () => {
  const ids = readFileSync(process.argv[2], 'utf8').trim().split(',');
  const eq = await p.examQuestion.findMany({ where: { questionId: { in: ids } },
    select: { questionId: true, exam: { select: { title: true, startAt: true, endAt: true, publishMode: true, deletedAt: true } } } });
  const now = new Date();
  for (const e of eq) {
    const acik = !e.exam.deletedAt && (e.exam.endAt == null || e.exam.endAt > now);
    console.log(e.questionId.slice(0, 8), acik ? 'AÇIK/YAKLAŞAN' : 'kapalı', e.exam.publishMode, e.exam.startAt.toISOString().slice(0, 10), e.exam.endAt?.toISOString().slice(0, 10) ?? '-', e.exam.title);
  }
  const ct = await p.courseTestQuestion.count({ where: { questionId: { in: ids } } });
  console.log('ders testinde:', ct);
})().finally(() => p.$disconnect());

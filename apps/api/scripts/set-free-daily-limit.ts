/**
 * Lansman engeli (Doc 22): free planın günlük soru limiti geliştirme
 * kolaylığı için 1000'di — canlıda 15 olmalı. Tek satırlık güvenli UPDATE.
 * Çalıştırma: npx ts-node scripts/set-free-daily-limit.ts [limit=15]
 */
import { PrismaClient } from '@prisma/client';

const LIMIT = Number(process.argv[2] ?? 15);

async function main() {
  const url = process.env.DATABASE_URL!;
  const prisma = new PrismaClient({
    datasources: {
      db: { url: url.includes('connection_limit') ? url : `${url}${url.includes('?') ? '&' : '?'}connection_limit=1` },
    },
  });
  try {
    const before = await prisma.plan.findUnique({ where: { key: 'free' } });
    console.log('önce:', before?.key, 'dailyQuestionLimit =', before?.dailyQuestionLimit);
    const updated = await prisma.plan.update({
      where: { key: 'free' },
      data: { dailyQuestionLimit: LIMIT },
    });
    console.log('sonra:', updated.key, 'dailyQuestionLimit =', updated.dailyQuestionLimit);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

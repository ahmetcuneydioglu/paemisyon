/**
 * Free planın günlük soru limitini ayarlar — limitin TEK doğruluk kaynağı budur
 * (kodda kalan sayılar yalnız plan satırı okunamazsa devreye giren emniyet ağı).
 * Çalıştırma: npx ts-node scripts/set-free-daily-limit.ts [limit=30]
 *
 * Limiti kalıcı değiştirirken src/common/plan.constants.ts ve prisma/seed.ts
 * içindeki fallback de aynı sayıya çekilmeli.
 */
import { PrismaClient } from '@prisma/client';
import { FREE_DAILY_LIMIT_FALLBACK } from '../src/common/plan.constants';

const LIMIT = Number(process.argv[2] ?? FREE_DAILY_LIMIT_FALLBACK);

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

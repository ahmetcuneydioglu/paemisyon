/**
 * Madde Atlası backfill (Doc 25 §4): mevcut bankadaki soruların köklerinden
 * madde numarası tespit edip questions.article_no'ya yazar.
 *
 * Güvenlik: yalnız article_no'su NULL olanlara dokunur (elle düzeltme ezilmez);
 * dry-run çıktısı önce dökülür. DB penceresi kuralı: connection_limit=1.
 *
 * Çalıştırma (apps/api içinden):
 *   npx ts-node scripts/backfill-article-no.ts          # dry-run
 *   npx ts-node scripts/backfill-article-no.ts --apply  # yaz
 */
import { PrismaClient } from '@prisma/client';
import { detectArticleNo } from '../src/modules/admin/questions/import-parser';

const APPLY = process.argv.includes('--apply');

function withConnLimit(url: string): string {
  return url.includes('connection_limit') ? url : `${url}${url.includes('?') ? '&' : '?'}connection_limit=1`;
}

async function main() {
  const prisma = new PrismaClient({
    datasources: { db: { url: withConnLimit(process.env.DATABASE_URL!) } },
  });
  try {
    const questions = await prisma.question.findMany({
      where: { deletedAt: null, articleNo: null, currentVersionId: { not: null } },
      select: {
        id: true,
        topic: { select: { name: true } },
        currentVersion: { select: { stem: true } },
      },
    });

    const updates: { id: string; articleNo: string; topic: string }[] = [];
    for (const q of questions) {
      const stem = q.currentVersion?.stem;
      if (!stem) continue;
      const article = detectArticleNo(stem);
      if (article) updates.push({ id: q.id, articleNo: article, topic: q.topic.name });
    }

    // Özet: konu bazında kaç madde tespiti.
    const byTopic = new Map<string, number>();
    for (const u of updates) byTopic.set(u.topic, (byTopic.get(u.topic) ?? 0) + 1);
    console.log(`Taranan: ${questions.length} soru · Madde tespit edilen: ${updates.length}`);
    for (const [t, n] of [...byTopic.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
      console.log(`  ${t}: ${n}`);
    }

    if (!APPLY) {
      console.log('\nDRY-RUN — yazmak için --apply ile çalıştır.');
      return;
    }

    // 50'lik parçalarla yaz (tek bağlantı, kısa transactionlar).
    let written = 0;
    for (let i = 0; i < updates.length; i += 50) {
      const chunk = updates.slice(i, i + 50);
      await prisma.$transaction(
        chunk.map((u) =>
          prisma.question.update({ where: { id: u.id }, data: { articleNo: u.articleNo } }),
        ),
      );
      written += chunk.length;
      console.log(`  yazıldı: ${written}/${updates.length}`);
    }
    console.log('Backfill tamam.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

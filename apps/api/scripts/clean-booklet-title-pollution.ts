/**
 * Tek seferlik temizlik (Doc 20 EK 2 düzeltmesi): eski parser'ın soru
 * metnine sızdırdığı kitapçık adını ("ZABIT KÂTİBİ A" gibi) mevcut
 * sürümlerin kök/şık metinlerinden söker ve contentHash'i yeniden hesaplar.
 * Idempotent — kirlilik kalmayınca 0 günceller.
 *
 * Çalıştırma: npx ts-node scripts/clean-booklet-title-pollution.ts "ZABIT KÂTİBİ A"
 */
import { PrismaClient } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

const title = process.argv[2] ?? 'ZABIT KÂTİBİ A';

function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function main() {
  const url =
    process.env.DATABASE_URL! +
    (process.env.DATABASE_URL!.includes('?') ? '&' : '?') +
    'connection_limit=1';
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  const re = new RegExp(`\\s*${esc(title)}(?:\\s*\\d{1,3})?`, 'g');
  const clean = (s: string) => s.replace(re, ' ').replace(/\s{2,}/g, ' ').trim();

  const versions = await prisma.questionVersion.findMany({
    where: {
      OR: [{ stem: { contains: title } }, { options: { some: { text: { contains: title } } } }],
    },
    select: {
      id: true,
      stem: true,
      options: { select: { id: true, text: true }, orderBy: { sortOrder: 'asc' } },
    },
  });

  let fixed = 0;
  for (const v of versions) {
    const newStem = clean(v.stem);
    const newOptions = v.options.map((o) => ({ id: o.id, text: clean(o.text) }));
    await prisma.$transaction(async (tx) => {
      for (const o of newOptions) {
        await tx.questionOption.update({ where: { id: o.id }, data: { text: o.text } });
      }
      await tx.questionVersion.update({
        where: { id: v.id },
        data: {
          stem: newStem,
          contentHash: questionFingerprint(newStem, newOptions.map((o) => o.text)),
        },
      });
    });
    fixed++;
  }
  console.log(`Temizlik tamam: "${title}" kirliliği ${fixed} sürümden söküldü, hash'ler yenilendi.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Doc 53 — Üniteyi veritabanına yükle (in_review).
 *
 *   cd apps/api && npx tsx scripts/ozet-yukle.ts <unite.json> [--replace]
 *
 * Doğrulamayı geçmeyen ünite YAZILMAZ (rapor basılır, çıkış 1). --replace: aynı slug varsa
 * eski kartlar silinir, sürüm artar, durum incelemeye döner. Yayın kararı panelden (admin).
 * Admin panelindeki "JSON içe aktar" ile aynı yolu (ozet-ice-aktar.ts) kullanır.
 * DB-yazma penceresi: Supabase pooler sınırı için connection_limit=1'e çevirir.
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import type { SummaryUnitJson } from '../src/modules/summaries/ozet-dogrulayici';
import { importUnit, SummaryImportError } from '../src/modules/summaries/ozet-ice-aktar';

const file = process.argv[2];
if (!file) {
  console.error('kullanım: ozet-yukle.ts <unite.json> [--replace]');
  process.exit(2);
}
const replaceExisting = process.argv.includes('--replace');
const url = (process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });

(async () => {
  const data = JSON.parse(readFileSync(file, 'utf8')) as SummaryUnitJson;
  try {
    const r = await importUnit(prisma, data, { replaceExisting });
    console.log(`Yüklendi: ${r.slug} → ${r.unitId} · ${r.blocks} kart · ${r.totalQuestions} bağlı soru · durum in_review`);
  } catch (e) {
    if (e instanceof SummaryImportError) {
      console.error(`HATA: ${e.message}`);
      for (const b of e.validation?.blocks.filter((x) => !x.ok) ?? []) {
        console.error(`  [${b.index + 1}] ${b.title}`);
        for (const i of b.issues) console.error(`     ✗ ${i}`);
      }
      process.exit(1);
    }
    throw e;
  } finally {
    await prisma.$disconnect();
  }
})();

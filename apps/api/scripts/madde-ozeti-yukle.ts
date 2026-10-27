/**
 * Doc 54 — madde özetlerini veritabanına yükle (in_review).
 *
 *   cd apps/api && npx tsx scripts/madde-ozeti-yukle.ts <ozet.json | dizin> [--replace]
 *
 * Doğrulamayı geçmeyen özet YAZILMAZ (rapor basılır). --replace: aynı maddenin özeti varsa yenilenir,
 * sürüm artar, durum incelemeye döner. Yayın kararı panelden (admin). connection_limit=1.
 */
import { PrismaClient } from '@prisma/client';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import type { ArticleSummaryJson } from '../src/modules/summaries/madde-ozeti-dogrulayici';
import {
  ArticleSummaryImportError,
  importArticleSummary,
} from '../src/modules/summaries/madde-ozeti-ice-aktar';

const target = process.argv[2];
if (!target) {
  console.error('kullanım: madde-ozeti-yukle.ts <ozet.json | dizin> [--replace]');
  process.exit(2);
}
const replaceExisting = process.argv.includes('--replace');
const url = (process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });

(async () => {
  const files = statSync(target).isDirectory()
    ? readdirSync(target)
        .filter((f) => f.endsWith('.json'))
        .sort()
        .map((f) => join(target, f))
    : [target];
  let yuklendi = 0;
  let kusurlu = 0;
  for (const file of files) {
    const s = JSON.parse(readFileSync(file, 'utf8')) as ArticleSummaryJson;
    try {
      const r = await importArticleSummary(prisma, s, { replaceExisting });
      console.log(`✓ ${r.lawSlug} md ${r.articleNo}${r.replaced ? ' (yenilendi)' : ''} → ${r.id}`);
      yuklendi++;
    } catch (e) {
      if (e instanceof ArticleSummaryImportError) {
        console.error(`✗ ${file}: ${e.message}`);
        for (const i of e.validation?.issues ?? []) console.error(`     - ${i}`);
        kusurlu++;
        continue;
      }
      throw e;
    }
  }
  await prisma.$disconnect();
  console.log(`\n${yuklendi} yüklendi · ${kusurlu} kusurlu (yazılmadı) · durum in_review`);
  process.exit(kusurlu ? 1 : 0);
})();

/**
 * Doc 56 — Bilgi kartı destesini veritabanına yükle (in_review).
 *
 *   cd apps/api && npx tsx scripts/kart-yukle.ts <deste.json> [--replace]
 *
 * Doğrulamayı geçmeyen deste YAZILMAZ (rapor basılır, çıkış 1). --replace: aynı konu + ünite +
 * kaynak etiketindeki henüz yayımlanmamış ve çalışılmamış kartlar silinip yeniden yazılır. Yayın
 * kararı panelden (admin, aşama 6). DB-yazma penceresi: connection_limit=1.
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import type { FlashcardDeckJson } from '../src/modules/flashcards/kart-dogrulayici';
import { FlashcardImportError, importDeck } from '../src/modules/flashcards/kart-ice-aktar';

const file = process.argv[2];
if (!file) {
  console.error('kullanım: kart-yukle.ts <deste.json> [--replace]');
  process.exit(2);
}
const replaceExisting = process.argv.includes('--replace');
const url = (process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });

(async () => {
  const data = JSON.parse(readFileSync(file, 'utf8')) as FlashcardDeckJson;
  try {
    const r = await importDeck(prisma, data, { replaceExisting });
    console.log(
      `Yüklendi: konu ${r.topicId}${r.unitId ? ` · ünite ${r.unitId}` : ''} · ${r.created} kart` +
        `${r.removed ? ` (${r.removed} eski kart yenilendi)` : ''} · durum in_review`,
    );
  } catch (e) {
    if (e instanceof FlashcardImportError) {
      console.error(`HATA: ${e.message}`);
      for (const c of e.validation?.cards.filter((x) => !x.ok) ?? []) {
        console.error(`  [${c.index + 1}] ${c.front}`);
        for (const i of c.issues) console.error(`     ✗ ${i}`);
      }
      process.exit(1);
    }
    throw e;
  } finally {
    await prisma.$disconnect();
  }
})();

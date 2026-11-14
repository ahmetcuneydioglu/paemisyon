/**
 * Doc 56 — Bilgi kartı destesini canlı madde metinlerine (kaynak metin destesinde pasajlara) karşı
 * doğrula (yazmaz).
 *
 *   cd apps/api && npx tsx scripts/kart-dogrula.ts <deste.json> [--md]
 *
 * Her kartın referansları ve cevabındaki sayılar madde metnine karşı denetlenir; aynı cevaba
 * giden ikinci kart kusurdur. --md: okunur rapor (standart çıktı). Kusur varsa çıkış 1.
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { resolveDeckBasis } from '../src/modules/flashcards/kart-ice-aktar';
import { validateDeck, type FlashcardDeckJson } from '../src/modules/flashcards/kart-dogrulayici';

const file = process.argv[2];
if (!file) {
  console.error('kullanım: kart-dogrula.ts <deste.json> [--md]');
  process.exit(2);
}
const md = process.argv.includes('--md');
const url = (process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });

(async () => {
  const data = JSON.parse(readFileSync(file, 'utf8')) as FlashcardDeckJson;
  try {
    // Dayanak mevzuat ya da kaynak metin (Doc 56 §12); içe aktarmayla aynı çözümleme.
    const leg = await resolveDeckBasis(prisma, data.deck);
    const byNo = leg.byNo;
    const r = validateDeck(data, byNo);
    if (md) {
      console.log(
        `# ${leg.name} — ${data.cards.length} kart · ${r.ok ? 'geçti' : `${r.fails} kusur`}\n`,
      );
      for (const c of r.cards) {
        console.log(`## ${c.index + 1}. [${c.kind}] ${c.front}${c.ok ? '' : ' — KUSUR'}`);
        for (const l of c.lines) console.log(`- ${l}`);
        console.log('');
      }
    } else {
      console.log(`${r.ok ? 'GEÇTİ' : 'KUSUR'}: ${data.cards.length} kart, ${r.fails} kusur`);
      for (const c of r.cards.filter((x) => !x.ok)) {
        console.log(`  [${c.index + 1}] ${c.front}`);
        for (const i of c.issues) console.log(`     ✗ ${i}`);
      }
    }
    process.exit(r.ok ? 0 : 1);
  } finally {
    await prisma.$disconnect();
  }
})();

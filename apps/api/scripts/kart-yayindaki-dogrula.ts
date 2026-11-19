/**
 * Doc 56 — Bir mevzuatın YAYINDAKİ (ve incelemedeki) bilgi kartlarını CANLI madde metnine karşı yeniden doğrula.
 * SALT OKUNUR; hiçbir şey yazmaz.
 *
 *   cd apps/api && npx tsx scripts/kart-yayindaki-dogrula.ts <kanun-no> [<kanun-no> …]
 *
 * Neden: madde metni betikle temizlendiğinde/tazelendiğinde (`mevzuat-dipnot-temizle`, `mevzuat-madde-tazele`)
 * eskime işareti düşmez (o işareti yalnız paneldeki madde düzenleme servisi koyar). Kartın cevabındaki bir sayı
 * yalnız silinen artıkta geçiyorduysa kart artık yayın kapısından geçmez; bu betik onları listeler
 * (banka turu, 19 Kas 2026). Kapı `kart-toplu-yayin.ts` ile aynıdır: `validateCard` + `loadRefMap`.
 */
import { PrismaClient } from '@prisma/client';
import { validateCard, type FlashcardJson } from '../src/modules/flashcards/kart-dogrulayici';
import { loadRefMap } from '../src/modules/flashcards/kart-kaynak';

const nolar = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!nolar.length) {
  console.error('kullanım: kart-yayindaki-dogrula.ts <kanun-no> [<kanun-no> …]');
  process.exit(2);
}
const url = (process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });

(async () => {
  let toplamKusur = 0;
  try {
    for (const no of nolar) {
      const leg = await prisma.legislation.findFirst({
        where: { deletedAt: null, number: no },
        select: { id: true, name: true },
      });
      if (!leg) {
        console.log(`${no}: mevzuat bulunamadı`);
        continue;
      }
      const byNo = await loadRefMap(prisma, { sourceDocumentId: null, legislationId: leg.id });
      const cards = await prisma.flashcard.findMany({
        where: {
          deletedAt: null,
          status: { in: ['published', 'in_review'] },
          sourceDocumentId: null,
          OR: [{ legislationId: leg.id }, { articles: { some: { lawArticle: { legislationId: leg.id } } } }],
        },
        select: {
          id: true,
          status: true,
          kind: true,
          front: true,
          back: true,
          explanation: true,
          difficulty: true,
          derivedNumbers: true,
          counterNumbers: true,
          articles: { select: { relation: true, lawArticle: { select: { articleNo: true, sortKey: true } } } },
        },
      });
      const kusurlu: string[] = [];
      for (const c of cards) {
        const refs = [...c.articles].sort(
          (a, b) =>
            (a.relation === 'primary' ? -1 : 0) - (b.relation === 'primary' ? -1 : 0) ||
            a.lawArticle.sortKey - b.lawArticle.sortKey,
        );
        const json: FlashcardJson = {
          kind: c.kind,
          front: c.front,
          back: c.back,
          explanation: c.explanation ?? undefined,
          difficulty: c.difficulty,
          articleRefs: refs.map((r) => r.lawArticle.articleNo),
          derivedNumbers: (c.derivedNumbers as FlashcardJson['derivedNumbers']) ?? undefined,
          counterNumbers: c.counterNumbers,
        };
        const v = validateCard(json, 0, byNo);
        if (!v.ok)
          kusurlu.push(
            `  ✗ ${c.id} [${c.status}] md ${json.articleRefs.join(', ')} — ${c.front.slice(0, 70)}\n      ${v.issues.join('; ')}`,
          );
      }
      toplamKusur += kusurlu.length;
      console.log(`${leg.name}: ${cards.length} kart · kusurlu ${kusurlu.length}`);
      for (const k of kusurlu) console.log(k);
    }
  } finally {
    await prisma.$disconnect();
  }
  process.exit(toplamKusur ? 1 : 0);
})();

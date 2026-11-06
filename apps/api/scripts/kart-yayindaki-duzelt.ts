/**
 * Doc 56 — YAYINDAKİ bilgi kartlarını denetim düzeltmesiyle yerinde güncelle (ilerleme korunur).
 *
 *   cd apps/api && npx tsx scripts/kart-yayindaki-duzelt.ts <eski.json> <yeni.json> --kartlar 2,10,13 [--kopya-sil]
 *
 * Eski ve yeni deste aynı sırada aynı kartları taşır; `--kartlar` 1'den başlayan sıra numaralarıdır.
 * Eşleme: ünite + yayında + ESKİ ön yüz metni (tam eşit). Her kart tam 1 satırla eşleşmezse işlem geri alınır.
 * Yalnız metin alanları (front/back/explanation/kind/difficulty/derivedNumbers/counterNumbers) değişir;
 * madde referansları değişmişse bu betik kullanılmaz (kartı çek, yenisini yükle). `--kopya-sil`: aynı ünitede
 * aynı kaynak etiketli, çalışılmamış in_review kopyaları (yanlışlıkla --replace ile yüklenenler) siler.
 * DB-yazma penceresi: connection_limit=1.
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import type { FlashcardDeckJson } from '../src/modules/flashcards/kart-dogrulayici';

const args = process.argv.slice(2);
const kIdx = args.indexOf('--kartlar');
const kartlar =
  kIdx >= 0
    ? args
        .splice(kIdx, 2)[1]
        .split(',')
        .map((x) => Number(x.trim()))
    : [];
const kopyaSil = args.includes('--kopya-sil');
const [eskiPath, yeniPath] = args.filter((a) => !a.startsWith('--'));
if (
  !eskiPath ||
  !yeniPath ||
  !kartlar.length ||
  kartlar.some((n) => !Number.isInteger(n) || n < 1)
) {
  console.error(
    'kullanım: kart-yayindaki-duzelt.ts <eski.json> <yeni.json> --kartlar 2,10,13 [--kopya-sil]',
  );
  process.exit(2);
}
const url = (process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });

(async () => {
  const eski = JSON.parse(readFileSync(eskiPath, 'utf8')) as FlashcardDeckJson;
  const yeni = JSON.parse(readFileSync(yeniPath, 'utf8')) as FlashcardDeckJson;
  if (
    !eski.deck.unitSlug ||
    eski.deck.unitSlug !== yeni.deck.unitSlug ||
    eski.cards.length !== yeni.cards.length
  ) {
    console.error('Eski ve yeni deste aynı üniteyi ve aynı kart sayısını taşımalı.');
    process.exit(2);
  }
  try {
    const unit = await prisma.summaryUnit.findFirst({
      where: { slug: eski.deck.unitSlug, deletedAt: null },
      select: { id: true },
    });
    if (!unit) throw new Error(`Ünite bulunamadı: ${eski.deck.unitSlug}`);
    await prisma.$transaction(async (tx) => {
      for (const n of kartlar) {
        const o = eski.cards[n - 1];
        const y = yeni.cards[n - 1];
        if (!o || !y) throw new Error(`#${n} destede yok`);
        if (o.articleRefs.join('|') !== y.articleRefs.join('|'))
          throw new Error(`#${n} madde referansı değişmiş; bu betik yalnız metin günceller`);
        const r = await tx.flashcard.updateMany({
          where: { summaryUnitId: unit.id, status: 'published', front: o.front },
          data: {
            front: y.front,
            back: y.back,
            explanation: y.explanation ?? null,
            kind: y.kind,
            difficulty: y.difficulty ?? 2,
            derivedNumbers: y.derivedNumbers ?? undefined,
            counterNumbers: y.counterNumbers ?? [],
          },
        });
        if (r.count !== 1) throw new Error(`#${n} yayında ${r.count} satırla eşleşti (1 beklenir)`);
        console.log(`#${n} güncellendi: ${y.front.slice(0, 70)}`);
      }
      if (kopyaSil) {
        const d = await tx.flashcard.deleteMany({
          where: {
            summaryUnitId: unit.id,
            sourceLabel: yeni.deck.sourceLabel,
            status: { in: ['in_review', 'draft'] },
            reviews: { none: {} },
          },
        });
        console.log(`çalışılmamış in_review kopya silindi: ${d.count}`);
      }
    });
    console.log(`Bitti: ${kartlar.length} yayındaki kart yerinde güncellendi.`);
  } finally {
    await prisma.$disconnect();
  }
})();

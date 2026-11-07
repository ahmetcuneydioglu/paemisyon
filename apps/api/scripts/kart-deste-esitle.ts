/**
 * Doc 56 — Prod'daki bir ünitenin kartlarını deste JSON'uyla EŞİTLE (çoğaltmadan).
 *
 *   cd apps/api && npx tsx scripts/kart-deste-esitle.ts <deste.json> [--uygula]
 *
 * Eşleme: ünite + ön yüz metni (tam eşit). Üç işlem:
 *   - destede OLMAYAN prod kartı (in_review / draft / published) → `archived` (yayındaki kart yayından düşer,
 *     kullanıcı ilerlemesi silinmez; Doc 06: silme yok, arşiv var);
 *   - destede olup metni değişen kart → back / explanation / kind / difficulty / derivedNumbers / counterNumbers
 *     yerinde güncellenir (madde referansı değişmişse atlanır ve raporlanır);
 *   - prod'da hiç olmayan deste kartı → raporlanır, YAZILMAZ (yeni kart için kart-yukle.ts kullanılır).
 * `--replace` ile yüklemenin aksine yayındaki kartları çoğaltmaz; kısmen yayınlanmış ünitede güvenli yol budur.
 * Varsayılan kuru çalıştırmadır; `--uygula` ile yazar. DB-yazma penceresi: connection_limit=1.
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import type { FlashcardDeckJson } from '../src/modules/flashcards/kart-dogrulayici';

const args = process.argv.slice(2);
const uygula = args.includes('--uygula');
const file = args.find((a) => !a.startsWith('--'));
if (!file) {
  console.error('kullanım: kart-deste-esitle.ts <deste.json> [--uygula]');
  process.exit(2);
}
const url = (process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });

(async () => {
  const deste = JSON.parse(readFileSync(file, 'utf8')) as FlashcardDeckJson;
  if (!deste.deck.unitSlug) {
    console.error('Deste unitSlug taşımıyor; eşitleme ünite bazlıdır.');
    process.exit(2);
  }
  try {
    const unit = await prisma.summaryUnit.findFirst({
      where: { slug: deste.deck.unitSlug, deletedAt: null },
      select: { id: true },
    });
    if (!unit) throw new Error(`Ünite bulunamadı: ${deste.deck.unitSlug}`);
    const prod = await prisma.flashcard.findMany({
      where: { summaryUnitId: unit.id, status: { in: ['in_review', 'draft', 'published'] } },
      include: { articles: { select: { lawArticle: { select: { articleNo: true } } } } },
    });
    const byFront = new Map(prod.map((c) => [c.front, c]));
    const desteFront = new Set(deste.cards.map((c) => c.front));
    const arsiv = prod.filter((c) => !desteFront.has(c.front));
    const guncelle: { id: string; front: string; data: Record<string, unknown> }[] = [];
    const yeni: string[] = [];
    const atla: string[] = [];
    for (const k of deste.cards) {
      const c = byFront.get(k.front);
      if (!c) {
        yeni.push(k.front);
        continue;
      }
      const refsProd = c.articles
        .map((a) => a.lawArticle.articleNo)
        .sort()
        .join('|');
      if (refsProd !== [...k.articleRefs].sort().join('|')) {
        atla.push(`${k.front.slice(0, 60)} (refs ${refsProd} ≠ ${k.articleRefs.join('|')})`);
        continue;
      }
      const data: Record<string, unknown> = {};
      if (c.back !== k.back) data.back = k.back;
      if ((c.explanation ?? null) !== (k.explanation ?? null))
        data.explanation = k.explanation ?? null;
      if (c.kind !== k.kind) data.kind = k.kind;
      if (c.difficulty !== (k.difficulty ?? 2)) data.difficulty = k.difficulty ?? 2;
      const cn = (k.counterNumbers ?? []).map((n) =>
        typeof n === 'number' ? n : (n as { value: number }).value,
      );
      if (JSON.stringify(c.counterNumbers) !== JSON.stringify(cn)) data.counterNumbers = cn;
      if (JSON.stringify(c.derivedNumbers ?? null) !== JSON.stringify(k.derivedNumbers ?? null))
        data.derivedNumbers = k.derivedNumbers ?? undefined;
      if (Object.keys(data).length) guncelle.push({ id: c.id, front: k.front, data });
    }
    console.log(
      `${deste.deck.unitSlug}: prod ${prod.length} kart · arşivlenecek ${arsiv.length} (yayında ${arsiv.filter((c) => c.status === 'published').length}) · güncellenecek ${guncelle.length} · prod'da olmayan ${yeni.length} · refs farkı ${atla.length}`,
    );
    for (const c of arsiv) console.log(`  arşiv [${c.status}] ${c.front.slice(0, 90)}`);
    for (const g of guncelle)
      console.log(`  güncelle ${Object.keys(g.data).join(',')} :: ${g.front.slice(0, 80)}`);
    for (const y of yeni) console.log(`  YENİ (yazılmadı) :: ${y.slice(0, 80)}`);
    for (const a of atla) console.log(`  ATLANDI :: ${a}`);
    if (!uygula) {
      console.log('Kuru çalıştırma; yazmak için --uygula.');
      return;
    }
    await prisma.$transaction(async (tx) => {
      if (arsiv.length)
        await tx.flashcard.updateMany({
          where: { id: { in: arsiv.map((c) => c.id) } },
          data: { status: 'archived' },
        });
      for (const g of guncelle) await tx.flashcard.update({ where: { id: g.id }, data: g.data });
    });
    console.log(`Uygulandı: ${arsiv.length} arşiv, ${guncelle.length} güncelleme.`);
  } finally {
    await prisma.$disconnect();
  }
})();

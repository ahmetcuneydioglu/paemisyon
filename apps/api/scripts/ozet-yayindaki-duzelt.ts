/**
 * Doc 53 — Yayındaki (ya da incelemedeki) bir ünitenin KARTLARINI yerinde düzelt; yayın durumu ve okuma
 * ilerlemesi korunur.
 *
 *   cd apps/api && npx tsx scripts/ozet-yayindaki-duzelt.ts <unite.json> --kartlar 2,3,7 [--uygula]
 *
 * `ozet-yukle.ts --replace` üniteyi incelemeye geri çeker ve kartları silip yeniden yazar; küçük bir içerik
 * düzeltmesi için bu fazladır. Bu betik paneldeki "kart düzenle" ile aynı kapıyı kullanır: `--kartlar` ünite
 * JSON'undaki 1'den başlayan kart sırasıdır; prod kartı ünite + sıra (`sortOrder`) ile bulunur, türü ve
 * başlığı JSON'la aynı olmalıdır (kaymış sıra yanlış kartı ezmesin). Kart `validateBlock`'tan geçmezse
 * hiçbir şey yazılmaz. Yalnız body ve rows değişir; başlık, madde referansları, sayı alanları ve betik
 * üretimi kartlar (istatistik/köprü) bu betikle değişmez. Tek
 * `summary_block.update_many` denetim kaydı düşer. Varsayılan kuru çalıştırmadır; `--uygula` ile yazar.
 * DB-yazma penceresi: connection_limit=1.
 */
import { Prisma, PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import {
  validateBlock,
  type SummaryBlockJson,
  type SummaryUnitJson,
} from '../src/modules/summaries/ozet-dogrulayici';
import { loadArticleMap } from '../src/modules/summaries/ozet-ice-aktar';

const args = process.argv.slice(2);
const uygula = args.includes('--uygula');
const kIdx = args.indexOf('--kartlar');
const kartlar =
  kIdx >= 0
    ? args
        .splice(kIdx, 2)[1]
        .split(',')
        .map((x) => Number(x.trim()))
    : [];
const file = args.find((a) => !a.startsWith('--'));
if (!file || !kartlar.length || kartlar.some((n) => !Number.isInteger(n) || n < 1)) {
  console.error('kullanım: ozet-yayindaki-duzelt.ts <unite.json> --kartlar 2,3,7 [--uygula]');
  process.exit(2);
}
const url = (process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });

/** jsonb anahtar sırasını korumaz; karşılaştırma anahtarları sıralayarak yapılır. */
const sirali = (v: unknown): string =>
  JSON.stringify(v, (_k, x: unknown) =>
    x && typeof x === 'object' && !Array.isArray(x)
      ? Object.fromEntries(
          Object.entries(x as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)),
        )
      : x,
  );

(async () => {
  const unite = JSON.parse(readFileSync(file, 'utf8')) as SummaryUnitJson;
  try {
    const unit = await prisma.summaryUnit.findFirst({
      where: { slug: unite.unit.slug, deletedAt: null },
      select: { id: true, status: true, legislationId: true },
    });
    if (!unit) throw new Error(`Ünite bulunamadı: ${unite.unit.slug}`);
    const adminler = await prisma.user.findMany({
      where: { roles: { some: { role: { key: 'admin' } } } },
      select: { id: true, email: true },
    });
    if (adminler.length !== 1) throw new Error(`Admin tek değil (${adminler.length}).`);
    const admin = adminler[0];
    const byNo = await loadArticleMap(prisma, unit.legislationId);
    const prod = await prisma.summaryBlock.findMany({
      where: { unitId: unit.id, status: { not: 'archived' } },
      orderBy: { sortOrder: 'asc' },
      include: { articleRefs: { select: { lawArticle: { select: { articleNo: true } } } } },
    });

    const isler: { id: string; n: number; data: Prisma.SummaryBlockUpdateInput }[] = [];
    for (const n of kartlar) {
      const j = unite.blocks[n - 1] as SummaryBlockJson | undefined;
      const p = prod[n - 1];
      if (!j || !p) throw new Error(`#${n} JSON'da ya da prod'da yok`);
      if (p.generated) throw new Error(`#${n} betik üretimi kart; elle düzenlenmez`);
      if (p.type !== j.type || (p.title ?? '') !== (j.title ?? ''))
        throw new Error(
          `#${n} prod kartıyla eşleşmiyor (${p.type} "${p.title}" ≠ ${j.type} "${j.title}")`,
        );
      const refsProd = p.articleRefs
        .map((r) => r.lawArticle.articleNo)
        .sort()
        .join('|');
      if (refsProd !== [...j.articleRefs].sort().join('|'))
        throw new Error(`#${n} madde referansı değişmiş; bu betik yalnız metin günceller`);
      const v = validateBlock(j, n - 1, byNo);
      if (!v.ok) throw new Error(`#${n} doğrulamayı geçmedi: ${v.issues.join('; ')}`);
      const degisen: string[] = [];
      if ((p.body ?? null) !== (j.body ?? null)) degisen.push('body');
      if (sirali(p.rows ?? null) !== sirali(j.rows ?? null)) degisen.push('rows');
      console.log(`#${n} [${p.type}] ${p.title} — değişen: ${degisen.join(', ') || 'yok'}`);
      if (!degisen.length) continue;
      const data: Prisma.SummaryBlockUpdateInput = {};
      if (degisen.includes('body')) data.body = j.body ?? null;
      if (degisen.includes('rows'))
        data.rows = j.rows ? (j.rows as unknown as Prisma.InputJsonValue) : Prisma.JsonNull;
      isler.push({ id: p.id, n, data });
    }
    console.log(`Ünite ${unite.unit.slug} (${unit.status}): ${isler.length} kart güncellenecek.`);
    if (!uygula) {
      console.log('Kuru çalıştırma; yazmak için --uygula.');
      return;
    }
    await prisma.$transaction(async (tx) => {
      for (const i of isler) await tx.summaryBlock.update({ where: { id: i.id }, data: i.data });
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          actorEmail: admin.email,
          action: 'summary_block.update_many',
          entityType: 'summary_unit',
          entityId: unit.id,
          detail: { via: 'scripts/ozet-yayindaki-duzelt.ts', blocks: isler.map((i) => i.id) },
        },
      });
    });
    console.log(
      `Uygulandı: ${isler.length} kart yerinde güncellendi; ünite durumu ${unit.status} kaldı.`,
    );
  } finally {
    await prisma.$disconnect();
  }
})();

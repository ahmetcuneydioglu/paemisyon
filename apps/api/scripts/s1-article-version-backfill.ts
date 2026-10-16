/**
 * Doc 49 S1-B — yayımlı her maddenin bugünkü metnini `law_article_versions` sürüm 1
 * olarak yazar. Sürümü zaten olan madde ATLANIR (idempotent). `LawArticle.text`
 * yetkili kalır; bu tablo tarihçedir. `effective_from` bilinmediği için NULL
 * bırakılır — yürürlük tarihi uydurulmaz; `verified_at = lastVerifiedAt`.
 *
 *   npx tsx scripts/s1-article-version-backfill.ts            (kuru çalışma)
 *   APPLY=1 npx tsx scripts/s1-article-version-backfill.ts    (yazar)
 *
 * CLAUDE.md: tek bağlantı, 200'lük partiler (metinler uzun), backend durmaz.
 */
import { PrismaClient } from '@prisma/client';

const APPLY = process.env.APPLY === '1';
const base = process.env.DATABASE_URL!;
const url = base.includes('connection_limit')
  ? base
  : `${base}${base.includes('?') ? '&' : '?'}connection_limit=1`;
const prisma = new PrismaClient({ datasources: { db: { url } } });

async function main() {
  const secim = {
    id: true,
    text: true,
    sourceName: true,
    sourceUrl: true,
    lastVerifiedAt: true,
    legislation: { select: { slug: true } },
  } as const;
  // Kuru çalışma migration'dan ÖNCE de koşabilsin: tablo yoksa (P2021) süzgeçsiz say.
  const maddeler = await prisma.lawArticle
    .findMany({
      where: { deletedAt: null, status: 'published', versions: { none: {} } },
      select: secim,
    })
    .catch((e: { code?: string }) => {
      if (e.code !== 'P2021') throw e;
      console.log('law_article_versions henüz yok — tüm yayımlı maddeler sayıldı');
      return prisma.lawArticle.findMany({
        where: { deletedAt: null, status: 'published' },
        select: secim,
      });
    });
  const kanunBasina = new Map<string, number>();
  for (const m of maddeler) {
    const k = m.legislation?.slug ?? '(kanunsuz)';
    kanunBasina.set(k, (kanunBasina.get(k) ?? 0) + 1);
  }
  const bosMetin = maddeler.filter((m) => !m.text.trim()).length;

  let yazilan = 0;
  if (APPLY) {
    for (let i = 0; i < maddeler.length; i += 200) {
      const r = await prisma.lawArticleVersion.createMany({
        data: maddeler.slice(i, i + 200).map((m) => ({
          lawArticleId: m.id,
          versionNo: 1,
          text: m.text,
          sourceName: m.sourceName,
          sourceUrl: m.sourceUrl,
          verifiedAt: m.lastVerifiedAt,
        })),
        skipDuplicates: true,
      });
      yazilan += r.count;
    }
  }
  const toplam = await prisma.lawArticleVersion.count().catch((e: { code?: string }) => {
    if (e.code === 'P2021') return null;
    throw e;
  });
  console.log(
    JSON.stringify(
      {
        mod: APPLY ? 'APPLY' : 'dry-run',
        surumsuzYayimliMadde: maddeler.length,
        bosMetin,
        kanunSayisi: kanunBasina.size,
        yazilan,
        tablodaToplam: toplam ?? 'tablo henüz yok',
        kanunBasina: Object.fromEntries([...kanunBasina].sort((a, b) => b[1] - a[1]).slice(0, 15)),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

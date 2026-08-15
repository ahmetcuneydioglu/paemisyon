/**
 * Mevzuat Merkezi geçişi (Doc 29 P0-A): kanun-benzeri Topic'lerden kalıcı
 * `legislation` kayıtları üretir, mevcut law_articles satırlarını bağlar,
 * sortKey doldurur. Idempotent — tekrar çalıştırmak güvenli (slug upsert).
 *   APPLY=1 ile yazar; onsuz dry-run.
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// public.service LAW_NAME_RE + anayasa ("T.C. Anayasası" o desene uymuyor —
// regex-kimlik borcunun kanıtı; kalıcı kayıt tam da bu yüzden gerekiyor).
const LAW_NAME_RE = /sayılı|kanun|yönetmeli|khk|mevzuat|anayasa/i;

// public.service.ts slugify'ın birebir kopyası (URL uyumluluğu ŞART —
// mevcut /kanun/[slug] sayfaları aynı slug'ı üretiyor).
function slugify(s: string): string {
  const map: Record<string, string> = {
    ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u',
    Ç: 'c', Ğ: 'g', İ: 'i', I: 'i', Ö: 'o', Ş: 's', Ü: 'u',
    â: 'a', Â: 'a', î: 'i', û: 'u',
  };
  return s.split('').map((ch) => map[ch] ?? ch).join('')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Deterministik madde sırası: sayısal *100 + harf eki; Ek/Geçici bloğu sona. */
export function articleSortKey(no: string): number {
  const m = /^(Ek|Geçici)?\s*(\d+)(?:\/([A-Z]))?/i.exec(no.trim());
  if (!m) return 9_000_000;
  const base = parseInt(m[2], 10) * 100 + (m[3] ? m[3].toUpperCase().charCodeAt(0) - 64 : 0);
  const prefix = (m[1] ?? '').toLocaleLowerCase('tr');
  if (prefix === 'ek') return 1_000_000 + base;
  if (prefix === 'geçici') return 2_000_000 + base;
  return base;
}

/** Bilinen kanunların kimlik bilgisi (kısaltma + arama takma adları). */
const KNOWN: Record<string, { shortName: string; number?: string; aliases: string[] }> = {
  '2559': { shortName: 'PVSK', number: '2559', aliases: ['pvsk', 'p.v.s.k', 'polis vazife', 'polis vazife ve salahiyet'] },
  '5271': { shortName: 'CMK', number: '5271', aliases: ['cmk', 'c.m.k', 'ceza muhakemesi'] },
  '5237': { shortName: 'TCK', number: '5237', aliases: ['tck', 't.c.k', 'türk ceza kanunu', 'ceza kanunu'] },
  '7068': { shortName: '7068', number: '7068', aliases: ['disiplin', 'kolluk disiplin', 'disiplin kanunu'] },
  '2911': { shortName: '2911', number: '2911', aliases: ['toplantı ve gösteri', 'gösteri yürüyüşleri'] },
  '5442': { shortName: '5442', number: '5442', aliases: ['il idaresi'] },
  '5326': { shortName: '5326', number: '5326', aliases: ['kabahatler'] },
  '6136': { shortName: '6136', number: '6136', aliases: ['ateşli silahlar'] },
  '3201': { shortName: 'ETK', number: '3201', aliases: ['emniyet teşkilat', 'teşkilat kanunu'] },
  '657': { shortName: 'DMK', number: '657', aliases: ['dmk', 'devlet memurları'] },
  '6284': { shortName: '6284', number: '6284', aliases: ['ailenin korunması', 'kadına karşı şiddet'] },
  '2918': { shortName: 'KTK', number: '2918', aliases: ['ktk', 'trafik kanunu', 'karayolları trafik'] },
};

function identityOf(name: string): { shortName: string | null; number: string | null; aliases: string[] } {
  const num = /(\d{3,4})\s*say/i.exec(name)?.[1] ?? null;
  if (num && KNOWN[num]) {
    const k = KNOWN[num];
    return { shortName: k.shortName, number: num, aliases: k.aliases };
  }
  if (/anayasa/i.test(name)) {
    return { shortName: 'Anayasa', number: null, aliases: ['anayasa', 'tc anayasası', '1982 anayasası'] };
  }
  return { shortName: null, number: num, aliases: [] };
}

async function main() {
  const apply = process.env.APPLY === '1';
  const topics = await prisma.topic.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      lawArticles: {
        where: { deletedAt: null },
        select: { id: true, articleNo: true, status: true, sourceUrl: true, lastVerifiedAt: true },
      },
    },
  });
  const lawTopics = topics.filter((t) => LAW_NAME_RE.test(t.name));
  console.log(`kanun-benzeri konu: ${lawTopics.length}`);

  let created = 0;
  let linked = 0;
  for (const t of lawTopics) {
    const slug = slugify(t.name);
    const idn = identityOf(t.name);
    const published = t.lawArticles.filter((a) => a.status === 'published');
    const lastVerified = published
      .map((a) => a.lastVerifiedAt)
      .filter(Boolean)
      .sort()
      .pop() ?? null;
    const sourceUrl = published.find((a) => a.sourceUrl)?.sourceUrl ?? null;

    console.log(
      `${slug} | ${idn.shortName ?? '-'} | no:${idn.number ?? '-'} | madde:${t.lawArticles.length} (yayın:${published.length})`,
    );
    if (!apply) continue;

    const leg = await prisma.legislation.upsert({
      where: { slug },
      update: {
        name: t.name,
        topicId: t.id,
        shortName: idn.shortName,
        number: idn.number,
        aliases: idn.aliases,
      },
      create: {
        slug,
        name: t.name,
        type: /yönetmeli/i.test(t.name) ? 'yonetmelik' : 'kanun',
        number: idn.number,
        shortName: idn.shortName,
        aliases: idn.aliases,
        officialSourceUrl: sourceUrl,
        lastVerifiedAt: lastVerified,
        // Yayınlanmış maddesi olan kanun okunabilir → published.
        status: published.length > 0 ? 'published' : 'draft',
        topicId: t.id,
      },
    });
    created++;

    for (const a of t.lawArticles) {
      await prisma.lawArticle.update({
        where: { id: a.id },
        data: { legislationId: leg.id, sortKey: articleSortKey(a.articleNo) },
      });
      linked++;
    }
  }
  console.log(apply ? `\nlegislation: ${created}, bağlanan madde: ${linked}` : '\n(dry-run — APPLY=1 ile yaz)');
  await prisma.$disconnect();
}
main();

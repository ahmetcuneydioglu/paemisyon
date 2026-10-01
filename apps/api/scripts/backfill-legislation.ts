/**
 * Mevzuat Merkezi kimlik tutarlılığı (Doc 29 P0-A): kanun-benzeri her Topic'in
 * TEK bir kalıcı `legislation` kaydı olmasını ve o kaydın slug'ının web'in
 * ürettiği URL slug'ı (slugify(topic.name)) ile AYNI olmasını sağlar; konunun
 * law_articles satırlarını kayda bağlar; yayın durumunu yansıtır.
 *
 * Neden: web /kanun/[slug] sayfaları slug'ı konu adından türetiyor, /oku ve
 * arama paleti ise `legislation.slug` ile konuşuyor. İkisi ayrışınca sayfa
 * 404 veriyor (1 Eki 2026'da 16 kanun/yönetmelikte görüldü: 8 slug farkı,
 * 7 kayıt yok, 1 madde bağsız).
 *
 * Idempotent — tekrar çalıştırmak güvenli. Çözümleme sırası:
 *   1. topicId ile mevcut kayıt → slug farklıysa YENİDEN ADLANDIR
 *   2. slug ile mevcut, konusuz kayıt → konuya BAĞLA
 *   3. hiçbiri → OLUŞTUR
 * Çakışma (slug başka konunun kaydında) yazılmaz, raporlanır.
 *
 *   APPLY=1 ile yazar; onsuz dry-run (denetim raporu).
 *   DB penceresi kuralı: connection_limit=1 (CLAUDE.md).
 */
import { PrismaClient } from '@prisma/client';

const base = process.env.DATABASE_URL!;
const url = base.includes('connection_limit')
  ? base.replace(/connection_limit=\d+/, 'connection_limit=1')
  : `${base}${base.includes('?') ? '&' : '?'}connection_limit=1`;
const prisma = new PrismaClient({ datasources: { db: { url } } });

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

// Numarasız adlar için ad → kanun no eşlemesi ("Türk Ceza Kanunu" gibi).
const NAME_TO_NUMBER: [RegExp, string][] = [
  [/türk ceza kanunu/i, '5237'],
  [/ceza muhakemesi/i, '5271'],
  [/polis vazife/i, '2559'],
  [/devlet memurları/i, '657'],
];

function identityOf(name: string): { shortName: string | null; number: string | null; aliases: string[] } {
  const num =
    /(\d{3,4})\s*say/i.exec(name)?.[1] ??
    /^(\d{3,4})\s/.exec(name)?.[1] ??
    NAME_TO_NUMBER.find(([re]) => re.test(name))?.[1] ??
    null;
  if (num && KNOWN[num]) {
    const k = KNOWN[num];
    return { shortName: k.shortName, number: num, aliases: k.aliases };
  }
  if (/anayasa/i.test(name) && !/mahkemesi|değişiklik/i.test(name)) {
    return { shortName: 'Anayasa', number: null, aliases: ['anayasa', 'tc anayasası', '1982 anayasası'] };
  }
  return { shortName: null, number: num, aliases: [] };
}

type Durum = 'OK' | 'SLUG_FARKLI' | 'KONUSUZ_KAYIT' | 'KAYIT_YOK' | 'CAKISMA';

async function main() {
  const apply = process.env.APPLY === '1';

  const [topics, legs] = await Promise.all([
    prisma.topic.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        lawArticles: {
          where: { deletedAt: null },
          select: {
            id: true, articleNo: true, status: true, sourceUrl: true,
            lastVerifiedAt: true, legislationId: true, sortKey: true,
          },
        },
      },
    }),
    prisma.legislation.findMany({
      where: { deletedAt: null },
      select: { id: true, slug: true, name: true, topicId: true, status: true, officialSourceUrl: true, lastVerifiedAt: true },
    }),
  ]);
  const lawTopics = topics.filter((t) => LAW_NAME_RE.test(t.name));
  const byTopic = new Map(legs.filter((l) => l.topicId).map((l) => [l.topicId!, l]));
  const bySlug = new Map(legs.map((l) => [l.slug, l]));
  console.log(`kanun-benzeri konu: ${lawTopics.length} · legislation kaydı: ${legs.length}\n`);

  const sayac: Record<Durum, number> = { OK: 0, SLUG_FARKLI: 0, KONUSUZ_KAYIT: 0, KAYIT_YOK: 0, CAKISMA: 0 };
  let renamed = 0, created = 0, attached = 0, linked = 0, published = 0;

  for (const t of lawTopics) {
    const slug = slugify(t.name);
    const idn = identityOf(t.name);
    const pub = t.lawArticles.filter((a) => a.status === 'published');
    const lastVerified = pub.map((a) => a.lastVerifiedAt).filter((d): d is Date => d != null)
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    const sourceUrl = pub.find((a) => a.sourceUrl)?.sourceUrl ?? null;

    const mevcut = byTopic.get(t.id) ?? null;
    const slugSahibi = bySlug.get(slug) ?? null;

    let durum: Durum;
    if (mevcut && mevcut.slug === slug) durum = 'OK';
    else if (mevcut) durum = slugSahibi && slugSahibi.id !== mevcut.id ? 'CAKISMA' : 'SLUG_FARKLI';
    else if (slugSahibi) durum = slugSahibi.topicId == null ? 'KONUSUZ_KAYIT' : 'CAKISMA';
    else durum = 'KAYIT_YOK';
    sayac[durum]++;

    const bagsiz = t.lawArticles.filter((a) => !mevcut || a.legislationId !== mevcut.id).length;
    const yayinUyumsuz = mevcut != null && pub.length > 0 && mevcut.status !== 'published';
    const not = [
      durum !== 'OK' ? durum : '',
      durum === 'SLUG_FARKLI' ? `(${mevcut!.slug} → ${slug})` : '',
      durum === 'CAKISMA' ? `(slug "${slug}" başka kayıtta: ${slugSahibi!.topicId ?? 'konusuz'})` : '',
      bagsiz > 0 ? `madde bağsız:${bagsiz}` : '',
      yayinUyumsuz ? 'yayın durumu geri' : '',
    ].filter(Boolean).join(' ');
    const sessiz = durum === 'OK' && bagsiz === 0 && !yayinUyumsuz;
    if (!sessiz || !apply) {
      console.log(
        `${sessiz ? '  ' : '!!'} ${slug} | ${idn.shortName ?? '-'} | no:${idn.number ?? '-'} | madde:${t.lawArticles.length} (yayın:${pub.length})${not ? ' | ' + not : ''}`,
      );
    }
    if (!apply || durum === 'CAKISMA') continue;

    // Tahribatsız kimlik: tanınmayan kanunda mevcut (elle girilmiş) kimlik korunur.
    const kimlik = {
      ...(idn.shortName ? { shortName: idn.shortName } : {}),
      ...(idn.number ? { number: idn.number } : {}),
      ...(idn.aliases.length > 0 ? { aliases: idn.aliases } : {}),
    };

    let leg: { id: string };
    if (durum === 'OK' || durum === 'SLUG_FARKLI') {
      leg = await prisma.legislation.update({
        where: { id: mevcut!.id },
        data: {
          ...(durum === 'SLUG_FARKLI' ? { slug } : {}),
          name: t.name,
          ...kimlik,
          ...(mevcut!.officialSourceUrl == null && sourceUrl ? { officialSourceUrl: sourceUrl } : {}),
          ...(yayinUyumsuz ? { status: 'published', lastVerifiedAt: mevcut!.lastVerifiedAt ?? lastVerified } : {}),
        },
        select: { id: true },
      });
      if (durum === 'SLUG_FARKLI') renamed++;
      if (yayinUyumsuz) published++;
    } else if (durum === 'KONUSUZ_KAYIT') {
      leg = await prisma.legislation.update({
        where: { id: slugSahibi!.id },
        data: {
          topicId: t.id,
          name: t.name,
          ...kimlik,
          ...(pub.length > 0 && slugSahibi!.status !== 'published' ? { status: 'published', lastVerifiedAt: lastVerified } : {}),
        },
        select: { id: true },
      });
      attached++;
    } else {
      leg = await prisma.legislation.create({
        data: {
          slug,
          name: t.name,
          type: /yönetmeli/i.test(t.name) ? 'yonetmelik' : 'kanun',
          number: idn.number,
          shortName: idn.shortName,
          aliases: idn.aliases,
          officialSourceUrl: sourceUrl,
          lastVerifiedAt: lastVerified,
          // Yayınlanmış maddesi olan kanun okunabilir → published.
          status: pub.length > 0 ? 'published' : 'draft',
          topicId: t.id,
        },
        select: { id: true },
      });
      created++;
    }

    for (const a of t.lawArticles) {
      if (a.legislationId === leg.id) continue;
      await prisma.lawArticle.update({
        where: { id: a.id },
        data: {
          legislationId: leg.id,
          // Daha önce sıralanmış (ör. içe aktarımın verdiği) anahtar korunur.
          ...(a.sortKey === 0 ? { sortKey: articleSortKey(a.articleNo) } : {}),
        },
      });
      linked++;
    }
  }

  // Konusu kanun-benzeri olmayan / konusuz / metinsiz kayıtlar — bilgi amaçlı.
  const lawTopicIds = new Set(lawTopics.map((t) => t.id));
  const yetim = legs.filter((l) => !l.topicId || !lawTopicIds.has(l.topicId));
  if (yetim.length > 0) {
    console.log('\nKonusu kanun-benzeri olmayan ya da konusuz legislation kayıtları (dokunulmadı):');
    for (const l of yetim) {
      const topicName = l.topicId ? topics.find((t) => t.id === l.topicId)?.name ?? '(silinmiş konu)' : '(konusuz)';
      console.log(`   ${l.slug} | ${l.status} | konu: ${topicName}`);
    }
  }

  console.log(`\nözet: ${Object.entries(sayac).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
  console.log(
    apply
      ? `yazıldı: yeniden adlandırılan ${renamed}, oluşturulan ${created}, konuya bağlanan ${attached}, yayına alınan ${published}, bağlanan madde ${linked}`
      : '(dry-run — APPLY=1 ile yaz)',
  );
  await prisma.$disconnect();
}
main();

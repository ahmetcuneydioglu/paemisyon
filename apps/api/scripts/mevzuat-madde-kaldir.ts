/**
 * Banka turu (19 Kas 2026) — İçe aktarım artığı olan MÜKERRER/BOZUK madde satırını kaldır (yumuşak silme).
 *
 * Örnek: 657 "Geçici 32314" — kaynakta "Geçici Madde 32[314]" (dipnot işareti numaraya yapışmış); gerçek
 * Geçici 32 budur, ayrı satır olarak kalması listeyi bozar. Bu betik satırı `deletedAt` ile kaldırır; metni
 * başka satıra taşımak `mevzuat-metin-yama.ts` işidir.
 *
 *   npx tsx scripts/mevzuat-madde-kaldir.ts <plan.json>          (kuru)
 *   npx tsx scripts/mevzuat-madde-kaldir.ts <plan.json> --yaz
 *
 * plan.json: [{ "slug": "<Legislation.slug>", "no": "Geçici 32314", "gerekce": "…" }]
 * Emniyet: maddeye bağlı soru, bilgi kartı, özet kartı, madde özeti ya da kullanıcı vurgusu varsa satır
 * ATLANIR (önce bağlar taşınmalı). Yazmadan önce satır docs/32-yayin-denetimi/kaldir-yedek-<zaman>.json'a
 * alınır, işlem mevzuat-tazeleme.jsonl defterine düşer. DB-yazma penceresi: connection_limit=1.
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync, writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';

const base = process.env.DATABASE_URL!;
const url = base.includes('connection_limit')
  ? base.replace(/connection_limit=\d+/, 'connection_limit=1')
  : `${base}${base.includes('?') ? '&' : '?'}connection_limit=1`;
const p = new PrismaClient({ datasources: { db: { url } } });
const D32 = join(__dirname, '../../../docs/32-yayin-denetimi');

type Satir = { slug: string; no: string; gerekce: string };

(async () => {
  const planYol = process.argv[2];
  if (!planYol || planYol.startsWith('--')) throw new Error('kullanım: mevzuat-madde-kaldir.ts <plan.json> [--yaz]');
  const YAZ = process.argv.includes('--yaz');
  const plan: Satir[] = JSON.parse(readFileSync(planYol, 'utf8'));
  const simdi = new Date();
  const kaldirilacak: { id: string; slug: string; no: string; gerekce: string; satir: unknown }[] = [];
  for (const s of plan) {
    const a = await p.lawArticle.findFirst({
      where: { deletedAt: null, articleNo: s.no, legislation: { slug: s.slug, deletedAt: null } },
      select: { id: true, articleNo: true, title: true, text: true, sortKey: true, status: true, topicId: true, legislationId: true, sectionId: true, sourceUrl: true, effectiveInfo: true },
    });
    if (!a) {
      console.log(`  ? ${s.slug} md ${s.no}: madde bulunamadı — atlandı`);
      continue;
    }
    const bag = {
      soru: await p.questionArticle.count({ where: { lawArticleId: a.id } }),
      eskiEtiketliSoru: await p.question.count({ where: { deletedAt: null, topicId: a.topicId, articleNo: a.articleNo } }),
      kart: await p.flashcardArticle.count({ where: { lawArticleId: a.id } }),
      ozetKarti: await p.summaryBlockArticle.count({ where: { lawArticleId: a.id } }),
      maddeOzeti: await p.articleSummary.count({ where: { lawArticleId: a.id } }),
      vurgu: await p.articleHighlight.count({ where: { lawArticleId: a.id } }),
    };
    const dolu = Object.entries(bag).filter(([, n]) => n > 0);
    if (dolu.length) {
      console.log(`  ! ${s.slug} md ${s.no}: bağlı içerik var (${dolu.map(([k, n]) => `${k} ${n}`).join(', ')}) — atlandı`);
      continue;
    }
    console.log(`  ${s.slug.slice(0, 40)} md ${s.no} («${a.text.slice(0, 70).replace(/\n/g, ' ⏎ ')}») kaldırılacak — ${s.gerekce}`);
    kaldirilacak.push({ id: a.id, slug: s.slug, no: s.no, gerekce: s.gerekce, satir: a });
  }
  console.log(`\n${kaldirilacak.length} madde satırı kaldırılacak`);
  if (!YAZ) {
    console.log('(KURU ÇALIŞMA — --yaz ile uygulanır)');
    return;
  }
  if (!kaldirilacak.length) return;
  const yedek = join(D32, `kaldir-yedek-${simdi.toISOString().slice(0, 19).replace(/:/g, '')}.json`);
  writeFileSync(yedek, JSON.stringify(kaldirilacak, null, 1));
  await p.$transaction(async (tx) => {
    for (const x of kaldirilacak) await tx.lawArticle.update({ where: { id: x.id }, data: { deletedAt: simdi } });
  });
  appendFileSync(
    join(D32, 'mevzuat-tazeleme.jsonl'),
    kaldirilacak.map((x) => JSON.stringify({ zaman: simdi.toISOString(), tur: 'madde-kaldir', mevzuat: x.slug, madde: x.no, gerekce: x.gerekce })).join('\n') + '\n',
  );
  console.log(`✓ ${kaldirilacak.length} satır kaldırıldı · yedek: ${yedek}`);
})().finally(() => p.$disconnect());

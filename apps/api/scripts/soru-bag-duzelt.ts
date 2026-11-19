/**
 * Banka turu (19 Kas 2026) — Yayındaki sorunun MADDE BAĞINI ve/veya AÇIKLAMASINDAKİ bir parçayı düzelt.
 *
 * Soru kökü, şıklar ve anahtar DEĞİŞMEZ (contentHash aynı kalır: parmak izi kök + şıklardan üretilir).
 * Yalnız kullanıcının soru bazında verdiği onayla çalıştırılır.
 *
 *   npx tsx scripts/soru-bag-duzelt.ts <plan.json>          (kuru)
 *   npx tsx scripts/soru-bag-duzelt.ts <plan.json> --yaz
 *
 * plan.json: [{
 *   "soru": "<Question.id öneki>",
 *   "articleNo": "34",                                  // (isteğe bağlı) Question.articleNo — atlas bunu okur
 *   "baglar": [{ "mevzuat": "5326", "no": "34", "relation": "primary" }],   // (isteğe bağlı) verilirse mevcut
 *                                                       //  bağların YERİNE geçer; kaynak 'script' yazılır
 *   "aciklama": { "eski": "…", "yeni": "…" },           // (isteğe bağlı) parça açıklamada tam bir kez geçmeli
 *   "gerekce": "…"
 * }]
 * Yazmadan önce eski durum docs/32-yayin-denetimi/soru-bag-yedek-<zaman>.json'a alınır; işlem
 * docs/32-yayin-denetimi/ilerleme.jsonl defterine düşer. DB-yazma penceresi: connection_limit=1.
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

type Bag = { mevzuat: string; no: string; relation: 'primary' | 'related' };
type Satir = { soru: string; articleNo?: string; baglar?: Bag[]; aciklama?: { eski: string; yeni: string }; gerekce: string };

(async () => {
  const planYol = process.argv[2];
  if (!planYol || planYol.startsWith('--')) throw new Error('kullanım: soru-bag-duzelt.ts <plan.json> [--yaz]');
  const YAZ = process.argv.includes('--yaz');
  const plan: Satir[] = JSON.parse(readFileSync(planYol, 'utf8'));
  const simdi = new Date();
  const isler: { s: Satir; q: any; yeniBag?: { lawArticleId: string; relation: 'primary' | 'related' }[]; yeniAciklama?: string }[] = [];
  for (const s of plan) {
    const adaylar: { id: string }[] = await p.$queryRawUnsafe(
      `select id::text from questions where deleted_at is null and id::text like $1`, `${s.soru}%`);
    if (adaylar.length !== 1) throw new Error(`${s.soru}: ${adaylar.length} soru eşleşti`);
    const q = await p.question.findUniqueOrThrow({
      where: { id: adaylar[0].id },
      select: { id: true, articleNo: true, topicId: true,
        currentVersion: { select: { id: true, status: true, stem: true, explanation: true } },
        articles: { select: { lawArticleId: true, relation: true, source: true, lawArticle: { select: { articleNo: true, legislation: { select: { number: true } } } } } } },
    });
    if (q.currentVersion?.status !== 'published') throw new Error(`${s.soru}: yayında değil`);
    const is: (typeof isler)[number] = { s, q };
    console.log(`\n-- ${s.soru}  ${q.currentVersion.stem.replace(/\s+/g, ' ').slice(0, 110)}`);
    if (s.articleNo !== undefined) console.log(`   articleNo: «${q.articleNo ?? '—'}» → «${s.articleNo}»`);
    if (s.baglar) {
      if (s.baglar.filter((b) => b.relation === 'primary').length !== 1) throw new Error(`${s.soru}: tam bir primary bağ olmalı`);
      is.yeniBag = [];
      for (const b of s.baglar) {
        const a = await p.lawArticle.findFirst({
          where: { deletedAt: null, articleNo: b.no, legislation: { number: b.mevzuat, deletedAt: null } },
          select: { id: true, topicId: true },
        });
        if (!a) throw new Error(`${s.soru}: ${b.mevzuat} md ${b.no} bankada yok`);
        if (b.relation === 'primary' && s.articleNo !== undefined && (a.topicId !== q.topicId || b.no !== s.articleNo))
          throw new Error(`${s.soru}: articleNo ile primary bağ uyuşmuyor (atlas (topicId, articleNo) anahtarını okur)`);
        is.yeniBag.push({ lawArticleId: a.id, relation: b.relation });
      }
      console.log(`   bağ: [${q.articles.map((x) => `${x.lawArticle.legislation?.number}:${x.lawArticle.articleNo}:${x.relation}`).join(', ') || '—'}] → [${s.baglar.map((b) => `${b.mevzuat}:${b.no}:${b.relation}`).join(', ')}]`);
    }
    if (s.aciklama) {
      const e = q.currentVersion.explanation ?? '';
      if (e.split(s.aciklama.eski).length !== 2) throw new Error(`${s.soru}: açıklama parçası tam bir kez geçmiyor`);
      is.yeniAciklama = e.replace(s.aciklama.eski, s.aciklama.yeni);
      console.log(`   açıklama: − «${s.aciklama.eski}»\n             + «${s.aciklama.yeni}»`);
    }
    console.log(`   GEREKÇE: ${s.gerekce}`);
    isler.push(is);
  }
  console.log(`\n${isler.length} soru düzeltilecek`);
  if (!YAZ) {
    console.log('(KURU ÇALIŞMA — --yaz ile uygulanır)');
    return;
  }
  const yedek = join(D32, `soru-bag-yedek-${simdi.toISOString().slice(0, 19).replace(/:/g, '')}.json`);
  writeFileSync(yedek, JSON.stringify(isler.map((i) => ({ plan: i.s, onceki: i.q })), null, 1));
  await p.$transaction(async (tx) => {
    for (const i of isler) {
      if (i.s.articleNo !== undefined) await tx.question.update({ where: { id: i.q.id }, data: { articleNo: i.s.articleNo } });
      if (i.yeniBag) {
        await tx.questionArticle.deleteMany({ where: { questionId: i.q.id } });
        await tx.questionArticle.createMany({ data: i.yeniBag.map((b) => ({ questionId: i.q.id, lawArticleId: b.lawArticleId, relation: b.relation, source: 'script' as const })) });
      }
      if (i.yeniAciklama !== undefined) await tx.questionVersion.update({ where: { id: i.q.currentVersion.id }, data: { explanation: i.yeniAciklama } });
    }
  });
  appendFileSync(
    join(D32, 'ilerleme.jsonl'),
    isler.map((i) => JSON.stringify({ id: i.q.currentVersion.id.slice(0, 8), soru: i.q.id.slice(0, 8), sinif: 'duzeltildi', bulgu: `BAĞ/AÇIKLAMA DÜZELTİLDİ — ${i.s.gerekce}`, zaman: simdi.toISOString() })).join('\n') + '\n',
  );
  console.log(`✓ ${isler.length} soru düzeltildi · yedek: ${yedek}`);
})().finally(() => p.$disconnect());

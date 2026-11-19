/**
 * Banka turu (19 Kas 2026) — Madde BAŞLIK alanına karışmış dipnot artıklarını düzelt.
 *
 * İçe aktarmada bazı maddelerin `title` alanına madde başlığı yerine dipnotun kuyruğu yazılmış
 * ("md.)", "…sayılı Kararı ile.)", "E) (Mülga: …)"). Başlık okuyucuda, "Sınav der ki" kartında ve madde
 * listelerinde görünür. Bu betik yalnız `title` alanını değiştirir; madde METNİNE dokunmaz, bu yüzden
 * eskime işareti de düşmez.
 *
 *   npx tsx scripts/mevzuat-baslik-duzelt.ts <plan.json>          (kuru)
 *   npx tsx scripts/mevzuat-baslik-duzelt.ts <plan.json> --yaz
 *
 * plan.json: [{ "slug": "<Legislation.slug>", "no": "Geçici 9", "eski": "<şimdiki başlık>", "yeni": null | "<başlık>" }]
 * Emniyet: bankadaki başlık plandaki `eski` ile birebir aynı değilse o satır ATLANIR (plan bayat).
 * Yazmadan önce eski başlıklar docs/32-yayin-denetimi/baslik-yedek-<zaman>.json'a alınır, her işlem
 * mevzuat-tazeleme.jsonl defterine düşer. DB-yazma penceresi: connection_limit=1.
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

type Satir = { slug: string; no: string; eski: string | null; yeni: string | null };

(async () => {
  const planYol = process.argv[2];
  if (!planYol || planYol.startsWith('--')) throw new Error('kullanım: mevzuat-baslik-duzelt.ts <plan.json> [--yaz]');
  const YAZ = process.argv.includes('--yaz');
  const plan: Satir[] = JSON.parse(readFileSync(planYol, 'utf8'));
  const simdi = new Date();
  const yazilacak: { id: string; slug: string; no: string; eski: string | null; yeni: string | null }[] = [];
  let atlanan = 0;
  for (const s of plan) {
    const a = await p.lawArticle.findFirst({
      where: { deletedAt: null, articleNo: s.no, legislation: { slug: s.slug, deletedAt: null } },
      select: { id: true, title: true },
    });
    if (!a) {
      console.log(`  ? ${s.slug} md ${s.no}: madde bulunamadı — atlandı`);
      atlanan++;
      continue;
    }
    if ((a.title ?? null) !== (s.eski ?? null)) {
      console.log(`  ! ${s.slug} md ${s.no}: başlık plandakinden farklı («${a.title ?? '—'}») — atlandı`);
      atlanan++;
      continue;
    }
    if ((a.title ?? null) === (s.yeni ?? null)) continue;
    console.log(`  ${s.slug.slice(0, 34)} md ${s.no}: «${a.title ?? '—'}» → ${s.yeni === null ? 'başlıksız' : `«${s.yeni}»`}`);
    yazilacak.push({ id: a.id, slug: s.slug, no: s.no, eski: a.title, yeni: s.yeni });
  }
  console.log(`\n${yazilacak.length} başlık değişecek · atlanan ${atlanan}`);
  if (!YAZ) {
    console.log('(KURU ÇALIŞMA — --yaz ile uygulanır)');
    return;
  }
  if (!yazilacak.length) return;
  const yedek = join(D32, `baslik-yedek-${simdi.toISOString().slice(0, 19).replace(/:/g, '')}.json`);
  writeFileSync(yedek, JSON.stringify(yazilacak, null, 1));
  await p.$transaction(async (tx) => {
    for (const x of yazilacak) await tx.lawArticle.update({ where: { id: x.id }, data: { title: x.yeni } });
  });
  appendFileSync(
    join(D32, 'mevzuat-tazeleme.jsonl'),
    yazilacak.map((x) => JSON.stringify({ zaman: simdi.toISOString(), tur: 'baslik-duzelt', mevzuat: x.slug, madde: x.no })).join('\n') + '\n',
  );
  console.log(`✓ ${yazilacak.length} başlık yazıldı · yedek: ${yedek}`);
})().finally(() => p.$disconnect());

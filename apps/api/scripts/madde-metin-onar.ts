/**
 * Banka madde metninde İÇE AKTARIM ONARIMI: tek bir ibareyi değiştirir ya da metnin sonuna
 * yapışmış artığı (dipnot, sonraki başlık, "işlenemeyen hükümler" kuyruğu) keser.
 *
 * `mevzuat-madde-tazele.ts` kaynağı aynı ayrıştırıcıyla okuduğu için bazı kusurları
 * yeniden üretir (dipnot imiyle biten fıkranın düşmesi, gövdeye yapışan dipnot); bu betik
 * o hâller içindir. Hukuki değişiklik İŞLEMEZ: LawArticleVersion açılmaz, bağlı özet ve
 * kartlar eskitilmez. Yeni metin resmî konsolide metinden elle doğrulanmış olmalıdır.
 *
 * Güvenlik: varsayılan KURU; `eski` ibare / `isaret` metinde TAM BİR KEZ geçmezse durur;
 * yazmadan önce eski satır yedeğe alınır (docs/32-yayin-denetimi/onarim-yedek-<tarih>.json),
 * her işlem docs/32-yayin-denetimi/mevzuat-tazeleme.jsonl defterine düşer.
 *
 *   npx tsx scripts/madde-metin-onar.ts <plan.json>          (kuru)
 *   npx tsx scripts/madde-metin-onar.ts <plan.json> --yaz
 *
 * plan.json: [{ "mevzuat": "<Legislation.name başı>", "no": "12", "gerekce": "…",
 *               "tur": "degistir", "eski": "…", "yeni": "…" }
 *             | { …, "tur": "kes", "isaret": "<bu ibareden itibaren sona kadar silinir>" }]
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync, writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';

const u = new URL(process.env.DATABASE_URL!);
u.searchParams.set('connection_limit', '1');
const p = new PrismaClient({ datasources: { db: { url: u.toString() } } });
const D32 = join(__dirname, '../../../docs/32-yayin-denetimi');

type Is = { mevzuat: string; no: string; gerekce: string } &
  ({ tur: 'degistir'; eski: string; yeni: string } | { tur: 'kes'; isaret: string });

(async () => {
  const YAZ = process.argv.includes('--yaz');
  const plan: Is[] = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const simdi = new Date();
  const hazir: { id: string; mevzuat: string; no: string; eski: string; yeni: string; gerekce: string }[] = [];

  for (const is of plan) {
    const leg = await p.legislation.findFirstOrThrow({
      where: { name: { startsWith: is.mevzuat }, deletedAt: null }, select: { id: true, name: true },
    });
    const a = await p.lawArticle.findFirstOrThrow({
      where: { legislationId: leg.id, articleNo: is.no, deletedAt: null }, select: { id: true, text: true },
    });
    const metin = a.text ?? '';
    const aranan = is.tur === 'degistir' ? is.eski : is.isaret;
    const kac = metin.split(aranan).length - 1;
    if (kac !== 1) throw new Error(`${leg.name} md ${is.no}: aranan ibare ${kac} kez geçiyor (tam bir kez olmalı) — DURDU`);
    const yeni = is.tur === 'degistir'
      ? metin.replace(is.eski, is.yeni)
      : metin.slice(0, metin.indexOf(is.isaret)).replace(/\s+$/, '');
    if (!yeni.trim() || yeni === metin) throw new Error(`${leg.name} md ${is.no}: sonuç boş ya da değişmedi — DURDU`);
    hazir.push({ id: a.id, mevzuat: leg.name, no: is.no, eski: metin, yeni, gerekce: is.gerekce });
    const i = is.tur === 'degistir' ? metin.indexOf(is.eski) : metin.indexOf(is.isaret);
    console.log(`\n~ ${leg.name} md ${is.no} [${is.tur}] ${metin.length} → ${yeni.length} krkt`);
    console.log(`  ESKİ: …${metin.slice(Math.max(0, i - 70), i + aranan.length + 40).replace(/\n/g, ' ⏎ ')}`);
    console.log(`  YENİ: …${yeni.slice(Math.max(0, i - 70), i + 220).replace(/\n/g, ' ⏎ ')}`);
  }

  console.log(`\nTOPLAM: ${hazir.length} onarım`);
  if (!YAZ) { console.log('(KURU ÇALIŞMA — --yaz ile uygulanır)'); return; }

  const yedekYol = join(D32, `onarim-yedek-${simdi.toISOString().slice(0, 10)}.json`);
  writeFileSync(yedekYol, JSON.stringify(hazir.map((x) => ({ id: x.id, mevzuat: x.mevzuat, no: x.no, text: x.eski })), null, 1));
  await p.$transaction(async (tx) => {
    for (const x of hazir) await tx.lawArticle.update({ where: { id: x.id }, data: { text: x.yeni } });
  }, { timeout: 60_000 });
  appendFileSync(join(D32, 'mevzuat-tazeleme.jsonl'), hazir.map((x) => JSON.stringify({
    zaman: simdi.toISOString(), tur: 'onarim', mevzuat: x.mevzuat, madde: x.no, effectiveInfo: x.gerekce,
  })).join('\n') + '\n');
  console.log(`\n✓ yazıldı · yedek: ${yedekYol}`);
})().finally(() => p.$disconnect());

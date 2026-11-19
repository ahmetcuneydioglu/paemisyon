/**
 * Banka turu (19 Kas 2026) — Madde metnine NOKTA ATIŞI yama (elle incelenmiş artık temizliği).
 *
 * `mevzuat-dipnot-temizle` kaynağın temiz gövdesini yazar; kaynağın ayrıştırması bir maddede hatalıysa
 * (657 md 56 ve 2918 md 65/A'da son fıkrayı başlık sanıp kırpıyor) o madde elle yamalanır. Bu betik yalnız
 * planda yazan parçayı değiştirir, metnin geri kalanına dokunmaz; eskime işareti düşmez.
 *
 *   npx tsx scripts/mevzuat-metin-yama.ts <plan.json>          (kuru)
 *   npx tsx scripts/mevzuat-metin-yama.ts <plan.json> --yaz
 *
 * plan.json: [{ "slug": "<Legislation.slug>", "no": "56", "yamalar": [{ "eski": "<metinde TAM BİR KEZ geçen parça>", "yeni": "" }] }]
 * Emniyet: parça metinde tam bir kez geçmiyorsa madde ATLANIR. Vurgular yeni metne taşınır; taşınamayan
 * vurgu varsa madde yazılmaz. Yedek: docs/32-yayin-denetimi/yama-yedek-<zaman>.json; defter: mevzuat-tazeleme.jsonl.
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync, writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import { vurguEsle } from './lib/vurgu-esle';

const base = process.env.DATABASE_URL!;
const p = new PrismaClient({ datasources: { db: { url: base.replace(/connection_limit=\d+/, 'connection_limit=1') } } });
const D32 = join(__dirname, '../../../docs/32-yayin-denetimi');
type Satir = { slug: string; no: string; yamalar: { eski: string; yeni: string }[] };
const kisa = (s: string) => JSON.stringify(s.length > 90 ? `${s.slice(0, 45)}…${s.slice(-40)}` : s);

(async () => {
  const planYol = process.argv[2];
  if (!planYol || planYol.startsWith('--')) throw new Error('kullanım: mevzuat-metin-yama.ts <plan.json> [--yaz]');
  const YAZ = process.argv.includes('--yaz');
  const plan: Satir[] = JSON.parse(readFileSync(planYol, 'utf8'));
  const simdi = new Date();
  const yaz: { id: string; slug: string; no: string; eski: string; yeni: string; vurgular: { id: string; startOffset: number; endOffset: number }[] }[] = [];
  let atlanan = 0;
  for (const s of plan) {
    const a = await p.lawArticle.findFirst({
      where: { deletedAt: null, articleNo: s.no, legislation: { slug: s.slug, deletedAt: null } },
      select: { id: true, text: true, highlights: { select: { id: true, startOffset: true, endOffset: true, snippet: true } } },
    });
    if (!a) { console.log(`  ? ${s.slug} md ${s.no}: madde bulunamadı — atlandı`); atlanan++; continue; }
    let yeni = a.text, hata = '';
    for (const y of s.yamalar) {
      const n = yeni.split(y.eski).length - 1;
      if (n !== 1) { hata = `parça ${n} kez geçiyor: ${kisa(y.eski)}`; break; }
      yeni = yeni.replace(y.eski, () => y.yeni);
    }
    const vurgular: (typeof yaz)[number]['vurgular'] = [];
    if (!hata) for (const h of a.highlights) { const e = vurguEsle(h, a.text, yeni); if (e) vurgular.push({ id: h.id, ...e }); else hata = `vurgu taşınamadı: ${kisa(h.snippet)}`; }
    if (hata) { console.log(`  ! ${s.slug} md ${s.no}: ${hata} — atlandı`); atlanan++; continue; }
    console.log(`  ${s.slug.slice(0, 30)} md ${s.no}: ${a.text.length} → ${yeni.length} krkt · ${s.yamalar.length} yama · ${vurgular.length} vurgu`);
    for (const y of s.yamalar) console.log(`      − ${kisa(y.eski)}${y.yeni ? `\n      + ${kisa(y.yeni)}` : ''}`);
    yaz.push({ id: a.id, slug: s.slug, no: s.no, eski: a.text, yeni, vurgular });
  }
  console.log(`\n${yaz.length} madde yamalanacak · atlanan ${atlanan}`);
  if (!YAZ) { console.log('(KURU ÇALIŞMA — --yaz ile uygulanır)'); return; }
  if (!yaz.length) return;
  const yedek = join(D32, `yama-yedek-${simdi.toISOString().slice(0, 19).replace(/:/g, '')}.json`);
  writeFileSync(yedek, JSON.stringify(yaz.map((x) => ({ id: x.id, mevzuat: x.slug, articleNo: x.no, text: x.eski })), null, 1));
  await p.$transaction(async (tx) => {
    for (const x of yaz) {
      await tx.lawArticle.update({ where: { id: x.id }, data: { text: x.yeni } });
      for (const v of x.vurgular) await tx.articleHighlight.update({ where: { id: v.id }, data: { startOffset: v.startOffset, endOffset: v.endOffset } });
    }
  });
  appendFileSync(join(D32, 'mevzuat-tazeleme.jsonl'), yaz.map((x) => JSON.stringify({ zaman: simdi.toISOString(), tur: 'metin-yama', mevzuat: x.slug, madde: x.no })).join('\n') + '\n');
  console.log(`✓ ${yaz.length} madde yamalandı · yedek: ${yedek}`);
})().finally(() => p.$disconnect());

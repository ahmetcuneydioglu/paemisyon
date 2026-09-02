/**
 * Doc 32 — YAYINEVI KAYNAK ETIKETLERINI KALDIRIR (kullanici karari).
 *
 * sourceLabel istemcide "kaynak" olarak GORUNUR. Sinavdan cikmis sorularda bu
 * bir guven vaadidir ("30 EYLUL 2023 JGK ..."), ama yayinevi kitabindan gelen
 * sorularda kitabin adini gostermek hem istenmiyor hem de telif acisindan
 * gereksiz risk. Bu script YALNIZ yayinevi etiketlerini bosaltir; sinav, kanun
 * ve "Ozgun soru · madde" etiketlerine DOKUNMAZ.
 *
 * Soru metni, siklar, aciklama ve dayanak DEGISMEZ.
 *
 *   npx tsx scripts/kaynak-etiket-temizle.ts          (kuru calisma)
 *   npx tsx scripts/kaynak-etiket-temizle.ts --yaz
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const p = new PrismaClient();
const YEDEK = `${__dirname}/../../../docs/32-yayin-denetimi/kaynak-etiket-yedek.json`;
// Yayinevi adi tasiyan etiketler. Liste ACIK UCLU DEGILDIR: yeni bir yayinevi
// partisi gelirse buraya elle eklenir; genis desen sinav adlarini da silerdi.
const YAYINEVI = ['THEMIS'];

(async () => {
  const YAZ = process.argv.includes('--yaz');
  const rows = await p.questionVersion.findMany({
    where: { sourceLabel: { not: null } },
    select: { id: true, sourceLabel: true, status: true } });
  const hedef = rows.filter((r) => YAYINEVI.some((y) => r.sourceLabel!.toLocaleUpperCase('tr').includes(y)));

  const sayim = new Map<string, number>();
  for (const r of hedef) sayim.set(r.sourceLabel!, (sayim.get(r.sourceLabel!) ?? 0) + 1);
  console.log(`bosaltilacak etiket tasiyan surum: ${hedef.length}`);
  for (const [k, n] of sayim) console.log(`  ${String(n).padStart(4)}  ${k}`);
  console.log(`dokunulmayan etiketli surum: ${rows.length - hedef.length}`);

  if (!YAZ) { console.log('\n(KURU CALISMA — --yaz ile uygulanir)'); return; }
  writeFileSync(YEDEK, JSON.stringify(hedef.map((r) => ({ id: r.id, sourceLabel: r.sourceLabel, status: r.status })), null, 1));
  const r = await p.questionVersion.updateMany({
    where: { id: { in: hedef.map((x) => x.id) } }, data: { sourceLabel: null } });
  console.log(`\nTAMAM: ${r.count} surumun kaynak etiketi bosaltildi. Yedek: ${YEDEK}`);
})().finally(() => p.$disconnect());

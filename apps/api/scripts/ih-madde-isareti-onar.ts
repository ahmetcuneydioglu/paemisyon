/**
 * Doc 33 — gömülü font madde işaretlerini (U+F050 gibi) onarır.
 *
 * İki hedef:
 *   1) Veritabanındaki soru kökleri — panelde kutu, uygulamada soru işareti
 *      olarak görünen PUA karakteri "•" ile değiştirilir, maddeler ALT ALTA
 *      dizilir (web'de whitespace-pre-line, Flutter'da Text zaten \n'i basar).
 *   2) Hat dosyaları (aday-471.json, parti/*-kor.json, kurtarma/parca-*.json)
 *      — henüz bankaya yazılmamış sorular temiz gitsin.
 *
 * Kök değiştiği için contentHash (mükerrer parmak izi) yeniden hesaplanır.
 * Yayındaki sürüm de onarılır: bu bir içerik değişikliği değil, okunamayan
 * karakterin giderilmesidir (Doc 32 "kesin kusur" yaklaşımı). Yedek yazılır.
 *
 *   npx tsx scripts/ih-madde-isareti-onar.ts            # kuru çalışma
 *   APPLY=1 npx tsx scripts/ih-madde-isareti-onar.ts    # uygula
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';
import { maddeListesiniDuzelt, puaVarMi } from './madde-listesi-duzelt';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/33-insan-haklari-partisi';
const APPLY = process.env.APPLY === '1';
const prisma = new PrismaClient();

async function veritabani() {
  const hepsi = await prisma.questionVersion.findMany({
    where: { question: { deletedAt: null } },
    select: { id: true, stem: true, status: true, questionId: true, options: { select: { text: true }, orderBy: { sortOrder: 'asc' } } },
  });
  const hedef = hepsi.filter((x) => puaVarMi(x.stem));
  console.log(`\n── VERİTABANI: ${hedef.length} sürüm onarılacak`);
  const yedek = hedef.map((x) => ({ versionId: x.id, questionId: x.questionId, status: x.status, eskiStem: x.stem }));
  for (const x of hedef) {
    const yeni = maddeListesiniDuzelt(x.stem);
    console.log(`   [${x.status}] ${x.questionId}`);
    console.log(`      ${yeni.split('\n')[0]} …(${yeni.split('\n').length} satır)`);
    if (!APPLY) continue;
    await prisma.questionVersion.update({
      where: { id: x.id },
      data: { stem: yeni, contentHash: questionFingerprint(yeni, x.options.map((o) => o.text)) },
    });
  }
  if (APPLY && hedef.length) {
    writeFileSync(`${KOK}/madde-isareti-yedek.json`, JSON.stringify(yedek, null, 1));
    console.log(`   ✓ ${hedef.length} sürüm güncellendi · yedek: madde-isareti-yedek.json`);
  }
}

function dosyalar() {
  const yollar = [
    `${KOK}/aday-471.json`,
    ...readdirSync(`${KOK}/parti`).filter((f) => /-kor\.json$/.test(f)).map((f) => `${KOK}/parti/${f}`),
    ...readdirSync(`${KOK}/kurtarma`).filter((f) => /\.json$/.test(f)).map((f) => `${KOK}/kurtarma/${f}`),
  ];
  let toplam = 0;
  for (const yol of yollar) {
    const ham = readFileSync(yol, 'utf8');
    if (!puaVarMi(ham)) continue;
    const veri = JSON.parse(ham);
    let n = 0;
    const gez = (o: any) => {
      if (Array.isArray(o)) return o.forEach(gez);
      if (!o || typeof o !== 'object') return;
      for (const [k, v] of Object.entries(o)) {
        if (typeof v === 'string' && puaVarMi(v)) { o[k] = maddeListesiniDuzelt(v); n++; }
        else gez(v);
      }
    };
    gez(veri);
    console.log(`   ${String(n).padStart(3)} alan · ${yol.replace(KOK + '/', '')}`);
    toplam += n;
    if (APPLY) writeFileSync(yol, JSON.stringify(veri, null, 1));
  }
  console.log(`── DOSYALAR: ${toplam} metin alanı onarılacak`);
}

async function main() {
  console.log(APPLY ? 'MOD: UYGULA' : 'MOD: KURU ÇALIŞMA');
  console.log('\n── HAT DOSYALARI');
  dosyalar();
  await veritabani();
  if (!APPLY) console.log('\n(APPLY=1 ile uygulanır)');
}
main().finally(() => prisma.$disconnect());

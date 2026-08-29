/**
 * Defterdeki `oneri_aciklama` kayıtlarını sorulara uygular.
 *
 * GÜVENLİK KURALLARI:
 *  - Yalnız açıklaması BOŞ olan soruya yazar; mevcut açıklamanın üzerine YAZMAZ.
 *  - Metin Türkçe karakter taşımıyorsa reddeder (defter notu ile kullanıcı metni
 *    karışmasın diye — bu hata bir kez yapılmıştı).
 *  - contentHash DEĞİŞMEZ: parmak izi kök + şık metinlerinden üretilir,
 *    açıklama fingerprint'e girmez.
 *  - Yazmadan önce eski durumu yedekler.
 *
 *   npx tsx scripts/oneri-aciklama-uygula.ts            (kuru çalışma)
 *   npx tsx scripts/oneri-aciklama-uygula.ts --yaz
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync, writeFileSync } from 'fs';

const p = new PrismaClient();
const KLASOR = `${__dirname}/../../../docs/32-yayin-denetimi`;
const TR = /[çğıöşüÇĞİÖŞÜâîû]/;

(async () => {
  const YAZ = process.argv.includes('--yaz');

  // Defter: son kayit gecerli
  const son = new Map<string, any>();
  for (const l of readFileSync(`${KLASOR}/ilerleme.jsonl`, 'utf-8').split('\n')) {
    if (!l.trim()) continue;
    const o = JSON.parse(l);
    son.set(String(o.id).slice(0, 8), o);
  }
  const oneriler = [...son.values()].filter((o) => o.oneri_aciklama);
  console.log(`defterde oneri_aciklama tasiyan kayit: ${oneriler.length}`);

  const rows = await p.questionVersion.findMany({
    where: { status: 'published', question: { deletedAt: null } },
    select: { id: true, stem: true, explanation: true,
      question: { select: { topic: { select: { name: true } } } } },
  });

  const plan: Array<{ r: (typeof rows)[number]; metin: string }> = [];
  const atlanan: string[] = [];

  for (const o of oneriler) {
    const r = rows.find((x) => x.id.startsWith(String(o.id).slice(0, 8)));
    if (!r) { atlanan.push(`${o.id}: yayinda bulunamadi`); continue; }
    if (r.explanation?.trim()) { atlanan.push(`${o.id}: ZATEN ACIKLAMASI VAR, dokunulmadi`); continue; }
    const metin = String(o.oneri_aciklama).trim();
    if (!TR.test(metin)) { atlanan.push(`${o.id}: metin Turkce karakter tasimiyor, REDDEDILDI`); continue; }
    if (metin.length < 60) { atlanan.push(`${o.id}: metin cok kisa (${metin.length}), REDDEDILDI`); continue; }
    plan.push({ r, metin });
  }

  console.log(`uygulanacak : ${plan.length}`);
  console.log(`atlanan     : ${atlanan.length}`);
  for (const a of atlanan) console.log(`   - ${a}`);

  console.log(`\n=== ORNEK (ilk 3) ===`);
  for (const x of plan.slice(0, 3)) {
    console.log(`\n-- ${x.r.id.slice(0, 8)} [${x.r.question.topic?.name}]`);
    console.log(`   SORU : ${x.r.stem.replace(/\s+/g, ' ').slice(0, 110)}`);
    console.log(`   ACIK : ${x.metin.slice(0, 220)}...`);
  }

  if (!YAZ) { console.log('\n(KURU CALISMA — --yaz ile uygulanir)'); return; }

  writeFileSync(`${KLASOR}/aciklama-yedek.json`,
    JSON.stringify(plan.map((x) => ({ versiyonId: x.r.id, eskiAciklama: x.r.explanation })), null, 1));

  let n = 0;
  for (const x of plan) {
    await p.questionVersion.update({ where: { id: x.r.id }, data: { explanation: x.metin } });
    n++;
  }
  console.log(`\nYAZILDI: ${n} soruya aciklama eklendi.`);
})().finally(() => p.$disconnect());

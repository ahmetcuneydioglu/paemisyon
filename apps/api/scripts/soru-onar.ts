/**
 * Doc 32 — SORU ONARICI. Denetimde kusurlu cikip ONARILABILIR olan sorular icin.
 *
 * Arsivleme son caredir: soru tumuyle gecersizse (mevzuat degisti, hicbir sik
 * dogru degil) uygulanir. Ama bazi kusurlar tek bir alanin duzeltilmesiyle
 * kapanir — yanlis isaretlenmis cevap anahtari, ya da mevzuat degisikligi
 * yuzunden yanlisa donmus TEK bir sik metni. Bu durumda soruyu silmek bankayi
 * gereksiz yere kucultur.
 *
 * GUVENLIK:
 *  - Her degisiklik ONCE yedeklenir (onarim-yedek.json).
 *  - Cevap anahtari tasinirken yeni dogru sik TEK olmak zorundadir; birden fazla
 *    isCorrect kalirsa islem iptal edilir.
 *  - Sinavda kullanilmis soruda sik METNI degistirilmez (gecmis sonucun anlami
 *    bozulur); yalniz uyarir. Cevap anahtari tasima da ayni sekilde engellenir.
 *  - Deftere yazar.
 *
 *   npx tsx scripts/soru-onar.ts          (kuru calisma)
 *   npx tsx scripts/soru-onar.ts --yaz
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync, appendFileSync } from 'fs';

const p = new PrismaClient();
const YEDEK = `${__dirname}/../../../docs/32-yayin-denetimi/onarim-yedek.json`;
const DEFTER = `${__dirname}/../../../docs/32-yayin-denetimi/ilerleme.jsonl`;

type Onarim =
  | { id: string; tur: 'cevap'; yeniDogruHarf: string; gerekce: string }
  | { id: string; tur: 'sikMetni'; harf: string; yeniMetin: string; gerekce: string };

const O: Onarim[] = [
  // Onarim kayitlari her kosuda doldurulur; ornekler icin onarim-yedek.json.
];


(async () => {
  const YAZ = process.argv.includes('--yaz');
  const rows = await p.questionVersion.findMany({
    where: { status: 'published', question: { deletedAt: null } },
    select: {
      id: true, stem: true, _count: { select: { examQuestions: true } },
      question: { select: { topic: { select: { name: true } } } },
      options: { select: { id: true, label: true, text: true, isCorrect: true }, orderBy: { sortOrder: 'asc' } },
    },
  });

  const plan: Array<{ o: Onarim; r: (typeof rows)[number] }> = [];
  for (const o of O) {
    const r = rows.find((x) => x.id.startsWith(o.id));
    if (!r) { console.log(`!! ${o.id} yayinda bulunamadi — atlandi`); continue; }
    if (r._count.examQuestions > 0) {
      console.log(`!! ${o.id} SINAVDA KULLANILMIS (${r._count.examQuestions}) — onarim yapilmaz, elle karar verilmeli`);
      continue;
    }
    if (o.tur === 'cevap') {
      const hedef = r.options.find((x) => x.label === o.yeniDogruHarf);
      if (!hedef) { console.log(`!! ${o.id} icin ${o.yeniDogruHarf} sikki yok — atlandi`); continue; }
      if (hedef.isCorrect) { console.log(`   ${o.id} zaten ${o.yeniDogruHarf} isaretli — atlandi`); continue; }
    } else {
      const hedef = r.options.find((x) => x.label === o.harf);
      if (!hedef) { console.log(`!! ${o.id} icin ${o.harf} sikki yok — atlandi`); continue; }
      if (hedef.text.trim() === o.yeniMetin.trim()) { console.log(`   ${o.id} ${o.harf} zaten guncel — atlandi`); continue; }
    }
    plan.push({ o, r });
    console.log(`\n-- ${o.id}  [${r.question.topic?.name}]`);
    console.log(`   ${r.stem.replace(/\s+/g, ' ').slice(0, 120)}`);
    for (const x of r.options) {
      const yeni = o.tur === 'cevap'
        ? (x.label === o.yeniDogruHarf ? ' <= YENI DOGRU' : (x.isCorrect ? ' <= eski dogru, kaldirilacak' : ''))
        : (x.label === o.harf ? ' <= METIN DEGISECEK' : '');
      console.log(`     ${x.label}${x.isCorrect ? ' [X]' : '   '} ${x.text.replace(/\s+/g, ' ').slice(0, 95)}${yeni}`);
    }
    if (o.tur === 'sikMetni') console.log(`     YENI ${o.harf}: ${o.yeniMetin}`);
  }

  console.log(`\nonarilacak: ${plan.length} / ${O.length}`);
  if (!YAZ) { console.log('(KURU CALISMA — --yaz ile uygulanir)'); return; }
  if (!plan.length) return;

  writeFileSync(YEDEK, JSON.stringify(plan.map((x) => ({
    id: x.r.id, onarim: x.o, oncekiSiklar: x.r.options,
  })), null, 1));

  const simdi = new Date();
  for (const { o, r } of plan) {
    await p.$transaction(async (tx) => {
      if (o.tur === 'cevap') {
        for (const x of r.options) {
          const olmali = x.label === o.yeniDogruHarf;
          if (x.isCorrect !== olmali) await tx.questionOption.update({ where: { id: x.id }, data: { isCorrect: olmali } });
        }
        // Guvenlik: tek dogru sik kaldigini DOGRULA.
        const sonra = await tx.questionOption.count({ where: { questionVersionId: r.id, isCorrect: true } });
        if (sonra !== 1) throw new Error(`${o.id}: onarim sonrasi dogru sik sayisi ${sonra} — geri alindi`);
      } else {
        const hedef = r.options.find((x) => x.label === o.harf)!;
        await tx.questionOption.update({ where: { id: hedef.id }, data: { text: o.yeniMetin } });
      }
    });
    console.log(`ONARILDI: ${o.id} [${o.tur}]`);
  }

  appendFileSync(DEFTER, plan.map(({ o, r }) => JSON.stringify({
    id: r.id.slice(0, 8),
    konu: r.question.topic?.name ?? null,
    dayanak: `onarim: ${o.tur}`,
    sinif: 'duzeltilerek',
    bulgu: `ONARILDI (${o.tur}) — ${o.gerekce}`,
    zaman: simdi.toISOString(),
  })).join('\n') + '\n');
  console.log(`\nTOPLAM: ${plan.length} soru onarildi. Yedek: ${YEDEK}`);
})().finally(() => p.$disconnect());

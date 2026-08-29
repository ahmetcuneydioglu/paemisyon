/**
 * Denetim sırasında DOĞRULANMIŞ madde bağlantılarını question.articleNo alanına yazar.
 *
 * Buraya yalnız resmî metinle karşılaştırılıp dayanağı kesinleşen sorular girer;
 * öneri motorunun (madde-oner.ts / oneri-grup.ts) çıktısı tek başına yeterli değildir.
 * Soru içeriğine DOKUNMAZ — yalnız metadata.
 *
 *   npx tsx scripts/articleno-bagla.ts            (kuru çalışma)
 *   npx tsx scripts/articleno-bagla.ts --yaz
 */
import { PrismaClient } from '@prisma/client';
import { appendFileSync } from 'fs';

const p = new PrismaClient();
const YEDEK = `${__dirname}/../../../docs/32-yayin-denetimi/articleno-yedek.jsonl`;

// [soru id oneki, konu adi parcasi, articleNo]
const B: Array<[string, string, string]> = [
  // [soru id oneki, konu adi parcasi, articleNo] — her kosuda doldurulur.
];

(async () => {
  const YAZ = process.argv.includes('--yaz');

  const rows = await p.questionVersion.findMany({
    where: { status: 'published', question: { deletedAt: null } },
    select: { id: true, questionId: true, stem: true,
      question: { select: { articleNo: true, topic: { select: { name: true } } } } },
  });

  const plan = [];
  for (const [onek, konu, madde] of B) {
    const r = rows.find((x) => x.id.startsWith(onek));
    if (!r) { console.log(`!! ${onek} bulunamadi`); continue; }
    if (!(r.question.topic?.name ?? '').includes(konu)) {
      console.log(`!! ${onek} konu uyusmuyor: ${r.question.topic?.name}`); continue;
    }
    if (r.question.articleNo === madde) { console.log(`   ${onek} zaten m.${madde}`); continue; }
    if (r.question.articleNo) {
      console.log(`!! ${onek} zaten BASKA maddeye bagli (m.${r.question.articleNo}); atlandi`); continue;
    }
    plan.push({ r, madde });
    console.log(`  ${onek}  ->  m.${madde}   ${r.stem.replace(/\s+/g, ' ').slice(0, 90)}`);
  }

  console.log(`\nbaglanacak: ${plan.length}`);
  if (!YAZ) { console.log('(KURU CALISMA — --yaz ile uygulanir)'); return; }

  appendFileSync(YEDEK, plan.map((x) => JSON.stringify({
    versiyonId: x.r.id, questionId: x.r.questionId, eskiArticleNo: null, yeniArticleNo: x.madde,
  })).join('\n') + '\n');

  for (const x of plan) {
    await p.question.update({ where: { id: x.r.questionId }, data: { articleNo: x.madde } });
  }
  console.log(`YAZILDI: ${plan.length} soru baglandi`);
})().finally(() => p.$disconnect());

/**
 * Doc 32 — DENETIM SONUCU ARSIVLEME.
 *
 * Yayindan kaldirilmasi gereken sorulari arsivler. Iki mesru gerekce vardir:
 *   ESKIME  — mevzuat degisti, isaretli cevap artik yururlukteki metne uymuyor
 *             ve kok onarilabilir degil (onarim soruyu bambaska bir soru yapar).
 *   KAYNAKSIZ — sorunun dayanagi bankada yok ve temin edilemiyor; "gercek,
 *             kaynakli soru" vaadi kaynaksiz soruyu tasiyamaz.
 *
 * Desen Doc 31/32 ile ayni: surum archived + soru soft delete. ExamQuestion
 * questionVersionId'ye FK ile bagli oldugundan SURUM SATIRI SILINMEZ; gecmis
 * sinav sonuclari bozulmaz. Sinavda kullanilmis sorular ayrica raporlanir.
 *
 *   npx tsx scripts/soru-arsivle.ts            (kuru calisma)
 *   npx tsx scripts/soru-arsivle.ts --yaz
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync, appendFileSync } from 'fs';

const p = new PrismaClient();
const YEDEK = `${__dirname}/../../../docs/32-yayin-denetimi/arsiv-yedek.json`;

// [soru id oneki, sinif, gerekce]
const A: Array<[string, 'eskime' | 'kaynaksiz' | 'bozuk', string]> = [
  // [soru id oneki, sinif, gerekce] — her kosuda doldurulur.
];

(async () => {
  const YAZ = process.argv.includes('--yaz');

  const rows = await p.questionVersion.findMany({
    where: { status: 'published', question: { deletedAt: null } },
    select: { id: true, questionId: true, stem: true, explanation: true, sourceLabel: true,
      _count: { select: { examQuestions: true } },
      options: { select: { label: true, text: true, isCorrect: true }, orderBy: { sortOrder: 'asc' } },
      question: { select: { articleNo: true, topic: { select: { name: true } } } } },
  });

  const plan = [];
  for (const [onek, sinif, gerekce] of A) {
    const r = rows.find((x) => x.id.startsWith(onek));
    if (!r) { console.log(`!! ${onek} yayinda bulunamadi — atlandi`); continue; }
    plan.push({ r, sinif, gerekce });
    console.log(`\n-- ${onek}  [${sinif}]  ${r.question.topic?.name}`);
    console.log(`   ${r.stem.replace(/\s+/g, ' ').slice(0, 130)}`);
    console.log(`   kaynak: ${r.sourceLabel} | sinavda kullanim: ${r._count.examQuestions}`);
    if (r._count.examQuestions > 0)
      console.log(`   NOT: ${r._count.examQuestions} sinavda kullanilmis — surum satiri KORUNUYOR, gecmis sonuclar bozulmaz.`);
    console.log(`   GEREKCE: ${gerekce.slice(0, 220)}`);
  }

  const sayim = plan.reduce((a: Record<string, number>, x) => ({ ...a, [x.sinif]: (a[x.sinif] ?? 0) + 1 }), {});
  console.log(`\narsivlenecek: ${plan.length} / ${A.length}  ${JSON.stringify(sayim)}`);
  if (!YAZ) { console.log('(KURU CALISMA — --yaz ile uygulanir)'); return; }

  writeFileSync(YEDEK, JSON.stringify(plan.map((x) => ({
    sinif: x.sinif, gerekce: x.gerekce, arsivlenen: { ...x.r, _count: undefined },
  })), null, 1));

  const simdi = new Date();
  for (const x of plan) {
    await p.$transaction(async (tx) => {
      await tx.questionVersion.update({ where: { id: x.r.id }, data: { status: 'archived', archivedAt: simdi } });
      await tx.question.update({ where: { id: x.r.questionId }, data: { deletedAt: simdi, currentVersionId: null } });
    });
    console.log(`arsivlendi: ${x.r.id.slice(0, 8)}  [${x.sinif}]`);
  }
  // DEFTERE YAZ. Bu adim onceden YOKTU ve iki kez ayni karisikliga yol acti:
  // arsivlenmis sorular defterde hala 'belirsiz' gorunuyordu, ben de "arsivlenmesi
  // gerekenler kalmis" diye yanlis rapor verdim. Arsivleme ile defter kaydi ayni
  // islemde olmali; aksi halde iki kaynak birbirinden ayrisiyor.
  const DEFTER = `${__dirname}/../../../docs/32-yayin-denetimi/ilerleme.jsonl`;
  const satirlar = plan.map((x) => JSON.stringify({
    id: x.r.id.slice(0, 8),
    konu: x.r.question.topic?.name ?? null,
    dayanak: `arsiv: ${x.sinif}`,
    sinif: 'arsivlendi',
    bulgu: `ARSIVLENDI (${x.sinif}) — ${x.gerekce}`,
    zaman: simdi.toISOString(),
  }));
  appendFileSync(DEFTER, satirlar.join('\n') + '\n');
  console.log(`deftere yazildi: ${satirlar.length} kayit`);

  console.log(`\nTOPLAM: ${plan.length} soru arsivlendi. Yedek: ${YEDEK}`);
})().finally(() => p.$disconnect());

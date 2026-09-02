/**
 * Doc 32 — DENETIMDEN GECEMEYEN, HIC YAYINLANMAMIS SORULARI ARSIVLER.
 *
 * soru-arsivle.ts YAYINDAKI soruyu geri ceker; bu script ise in_review
 * kuyrugunda kalmis, hic yayinlanmamis sorular icindir. Ikisi ayri tutuldu
 * cunku yayindaki soruyu geri cekmek kullaniciya gorunen bir degisikliktir,
 * kuyruktakini elemek degildir.
 *
 * Gerekce: denetimde "belirsiz" (yururlukteki mevzuattan kanitlanamiyor) ya da
 * "kusurlu" cikan sorular. Banka "gercek, kaynakli soru" vaadi tasidigi icin
 * kanitlanamayan soru bankaya girmez.
 *
 * Surum satiri SILINMEZ (ExamQuestion FK'si ve denetim izi korunur);
 * status=archived + question.deletedAt yazilir. Deftere islenir.
 *
 *   npx tsx scripts/kuyruk-arsivle.ts --id <8hane> [--id ...] --gerekce "..." [--yaz]
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync, appendFileSync } from 'fs';

const p = new PrismaClient();
const KLASOR = `${__dirname}/../../../docs/32-yayin-denetimi`;

(async () => {
  const YAZ = process.argv.includes('--yaz');
  const idler = process.argv.reduce<string[]>((a, x, i) =>
    process.argv[i - 1] === '--id' ? [...a, x] : a, []);
  const gi = process.argv.indexOf('--gerekce');
  const gerekce = gi === -1 ? 'denetimden gecemedi' : process.argv[gi + 1];
  if (!idler.length) { console.log('--id ile en az bir soru onegi ver'); return; }

  const rows = await p.questionVersion.findMany({
    where: { status: 'in_review', question: { deletedAt: null } },
    select: { id: true, questionId: true, stem: true, explanation: true, sourceLabel: true,
      _count: { select: { examQuestions: true } },
      options: { select: { label: true, text: true, isCorrect: true }, orderBy: { sortOrder: 'asc' } },
      question: { select: { topic: { select: { name: true } } } } } });

  const plan = [];
  for (const onek of idler) {
    const r = rows.find((x) => x.id.startsWith(onek));
    if (!r) { console.log(`!! ${onek} kuyrukta bulunamadi — atlandi`); continue; }
    if (r._count.examQuestions > 0) {
      console.log(`!! ${onek} sinavda kullanilmis — elle karar verilmeli, atlandi`); continue;
    }
    plan.push(r);
    console.log(`  ${onek}  [${r.question.topic?.name}]  ${r.stem.replace(/\s+/g, ' ').slice(0, 62)}`);
  }

  console.log(`\narsivlenecek: ${plan.length} / ${idler.length}`);
  console.log(`gerekce: ${gerekce}`);
  if (!YAZ) { console.log('(KURU CALISMA — --yaz ile uygulanir)'); return; }
  if (!plan.length) return;

  writeFileSync(`${KLASOR}/kuyruk-arsiv-yedek.json`,
    JSON.stringify(plan.map((r) => ({ ...r, _count: undefined })), null, 1));

  const simdi = new Date();
  for (const r of plan) {
    await p.$transaction(async (tx) => {
      await tx.questionVersion.update({ where: { id: r.id },
        data: { status: 'archived', archivedAt: simdi } });
      await tx.question.update({ where: { id: r.questionId },
        data: { deletedAt: simdi, currentVersionId: null } });
    });
    console.log(`ARSIVLENDI: ${r.id.slice(0, 8)}`);
  }

  appendFileSync(`${KLASOR}/ilerleme.jsonl`, plan.map((r) => JSON.stringify({
    id: r.id.slice(0, 8), konu: r.question.topic?.name ?? null,
    dayanak: null, sinif: 'arsivlendi',
    bulgu: `KUYRUKTAN ARSIVLENDI (hic yayinlanmadi) — ${gerekce}`,
    zaman: simdi.toISOString(),
  })).join('\n') + '\n');
  console.log(`\nTOPLAM: ${plan.length} soru arsivlendi. Yedek: ${KLASOR}/kuyruk-arsiv-yedek.json`);
})().finally(() => p.$disconnect());

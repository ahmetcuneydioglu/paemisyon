/**
 * Yanlislikla arsivlenmis soruyu YAYINA geri alir (arsivleme deseninin tersi).
 * Yalniz gerekcesi cürütülmüs kayitlar icin; her geri alis deftere yazilir.
 *   npx tsx scripts/arsiv-geri-al.ts <id-oneki> ["gerekce"]  [--yaz]
 */
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const onek = process.argv[2];
  const YAZ = process.argv.includes('--yaz');
  const rows = await p.questionVersion.findMany({
    where: { status: 'archived' },
    select: { id: true, questionId: true, stem: true, question: { select: { deletedAt: true, currentVersionId: true } } } });
  const r = rows.find((x) => x.id.startsWith(onek));
  if (!r) { console.log(`!! ${onek} arsivde bulunamadi`); return; }
  console.log(`${onek}: ${r.stem.replace(/\s+/g, ' ').slice(0, 100)}`);
  if (!YAZ) { console.log('(KURU CALISMA — --yaz ile uygulanir)'); return; }
  await p.$transaction(async (tx) => {
    await tx.questionVersion.update({ where: { id: r.id }, data: { status: 'published', archivedAt: null } });
    await tx.question.update({ where: { id: r.questionId }, data: { deletedAt: null, currentVersionId: r.id } });
  });
  console.log(`YAYINA GERI ALINDI: ${onek}`);
})().finally(() => p.$disconnect());

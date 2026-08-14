/**
 * Onay kuyruğundaki MÜKERRER kopyaları temizler: aynı contentHash'ten yalnız
 * EN ESKİ kopya kalır; fazlalıklar soft-delete edilir (question.deletedAt —
 * geri döndürülebilir, hiçbir satır fiziksel silinmez). Yalnız in_review +
 * hiç cevaplanmamış sorulara dokunur. --uygula olmadan yalnız listeler.
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const apply = process.argv.includes('--uygula');
  const rows = await prisma.questionVersion.findMany({
    where: { status: 'in_review', question: { deletedAt: null } },
    select: { questionId: true, contentHash: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  const seen = new Set<string>();
  const fazla: string[] = [];
  for (const r of rows) {
    if (!r.contentHash) continue;
    if (seen.has(r.contentHash)) fazla.push(r.questionId);
    else seen.add(r.contentHash);
  }
  console.log(`kuyruk: ${rows.length} · benzersiz: ${seen.size} · silinecek fazla kopya: ${fazla.length}`);
  if (fazla.length === 0) return;

  // Güvence: cevaplanmış hiçbir soru silinmez (teoride imkânsız — yayınlanmadı).
  const answered = await prisma.quizAnswer.groupBy({
    by: ['questionId'],
    where: { questionId: { in: fazla } },
  });
  if (answered.length > 0) {
    console.error(`UYARI: ${answered.length} kopyada cevap var — bunlar atlanıyor.`);
  }
  const answeredSet = new Set(answered.map((a) => a.questionId));
  const hedef = fazla.filter((id) => !answeredSet.has(id));

  if (!apply) return console.log('(--uygula ile soft-delete edilir)');
  const { count } = await prisma.question.updateMany({
    where: { id: { in: hedef } },
    data: { deletedAt: new Date() },
  });
  console.log(`soft-delete: ${count} kopya kuyruktan düştü`);
}
main().finally(() => prisma.$disconnect());

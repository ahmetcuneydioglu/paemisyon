/**
 * Onay kuyruğundaki (in_review) sürümlerin açıklamalarından PDF'ten sızan
 * "CEVAP ANAHTARI" başlığını temizler. --uygula olmadan yalnız listeler.
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const RE = /\s*(?:[ÜU]nite\s*:?\s*\d+\s*)?CEVAP\s+ANAHTARI\s*:?\s*/gi;

async function main() {
  const apply = process.argv.includes('--uygula');
  const rows = await prisma.questionVersion.findMany({
    where: {
      status: 'in_review',
      question: { deletedAt: null },
      explanation: { contains: 'CEVAP ANAHTARI', mode: 'insensitive' },
    },
    select: { id: true, explanation: true },
  });
  console.log(`bulunan: ${rows.length} sürüm`);
  for (const r of rows.slice(0, 5)) {
    console.log('  örnek:', JSON.stringify(r.explanation?.slice(-80)));
  }
  if (!apply) return console.log('(--uygula ile temizlenir)');
  for (const r of rows) {
    const temiz = (r.explanation ?? '').replace(RE, ' ').replace(/\s+/g, ' ').trim();
    await prisma.questionVersion.update({
      where: { id: r.id },
      data: { explanation: temiz.length > 0 ? temiz : null },
    });
  }
  console.log(`temizlendi: ${rows.length}`);
}
main().finally(() => prisma.$disconnect());

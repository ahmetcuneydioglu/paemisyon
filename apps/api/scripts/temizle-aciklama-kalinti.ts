/**
 * Onay kuyruğu (in_review) açıklamalarındaki PDF sayfa başlığı kalıntılarını
 * temizler ("Cevaplarınızı, cevap kâğıdınızın … testi için ayrılan kısmına
 * işaretleyiniz.", "Bu testte N soru bulunmaktadır.", "DİKKAT!" vb.).
 * --uygula olmadan yalnız listeler.
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Kalıntı desenleri — cümlenin yakalanan TÜM parçası silinir.
const PATTERNS: RegExp[] = [
  // Tam ya da kuyruğu kopmuş yönerge cümlesi (başı "Cevaplarınızı…" olabilir de olmayabilir de)
  /(?:Cevaplarınızı,?\s*)?(?:cevap\s+kâ?ğıdınızın\s*)?(?:[A-ZÇĞİÖŞÜ][\wçğıöşüÇĞİÖŞÜ\s]*?)?\btesti için ayrılan kısmına işaretleyiniz\.?/gi,
  /Cevaplarınızı,?\s*cevap\s+kâ?ğıdınızın\b[^.]*\.?/gi,
  /Bu testte \d+ soru bulunmaktadır\.?/gi,
  /DİKKAT!?/g,
  /Ceza Muhakemesi Hukuku(?=\s|$)/g, // sayfa başlığı tek başına sızmışsa
  /[ÜU]nite\s*:?\s*\d+\.?/gi, // ünite etiketi kalıntısı
];

async function main() {
  const apply = process.argv.includes('--uygula');
  const rows = await prisma.questionVersion.findMany({
    where: {
      status: 'in_review',
      question: { deletedAt: null },
      OR: [
        { explanation: { contains: 'işaretleyiniz', mode: 'insensitive' } },
        { explanation: { contains: 'cevap kâğıdınızın', mode: 'insensitive' } },
        { explanation: { contains: 'Bu testte', mode: 'insensitive' } },
        { explanation: { contains: 'DİKKAT' } },
      ],
    },
    select: { id: true, explanation: true },
  });
  console.log(`bulunan: ${rows.length} sürüm`);
  let degisen = 0;
  for (const r of rows) {
    let temiz = r.explanation ?? '';
    for (const re of PATTERNS) temiz = temiz.replace(re, ' ');
    temiz = temiz.replace(/\s+/g, ' ').trim();
    if (temiz === (r.explanation ?? '').trim()) continue;
    degisen++;
    if (degisen <= 6) {
      console.log('  önce :', JSON.stringify((r.explanation ?? '').slice(-100)));
      console.log('  sonra:', JSON.stringify(temiz.slice(-100)));
    }
    if (apply) {
      await prisma.questionVersion.update({
        where: { id: r.id },
        data: { explanation: temiz.length > 0 ? temiz : null },
      });
    }
  }
  console.log(apply ? `temizlendi: ${degisen}` : `değişecek: ${degisen} (--uygula ile yazılır)`);
}
main().finally(() => prisma.$disconnect());

/**
 * Doc 39 — bir kanunun bankadaki TÜM sorularını mükerrer tabanı olarak döker.
 *
 * Denetçiler bu dosyayı "bankadaki bir soru bu cevabı zaten veriyor mu?"
 * taramasında kullanır; bu yüzden ŞIKLARIYLA basılır (yalnız kök basıldığında
 * banka şık sızıntıları görünmez — bu hatta bir kez böyle kaçırıldı).
 *
 * `HARIC=1` ile Doc 39'un kendi ürettiği sorular dışarıda bırakılır (ilk
 * üretim turunda böyle kullanıldı). Sonraki turlarda Doc 39 soruları bankaya
 * girip yayına alındığı için DAHİL edilmelidir — aksi hâlde yeni sorular
 * kendi kardeşlerini tekrarlar.
 *
 *   npx tsx scripts/doc39-mevcut-sorular-cikar.ts <doc-dizini> <kanun-no>
 */
import { writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const HARIC = process.env.HARIC === '1';
const prisma = new PrismaClient();

async function main() {
  const [doc, kanunNo] = process.argv.slice(2);
  if (!doc || !kanunNo) throw new Error('kullanım: … <doc-dizini> <kanun-no>');
  const leg = await prisma.legislation.findFirstOrThrow({ where: { number: kanunNo } });
  if (!leg.topicId) throw new Error(`${kanunNo} kanununun bağlı konusu yok`);

  const v = await prisma.questionVersion.findMany({
    where: {
      question: { topicId: leg.topicId, deletedAt: null },
      status: { in: ['published', 'in_review'] },
      ...(HARIC ? { NOT: { sourceLabel: { startsWith: 'Mevzuat türetimi' } } } : {}),
    },
    select: {
      stem: true, sourceLabel: true,
      question: { select: { articleNo: true } },
      options: { select: { label: true, text: true, isCorrect: true }, orderBy: { sortOrder: 'asc' } },
    },
  });

  const satir = v.map((x) => {
    const md = x.question.articleNo ? `[md ${x.question.articleNo}] ` : '';
    const sik = x.options.map((o) => `   ${o.label}) ${o.text}${o.isCorrect ? '  ✔' : ''}`).join('\n');
    return `${md}${x.stem}\n${sik}`;
  });
  const yol = `${doc}/mevzuat/${kanunNo}-mevcut-sorular.txt`;
  writeFileSync(yol, satir.join('\n\n') + '\n', 'utf8');
  const turetme = v.filter((x) => x.sourceLabel?.startsWith('Mevzuat türetimi')).length;
  console.log(`${yol}: ${v.length} soru (${turetme}'i Doc 39 türetimi, ${v.length - turetme}'i mevcut banka)`);
}
main().finally(() => prisma.$disconnect());

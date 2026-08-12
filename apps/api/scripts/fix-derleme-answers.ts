/**
 * Onay kuyruğundaki derleme sorularının cevap düzeltmesi (tek seferlik).
 *
 * Neden: derleme çıkarıcısının ilk sürümü, mükerrer kopyalar arasında cevabı
 * HARF olarak taşıyordu; kopyaların şık SIRASI farklı olunca 112 sorunun
 * doğru cevabı yanlış şıkka kaydı. v2 XLSX metin-bazlı taşımayla doğru.
 *
 * Bu script v2 "Hazır" sayfasını okur, bekleyen (pending) soru sürümlerini
 * contentHash ile eşler ve doğru cevap FARKLIYSA isCorrect bayraklarını
 * günceller. Yayınlanmış soruya DOKUNMAZ. v2'de İncele'ye taşınmış (artık
 * güvenilmeyen) satırların bekleyen karşılıklarını da listeler.
 *
 * Kullanım: npx ts-node scripts/fix-derleme-answers.ts <v2.xlsx> [--uygula]
 *   --uygula verilmezse KURU ÇALIŞIR (yalnız rapor).
 */
import { PrismaClient } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

const xlsxPath = process.argv[2];
const apply = process.argv.includes('--uygula');
if (!xlsxPath) {
  console.error('Kullanım: fix-derleme-answers.ts <v2.xlsx> [--uygula]');
  process.exit(1);
}

const url = process.env.DATABASE_URL!;
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: url.includes('connection_limit')
        ? url.replace(/connection_limit=\d+/, 'connection_limit=1')
        : `${url}${url.includes('?') ? '&' : '?'}connection_limit=1`,
    },
  },
});

const norm = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();

async function main() {
  // 1) v2 Hazır sayfası → parmak izi → doğru CEVAP METNİ
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(xlsxPath);
  const ws = wb.getWorksheet('Hazır');
  if (!ws) throw new Error("XLSX'te 'Hazır' sayfası yok.");
  const wanted = new Map<string, { answerText: string; stem: string }>();
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const stem = String(row.getCell(1).value ?? '');
    const options = ['A', 'B', 'C', 'D', 'E']
      .map((l, i) => ({ label: l, text: String(row.getCell(i + 2).value ?? '').trim() }))
      .filter((o) => o.text.length > 0);
    const dogru = String(row.getCell(7).value ?? '');
    const answer = options.find((o) => o.label === dogru);
    if (!answer) return;
    const fp = questionFingerprint(stem, options.map((o) => o.text));
    wanted.set(fp, { answerText: norm(answer.text), stem });
  });
  console.log('v2 Hazır satırı:', wanted.size);

  // 2) Bekleyen sürümler (yayınlanmamış) — contentHash eşleşmesi
  const versions = await prisma.questionVersion.findMany({
    where: {
      contentHash: { in: [...wanted.keys()] },
      status: { not: 'published' },
      question: { deletedAt: null },
    },
    include: { options: true, question: { select: { id: true, currentVersionId: true } } },
  });
  console.log('kuyrukta eşleşen bekleyen sürüm:', versions.length);

  let already = 0;
  let fixed = 0;
  const unmatched: string[] = [];
  for (const v of versions) {
    const target = wanted.get(v.contentHash!)!;
    const correctNow = v.options.find((o) => o.isCorrect);
    const shouldBe = v.options.find((o) => norm(o.text) === target.answerText);
    if (!shouldBe) {
      unmatched.push(`${target.stem.slice(0, 60)} → hedef metin şıklarda yok`);
      continue;
    }
    if (correctNow?.id === shouldBe.id) {
      already++;
      continue;
    }
    fixed++;
    console.log(
      `${apply ? 'DÜZELTİLDİ' : 'düzeltilecek'}: ${target.stem.slice(0, 55)}… ` +
        `${correctNow?.label ?? '?'} → ${shouldBe.label}`,
    );
    if (apply) {
      await prisma.$transaction([
        prisma.questionOption.updateMany({
          where: { questionVersionId: v.id },
          data: { isCorrect: false },
        }),
        prisma.questionOption.update({
          where: { id: shouldBe.id },
          data: { isCorrect: true },
        }),
      ]);
    }
  }

  // 3) v2'de artık güvenilmeyen (Hazır dışı) bekleyenler — elle bakılacaklar
  const staleVersions = await prisma.questionVersion.findMany({
    where: {
      contentHash: { notIn: [...wanted.keys()] },
      status: { not: 'published' },
      question: { deletedAt: null },
      sourceLabel: { contains: 'İnkılap' }, // yalnız bu içe aktarmanın etiketi
    },
    select: { stem: true },
  });

  console.log('──────────────────────────────');
  console.log('Zaten doğru:', already, '| Düzeltilen:', fixed, apply ? '' : '(KURU ÇALIŞMA — --uygula ile yaz)');
  if (unmatched.length) console.log('Eşleşmeyen:', unmatched.length, unmatched.slice(0, 3));
  console.log('v2 güvenilir listesinde OLMAYAN bekleyen (elle bak):', staleVersions.length);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

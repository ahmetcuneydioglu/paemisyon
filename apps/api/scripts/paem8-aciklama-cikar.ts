/**
 * Doc 36 — PAEM 8'in açıklaması olmayan sorularını dosyaya döker.
 *
 * PAEM 8 bankaya açıklamasız girmiş: 100 sorunun 47'sinde `explanation` boş.
 * Genel Kültür, İdare Hukuku, İnkılap ve İnsan Hakları bloklarında hiç
 * açıklama yok — vitrine orantılı soru seçilemiyor, seçilse de sayfa kendi
 * vaadini ("her sorunun altında dayanağı var") tutamıyor.
 *
 * Açıklamalar dosyada üretilir; denetçi/açıklama ajanları veritabanına
 * BAĞLANMAZ (Supabase pooler'da 15 slot var, paralel ajan hattı doldurur).
 *
 *   npx tsx scripts/paem8-aciklama-cikar.ts
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/36-paem-cikmis-sorular';
const prisma = new PrismaClient();
/** Ajan başına iş büyüklüğü — Doc 33-35'te 20 soruluk partiler iyi çalıştı. */
const PARTI = 16;

async function main() {
  const sinav = await prisma.pastExam.findUnique({ where: { slug: 'paem-8-2024' }, select: { id: true } });
  if (!sinav) throw new Error('paem-8-2024 yok');

  const kayitlar = await prisma.pastExamQuestion.findMany({
    where: { pastExamId: sinav.id },
    orderBy: { orderNo: 'asc' },
    select: {
      orderNo: true,
      questionId: true,
      question: {
        select: {
          topic: { select: { name: true, course: { select: { name: true } } } },
          currentVersion: {
            select: {
              id: true,
              explanation: true,
              stem: true,
              mediaUrl: true,
              options: { orderBy: { sortOrder: 'asc' }, select: { label: true, text: true, isCorrect: true } },
            },
          },
        },
      },
    },
  });

  const eksik = kayitlar.filter((k) => !k.question.currentVersion?.explanation);
  console.log(`toplam ${kayitlar.length} · açıklaması eksik ${eksik.length}`);

  mkdirSync(`${KOK}/paem8-aciklama`, { recursive: true });
  for (let i = 0; i < eksik.length; i += PARTI) {
    const dilim = eksik.slice(i, i + PARTI).map((k) => ({
      no: k.orderNo,
      questionId: k.questionId,
      versionId: k.question.currentVersion!.id,
      ders: k.question.topic.course.name,
      konu: k.question.topic.name,
      kok: k.question.currentVersion!.stem,
      gorsel: k.question.currentVersion!.mediaUrl,
      siklar: k.question.currentVersion!.options.map((o) => ({ harf: o.label, metin: o.text, dogru: o.isCorrect })),
    }));
    const ad = `parca-${Math.floor(i / PARTI) + 1}`;
    writeFileSync(`${KOK}/paem8-aciklama/${ad}.json`, JSON.stringify(dilim, null, 1));
    console.log(`  ${ad}.json — ${dilim.length} soru (${dilim[0].no}-${dilim.at(-1)!.no})`);
  }
}
main().finally(() => prisma.$disconnect());

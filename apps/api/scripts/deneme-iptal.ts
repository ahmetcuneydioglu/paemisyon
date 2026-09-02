/**
 * BIR DENEMEYI SONUCLARIYLA BIRLIKTE IPTAL EDER ("hic yapilmamis gibi").
 *
 * Neden oturumlari da silmek gerekiyor: `globalLeaderboard` sorgusu
 * quiz_sessions'tan mode='deneme' + status='completed' satirlarini okur ve
 * exam.deletedAt'e BAKMAZ (exams.service.ts). Denemeyi yalnizca arsivlemek,
 * bozuk netlerin kuresel siralamada KALICI olarak kalmasi demektir.
 *
 * Yaptigi is:
 *   1) TAM YEDEK alir (deneme + soru seti + oturumlar + cevaplar)
 *   2) Oturumlari siler — QuizAnswer FK'si Cascade oldugu icin cevaplar da gider
 *   3) Denemeyi soft-delete eder (deletedAt) — liste ve detay uclarindan duser
 *
 * Soru seti (ExamQuestion) ve sorularin kendisi KORUNUR; deneme yeniden
 * yayinlanmak istenirse ayni 89 soruyla kurulabilir.
 *
 *   npx tsx scripts/deneme-iptal.ts --deneme "<baslik parcasi>"          (kuru)
 *   npx tsx scripts/deneme-iptal.ts --deneme "<baslik parcasi>" --yaz
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const p = new PrismaClient();
const arg = (a: string) => { const i = process.argv.indexOf(a); return i === -1 ? null : process.argv[i + 1]; };

async function main() {
  const YAZ = process.argv.includes('--yaz');
  const baslik = arg('--deneme');
  if (!baslik) { console.log('--deneme "<baslik>" ver'); return; }

  const exam = await p.exam.findFirst({
    where: { title: { contains: baslik }, deletedAt: null },
    select: { id: true, title: true, startAt: true, durationMinutes: true, status: true },
  });
  if (!exam) { console.log('Deneme bulunamadi (veya zaten silinmis).'); return; }

  const bitis = new Date(exam.startAt.getTime() + exam.durationMinutes * 60000);
  if (new Date() < bitis) {
    console.log('DURDURULDU: bu denemenin canli penceresi henuz kapanmamis.');
    return;
  }

  const sorular = await p.examQuestion.count({ where: { examId: exam.id } });
  const oturumlar = await p.quizSession.findMany({
    where: { examId: exam.id },
    select: { id: true, userId: true, status: true, totalQuestions: true, correctCount: true,
      wrongCount: true, blankCount: true, score: true, startedAt: true, completedAt: true,
      answers: { select: { questionId: true, questionVersionId: true, selectedOptionId: true,
        isCorrect: true, answeredAt: true, timeSpentMs: true } } },
  });
  const cevap = oturumlar.reduce((s, o) => s + o.answers.length, 0);

  console.log(`Deneme : ${exam.title}`);
  console.log(`Bitis  : ${bitis.toISOString()}  (pencere kapali)`);
  console.log(`Soru   : ${sorular} (ExamQuestion KORUNUR)`);
  console.log(`Oturum : ${oturumlar.length}  |  Cevap: ${cevap}   -> SILINECEK`);
  if (!YAZ) { console.log('\nKURU CALISMA — uygulamak icin --yaz ekle.'); return; }

  const yedek = path.join(__dirname, '../../../docs/32-yayin-denetimi/deneme-iptal-yedek.json');
  fs.writeFileSync(yedek, JSON.stringify({ exam, soruSayisi: sorular, oturumlar }, null, 1), 'utf-8');

  await p.$transaction(async (tx) => {
    await tx.quizSession.deleteMany({ where: { examId: exam.id } }); // cevaplar Cascade ile gider
    await tx.exam.update({ where: { id: exam.id }, data: { deletedAt: new Date(), status: 'archived' } });
  });

  const kalanOturum = await p.quizSession.count({ where: { examId: exam.id } });
  console.log(`\nTAMAM: ${oturumlar.length} oturum ve ${cevap} cevap silindi; deneme arsivlendi.`);
  console.log(`Kalan oturum: ${kalanOturum} (0 olmali)`);
  console.log(`Yedek: ${yedek}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => p.$disconnect());

/**
 * BITMIS BIR DENEMEDEN SORU CIKARIR ve NETLERI YENIDEN HESAPLAR.
 *
 * Neden ayri bir script: soruyu ExamQuestion'dan silmek TEK BASINA YETMEZ.
 * Puan QuizAnswer'dan hesaplanir ve deneme oturumlarinda questionOrder bos
 * oldugu icin TUM cevaplar nete dahil olur (quiz.service.ts hesaplama blogu).
 * Yalnizca ExamQuestion silinirse soru ekrandan kalkar ama PUANI ETKILEMEYE
 * DEVAM EDER; ustelik totalQuestions eski degerde kalip bos sayisini sisirir.
 * Bu script uc isi birlikte yapar:
 *   1) ExamQuestion satirlarini siler
 *   2) O sorulara bu denemede verilmis QuizAnswer satirlarini siler
 *   3) Oturumlarin totalQuestions'ini duserek NET'i yeniden hesaplar
 *      (deneme puani = dogru - yanlis/4, quiz.service.ts ile ayni kural)
 *
 * CANLI DENEMEDE CALISTIRMA. Sorular her istekte ExamQuestion'dan okundugu
 * icin katilimcilarin soru sayisi ortada degisir. Script canli pencerede
 * calistirilirsa uyarir ve --canli-biliyorum verilmedikce durur.
 *
 *   npx tsx scripts/deneme-soru-cikar.ts --deneme <baslik parcasi> --konu "<konu adi>"
 *   npx tsx scripts/deneme-soru-cikar.ts --deneme <...> --konu "<...>" --yaz
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const p = new PrismaClient();
const arg = (ad: string) => { const i = process.argv.indexOf(ad); return i === -1 ? null : process.argv[i + 1]; };

async function main() {
  const YAZ = process.argv.includes('--yaz');
  const baslik = arg('--deneme');
  const konuAdi = arg('--konu');
  if (!baslik || !konuAdi) { console.log('--deneme "<baslik>" --konu "<konu>" ver'); return; }

  const exam = await p.exam.findFirst({
    where: { title: { contains: baslik }, deletedAt: null },
    select: { id: true, title: true, startAt: true, durationMinutes: true },
  });
  if (!exam) { console.log('Deneme bulunamadi.'); return; }

  const bitis = new Date(exam.startAt.getTime() + exam.durationMinutes * 60000);
  const canli = exam.startAt <= new Date() && new Date() < bitis;
  console.log(`Deneme: ${exam.title}`);
  console.log(`Bitis: ${bitis.toISOString()}  |  ${canli ? '>>> CANLI PENCERE SURUYOR <<<' : 'kapali'}`);
  if (canli && !process.argv.includes('--canli-biliyorum')) {
    console.log('\nDURDURULDU: canli denemede calistirmak katilimcilarin soru sayisini ortada degistirir.');
    console.log('Bilerek yapiyorsan --canli-biliyorum ekle.');
    return;
  }

  const konu = await p.topic.findFirst({ where: { name: konuAdi }, select: { id: true, name: true } });
  if (!konu) { console.log(`Konu bulunamadi: ${konuAdi}`); return; }

  const eq = await p.examQuestion.findMany({
    where: { examId: exam.id, question: { topicId: konu.id } },
    select: { questionId: true, questionVersionId: true, sortOrder: true, questionVersion: { select: { stem: true } } },
    orderBy: { sortOrder: 'asc' },
  });
  if (!eq.length) { console.log('Bu denemede o konudan soru yok.'); return; }

  const qIds = eq.map((x) => x.questionId);
  const cevap = await p.quizAnswer.count({ where: { questionId: { in: qIds }, session: { examId: exam.id } } });
  const oturumlar = await p.quizSession.findMany({
    where: { examId: exam.id },
    select: { id: true, status: true, totalQuestions: true, correctCount: true, wrongCount: true, score: true },
  });

  console.log(`\nCikarilacak soru: ${eq.length}`);
  eq.forEach((x) => console.log(`   #${String(x.sortOrder).padStart(3)}  ${x.questionVersion.stem.slice(0, 72).replace(/\n/g, ' ')}`));
  console.log(`\nSilinecek cevap: ${cevap}`);
  console.log(`Etkilenen oturum: ${oturumlar.length} (tamamlanan ${oturumlar.filter((s) => s.status === 'completed').length})`);
  if (!YAZ) { console.log('\nKURU CALISMA — uygulamak icin --yaz ekle.'); return; }

  const yedek = path.join(__dirname, '../../../docs/32-yayin-denetimi/deneme-soru-cikar-yedek.json');
  fs.writeFileSync(yedek, JSON.stringify({ examId: exam.id, baslik: exam.title, konu: konu.name,
    cikarilan: eq, oncekiOturumlar: oturumlar }, null, 1), 'utf-8');

  await p.$transaction(async (tx) => {
    await tx.quizAnswer.deleteMany({ where: { questionId: { in: qIds }, session: { examId: exam.id } } });
    await tx.examQuestion.deleteMany({ where: { examId: exam.id, questionId: { in: qIds } } });
  });

  const kalan = await p.examQuestion.count({ where: { examId: exam.id } });
  let guncellenen = 0;
  for (const s of oturumlar) {
    const ans = await p.quizAnswer.findMany({ where: { sessionId: s.id }, select: { isCorrect: true, selectedOptionId: true } });
    const dogru = Math.min(ans.filter((a) => a.isCorrect === true).length, kalan);
    const yanlis = Math.min(ans.filter((a) => a.isCorrect === false && a.selectedOptionId != null).length, kalan - dogru);
    const bos = kalan - dogru - yanlis;
    const net = dogru - yanlis / 4;
    await p.quizSession.update({
      where: { id: s.id },
      data: {
        totalQuestions: kalan, correctCount: dogru, wrongCount: yanlis, blankCount: bos,
        ...(s.status === 'completed' ? { score: net } : {}),
      },
    });
    guncellenen++;
  }

  console.log(`\nTAMAM: ${eq.length} soru cikarildi, ${cevap} cevap silindi.`);
  console.log(`Denemenin yeni soru sayisi: ${kalan}`);
  console.log(`Yeniden hesaplanan oturum: ${guncellenen}`);
  console.log(`Yedek (geri alma icin): ${yedek}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => p.$disconnect());

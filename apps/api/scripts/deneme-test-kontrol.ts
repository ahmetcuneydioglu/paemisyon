/**
 * Deneme sınavı testi — SALT OKUR doğrulama.
 *
 * "30 sorudan sonra cevaplar kaydedilmiyor" hatasının (c4a123b ile düzeltildi)
 * gerçekten kapandığını UI'ya güvenmeden ölçer. 2 Eylül 2026'da belirti tam
 * olarak şuydu: ücretsiz kullanıcıların cevap sayısı 30'da duruyordu.
 *
 *   npx tsx scripts/deneme-test-kontrol.ts                 # son yayınlanan deneme
 *   npx tsx scripts/deneme-test-kontrol.ts <examId>
 *
 * BAKILACAK: her katılımcı için kaydedilen cevap sayısı. Ücretsiz bir hesapta
 * sayı TAM 30 ise hata YAŞANIYOR; 30'u geçiyorsa düzeltme çalışıyor.
 */
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

(async () => {
  const examId = process.argv[2];
  const exam = examId
    ? await p.exam.findUnique({ where: { id: examId } })
    : await p.exam.findFirst({
        where: { status: 'published', deletedAt: null },
        orderBy: { startAt: 'desc' },
      });
  if (!exam) {
    console.log('Deneme bulunamadı. Yayınlanmış bir deneme yok ya da id yanlış.');
    return;
  }

  const soruSayisi = await p.examQuestion.count({ where: { examId: exam.id } });
  const bitis = new Date(exam.startAt.getTime() + exam.durationMinutes * 60_000);
  const simdi = new Date();
  const durum = simdi < exam.startAt ? 'BAŞLAMADI' : simdi < bitis ? 'AKTİF' : 'BİTTİ';

  console.log(`\nDENEME: ${exam.title}`);
  console.log(`  id            : ${exam.id}`);
  console.log(`  durum         : ${exam.status} / ${durum}`);
  console.log(`  pencere       : ${exam.startAt.toISOString()} → ${bitis.toISOString()} (${exam.durationMinutes} dk)`);
  console.log(`  isPremium     : ${exam.isPremium}  ${exam.isPremium ? '(YALNIZ ABONELER)' : '(HERKESE AÇIK)'}`);
  console.log(`  soru sayısı   : ${soruSayisi}${soruSayisi <= 30 ? '  ⚠ 30 VEYA ALTI — bu testi KANITLAMAZ, >30 gerekir' : ''}`);

  const sessions = await p.quizSession.findMany({
    where: { examId: exam.id },
    orderBy: { startedAt: 'asc' },
    select: {
      id: true, status: true, startedAt: true, completedAt: true,
      plannedDurationSeconds: true,
      user: { select: { email: true, isPremium: true } },
      _count: { select: { answers: true } },
    },
  });

  if (sessions.length === 0) {
    console.log('\nHenüz katılım yok.\n');
    return;
  }

  console.log(`\nKATILIM: ${sessions.length}\n`);
  console.log('  plan   cevap  durum        son cevap           hesap');
  console.log('  ' + '─'.repeat(74));
  for (const s of sessions) {
    const son = await p.quizAnswer.findFirst({
      where: { sessionId: s.id },
      orderBy: { answeredAt: 'desc' },
      select: { answeredAt: true },
    });
    const n = s._count.answers;
    // Tam 30'da durmak, ücretsiz plan limitinin sınavı kestiğinin imzasıdır.
    const bayrak = !s.user.isPremium && n === 30 ? '  ← TAM 30: HATA SÜRÜYOR' : '';
    console.log(
      `  ${(s.user.isPremium ? 'PREM' : 'ÜCRT').padEnd(6)} ${String(n).padStart(5)}  ` +
        `${s.status.padEnd(12)} ${(son?.answeredAt.toISOString().slice(11, 19) ?? '—').padEnd(19)} ` +
        `${s.user.email}${bayrak}`,
    );
  }

  const ucretsiz = sessions.filter((s) => !s.user.isPremium);
  console.log('\nSONUÇ');
  if (ucretsiz.length === 0) {
    console.log('  Ücretsiz hesapla katılım YOK — düzeltme test EDİLMEDİ.');
  } else if (ucretsiz.some((s) => s._count.answers === 30)) {
    console.log('  ✗ Bir ücretsiz hesap tam 30 cevapta durmuş — günlük limit sınavı KESİYOR.');
  } else if (ucretsiz.every((s) => s._count.answers > 30)) {
    console.log('  ✓ Ücretsiz hesapların hepsi 30 sınırını geçmiş — düzeltme ÇALIŞIYOR.');
  } else {
    console.log('  ? Ücretsiz hesapların cevap sayısı 30 altında; sınırı geçen bir deneme yapılmadı.');
  }
  console.log();
})().finally(() => p.$disconnect());

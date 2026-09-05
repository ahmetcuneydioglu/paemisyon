/**
 * CANLI DENEME SAĞLIK KONTROLÜ — SALT OKUR, sınav SÜRERKEN çalıştırılabilir.
 *
 * deneme-test-kontrol.ts tek bir soruyu yanıtlar ("30 limiti kesiyor mu?").
 * Bu betik sınav devam ederken bakılması gereken her şeyi tek ekranda verir:
 * kaydedilen cevap sayıları, 30 bariyeri, set dışı/pencere dışı cevap (güvenlik),
 * questionOrder dolu mu (sıralama şişirme koruması) ve günlük kota kirlenmesi.
 *
 *   npx tsx scripts/deneme-canli-kontrol.ts
 */
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

(async () => {
  const exam = await p.exam.findFirstOrThrow({
    where: { status: 'published', deletedAt: null },
    orderBy: { startAt: 'desc' },
  });
  const bitis = new Date(exam.startAt.getTime() + exam.durationMinutes * 60_000);
  const kalan = Math.round((bitis.getTime() - Date.now()) / 60_000);
  console.log(`${exam.title} — bitişe ${kalan} dk (${bitis.toISOString().slice(11, 16)}Z)`);

  const eq = await p.examQuestion.findMany({
    where: { examId: exam.id },
    select: { questionId: true, questionVersionId: true },
  });
  const setQ = new Set(eq.map((r) => r.questionId));
  const setV = new Set(eq.map((r) => r.questionVersionId));

  const ss = await p.quizSession.findMany({
    where: { examId: exam.id },
    include: {
      user: { select: { id: true, email: true, entitlement: { select: { isPremium: true } } } },
      answers: { select: { questionId: true, questionVersionId: true, answeredAt: true } },
    },
    orderBy: { startedAt: 'asc' },
  });

  console.log('\nplan  cevap  son cevap  questionOrder  set dışı  pencere dışı  hesap');
  console.log('─'.repeat(88));
  let sorun = 0;
  for (const s of ss) {
    const prem = s.user.entitlement?.isPremium ?? false;
    const disQ = s.answers.filter((a) => !setQ.has(a.questionId)).length;
    const disV = s.answers.filter((a) => !setV.has(a.questionVersionId)).length;
    const disP = s.answers.filter(
      (a) => a.answeredAt < exam.startAt || a.answeredAt > bitis,
    ).length;
    const qo = Array.isArray(s.questionOrder) ? (s.questionOrder as unknown[]).length : null;
    const son = s.answers.reduce<Date | null>(
      (m, a) => (m == null || a.answeredAt > m ? a.answeredAt : m),
      null,
    );
    if (disQ || disV || disP || qo == null) sorun++;
    console.log(
      `${(prem ? 'PREM' : 'ÜCRT').padEnd(5)} ${String(s.answers.length).padStart(5)}  ` +
        `${(son?.toISOString().slice(11, 19) ?? '—').padEnd(9)}  ` +
        `${String(qo ?? 'NULL').padStart(13)}  ${String(disQ + disV).padStart(8)}  ` +
        `${String(disP).padStart(12)}  ${s.user.email}`,
    );
  }

  // Ücretsiz hesaplarda 30 bariyeri ve kota kirlenmesi.
  const bugun = new Date().toISOString().slice(0, 10);
  const kota = await p.$queryRawUnsafe<{ email: string; n: number; limit: number }[]>(
    `SELECT u.email, d.questions_answered AS n, d.daily_limit AS limit
     FROM daily_usage d JOIN users u ON u.id = d.user_id
     WHERE d.usage_date = $1::date AND d.user_id = ANY($2::uuid[])`,
    bugun,
    ss.map((s) => s.user.id),
  );
  const ucretsiz = ss.filter((s) => !(s.user.entitlement?.isPremium ?? false));
  const enCok = Math.max(0, ...ucretsiz.map((s) => s.answers.length));
  const tam30 = ucretsiz.filter((s) => s.answers.length === 30).length;

  console.log(`\n30 BARİYERİ: ücretsiz hesaplarda en yüksek cevap = ${enCok}` +
    `  ${enCok > 30 ? '✓ bariyer AŞILDI (düzeltme canlıda çalışıyor)' : '— henüz 30 geçilmedi'}`);
  console.log(`  tam 30'da duran ücretsiz hesap: ${tam30} ${tam30 === 0 ? '✓' : '✗ HATA SÜRÜYOR'}`);
  console.log(`\nGÜNLÜK KOTA (${bugun}): ${kota.length === 0 ? 'kayıt yok ✓ sınav kotayı tüketmiyor' : ''}`);
  for (const k of kota) console.log(`  ${k.email}: ${k.n}/${k.limit}`);
  console.log(`\nVERİ BÜTÜNLÜĞÜ: ${sorun === 0 ? '✓ sorun yok' : `✗ ${sorun} oturumda sorun`}`);
})().finally(() => p.$disconnect());

/**
 * Denemeler sıfırlaması (lansman öncesi tek seferlik).
 *
 * - Denemeler SOFT-DELETE edilir (`deletedAt`): listeden kalkar ama kayıt
 *   durur; yanlışlıkla silinirse `deletedAt = NULL` ile geri gelir.
 * - Deneme KATILIMLARI (examId dolu oturumlar) ve cevapları KALICI silinir —
 *   sıralamalar ve "bu denemeye girdin" izleri temizlensin.
 * - Normal turlar (examId NULL) ve soru bankası ASLA etkilenmez.
 * - Kullanıcı istatistikleri (UserStats/UserTopicProgress/streak) korunur:
 *   sıfırlama içerik temizliğidir, kullanıcı geçmişini yeniden yazmaz.
 *
 * Varsayılan dry-run; APPLY=1 ile uygular.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const apply = process.env.APPLY === '1';

  const exams = await prisma.exam.findMany({
    where: { deletedAt: null },
    select: { id: true, title: true, status: true },
  });
  const sessions = await prisma.quizSession.findMany({
    where: { examId: { not: null } },
    select: { id: true, examId: true, user: { select: { email: true } } },
  });
  const answerCount = await prisma.quizAnswer.count({
    where: { sessionId: { in: sessions.map((s) => s.id) } },
  });
  const untouched = await prisma.quizSession.count({ where: { examId: null } });

  console.log(`denemeler (soft-delete edilecek): ${exams.length}`);
  for (const e of exams) console.log(`  · ${e.title} [${e.status}]`);
  console.log(`katılım oturumu (kalıcı silinecek): ${sessions.length}`);
  for (const s of sessions) console.log(`  · ${s.user.email ?? '—'}`);
  console.log(`cevap (kalıcı silinecek): ${answerCount}`);
  console.log(`normal tur oturumu (DOKUNULMAYACAK): ${untouched}`);

  if (!apply) {
    console.log('\n(dry-run — APPLY=1 ile uygula)');
    await prisma.$disconnect();
    return;
  }

  const ids = sessions.map((s) => s.id);
  // Cevaplar cascade ile de giderdi; açıkça silmek sayıyı raporlanabilir kılar.
  const delAnswers = await prisma.quizAnswer.deleteMany({
    where: { sessionId: { in: ids } },
  });
  const delSessions = await prisma.quizSession.deleteMany({
    where: { id: { in: ids } },
  });
  // Yayından da kaldır: soft-delete'i atlayan bir sorgu kalırsa bile
  // taslak/arşiv durumu denemeyi listede göstermez.
  const soft = await prisma.exam.updateMany({
    where: { deletedAt: null },
    data: { deletedAt: new Date(), status: 'archived' },
  });

  console.log(
    `\nSİLİNDİ: ${delAnswers.count} cevap, ${delSessions.count} oturum · ARŞİVLENDİ: ${soft.count} deneme`,
  );
  await prisma.$disconnect();
}
main();

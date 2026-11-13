/**
 * Canlıda GİZLİ prova denemesi aç / sil (13 Kas 2026, yayın öncesi deneme güvencesi).
 *
 * Gerçek bir denemenin 100 sorusunu ve sabitlenmiş soru paketini kopyalar; `testOnly = true`
 * olduğu için yalnız admin/beta rolü görür (common/test-denemesi.ts), duyuru/hatırlatma/genel
 * liderlik yoktur. Gerçek cihazda uçtan uca deneme provası için.
 *
 *   npx ts-node --transpile-only scripts/prova-denemesi-ac.ts --kaynak <examId> \
 *     [--sure 15] [--pencere 25] [--mod takvimli|serbest] --confirm-live
 *   npx ts-node --transpile-only scripts/prova-denemesi-ac.ts --sil <examId> --confirm-live
 *
 * Silme yalnız testOnly denemeyi ve ona bağlı oturum/cevap/sıralama satırlarını kaldırır.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const arg = (ad: string) => {
  const i = process.argv.indexOf(`--${ad}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

async function main() {
  if (!process.argv.includes('--confirm-live')) throw new Error('Canlı veritabanı: --confirm-live gerekli.');
  const url = new URL(process.env.DATABASE_URL!);
  url.searchParams.set('connection_limit', '1');
  const prisma = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  try {
    const silId = arg('sil');
    if (silId) {
      const e = await prisma.exam.findUniqueOrThrow({ where: { id: silId } });
      if (!e.testOnly) throw new Error('Bu deneme testOnly değil — silinmez.');
      const sids = (await prisma.quizSession.findMany({ where: { OR: [{ examId: silId }, { archiveExamId: silId }] }, select: { id: true } })).map((s) => s.id);
      await prisma.$transaction([
        prisma.examFinalizeJob.deleteMany({ where: { sessionId: { in: sids } } }),
        prisma.examRanking.deleteMany({ where: { examId: silId } }),
        prisma.examQuestionAdjustment.deleteMany({ where: { examId: silId } }),
        prisma.quizAnswer.deleteMany({ where: { sessionId: { in: sids } } }),
        prisma.quizSession.deleteMany({ where: { id: { in: sids } } }),
        prisma.examQuestion.deleteMany({ where: { examId: silId } }),
        prisma.exam.delete({ where: { id: silId } }),
      ]);
      console.log(`Silindi: ${e.title} (${sids.length} oturum)`);
      return;
    }

    const kaynakId = arg('kaynak');
    if (!kaynakId) throw new Error('--kaynak <examId> gerekli.');
    const k = await prisma.exam.findUniqueOrThrow({ where: { id: kaynakId }, include: { questions: { orderBy: { sortOrder: 'asc' } } } });
    if (!k.questionPack) throw new Error('Kaynak denemenin soru paketi yok.');
    const sure = Number(arg('sure') ?? 15);
    const pencere = Number(arg('pencere') ?? sure + 10);
    const mod = (arg('mod') ?? 'takvimli') as 'takvimli' | 'serbest';
    const now = Date.now();
    const yeni = await prisma.exam.create({
      data: {
        title: `Prova · ${k.title}`,
        description: 'Gizli prova denemesi (yalnız test hesapları) — scripts/prova-denemesi-ac.ts',
        startAt: new Date(now - 60_000),
        durationMinutes: sure,
        publishMode: mod,
        endAt: mod === 'takvimli' ? new Date(now + pencere * 60_000) : null,
        difficulty: k.difficulty,
        examTypeId: k.examTypeId,
        isPremium: false,
        liveAnswerReveal: k.liveAnswerReveal,
        questionsOpenAfterEnd: k.questionsOpenAfterEnd,
        practiceAfterEnd: k.practiceAfterEnd,
        remindEnabled: false,
        questionPack: k.questionPack,
        questionPackBuiltAt: new Date(),
        status: 'published',
        testOnly: true,
        questions: { create: k.questions.map((q) => ({ questionId: q.questionId, questionVersionId: q.questionVersionId, sortOrder: q.sortOrder })) },
      },
    });
    console.log(JSON.stringify({ id: yeni.id, title: yeni.title, mod, sure, bitis: yeni.endAt, soru: k.questions.length }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

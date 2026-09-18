/**
 * Doc 46 E2E: kişisel deneme freemium kapısını GERÇEK veriye karşı doğrular.
 * Nest bağlamı açılır, QuizService doğrudan çağrılır (guard'ın ürettiği
 * AuthenticatedUser elle kurulur). Tek kullanımlık kullanıcı sonunda SİLİNİR.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { QuizService } from '../src/modules/quiz/quiz.service';
import { PrismaService } from '../src/infra/prisma/prisma.service';

const OK = (m: string) => console.log(`  ✓ ${m}`);
const FAIL = (m: string) => {
  console.error(`  ✗ ${m}`);
  process.exitCode = 1;
};

(async () => {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const quiz = app.get(QuizService);
  const prisma = app.get(PrismaService);

  const modul = await prisma.examType.findFirst({
    where: { sections: { some: {} } },
    select: { id: true, name: true },
  });
  if (!modul) throw new Error('Bölümlü hedef sınav bulunamadı.');
  console.log(`Hedef sınav: ${modul.name}\n`);

  const u = await prisma.user.create({
    data: {
      email: `e2e-doc46-${Date.now()}@paemisyon.test`,
      displayName: 'E2E Doc46',
      preferredModuleId: modul.id,
    },
    select: { id: true },
  });
  const free = { id: u.id, email: 'x', roles: ['user'], isPremium: false } as never;
  const prem = { id: u.id, email: 'x', roles: ['user'], isPremium: true } as never;
  const iste = (n: number) => ({ mode: 'exam', personalExam: true, questionCount: n }) as never;

  try {
    console.log('1) ÜCRETSİZ — 100 soru istenir, 25 ile açılmalı');
    const a = await quiz.startSession(free, iste(100));
    a.questions.length === 25
      ? OK(`açıldı: ${a.questions.length} soru`)
      : FAIL(`beklenen 25, gelen ${a.questions.length}`);

    console.log('2) ÜCRETSİZ — aynı istek tekrar: DEVAM etmeli, yeni hak yakmamalı');
    const b = await quiz.startSession(free, iste(25));
    b.sessionId === a.sessionId
      ? OK(`aynı oturum döndü (resumed=${(b as { resumed?: boolean }).resumed})`)
      : FAIL(`yeni oturum açıldı: ${b.sessionId}`);

    console.log('3) ÜCRETSİZ — oturum bitirilir, ikinci deneme REDDEDİLMELİ');
    await quiz.completeSession(u.id, a.sessionId);
    try {
      await quiz.startSession(free, iste(25));
      FAIL('reddedilmedi — kapı çalışmıyor!');
    } catch (e) {
      const r = (e as { response?: { code?: string; message?: string } }).response;
      r?.code === 'PERSONAL_EXAM_LIMIT'
        ? OK(`reddedildi: ${r.message}`)
        : FAIL(`beklenmeyen hata: ${JSON.stringify(r ?? e)}`);
    }

    console.log('4) PREMIUM — aynı kullanıcı, aynı gün: açılmalı ve 100 soru gelmeli');
    const c = await quiz.startSession(prem, iste(100));
    c.questions.length === 100
      ? OK(`açıldı: ${c.questions.length} soru`)
      : FAIL(`beklenen 100, gelen ${c.questions.length}`);
    await quiz.completeSession(u.id, c.sessionId);

    console.log('5) Oturumlar personalExam=true damgasıyla kaydedilmiş mi?');
    const damga = await prisma.quizSession.count({
      where: { userId: u.id, personalExam: true },
    });
    const toplam = await prisma.quizSession.count({ where: { userId: u.id } });
    damga === toplam && toplam === 2
      ? OK(`${damga}/${toplam} oturum damgalı`)
      : FAIL(`damgalı ${damga}, toplam ${toplam}`);

    console.log('6) Günlük soru kotası (daily_usage) TÜKETİLMEMİŞ olmalı');
    const usage = await prisma.dailyUsage.findFirst({ where: { userId: u.id } });
    (usage?.questionsAnswered ?? 0) === 0
      ? OK('daily_usage dokunulmadı — deneme ortasında kesilme riski yok')
      : FAIL(`daily_usage=${usage?.questionsAnswered}`);
  } finally {
    await prisma.user.delete({ where: { id: u.id } });
    console.log('\nTest kullanıcısı silindi.');
    await app.close();
  }
})();

/**
 * Doc 50 F0 — MIGRATION ÖNCESİ SALT OKUNUR SAYIM + YEDEK.
 *
 * `20261027090000_denemeler_v2` veri taşıması yapıyor: deneme arşiv oturumları
 * (archive_exam_id dolu, çıkmış sınav DEĞİL) aynı denemenin TEKRAR çözümüne
 * (exam_id + attempt_role='practice', mode='deneme', puan net'e) çevrilir.
 * Bu betik dokunulacak satırları sayar ve JSON yedeğini yazar; HİÇBİR ŞEY YAZMAZ.
 *
 *   cd apps/api && DATABASE_URL="...&connection_limit=1" npx tsx scripts/denemeler-v2-oncesi-sayim.ts
 *
 * Yedek: docs/50-denemeler-v2/tasima-yedek-<tarih>.json
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const p = new PrismaClient();

async function main() {
  const exams = await p.exam.findMany({
    where: { deletedAt: null },
    select: { id: true, title: true, status: true, startAt: true, durationMinutes: true, pastExam: { select: { id: true } } },
  });
  const mock = exams.filter((e) => !e.pastExam);
  const past = exams.filter((e) => e.pastExam);

  const [official, archiveAll, inProgressExam] = await Promise.all([
    p.quizSession.count({ where: { examId: { not: null } } }),
    p.quizSession.findMany({
      where: { archiveExamId: { not: null } },
      select: {
        id: true,
        userId: true,
        archiveExamId: true,
        mode: true,
        status: true,
        correctCount: true,
        wrongCount: true,
        blankCount: true,
        score: true,
        totalQuestions: true,
        startedAt: true,
        completedAt: true,
        plannedDurationSeconds: true,
      },
    }),
    p.quizSession.count({ where: { examId: { not: null }, status: 'in_progress' } }),
  ]);
  const pastIds = new Set(past.map((e) => e.id));
  const archiveMock = archiveAll.filter((s) => !pastIds.has(s.archiveExamId!));
  const archivePast = archiveAll.filter((s) => pastIds.has(s.archiveExamId!));

  // Taşıma sonrası kısmi tekil indeks çakışması olur mu? (official yalnız exam_id'li
  // mevcut satırlardan gelir; onlar zaten tam tekil anahtarla tekildi.) Yine de say.
  const dupOfficial = await p.$queryRaw<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM (
      SELECT user_id, exam_id FROM quiz_sessions WHERE exam_id IS NOT NULL AND status <> 'abandoned'
      GROUP BY user_id, exam_id HAVING COUNT(*) > 1) d`;

  const modules = await p.examType.count({ where: { isActive: true } });

  const rapor = {
    tarih: new Date().toISOString(),
    denemeler: { toplam: mock.length, yayinda: mock.filter((e) => e.status === 'published').length },
    cikmisSinavlar: past.length,
    resmiKatilim: official,
    yarimResmi: inProgressExam,
    arsivOturum: { toplam: archiveAll.length, denemeTasinacak: archiveMock.length, cikmisKalacak: archivePast.length },
    tasinacakTamamlanan: archiveMock.filter((s) => s.status === 'completed').length,
    tasinacakYarim: archiveMock.filter((s) => s.status === 'in_progress').length,
    resmiCiftKayit: dupOfficial[0]?.n ?? 0,
    aktifSinavTuru: modules,
    examTypeAtanacak: modules === 1 ? 'evet (tek tür)' : 'hayır — panelden seçilecek',
  };
  console.log(JSON.stringify(rapor, null, 2));

  const yedek = `${__dirname}/../../../docs/50-denemeler-v2/tasima-yedek-${new Date().toISOString().slice(0, 10)}.json`;
  writeFileSync(
    yedek,
    JSON.stringify({ rapor, tasinacak: archiveMock.map((s) => ({ ...s, score: s.score?.toString() ?? null })) }, null, 2),
  );
  console.log(`Yedek yazıldı: ${yedek}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());

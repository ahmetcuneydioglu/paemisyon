/**
 * Bir denemeyi PDF üretimi için JSON'a döker (SALT OKUR).
 *   npx tsx scripts/deneme-pdf-veri.ts <examId> > /tmp/deneme.json
 */
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const id = process.argv[2];
  const exam = await p.exam.findFirstOrThrow({ where: { id, deletedAt: null } });
  const rows = await p.examQuestion.findMany({
    where: { examId: exam.id },
    orderBy: { sortOrder: 'asc' },
    include: {
      question: { select: { topic: { select: { name: true, course: { select: { name: true } } } } } },
      questionVersion: {
        select: {
          stem: true,
          explanation: true,
          options: { orderBy: { sortOrder: 'asc' }, select: { label: true, text: true, isCorrect: true } },
        },
      },
    },
  });
  const out = {
    title: exam.title,
    durationMinutes: exam.durationMinutes,
    questionCount: rows.length,
    startAt: exam.startAt.toISOString(),
    questions: rows.map((r, i) => ({
      order: i + 1,
      course: r.question.topic.course.name,
      topic: r.question.topic.name,
      stem: r.questionVersion.stem,
      explanation: r.questionVersion.explanation,
      options: r.questionVersion.options.map((o) => ({ label: o.label, text: o.text })),
      answer: r.questionVersion.options.find((o) => o.isCorrect)?.label ?? '?',
    })),
  };
  process.stdout.write(JSON.stringify(out, null, 1));
})().finally(() => p.$disconnect());

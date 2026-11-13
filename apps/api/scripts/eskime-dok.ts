/**
 * Eskimiş (zamana bağlı) soru taraması — SALT OKUMA dökümü (13 Kas 2026).
 * Yayındaki soruları ders/konu/kök/şık/açıklama/kaynak/çıkmış-sınav bağıyla JSON'a döker.
 *   npx tsx scripts/eskime-dok.ts <cikti.json>
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';
const base = process.env.DATABASE_URL!;
const url = base.includes('connection_limit') ? base.replace(/connection_limit=\d+/, 'connection_limit=1') : `${base}${base.includes('?') ? '&' : '?'}connection_limit=1`;
const p = new PrismaClient({ datasources: { db: { url } } });
(async () => {
  const rows = await p.questionVersion.findMany({
    where: { status: 'published', question: { deletedAt: null } },
    select: {
      id: true, questionId: true, stem: true, explanation: true, sourceLabel: true, publishedAt: true,
      _count: { select: { examQuestions: true } },
      options: { select: { label: true, text: true, isCorrect: true }, orderBy: { sortOrder: 'asc' } },
      question: { select: { topic: { select: { name: true, parent: { select: { name: true } }, course: { select: { name: true } } } },
        pastExams: { select: { pastExam: { select: { name: true, kind: true } } } } } },
    },
  });
  const out = rows.map((r) => ({
    q: r.questionId, v: r.id, ders: r.question.topic.course.name,
    konu: (r.question.topic.parent ? r.question.topic.parent.name + ' > ' : '') + r.question.topic.name,
    kok: r.stem, siklar: r.options.map((o) => `${o.label}${o.isCorrect ? '*' : ''}) ${o.text}`),
    aciklama: r.explanation, kaynak: r.sourceLabel, deneme: r._count.examQuestions,
    cikmis: r.question.pastExams.map((x) => x.pastExam.name),
  }));
  writeFileSync(process.argv[2], JSON.stringify(out));
  console.log(out.length);
})().finally(() => p.$disconnect());

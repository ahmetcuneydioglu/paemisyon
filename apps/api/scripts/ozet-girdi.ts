/**
 * Doc 53 §4 adım 1 — Üretim girdisi: ünitenin madde metinleri + o maddelerden çıkmış soruların
 * kökleri ve şıkları (doğru/yanlış işaretli) + madde başına soru sayısı.
 *
 *   cd apps/api && npx tsx scripts/ozet-girdi.ts <legislationSlug> <from> <to> <cikti.json>
 *   örn: npx tsx scripts/ozet-girdi.ts t-c-anayasasi 87 100 /tmp/yasama-2-girdi.json
 *
 * Soru kökleri "ne soruluyor", yanlış şıklar "neyle karıştırılıyor" sorusunu cevaplar.
 * KAYNAK ETİKETİ (sourceLabel) girdiye KONMAZ (4 Eyl 2026 kuralı: model özette tekrarlayabilir).
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const [legSlug, fromS, toS, out] = process.argv.slice(2);
if (!legSlug || !fromS || !toS || !out) {
  console.error('kullanım: ozet-girdi.ts <legislationSlug> <from> <to> <cikti.json>');
  process.exit(2);
}
const url = (process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });

export interface OzetGirdi {
  legislation: { slug: string; name: string; topicId: string | null };
  range: { from: string; to: string };
  articles: { no: string; title: string | null; text: string; questionCount: number }[];
  questions: { articleNos: string[]; stem: string; options: { text: string; isCorrect: boolean }[] }[];
}

(async () => {
  const leg = await prisma.legislation.findFirst({
    where: { slug: legSlug, deletedAt: null },
    select: { id: true, name: true, slug: true, topicId: true },
  });
  if (!leg) {
    console.error('mevzuat yok:', legSlug);
    process.exit(2);
  }
  const from = Number(fromS);
  const to = Number(toS);
  const all = await prisma.lawArticle.findMany({
    where: { legislationId: leg.id, deletedAt: null, status: 'published' },
    orderBy: { sortKey: 'asc' },
    select: { id: true, articleNo: true, title: true, text: true },
  });
  const arts = all.filter((a) => {
    const n = Number(a.articleNo);
    return Number.isFinite(n) && n >= from && n <= to;
  });
  const qa = await prisma.questionArticle.findMany({
    where: {
      lawArticleId: { in: arts.map((a) => a.id) },
      question: { deletedAt: null, currentVersion: { status: 'published' } },
    },
    select: {
      lawArticleId: true,
      question: {
        select: {
          id: true,
          currentVersion: {
            select: { stem: true, options: { orderBy: { sortOrder: 'asc' }, select: { text: true, isCorrect: true } } },
          },
        },
      },
    },
  });
  const idToNo = new Map(arts.map((a) => [a.id, a.articleNo]));
  const byQ = new Map<string, { articleNos: Set<string>; stem: string; options: { text: string; isCorrect: boolean }[] }>();
  const count = new Map<string, number>();
  for (const r of qa) {
    const no = idToNo.get(r.lawArticleId)!;
    const cv = r.question.currentVersion;
    if (!cv) continue;
    const q = byQ.get(r.question.id) ?? { articleNos: new Set<string>(), stem: cv.stem, options: cv.options };
    q.articleNos.add(no);
    byQ.set(r.question.id, q);
  }
  for (const q of byQ.values()) for (const no of q.articleNos) count.set(no, (count.get(no) ?? 0) + 1);

  const girdi: OzetGirdi = {
    legislation: { slug: leg.slug, name: leg.name, topicId: leg.topicId },
    range: { from: fromS, to: toS },
    articles: arts.map((a) => ({ no: a.articleNo, title: a.title, text: a.text, questionCount: count.get(a.articleNo) ?? 0 })),
    questions: [...byQ.values()].map((q) => ({ articleNos: [...q.articleNos].sort((a, b) => Number(a) - Number(b)), stem: q.stem, options: q.options })),
  };
  writeFileSync(out, JSON.stringify(girdi, null, 1));
  console.log(`${leg.name} md ${fromS}–${toS}: ${arts.length} madde, ${byQ.size} soru → ${out}`);
  await prisma.$disconnect();
})();

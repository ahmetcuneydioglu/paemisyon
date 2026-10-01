/**
 * JSPS mukayesesi için SALT OKUNUR envanter: ders → konu → soru sayıları
 * (güncel sürüm durumuna göre), konuya bağlı mevzuat kimliği ve madde etiketi
 * dağılımı. Hiçbir yazma yapmaz.
 *
 *   npx tsx scripts/jsps-mukayese.ts [--out=/yol/dosya.json]
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'node:fs';

const p = new PrismaClient();
const out = process.argv.find((a) => a.startsWith('--out='))?.slice(6);

(async () => {
  const courses = await p.course.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, sortOrder: true },
  });
  const topics = await p.topic.findMany({
    where: { deletedAt: null },
    select: {
      id: true, name: true, courseId: true, parentId: true, sortOrder: true,
      matchKeywords: true,
      legislation: { select: { type: true, number: true, name: true, shortName: true, status: true } },
      _count: { select: { lawArticles: true } },
    },
  });
  const rows = await p.question.findMany({
    where: { deletedAt: null },
    select: {
      topicId: true, articleNo: true,
      currentVersion: { select: { status: true, sourceLabel: true } },
    },
  });
  const byTopic = new Map<string, { total: number; published: number; inReview: number; draft: number; archived: number; articles: Map<string, number>; sources: Map<string, number> }>();
  for (const r of rows) {
    const t = byTopic.get(r.topicId) ?? { total: 0, published: 0, inReview: 0, draft: 0, archived: 0, articles: new Map(), sources: new Map() };
    t.total += 1;
    const s = r.currentVersion?.status;
    if (s === 'published') t.published += 1; else if (s === 'in_review') t.inReview += 1; else if (s === 'archived') t.archived += 1; else t.draft += 1;
    if (r.articleNo) t.articles.set(r.articleNo, (t.articles.get(r.articleNo) ?? 0) + 1);
    const src = r.currentVersion?.sourceLabel ?? '(kaynaksız)';
    t.sources.set(src, (t.sources.get(src) ?? 0) + 1);
    byTopic.set(r.topicId, t);
  }
  const topicName = new Map(topics.map((t) => [t.id, t.name]));
  const report = courses.map((c) => ({
    course: c.name,
    topics: topics
      .filter((t) => t.courseId === c.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((t) => {
        const s = byTopic.get(t.id);
        return {
          topic: t.name,
          parent: t.parentId ? topicName.get(t.parentId) ?? null : null,
          legislation: t.legislation ? `${t.legislation.type} ${t.legislation.number ?? ''} ${t.legislation.shortName ?? ''}`.trim() : null,
          lawArticles: t._count.lawArticles,
          matchKeywords: t.matchKeywords,
          total: s?.total ?? 0,
          published: s?.published ?? 0,
          inReview: s?.inReview ?? 0,
          draft: s?.draft ?? 0,
          archived: s?.archived ?? 0,
          distinctArticles: s ? s.articles.size : 0,
          articles: s ? Object.fromEntries([...s.articles.entries()].sort((a, b) => b[1] - a[1])) : {},
          sourceKinds: s ? s.sources.size : 0,
          topSources: s ? [...s.sources.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5) : [],
        };
      }),
  }));
  const totals = { questions: rows.length, published: rows.filter((r) => r.currentVersion?.status === 'published').length };
  const json = JSON.stringify({ totals, report }, null, 2);
  if (out) writeFileSync(out, json);
  console.log(JSON.stringify(totals));
  for (const c of report) {
    console.log(`\n## ${c.course}`);
    for (const t of c.topics) console.log(`- ${t.topic}${t.parent ? ` (← ${t.parent})` : ''} | ${t.legislation ?? '-'} | toplam ${t.total} / yayın ${t.published} / inceleme ${t.inReview} / arşiv ${t.archived} | madde etiketi ${t.distinctArticles}`);
  }
  await p.$disconnect();
})();

/**
 * JSPS aktarımı için SALT OKUNUR dışa aktarım. JSPS'nin 67 satırıyla ortak olan
 * kanun/yönetmelik konularındaki YAYINLI soruları, güncel sürüm içeriği, şıkları,
 * kaynak etiketi ve madde etiketiyle JSON'a yazar. `article_no` boş olanlar için
 * kök → açıklama → hukuki referans sırasıyla `detectArticleNo` önerisi üretir
 * (Paemisyon'a YAZMAZ; öneri JSPS tarafında kapsam denetimiyle kullanılır).
 *
 *   npx tsx scripts/jsps-disa-aktar.ts --out=/yol/export.json
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'node:fs';
import { detectArticleNo } from '../src/modules/admin/questions/import-parser';

const p = new PrismaClient();
const out = process.argv.find((a) => a.startsWith('--out='))?.slice(6);
if (!out) throw new Error('--out=<dosya> gerekli.');

// JSPS satırlarıyla ortak kanunlar (mevzuat numarası) ve yönetmelikler (konu adı).
const LAW_NUMBERS = ['5237', '2559', '5271', '5326', '7068', '2911', '6136', '1774', '5395', '6284', '3713', '5442', '7201', '6698', '2918', '5607', '6222', '5188', '2860', '6458'];
const REGULATION_TOPICS: Record<string, string> = {
  'Adli Kolluk Yönetmeliği': 'yonetmelik-adli-kolluk',
  'Yakalama, Gözaltına Alma ve İfade Alma Yönetmeliği': 'yonetmelik-yakalama',
  'Adli ve Önleme Aramaları Yönetmeliği': 'yonetmelik-adli-onleme-aramalari',
  'Çocuk Koruma Kanunu Uygulama Yönetmeliği': 'yonetmelik-cocuk-koruma-usul',
  'Koruyucu ve Destekleyici Tedbir Kararlarının Uygulanması Hakkında Yönetmelik': 'yonetmelik-cocuk-koruma-tedbir',
  '6284 Sayılı Kanuna İlişkin Uygulama Yönetmeliği': 'yonetmelik-6284-uygulama',
  'Özel Güvenlik Hizmetlerine Dair Kanunun Uygulanmasına İlişkin Yönetmelik': 'yonetmelik-ozel-guvenlik',
};

(async () => {
  const topics = await p.topic.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, course: { select: { name: true } }, legislation: { select: { type: true, number: true, name: true } } },
  });
  const selected = topics
    .map((t) => {
      const number = t.legislation?.type === 'kanun' ? t.legislation.number : null;
      const key = number && LAW_NUMBERS.includes(number) ? `kanun-${number}` : REGULATION_TOPICS[t.name] ?? null;
      return key ? { ...t, jspsKey: key } : null;
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);
  const questions = await p.question.findMany({
    where: { deletedAt: null, topicId: { in: selected.map((t) => t.id) }, currentVersion: { status: 'published' } },
    select: {
      id: true, topicId: true, articleNo: true, createdAt: true,
      currentVersion: {
        select: {
          id: true, versionNo: true, stem: true, explanation: true, difficulty: true, sourceLabel: true, contentHash: true, publishedAt: true,
          options: { select: { label: true, text: true, isCorrect: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } },
          legalReferences: { select: { citation: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  const topicById = new Map(selected.map((t) => [t.id, t]));
  const rows = questions.map((q) => {
    const v = q.currentVersion!;
    const t = topicById.get(q.topicId)!;
    let detected: string | null = null;
    let detectedFrom: 'stem' | 'explanation' | 'legal_reference' | null = null;
    if (!q.articleNo) {
      for (const [source, text] of [['stem', v.stem], ['explanation', v.explanation ?? ''], ['legal_reference', v.legalReferences.map((r) => r.citation).join(' ')]] as const) {
        const hit = text ? detectArticleNo(text) : null;
        if (hit) { detected = hit; detectedFrom = source; break; }
      }
    }
    return {
      paemisyonId: q.id,
      versionId: v.id,
      versionNo: v.versionNo,
      course: t.course.name,
      topic: t.name,
      jspsKey: t.jspsKey,
      articleNo: q.articleNo,
      detectedArticleNo: detected,
      detectedFrom,
      stem: v.stem,
      explanation: v.explanation,
      difficulty: v.difficulty,
      sourceLabel: v.sourceLabel,
      contentHash: v.contentHash,
      publishedAt: v.publishedAt,
      legalReferences: v.legalReferences.map((r) => r.citation),
      options: v.options,
    };
  });
  const summary = {
    exportedOn: new Date().toISOString().slice(0, 10),
    total: rows.length,
    labeled: rows.filter((r) => r.articleNo).length,
    detected: rows.filter((r) => !r.articleNo && r.detectedArticleNo).length,
    undetected: rows.filter((r) => !r.articleNo && !r.detectedArticleNo).length,
    byKey: Object.fromEntries([...new Set(rows.map((r) => r.jspsKey))].sort().map((k) => [k, rows.filter((r) => r.jspsKey === k).length])),
  };
  writeFileSync(out, JSON.stringify({ summary, rows }, null, 1));
  console.log(JSON.stringify(summary, null, 2));
  await p.$disconnect();
})();

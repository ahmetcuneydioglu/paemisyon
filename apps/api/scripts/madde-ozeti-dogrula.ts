/**
 * Doc 54 — madde özeti doğrulayıcısı (CLI).
 *
 *   cd apps/api && npx tsx scripts/madde-ozeti-dogrula.ts <ozet.json | dizin> [--md]
 *
 * Her JSON için kanunun bütün maddelerini (metin) veritabanından okur, `madde-ozeti-dogrulayici`
 * ile doğrular, raporu basar; --md ile yanına okunur Markdown üretir. Çıkış kodu: kusur varsa 1.
 * Salt okur; connection_limit=1.
 */
import { PrismaClient } from '@prisma/client';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  validateArticleSummary,
  type ArticleSummaryJson,
} from '../src/modules/summaries/madde-ozeti-dogrulayici';
import type { ArticleText } from '../src/modules/summaries/ozet-dogrulayici';

const target = process.argv[2];
if (!target) {
  console.error('kullanım: madde-ozeti-dogrula.ts <ozet.json | dizin> [--md]');
  process.exit(2);
}
const WANT_MD = process.argv.includes('--md');
const url = (process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });

export function renderMarkdown(s: ArticleSummaryJson, lawName: string): string {
  const L = (t: string, items?: string[]) =>
    items?.length ? [`## ${t}`, ...items.map((x) => `- ${x}`), ''] : [];
  const T = (t: string, rows?: { label: string; value: string; ref?: string }[]) =>
    rows?.length
      ? [
          `## ${t}`,
          '| Konu | Değer | Fıkra |',
          '|---|---|---|',
          ...rows.map((r) => `| ${r.label} | ${r.value} | ${r.ref ?? ''} |`),
          '',
        ]
      : [];
  return [
    `# ${lawName} — Madde ${s.articleNo}: ${s.title}`,
    '',
    s.repealed ? `_Mülga._ ${s.shortSummary}` : s.shortSummary,
    '',
    `Durum: in_review · ${s.sourceLabel} (yalnız admin görür) · mevzuat kontrolü ${s.verifiedAt ?? '—'}`,
    '',
    ...(s.detailed ? ['## Ayrıntı', s.detailed, ''] : []),
    ...L('Temel noktalar', s.keyPoints),
    ...L('Şartlar', s.conditions),
    ...L('İstisnalar ve dikkat', s.exceptions),
    ...T('Süreler', s.timeLimits),
    ...T('Sayılar', s.numericalValues),
    ...(s.authorityAndLimits?.length
      ? [
          '## Yetki ve sınır',
          '| Yetki | Sınır | Fıkra |',
          '|---|---|---|',
          ...s.authorityAndLimits.map((a) => `| ${a.authority} | ${a.limit} | ${a.ref ?? ''} |`),
          '',
        ]
      : []),
    ...(s.relatedLegislation?.length
      ? [
          '## Diğer mevzuat',
          ...s.relatedLegislation.map(
            (r) =>
              `- ${r.law}${r.article ? ` md ${r.article}` : ''}${r.note ? ` — ${r.note}` : ''}${r.verified ? '' : ' _(bağlantı doğrulanmadı)_'}`,
          ),
          '',
        ]
      : []),
    ...L('Sınav hatırlatması', s.examReminders),
  ].join('\n');
}

(async () => {
  const files = statSync(target).isDirectory()
    ? readdirSync(target)
        .filter((f) => f.endsWith('.json'))
        .map((f) => join(target, f))
    : [target];
  const lawCache = new Map<
    string,
    { name: string; number: string | null; arts: Map<string, ArticleText> }
  >();
  let fails = 0;
  for (const file of files) {
    const s = JSON.parse(readFileSync(file, 'utf8')) as ArticleSummaryJson;
    let law = lawCache.get(s.lawSlug);
    if (!law) {
      const leg = await prisma.legislation.findFirst({
        where: { slug: s.lawSlug, deletedAt: null },
        select: { id: true, name: true, number: true },
      });
      if (!leg) {
        console.error(`${file}: mevzuat yok: ${s.lawSlug}`);
        fails++;
        continue;
      }
      const rows = await prisma.lawArticle.findMany({
        where: { legislationId: leg.id, deletedAt: null },
        select: { articleNo: true, text: true },
      });
      law = {
        name: leg.name,
        number: leg.number,
        arts: new Map(rows.map((r) => [r.articleNo, { articleNo: r.articleNo, text: r.text }])),
      };
      lawCache.set(s.lawSlug, law);
    }
    const article = law.arts.get(s.articleNo);
    if (!article) {
      console.error(`${file}: madde yok: ${s.articleNo}`);
      fails++;
      continue;
    }
    const v = validateArticleSummary(s, article, law.arts, law.number);
    console.log(`\n[${s.lawSlug} md ${s.articleNo}] ${s.title}`);
    for (const l of v.lines) console.log(`  ${l}`);
    console.log(`  Sonuç: ${v.ok ? 'GEÇTİ' : v.issues.length + ' kusur'}`);
    if (!v.ok) fails++;
    if (WANT_MD) writeFileSync(file.replace(/\.json$/, '.md'), renderMarkdown(s, law.name));
  }
  await prisma.$disconnect();
  console.log(`\n${files.length} dosya · ${fails} kusurlu`);
  process.exit(fails ? 1 : 0);
})();

/**
 * Doc 53 — Konu özeti doğrulayıcısı (CLI).
 *
 *   cd apps/api && npx tsx scripts/ozet-dogrula.ts <unite.json> [--md] [--write]
 *
 * Çekirdek `src/modules/summaries/ozet-dogrulayici.ts`'te (admin içe aktarma ve kart düzenleme
 * aynı kodu kullanır). Bu CLI: mevzuatın maddelerini veritabanından okur, exam_stats/bridge
 * kartlarını veriden doldurur, raporu basar; --write JSON'u doldurulmuş hâliyle yerine yazar,
 * --md yanına okunur Markdown üretir. Çıkış kodu: kusur varsa 1. connection_limit=1'e çevirir.
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync, writeFileSync } from 'fs';
import {
  fillGeneratedBlocks,
  unitArticleNos,
  validateUnit,
  type SummaryUnitJson,
} from '../src/modules/summaries/ozet-dogrulayici';
import { collectExamStats, loadArticleMap, normalizeArticleNos } from '../src/modules/summaries/ozet-ice-aktar';
import { articleLabel } from '../src/modules/summaries/unite-eslesme';

const file = process.argv[2];
if (!file) {
  console.error('kullanım: ozet-dogrula.ts <unite.json> [--md] [--write]');
  process.exit(2);
}
const WANT_MD = process.argv.includes('--md');
const WANT_WRITE = process.argv.includes('--write');

const url = (process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });

const LABEL: Record<string, string> = {
  concept: 'Kavram',
  rule: 'Kural',
  numbers: 'Sayılar',
  compare: 'Karşılaştırma',
  trap: 'Tuzak',
  exam_stats: 'Sınav der ki',
  bridge: 'Köprü',
};

export function renderMarkdown(data: SummaryUnitJson, legName: string): string {
  const md: string[] = [
    `# ${data.unit.title}`,
    '',
    `_${data.unit.subtitle ?? ''}_`,
    '',
    `Kaynak: ${legName}, md ${articleLabel({ ...data.unit, articleNos: data.unit.articleNos ?? [] })}. Durum: in_review. ${data.unit.sourceLabel} (yalnız admin görür).`,
    '',
  ];
  for (const b of data.blocks) {
    const label = LABEL[b.type] ?? b.type;
    md.push(`## ${label === b.title ? b.title : `${label} · ${b.title ?? ''}`}`, '', `<sub>md ${b.articleRefs.join(', ')}</sub>`, '');
    if (b.body) md.push(b.body, '');
    if (b.rows?.length) {
      const keys = Object.keys(b.rows[0]).filter((k) => k !== 'refs');
      const head: Record<string, string> = { label: 'Konu', value: 'Değer', aspect: 'Yön', left: 'Sol', right: 'Sağ' };
      md.push(`| ${keys.map((k) => head[k] ?? k).join(' | ')} | md |`, `|${keys.map(() => '---').join('|')}|---|`);
      for (const r of b.rows) md.push(`| ${keys.map((k) => String(r[k] ?? '')).join(' | ')} | ${(r.refs ?? []).join(', ')} |`);
      md.push('');
    }
  }
  return md.join('\n');
}

(async () => {
  const data = JSON.parse(readFileSync(file, 'utf8')) as SummaryUnitJson;
  const leg = await prisma.legislation.findFirst({
    where: { slug: data.unit.legislationSlug, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!leg) {
    console.error('mevzuat yok:', data.unit.legislationSlug);
    process.exit(2);
  }
  const byNo = await loadArticleMap(prisma, leg.id);
  const nos = normalizeArticleNos(data.unit.articleNos ?? [], byNo);
  if (!nos.ok) {
    console.error('Ünite madde listesi:', nos.error);
    process.exit(1);
  }
  const refs = unitArticleNos(data);
  const stats = await collectExamStats(prisma, byNo, refs);
  fillGeneratedBlocks(data, stats);
  const v = validateUnit(data, byNo);

  console.log(`Ünite: ${data.unit.title}\nMevzuat: ${leg.name} · madde ${byNo.size}`);
  for (const b of v.blocks) {
    console.log(`\n[${b.index + 1}] ${b.type} — ${b.title}`);
    for (const l of b.lines) console.log(`  ${l}`);
  }
  console.log(`\nSonuç: ${v.ok ? 'GEÇTİ' : v.fails + ' kusur'} · ${data.blocks.length} blok · ${stats.totalQuestions} bağlı soru`);

  if (WANT_WRITE) writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  if (WANT_MD) {
    const out = file.replace(/\.json$/, '.md');
    writeFileSync(out, renderMarkdown(data, leg.name));
    console.log('md yazıldı:', out);
  }
  await prisma.$disconnect();
  process.exit(v.ok ? 0 : 1);
})();

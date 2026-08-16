/**
 * Mevzuat Merkezi içe aktarımı (Doc 29 P0-F) — eski import-law-articles'ın
 * legislation-farkındalıklı halefi:
 *   - Kısım/Bölüm başlıklarını YAKALAR → legislation_sections (içindekiler),
 *   - madde başlıklarını yakalar ("Yakalama ve ... işlemler" → title),
 *   - legislationId + sectionId + sortKey yazar,
 *   - kanun künyesini (kaynak URL, doğrulama damgası) günceller.
 *
 * Kaynak: mevzuat.gov.tr resmî PDF'i — İNSAN indirir, kazıma yok (Doc 29 §13).
 *
 *   npx tsx scripts/mevzuat-import.ts --slug <legislation-slug> --file <pdf> \
 *     [--source-url <url>] [--effective-info "..."]  [APPLY=1] [PUBLISH=1]
 */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { parseDocument } from '../src/modules/admin/law-articles/law-document-parser';
import { extractPdfLawText } from '../src/modules/admin/law-articles/pdf-law-text';

const prisma = new PrismaClient();

/** backfill-legislation.articleSortKey'in kopyası (o dosya main() çalıştırır). */
function articleSortKey(no: string): number {
  const m = /^(Ek|Geçici)?\s*(\d+)(?:\/([A-Z]))?/i.exec(no.trim());
  if (!m) return 9_000_000;
  const base = parseInt(m[2], 10) * 100 + (m[3] ? m[3].toUpperCase().charCodeAt(0) - 64 : 0);
  const prefix = (m[1] ?? '').toLocaleLowerCase('tr');
  if (prefix === 'ek') return 1_000_000 + base;
  if (prefix === 'geçici') return 2_000_000 + base;
  return base;
}

function argOf(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? (process.argv[i + 1] ?? null) : null;
}

async function main() {
  const slug = argOf('--slug');
  const file = argOf('--file');
  const sourceUrl = argOf('--source-url');
  const effectiveInfo = argOf('--effective-info');
  const apply = process.env.APPLY === '1';
  const publish = process.env.PUBLISH === '1';
  if (!slug || !file) {
    console.error('Kullanım: --slug <legislation-slug> --file <pdf> [--source-url ...]');
    process.exit(1);
  }
  const leg = await prisma.legislation.findUnique({ where: { slug } });
  if (!leg || !leg.topicId) {
    console.error(`legislation bulunamadı ya da topic bağlantısı yok: ${slug}`);
    process.exit(1);
  }

  const raw = file.endsWith('.pdf')
    ? await extractPdfLawText(readFileSync(file))
    : readFileSync(file, 'utf8');
  const { sections, articles } = parseDocument(raw);

  // Mükerrer madde no: İLK geçen kazanır (dipnot artıkları gerçek metni ezmesin).
  const seen = new Set<string>();
  const unique = articles.filter((a) => {
    if (seen.has(a.articleNo)) return false;
    seen.add(a.articleNo);
    return true;
  });

  console.log(`bölüm: ${sections.length}, madde: ${unique.length} (mükerrer düşen: ${articles.length - unique.length})`);
  for (const s of sections.slice(0, 6)) {
    console.log(`  ${s.parentOrder != null ? '  ' : ''}§ ${s.heading}`);
  }
  for (const a of unique.slice(0, 5)) {
    console.log(`  m.${a.articleNo}${a.title ? ` — ${a.title}` : ''} | ${a.text.slice(0, 70)}…`);
  }
  if (!apply) {
    console.log('\n(dry-run — APPLY=1 ile yaz, PUBLISH=1 ile yayınla)');
    await prisma.$disconnect();
    return;
  }

  // Bölümler: sil-yeniden kur (idempotent; madde FK'ları SetNull ile korunur).
  await prisma.lawArticle.updateMany({
    where: { legislationId: leg.id },
    data: { sectionId: null },
  });
  await prisma.legislationSection.deleteMany({
    where: { legislationId: leg.id, parentId: { not: null } },
  });
  await prisma.legislationSection.deleteMany({ where: { legislationId: leg.id } });

  const sectionIds = new Map<number, string>();
  for (const s of sections) {
    const row = await prisma.legislationSection.create({
      data: {
        legislationId: leg.id,
        heading: s.heading,
        sortOrder: s.order,
        parentId: s.parentOrder != null ? sectionIds.get(s.parentOrder) : null,
      },
    });
    sectionIds.set(s.order, row.id);
  }

  let written = 0;
  for (const a of unique) {
    const text = a.text;
    if (text.length === 0) continue;
    const data = {
      text,
      title: a.title,
      legislationId: leg.id,
      sectionId: a.sectionOrder != null ? (sectionIds.get(a.sectionOrder) ?? null) : null,
      sortKey: articleSortKey(a.articleNo),
      sourceName: 'mevzuat.gov.tr',
      sourceUrl: sourceUrl ?? leg.officialSourceUrl,
      effectiveInfo: effectiveInfo ?? undefined,
      ...(publish
        ? { status: 'published' as const, lastVerifiedAt: new Date() }
        : {}),
    };
    await prisma.lawArticle.upsert({
      where: { topicId_articleNo: { topicId: leg.topicId, articleNo: a.articleNo } },
      update: data,
      create: { topicId: leg.topicId, articleNo: a.articleNo, ...data },
    });
    written++;
  }

  await prisma.legislation.update({
    where: { id: leg.id },
    data: {
      officialSourceUrl: sourceUrl ?? leg.officialSourceUrl,
      effectiveInfo: effectiveInfo ?? leg.effectiveInfo,
      ...(publish ? { status: 'published' as const, lastVerifiedAt: new Date() } : {}),
    },
  });

  console.log(`\nyazıldı: ${written} madde, ${sections.length} bölüm${publish ? ' (YAYINLANDI)' : ' (taslak)'}`);
  await prisma.$disconnect();
}
main();

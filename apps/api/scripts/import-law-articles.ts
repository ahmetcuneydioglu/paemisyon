/**
 * Resmî madde metni içe aktarma (Doc 25 §4 adım 3 — "kanun metni içerik hattı").
 *
 * KAYNAK: mevzuat.gov.tr'den ALINAN birebir konsolide metin. Site otomatik
 * erişime kapalı olduğundan İNSAN indirir. İki girdi biçimi:
 *   · PDF (önerilen): https://www.mevzuat.gov.tr/MevzuatMetin/{Tür}.{Tertip}.{No}.pdf
 *     (ör. 2559 sayılı Kanun → 1.5.2559.pdf) — script PDF'i metne çevirir.
 *   · .txt (kopyala-yapıştır).
 * Script yerel dosyayı madde madde bölüp yazar — kazıma YOK, AI üretimi YOK.
 *
 * Güvenlik:
 *  - Varsayılan TASLAK (status=draft); admin doğrulayıp yayınlar. --publish ile
 *    doğrudan YAYINLA (resmî PDF'e güvenerek; önce dry-run + göz kontrolü önerilir).
 *  - Zaten yayınlanmış/incelemedeki madde EZİLMEZ (--force olmadıkça).
 *  - Yalnız soru etiketi olan maddeleri yazar (Atlas'ın kapsamı); --all ile hepsi.
 *  - dry-run varsayılan; DB penceresi kuralı: connection_limit=1.
 *
 * Çalıştırma (apps/api içinden, DATABASE_URL ortamda olmalı):
 *   npx ts-node scripts/import-law-articles.ts --topic-id <uuid> --file 2559.pdf \
 *     --source-url "https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=2559&MevzuatTur=1&MevzuatTertip=5"
 *   # ...üstteki dry-run; yazmak için --apply, doğrudan yayınlamak için --publish ekle.
 */
import { readFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';
import { parseLawText } from '../src/modules/admin/law-articles/law-text-parser';
import { extractPdfLawText } from '../src/modules/admin/law-articles/pdf-law-text';

const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const ALL = argv.includes('--all');
const FORCE = argv.includes('--force');
// --publish: taslak yerine doğrudan YAYINLA (resmî PDF'e güveniyoruz). Yine de
// önce dry-run + göz kontrolü önerilir; yanlış metin canlıya gitmesin.
const PUBLISH = argv.includes('--publish');

function argVal(flag: string): string | undefined {
  const i = argv.indexOf(flag);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : undefined;
}

function withConnLimit(url: string): string {
  return url.includes('connection_limit')
    ? url
    : `${url}${url.includes('?') ? '&' : '?'}connection_limit=1`;
}

async function main() {
  const topicId = argVal('--topic-id');
  const file = argVal('--file');
  const sourceUrl = argVal('--source-url') ?? null;
  const effectiveInfo = argVal('--effective-info') ?? null;
  const sourceName = argVal('--source-name') ?? 'mevzuat.gov.tr';

  if (!topicId || !file) {
    console.error(
      'Kullanım: --topic-id <uuid> --file <path(.pdf|.txt)> [--source-url URL] [--effective-info "…"] [--all] [--force] [--apply] [--publish]',
    );
    process.exit(1);
  }

  // PDF (mevzuat.gov.tr'den indirilen) → metne çevir; değilse UTF-8 metin oku.
  const isPdf = file.toLowerCase().endsWith('.pdf');
  const raw = isPdf ? await extractPdfLawText(readFileSync(file)) : readFileSync(file, 'utf8');
  const parsed = parseLawText(raw);
  if (parsed.length === 0) {
    console.error(
      'Metinden hiç madde çözümlenemedi — dosya biçimini kontrol et (satır başında "Madde N –").',
    );
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: withConnLimit(process.env.DATABASE_URL!) } },
  });
  try {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, name: true, deletedAt: true },
    });
    if (!topic || topic.deletedAt) {
      console.error(`Kanun (topic) bulunamadı: ${topicId}`);
      process.exit(1);
    }

    // Bu kanunun soru etiketi olan maddeleri (Atlas kapsamı).
    const taggedRows = await prisma.question.groupBy({
      by: ['articleNo'],
      where: { topicId: topic.id, deletedAt: null, articleNo: { not: null } },
    });
    const tagged = new Set(taggedRows.map((r) => r.articleNo!));

    // Mevcut LawArticle durumları (ezme koruması + rapor).
    const existingRows = await prisma.lawArticle.findMany({
      where: { topicId: topic.id, deletedAt: null },
      select: { articleNo: true, status: true },
    });
    const existing = new Map(existingRows.map((r) => [r.articleNo, r.status]));

    const parsedNos = new Set(parsed.map((a) => a.articleNo));
    const candidates = ALL ? parsed : parsed.filter((a) => tagged.has(a.articleNo));

    const toWrite: typeof parsed = [];
    const skippedLocked: string[] = [];
    for (const a of candidates) {
      const st = existing.get(a.articleNo);
      if (st && st !== 'draft' && !FORCE) {
        skippedLocked.push(`${a.articleNo} (${st})`);
        continue;
      }
      toWrite.push(a);
    }

    // Etiketli ama metni bulunamayan maddeler = içerik boşluğu (önemli rapor).
    const missing = [...tagged].filter((no) => !parsedNos.has(no));

    console.log(`Kanun: ${topic.name}`);
    console.log(`Metinden çözümlenen madde: ${parsed.length}`);
    console.log(`Soru etiketli madde: ${tagged.size}${ALL ? ' (--all: tümü yazılıyor)' : ''}`);
    console.log(`Yazılacak: ${toWrite.length}`);
    if (skippedLocked.length) {
      console.log(`Atlanan (yayınlanmış/incelemede, --force yok): ${skippedLocked.length}`);
      console.log(
        `  ${skippedLocked.slice(0, 20).join(', ')}${skippedLocked.length > 20 ? ' …' : ''}`,
      );
    }
    if (missing.length) {
      console.log(`UYARI — etiketli ama metni bulunamayan ${missing.length} madde:`);
      console.log(`  ${missing.slice(0, 30).join(', ')}${missing.length > 30 ? ' …' : ''}`);
    }

    if (!APPLY) {
      console.log('\nDRY-RUN — yazmak için --apply ile çalıştır.');
      return;
    }

    const statusData = PUBLISH
      ? { status: 'published' as const, lastVerifiedAt: new Date() }
      : { status: 'draft' as const, lastVerifiedAt: null };

    let written = 0;
    for (const a of toWrite) {
      await prisma.lawArticle.upsert({
        where: { topicId_articleNo: { topicId: topic.id, articleNo: a.articleNo } },
        create: {
          topicId: topic.id,
          articleNo: a.articleNo,
          text: a.text,
          sourceName,
          sourceUrl,
          effectiveInfo,
          ...statusData,
        },
        update: { text: a.text, sourceName, sourceUrl, effectiveInfo, ...statusData },
      });
      written += 1;
      if (written % 25 === 0) console.log(`  yazıldı: ${written}/${toWrite.length}`);
    }
    console.log(
      PUBLISH
        ? `İçe aktarma tamam — ${written} madde YAYINLANDI (canlıda görünür).`
        : `İçe aktarma tamam — ${written} taslak madde. Admin panelinden doğrulayıp yayınla.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

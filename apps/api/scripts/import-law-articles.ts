/**
 * Resmî madde metni içe aktarma (Doc 25 §4 adım 3 — "kanun metni içerik hattı").
 *
 * KAYNAK: mevzuat.gov.tr'den ALINAN birebir konsolide metin. Site otomatik
 * erişime kapalı olduğundan metni İNSAN indirir (tarayıcıdan .doc→.txt / kopyala)
 * ve bu script yerel dosyayı madde madde bölüp yazar — kazıma YOK, AI üretimi YOK.
 *
 * Güvenlik:
 *  - Yazılan kayıtlar TASLAK (status=draft); admin doğrulayıp yayınlar. İstemciye
 *    yalnız yayınlanmış metin gider.
 *  - Zaten yayınlanmış/incelemedeki madde EZİLMEZ (--force olmadıkça).
 *  - Yalnız soru etiketi olan maddeleri yazar (Atlas'ın kapsamı); --all ile hepsi.
 *  - dry-run varsayılan; DB penceresi kuralı: connection_limit=1.
 *
 * Çalıştırma (apps/api içinden):
 *   npx ts-node scripts/import-law-articles.ts --topic-id <uuid> --file 657.txt \
 *     --source-url "https://www.mevzuat.gov.tr/..." --effective-info "5/7/2022 işlenmiş"
 *   # ...üstteki dry-run; yazmak için sona --apply ekle.
 */
import { readFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';
import { parseLawText } from '../src/modules/admin/law-articles/law-text-parser';

const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const ALL = argv.includes('--all');
const FORCE = argv.includes('--force');

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
      'Kullanım: --topic-id <uuid> --file <path> [--source-url URL] [--effective-info "…"] [--all] [--force] [--apply]',
    );
    process.exit(1);
  }

  const raw = readFileSync(file, 'utf8');
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
          status: 'draft',
        },
        // Yalnız taslağı tazeler; yayınlanmışa buraya --force ile düşülür.
        update: { text: a.text, sourceName, sourceUrl, effectiveInfo, status: 'draft' },
      });
      written += 1;
      if (written % 25 === 0) console.log(`  yazıldı: ${written}/${toWrite.length}`);
    }
    console.log(
      `İçe aktarma tamam — ${written} taslak madde. Admin panelinden doğrulayıp yayınla.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

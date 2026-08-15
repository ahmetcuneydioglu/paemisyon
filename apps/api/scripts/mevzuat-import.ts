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
import { canonicalArticleNo } from '../src/modules/admin/law-articles/law-text-parser';
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

// "BİRİNCİ KISIM" / "ON YEDİNCİ BÖLÜM" — tamamı büyük harf, 1-3 kelime + tür.
const SECTION_RE = /^\s*((?:[A-ZÇĞİÖŞÜ]+\s+){1,3})(KISIM|BÖLÜM)\s*$/;
// Madde başlığı satırı (law-text-parser ile aynı aile).
const ARTICLE_RE =
  /^\s*(ek\s+madde|geçici\s+madde|madde)\s+(\d+(?:\/[0-9A-Za-zÇĞİÖŞÜçğıöşü]+)?)\s*(?:[–—\-.]\s*)?(.*)$/;

interface ParsedSection {
  kind: 'KISIM' | 'BÖLÜM';
  heading: string; // "BİRİNCİ BÖLÜM — Amaç, Kapsam ve Tanımlar"
  order: number;
  parentOrder: number | null; // KISIM sırası (BÖLÜM için)
}
interface ParsedArt {
  no: string;
  title: string | null;
  lines: string[];
  sectionOrder: number | null;
}

function parseDocument(raw: string): { sections: ParsedSection[]; articles: ParsedArt[] } {
  const lines = raw.split('\n');
  const sections: ParsedSection[] = [];
  const articles: ParsedArt[] = [];
  let current: ParsedArt | null = null;
  let currentKisim: number | null = null;
  let currentSection: number | null = null;
  let pendingSection: { kind: 'KISIM' | 'BÖLÜM' } | null = null;
  let prevLine = '';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length === 0) {
      prevLine = '';
      continue;
    }

    // Bölüm başlığının İKİNCİ satırı: "Amaç, Kapsam ve Tanımlar".
    if (pendingSection) {
      const s = sections[sections.length - 1];
      // Alt başlık makul uzunluktaysa başlığa ekle; değilse tek satır kalır.
      if (line.length <= 90 && !ARTICLE_RE.test(line.toLocaleLowerCase('tr'))) {
        s.heading = `${s.heading} — ${line}`;
        pendingSection = null;
        prevLine = '';
        continue;
      }
      pendingSection = null;
    }

    const sm = SECTION_RE.exec(line);
    if (sm) {
      const kind = sm[2] as 'KISIM' | 'BÖLÜM';
      const order = sections.length;
      if (kind === 'KISIM') currentKisim = order;
      sections.push({
        kind,
        heading: `${sm[1].trim()} ${kind}`,
        order,
        parentOrder: kind === 'BÖLÜM' ? currentKisim : null,
      });
      currentSection = order;
      pendingSection = { kind };
      // Başlıktan hemen önce yakalanmış "madde başlığı adayı" bölüme aitmiş —
      // önceki maddenin gövdesinden zaten düşülmedi; sorun yok.
      prevLine = '';
      continue;
    }

    const am = ARTICLE_RE.exec(line.toLocaleLowerCase('tr'));
    if (am) {
      const label = am[1].replace(/\s+/, ' ');
      const rawNo =
        label.startsWith('ek') ? `ek ${am[2]}` :
        label.startsWith('geçici') ? `geçici ${am[2]}` : am[2];
      const no = canonicalArticleNo(rawNo);
      if (no) {
        // Madde başlığı: hemen önceki kısa, noktasız satır (resmî düzen).
        let title: string | null = null;
        if (
          current &&
          prevLine.length > 0 &&
          prevLine.length <= 90 &&
          !/[.:;]$/.test(prevLine) &&
          !SECTION_RE.test(prevLine)
        ) {
          // PDF dipnot numaraları başlığa yapışır: "Kasten yaralama3637";
          // Anayasa kenar başlıklarındaki "II." roman ön eki de düşer.
          title = prevLine
            .replace(/\d+$/, '')
            .replace(/^[IVXLC]+\.\s*/, '')
            .trim();
          // Dipnot rakamı atılınca cümle olduğu ortaya çıkan satır ("…tabidir.")
          // başlık DEĞİL, önceki maddenin devam satırıdır.
          if (/[.:;,]$/.test(title) || title.length < 3) title = null;
          // Önceki maddenin gövdesinin son satırıysa oradan düş.
          const tail = current.lines[current.lines.length - 1];
          if (tail === prevLine) current.lines.pop();
        }
        if (current) articles.push(current);
        // Başlık satırının madde metni kuyruğu ("Madde 90- (1) …" kalanı):
        // orijinal satırdan etiketi düşerek al (büyük/küçük harf korunur).
        const restStart = line.length - am[3].length;
        const rest = am[3].length > 0 ? line.slice(restStart) : '';
        current = {
          no,
          title,
          lines: rest ? [rest] : [],
          sectionOrder: currentSection,
        };
        prevLine = '';
        continue;
      }
    }

    if (current) current.lines.push(line);
    prevLine = line;
  }
  if (current) articles.push(current);
  return { sections, articles };
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
    if (seen.has(a.no)) return false;
    seen.add(a.no);
    return true;
  });

  console.log(`bölüm: ${sections.length}, madde: ${unique.length} (mükerrer düşen: ${articles.length - unique.length})`);
  for (const s of sections.slice(0, 6)) {
    console.log(`  ${s.parentOrder != null ? '  ' : ''}§ ${s.heading}`);
  }
  for (const a of unique.slice(0, 5)) {
    console.log(`  m.${a.no}${a.title ? ` — ${a.title}` : ''} | ${a.lines.join(' ').slice(0, 70)}…`);
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
    const text = a.lines.join('\n').trim();
    if (text.length === 0) continue;
    const data = {
      text,
      title: a.title,
      legislationId: leg.id,
      sectionId: a.sectionOrder != null ? (sectionIds.get(a.sectionOrder) ?? null) : null,
      sortKey: articleSortKey(a.no),
      sourceName: 'mevzuat.gov.tr',
      sourceUrl: sourceUrl ?? leg.officialSourceUrl,
      effectiveInfo: effectiveInfo ?? undefined,
      ...(publish
        ? { status: 'published' as const, lastVerifiedAt: new Date() }
        : {}),
    };
    await prisma.lawArticle.upsert({
      where: { topicId_articleNo: { topicId: leg.topicId, articleNo: a.no } },
      update: data,
      create: { topicId: leg.topicId, articleNo: a.no, ...data },
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

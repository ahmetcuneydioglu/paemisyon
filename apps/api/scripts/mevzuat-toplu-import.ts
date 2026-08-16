/**
 * Toplu mevzuat taşıma (tek seferlik dalga — Doc 29):
 * ~/Downloads'taki mevzuat.gov.tr PDF'lerini metinsiz mevzuata eşler,
 * HER dosyada kimlik doğrulaması yapar (yanlış kanun yazılamaz), dry-run
 * raporu üretir; APPLY=1 ile içe aktarıp yayınlar.
 *
 * Eşleme:
 *  - "X.Y.NNNN.pdf" → legislation.number == NNNN (X=tür, Y=tertip → kaynak URL)
 *  - "yon-<anahtar>.pdf" → aşağıdaki yönetmelik eşleme tablosu
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { PrismaClient } from '@prisma/client';
import {
  parseDocument,
  verifyLawIdentity,
} from '../src/modules/admin/law-articles/law-document-parser';
import { articleSortKey } from '../src/modules/admin/law-articles/law-text-parser';
import { extractPdfLawText } from '../src/modules/admin/law-articles/pdf-law-text';

const prisma = new PrismaClient();

/** yon-*.pdf → legislation adı arama parçası. */
const YONETMELIK_MAP: Record<string, string> = {
  'yon-adli-arama': 'Adli ve Önleme Aramaları',
  'yon-yakalama-gozalti': 'Yakalama, Gözaltına Alma',
  'yon-atama': 'Atama ve Yer Değiştirme',
  'yon-cocuk-koruma': 'Çocuk Koruma Kanunu Uygulama',
  'yon-adli-kolluk': 'Adli Kolluk Yönetmeliği',
  'yon-performans': 'Performans Değerlendirme',
};

interface Plan {
  file: string;
  slug: string;
  name: string;
  sourceUrl: string | null;
  raw: string;
  sections: number;
  articles: number;
  titled: number;
  identityOk: boolean;
  identityReason?: string;
}

async function buildPlans(): Promise<{ plans: Plan[]; skipped: string[] }> {
  const dir = join(homedir(), 'Downloads');
  const files = readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.pdf'));
  const legs = await prisma.legislation.findMany({
    where: { deletedAt: null },
    select: {
      slug: true, name: true, number: true, topicId: true,
      _count: { select: { articles: { where: { status: 'published', deletedAt: null } } } },
    },
  });
  const needText = legs.filter((l) => l._count.articles === 0);
  const byNumber = new Map(needText.filter((l) => l.number).map((l) => [l.number!, l]));

  const plans: Plan[] = [];
  const skipped: string[] = [];
  const claimed = new Set<string>();

  for (const f of files) {
    let target: (typeof needText)[number] | undefined;
    let sourceUrl: string | null = null;

    const num = /^(\d+)\.(\d+)\.(\d{3,5})\.pdf$/i.exec(f);
    const yon = /^(yon-[a-z-]+)\.pdf$/i.exec(f);
    if (num) {
      target = byNumber.get(num[3]);
      if (target) {
        sourceUrl = `https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=${num[3]}&MevzuatTur=${num[1]}&MevzuatTertip=${num[2]}`;
      }
    } else if (yon) {
      const needle = YONETMELIK_MAP[yon[1].toLocaleLowerCase('tr')];
      if (needle) {
        target = needText.find((l) =>
          l.name.toLocaleLowerCase('tr').includes(needle.toLocaleLowerCase('tr')),
        );
      }
    }
    if (!target) continue; // ilgisiz PDF (eski sınav kitapçıkları vb.)
    if (claimed.has(target.slug)) {
      skipped.push(`${f} → ${target.slug} zaten başka dosyayla eşleşti`);
      continue;
    }
    claimed.add(target.slug);

    const raw = await extractPdfLawText(readFileSync(join(dir, f)));
    const identity = verifyLawIdentity(raw, {
      number: target.number,
      name: target.name,
    });
    const doc = parseDocument(raw);
    plans.push({
      file: f,
      slug: target.slug,
      name: target.name,
      sourceUrl,
      raw,
      sections: doc.sections.length,
      articles: doc.articles.length,
      titled: doc.articles.filter((a) => a.title != null).length,
      identityOk: identity.ok,
      identityReason: identity.reason,
    });
  }
  return { plans, skipped };
}

async function importOne(plan: Plan): Promise<string> {
  const leg = await prisma.legislation.findUnique({ where: { slug: plan.slug } });
  if (!leg?.topicId) return 'HATA: topic bağlantısı yok';
  const doc = parseDocument(plan.raw);

  const seen = new Set<string>();
  const unique = doc.articles.filter((a) => {
    if (seen.has(a.articleNo)) return false;
    seen.add(a.articleNo);
    return true;
  });

  // Bölümler: sil-yeniden kur.
  await prisma.lawArticle.updateMany({
    where: { legislationId: leg.id },
    data: { sectionId: null },
  });
  await prisma.legislationSection.deleteMany({
    where: { legislationId: leg.id, parentId: { not: null } },
  });
  await prisma.legislationSection.deleteMany({ where: { legislationId: leg.id } });
  const sectionIds = new Map<number, string>();
  for (const s of doc.sections) {
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
    const data = {
      text: a.text,
      title: a.title,
      legislationId: leg.id,
      sectionId:
        a.sectionOrder != null ? (sectionIds.get(a.sectionOrder) ?? null) : null,
      sortKey: articleSortKey(a.articleNo),
      sourceName: 'mevzuat.gov.tr',
      sourceUrl: plan.sourceUrl ?? leg.officialSourceUrl,
      status: 'published' as const,
      lastVerifiedAt: new Date(),
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
      officialSourceUrl: plan.sourceUrl ?? leg.officialSourceUrl,
      status: 'published',
      lastVerifiedAt: new Date(),
    },
  });
  return `${written} madde, ${doc.sections.length} bölüm YAYINLANDI`;
}

async function main() {
  const apply = process.env.APPLY === '1';
  const { plans, skipped } = await buildPlans();

  console.log(`eşleşen dosya: ${plans.length}\n`);
  for (const p of plans) {
    const flag = p.identityOk ? '✓' : '✗ KİMLİK UYUŞMUYOR';
    console.log(
      `${flag} ${p.file} → ${p.name.slice(0, 52)} | ${p.articles} madde, ${p.sections} bölüm, ${p.titled} başlık${p.identityReason ? ` | ${p.identityReason}` : ''}`,
    );
  }
  for (const s of skipped) console.log('atlandı:', s);

  const bad = plans.filter((p) => !p.identityOk);
  if (!apply) {
    console.log(`\n(dry-run — APPLY=1 ile yaz; kimliği uyuşmayan ${bad.length} dosya HER DURUMDA atlanır)`);
    await prisma.$disconnect();
    return;
  }

  console.log('');
  for (const p of plans) {
    if (!p.identityOk) {
      console.log(`ATLANDI (kimlik): ${p.file}`);
      continue;
    }
    if (p.articles === 0) {
      console.log(`ATLANDI (0 madde çözümlendi — PDF düzeni farklı): ${p.file}`);
      continue;
    }
    const r = await importOne(p);
    console.log(`${p.name.slice(0, 48)} → ${r}`);
  }
  await prisma.$disconnect();
}
main();

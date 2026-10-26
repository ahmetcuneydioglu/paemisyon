/**
 * Doc 53 — Ünite içe aktarma: JSON → doğrula → istatistikleri veriden doldur → in_review olarak yaz.
 *
 * PrismaClient alır (PrismaService de bir PrismaClient'tır); hem admin servisi hem
 * `scripts/ozet-yukle.ts` aynı yolu kullanır. Doğrulamayı geçmeyen ünite YAZILMAZ.
 */
import type { Prisma, PrismaClient } from '@prisma/client';
import {
  fillGeneratedBlocks,
  unitArticleNos,
  validateUnit,
  type ArticleText,
  type ExamStatsInput,
  type SummaryUnitJson,
  type UnitValidation,
} from './ozet-dogrulayici';

type Db = Pick<
  PrismaClient,
  'legislation' | 'lawArticle' | 'questionArticle' | 'lawArticleVersion' | 'summaryUnit' | 'topic' | '$transaction'
>;

export interface ImportResult {
  unitId: string;
  slug: string;
  blocks: number;
  totalQuestions: number;
  validation: UnitValidation;
}

export class SummaryImportError extends Error {
  constructor(
    message: string,
    readonly validation?: UnitValidation,
  ) {
    super(message);
  }
}

/** Mevzuatın tüm maddeleri: no → metin (ünite dışı referanslar için de gerekir). */
export async function loadArticleMap(db: Db, legislationId: string) {
  const arts = await db.lawArticle.findMany({
    where: { legislationId, deletedAt: null },
    select: { id: true, articleNo: true, title: true, text: true },
  });
  const byNo = new Map<string, ArticleText & { id: string; title: string | null }>();
  for (const a of arts) byNo.set(a.articleNo, { articleNo: a.articleNo, text: a.text, id: a.id, title: a.title });
  return byNo;
}

/** Ünitenin maddelerine bağlı yayındaki sorular → istatistik girdisi (model değil, veri). */
export async function collectExamStats(
  db: Db,
  byNo: Map<string, { id: string; title: string | null }>,
  articleNos: string[],
): Promise<ExamStatsInput> {
  const ids = articleNos.map((n) => byNo.get(n)?.id).filter((x): x is string => Boolean(x));
  const rows = await db.questionArticle.findMany({
    where: { lawArticleId: { in: ids }, question: { deletedAt: null, currentVersion: { status: 'published' } } },
    select: {
      lawArticleId: true,
      question: {
        select: { id: true, pastExams: { select: { pastExam: { select: { name: true, kind: true } } } } },
      },
    },
  });
  const idToNo = new Map([...byNo].map(([no, a]) => [a.id, no]));
  const perArticleSets = new Map<string, Set<string>>();
  const exams = new Map<string, number>();
  const all = new Set<string>();
  for (const r of rows) {
    const no = idToNo.get(r.lawArticleId);
    if (!no) continue;
    (perArticleSets.get(no) ?? perArticleSets.set(no, new Set()).get(no)!).add(r.question.id);
    all.add(r.question.id);
    // Yalnız RESMÎ sınav adı gösterilir (Doc 36 istisnası); analiz/kitap etiketi girmez.
    for (const pe of r.question.pastExams) {
      if (pe.pastExam.kind !== 'resmi') continue;
      exams.set(pe.pastExam.name, (exams.get(pe.pastExam.name) ?? 0) + 1);
    }
  }
  return {
    perArticle: new Map([...perArticleSets].map(([no, s]) => [no, s.size])),
    titles: new Map([...byNo].map(([no, a]) => [no, a.title ?? ''])),
    totalQuestions: all.size,
    exams,
  };
}

/** Madde → en son sürüm no (eskime kıyası için karta yazılır). */
async function latestVersionNos(db: Db, articleIds: string[]): Promise<Map<string, number>> {
  if (articleIds.length === 0) return new Map();
  const g = await db.lawArticleVersion.groupBy({
    by: ['lawArticleId'],
    where: { lawArticleId: { in: articleIds } },
    _max: { versionNo: true },
  });
  return new Map(g.map((r) => [r.lawArticleId, r._max.versionNo ?? 0]));
}

export async function importUnit(
  db: Db,
  data: SummaryUnitJson,
  opts: { createdBy?: string | null; replaceExisting?: boolean } = {},
): Promise<ImportResult> {
  const u = data.unit;
  if (!u?.slug || !u.legislationSlug || !u.topicId || !u.title || !u.sourceLabel) {
    throw new SummaryImportError('unit.slug, legislationSlug, topicId, title ve sourceLabel zorunlu.');
  }
  if (!/^AI özeti/.test(u.sourceLabel)) {
    throw new SummaryImportError('sourceLabel "AI özeti" ön ekiyle başlamalı (Doc 53 karar 2).');
  }
  if (!Array.isArray(data.blocks) || data.blocks.length === 0) {
    throw new SummaryImportError('En az bir kart gerekli.');
  }
  const leg = await db.legislation.findFirst({
    where: { slug: u.legislationSlug, deletedAt: null },
    select: { id: true },
  });
  if (!leg) throw new SummaryImportError(`Mevzuat bulunamadı: ${u.legislationSlug}`);
  const topic = await db.topic.findFirst({ where: { id: u.topicId, deletedAt: null }, select: { id: true } });
  if (!topic) throw new SummaryImportError(`Konu bulunamadı: ${u.topicId}`);

  const byNo = await loadArticleMap(db, leg.id);
  const refs = unitArticleNos(data);
  const stats = await collectExamStats(db, byNo, refs);
  fillGeneratedBlocks(data, stats);

  const validation = validateUnit(data, byNo);
  if (!validation.ok) {
    throw new SummaryImportError(`Doğrulama geçmedi: ${validation.fails} kusur. Ünite yazılmadı.`, validation);
  }

  const allRefIds = [...new Set(data.blocks.flatMap((b) => b.articleRefs))]
    .map((n) => byNo.get(n)?.id)
    .filter((x): x is string => Boolean(x));
  const versions = await latestVersionNos(db, allRefIds);

  const existing = await db.summaryUnit.findUnique({ where: { slug: u.slug }, select: { id: true, version: true, status: true } });
  if (existing && !opts.replaceExisting) {
    throw new SummaryImportError(`Bu slug zaten var: ${u.slug}. Üzerine yazmak için replaceExisting.`);
  }

  const unitData = {
    topicId: topic.id,
    legislationId: leg.id,
    slug: u.slug,
    title: u.title,
    subtitle: u.subtitle ?? null,
    articleFrom: String(u.articleFrom),
    articleTo: String(u.articleTo),
    readingMinutes: u.readingMinutes ?? 10,
    sourceLabel: u.sourceLabel,
    generatedBy: u.generatedBy ?? null,
    status: 'in_review' as const,
    createdBy: opts.createdBy ?? null,
  };
  const blocksData = data.blocks.map((b, i) => ({
    type: b.type,
    title: b.title ?? null,
    body: b.body ?? null,
    rows: (b.rows ?? undefined) as Prisma.InputJsonValue | undefined,
    derivedNumbers: (b.derivedNumbers ?? undefined) as Prisma.InputJsonValue | undefined,
    counterNumbers: b.counterNumbers ?? [],
    generated: Boolean(b.generated),
    sortOrder: i,
    status: 'in_review' as const,
    articleRefs: {
      create: b.articleRefs
        .map((n) => byNo.get(n)?.id)
        .filter((x): x is string => Boolean(x))
        .map((lawArticleId) => ({ lawArticleId, articleVersionNo: versions.get(lawArticleId) ?? null })),
    },
  }));

  const unitId = await db.$transaction(async (tx) => {
    if (existing) {
      // Yeniden içe aktarma: eski kartlar silinir (cascade), sürüm artar, durum incelemeye döner.
      await tx.summaryBlock.deleteMany({ where: { unitId: existing.id } });
      const row = await tx.summaryUnit.update({
        where: { id: existing.id },
        data: { ...unitData, version: existing.version + 1, publishedAt: null, deletedAt: null, blocks: { create: blocksData } },
        select: { id: true },
      });
      return row.id;
    }
    const row = await tx.summaryUnit.create({ data: { ...unitData, blocks: { create: blocksData } }, select: { id: true } });
    return row.id;
  });

  return { unitId, slug: u.slug, blocks: data.blocks.length, totalQuestions: stats.totalQuestions, validation };
}

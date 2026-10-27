/**
 * Doc 54 — madde özeti içe aktarma: JSON → doğrula → `article_summaries` (in_review, 1:1 upsert).
 * Admin servisi ve `scripts/madde-ozeti-yukle.ts` aynı yolu kullanır. Doğrulamayı geçmeyen özet yazılmaz.
 */
import type { Prisma, PrismaClient } from '@prisma/client';
import {
  validateArticleSummary,
  type ArticleSummaryJson,
  type ArticleSummaryValidation,
} from './madde-ozeti-dogrulayici';
import { normalizeCounterNumbers, type ArticleText } from './ozet-dogrulayici';

type Db = Pick<PrismaClient, 'legislation' | 'lawArticle' | 'lawArticleVersion' | 'articleSummary'>;

export class ArticleSummaryImportError extends Error {
  constructor(
    message: string,
    readonly validation?: ArticleSummaryValidation,
  ) {
    super(message);
  }
}

export interface ArticleSummaryImportResult {
  id: string;
  lawSlug: string;
  articleNo: string;
  replaced: boolean;
  validation: ArticleSummaryValidation;
}

/** Kanunun bütün maddeleri (no → metin + id). */
export async function loadLawArticles(db: Db, lawSlug: string) {
  const leg = await db.legislation.findFirst({
    where: { slug: lawSlug, deletedAt: null },
    select: { id: true, name: true, number: true },
  });
  if (!leg) throw new ArticleSummaryImportError(`Mevzuat bulunamadı: ${lawSlug}`);
  const rows = await db.lawArticle.findMany({
    where: { legislationId: leg.id, deletedAt: null },
    select: { id: true, articleNo: true, text: true },
  });
  const byNo = new Map<string, ArticleText & { id: string }>(
    rows.map((r) => [r.articleNo, { articleNo: r.articleNo, text: r.text, id: r.id }]),
  );
  return { leg, byNo };
}

export function toSummaryData(
  s: ArticleSummaryJson,
  opts: { createdBy?: string | null; articleVersionNo: number | null },
) {
  const j = (v: unknown) => (v == null ? undefined : (v as Prisma.InputJsonValue));
  return {
    repealed: Boolean(s.repealed),
    title: s.title.trim(),
    shortSummary: s.shortSummary.trim(),
    detailed: s.detailed?.trim() || null,
    keyPoints: s.keyPoints ?? [],
    conditions: s.conditions ?? [],
    exceptions: s.exceptions ?? [],
    timeLimits: j(s.timeLimits),
    numericalValues: j(s.numericalValues),
    authorityAndLimits: j(s.authorityAndLimits),
    relatedLegislation: j(s.relatedLegislation),
    examReminders: s.examReminders ?? [],
    derivedNumbers: j(s.derivedNumbers),
    counterNumbers: normalizeCounterNumbers(s.counterNumbers),
    articleVersionNo: opts.articleVersionNo,
    staleSince: null as Date | null,
    verificationStatus: 'pending_review' as const,
    verifiedAt: s.verifiedAt ? new Date(s.verifiedAt) : null,
    sourceLabel: s.sourceLabel,
    generatedBy: s.generatedBy ?? null,
    status: 'in_review' as const,
    createdBy: opts.createdBy ?? null,
  };
}

export async function importArticleSummary(
  db: Db,
  s: ArticleSummaryJson,
  opts: { createdBy?: string | null; replaceExisting?: boolean } = {},
): Promise<ArticleSummaryImportResult> {
  const { leg, byNo } = await loadLawArticles(db, s.lawSlug);
  const article = byNo.get(s.articleNo);
  if (!article)
    throw new ArticleSummaryImportError(`Madde bulunamadı: ${s.lawSlug} md ${s.articleNo}`);
  const validation = validateArticleSummary(s, article, byNo, leg.number);
  if (!validation.ok)
    throw new ArticleSummaryImportError(
      `Doğrulama geçmedi: ${validation.issues.length} kusur. Özet yazılmadı.`,
      validation,
    );

  const ver = await db.lawArticleVersion.findFirst({
    where: { lawArticleId: article.id },
    orderBy: { versionNo: 'desc' },
    select: { versionNo: true },
  });
  const existing = await db.articleSummary.findUnique({
    where: { lawArticleId: article.id },
    select: { id: true, version: true },
  });
  if (existing && !opts.replaceExisting) {
    throw new ArticleSummaryImportError(
      `md ${s.articleNo} için özet zaten var. Üzerine yazmak için replaceExisting.`,
    );
  }
  const data = toSummaryData(s, {
    createdBy: opts.createdBy,
    articleVersionNo: ver?.versionNo ?? null,
  });
  const row = existing
    ? await db.articleSummary.update({
        where: { id: existing.id },
        data: { ...data, version: existing.version + 1, publishedAt: null },
        select: { id: true },
      })
    : await db.articleSummary.create({
        data: { ...data, lawArticleId: article.id },
        select: { id: true },
      });
  return {
    id: row.id,
    lawSlug: s.lawSlug,
    articleNo: s.articleNo,
    replaced: Boolean(existing),
    validation,
  };
}

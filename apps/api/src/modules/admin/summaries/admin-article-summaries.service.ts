import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { AuditService } from '../audit.service';
import {
  validateArticleSummary,
  type ArticleSummaryJson,
} from '../../summaries/madde-ozeti-dogrulayici';
import {
  ArticleSummaryImportError,
  importArticleSummary,
  loadLawArticles,
  toSummaryData,
} from '../../summaries/madde-ozeti-ice-aktar';
import { articleSummaryPaths, revalidateWebPaths } from '../../summaries/web-revalidate';

export type UpdateArticleSummaryDto = Partial<
  Pick<
    ArticleSummaryJson,
    | 'title'
    | 'shortSummary'
    | 'detailed'
    | 'keyPoints'
    | 'conditions'
    | 'exceptions'
    | 'timeLimits'
    | 'numericalValues'
    | 'authorityAndLimits'
    | 'relatedLegislation'
    | 'examReminders'
    | 'derivedNumbers'
    | 'counterNumbers'
  >
>;

/**
 * Madde özetleri — panel tarafı (Doc 54). Üretim modeldir, yayın insanındır: içe aktarma in_review açar;
 * editör alanları düzenler (her kayıt sayı/atıf doğrulamasından yeniden geçer); admin yayınlar. Eskimiş
 * (madde metni tazelenmiş) özet yayınlanamaz; önce yeniden incelenir.
 */
@Injectable()
export class AdminArticleSummariesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Kanun bazında kapsama: madde sayısı, özetli, yayında, eskimiş. */
  async laws() {
    const legs = await this.prisma.legislation.findMany({
      where: { deletedAt: null, articles: { some: { summary: { isNot: null } } } },
      select: {
        id: true,
        slug: true,
        name: true,
        shortName: true,
        _count: { select: { articles: { where: { deletedAt: null } } } },
        articles: {
          where: { deletedAt: null, summary: { isNot: null } },
          select: { summary: { select: { status: true, staleSince: true } } },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
    return legs.map((l) => ({
      slug: l.slug,
      name: l.name,
      shortName: l.shortName,
      articles: l._count.articles,
      summarized: l.articles.length,
      published: l.articles.filter((a) => a.summary?.status === 'published').length,
      inReview: l.articles.filter((a) => a.summary?.status === 'in_review').length,
      stale: l.articles.filter((a) => a.summary?.staleSince).length,
    }));
  }

  /** Bir kanunun maddeleri + özet durumu (madde sırasıyla; özetsizler de listede). */
  async list(lawSlug: string) {
    const leg = await this.prisma.legislation.findFirst({
      where: { slug: lawSlug, deletedAt: null },
      select: { id: true, name: true, slug: true },
    });
    if (!leg) throw new NotFoundException('Mevzuat bulunamadı.');
    const rows = await this.prisma.lawArticle.findMany({
      where: { legislationId: leg.id, deletedAt: null },
      orderBy: { sortKey: 'asc' },
      select: {
        id: true,
        articleNo: true,
        title: true,
        lastVerifiedAt: true,
        _count: { select: { questions: true } },
        summary: {
          select: {
            id: true,
            title: true,
            status: true,
            repealed: true,
            staleSince: true,
            verificationStatus: true,
            verifiedAt: true,
            version: true,
            sourceLabel: true,
            updatedAt: true,
          },
        },
      },
    });
    return {
      law: leg,
      articles: rows.map((r) => ({
        lawArticleId: r.id,
        no: r.articleNo,
        articleTitle: r.title,
        questionCount: r._count.questions,
        textVerifiedAt: r.lastVerifiedAt,
        summary: r.summary,
      })),
    };
  }

  /** Özet + resmî madde metni (yan yana inceleme) + canlı doğrulama. */
  async detail(id: string) {
    const s = await this.prisma.articleSummary.findUnique({
      where: { id },
      include: {
        lawArticle: {
          select: {
            id: true,
            articleNo: true,
            title: true,
            text: true,
            lastVerifiedAt: true,
            effectiveInfo: true,
            sourceUrl: true,
            legislation: { select: { slug: true, name: true, number: true } },
          },
        },
      },
    });
    if (!s || !s.lawArticle.legislation) throw new NotFoundException('Özet bulunamadı.');
    const leg = s.lawArticle.legislation;
    const { byNo } = await loadLawArticles(this.prisma, leg.slug);
    const json = this.toJson(s, leg.slug, s.lawArticle.articleNo);
    const validation = validateArticleSummary(
      json,
      { articleNo: s.lawArticle.articleNo, text: s.lawArticle.text },
      byNo,
      leg.number,
    );
    const { lawArticle, ...rest } = s;
    const art = {
      id: lawArticle.id,
      articleNo: lawArticle.articleNo,
      title: lawArticle.title,
      text: lawArticle.text,
      lastVerifiedAt: lawArticle.lastVerifiedAt,
      effectiveInfo: lawArticle.effectiveInfo,
      sourceUrl: lawArticle.sourceUrl,
    };
    return { ...rest, article: { ...art, lawSlug: leg.slug, lawName: leg.name }, validation };
  }

  async import(actor: AuthenticatedUser, data: ArticleSummaryJson, replaceExisting = false) {
    try {
      const r = await importArticleSummary(this.prisma, data, {
        createdBy: actor.id,
        replaceExisting,
      });
      await this.audit.log(actor, 'article_summary.import', 'article_summary', r.id, {
        lawSlug: r.lawSlug,
        articleNo: r.articleNo,
        replaced: r.replaced,
      });
      return r;
    } catch (e) {
      if (e instanceof ArticleSummaryImportError) {
        throw new BadRequestException(
          [e.message, ...(e.validation?.issues ?? []).map((i) => `✗ ${i}`)].join('\n'),
        );
      }
      throw e;
    }
  }

  /** Alan düzenleme: kayıt öncesi yeniden doğrulanır; geçmeyen kaydedilmez. Eskime damgası kalkar. */
  async update(actor: AuthenticatedUser, id: string, dto: UpdateArticleSummaryDto) {
    const s = await this.prisma.articleSummary.findUnique({
      where: { id },
      include: {
        lawArticle: {
          select: {
            id: true,
            articleNo: true,
            text: true,
            legislation: { select: { slug: true, number: true } },
          },
        },
      },
    });
    if (!s || !s.lawArticle.legislation) throw new NotFoundException('Özet bulunamadı.');
    const slug = s.lawArticle.legislation.slug;
    const next: ArticleSummaryJson = { ...this.toJson(s, slug, s.lawArticle.articleNo), ...dto };
    const { byNo } = await loadLawArticles(this.prisma, slug);
    const v = validateArticleSummary(
      next,
      { articleNo: s.lawArticle.articleNo, text: s.lawArticle.text },
      byNo,
      s.lawArticle.legislation.number,
    );
    if (!v.ok)
      throw new BadRequestException(
        [
          `Özet doğrulamayı geçmedi: ${v.issues.length} kusur.`,
          ...v.issues.map((i) => `✗ ${i}`),
        ].join('\n'),
      );
    const ver = await this.prisma.lawArticleVersion.findFirst({
      where: { lawArticleId: s.lawArticle.id },
      orderBy: { versionNo: 'desc' },
      select: { versionNo: true },
    });
    const d = toSummaryData(next, {
      createdBy: s.createdBy,
      articleVersionNo: ver?.versionNo ?? null,
    });
    // Düzenleme durumu, sürümü, kaynak etiketini ve doğrulama durumunu korur; yalnız içerik ve eskime değişir.
    const icerik: Prisma.ArticleSummaryUpdateInput = {
      repealed: d.repealed,
      title: d.title,
      shortSummary: d.shortSummary,
      detailed: d.detailed,
      keyPoints: d.keyPoints,
      conditions: d.conditions,
      exceptions: d.exceptions,
      timeLimits: d.timeLimits,
      numericalValues: d.numericalValues,
      authorityAndLimits: d.authorityAndLimits,
      relatedLegislation: d.relatedLegislation,
      examReminders: d.examReminders,
      derivedNumbers: d.derivedNumbers,
      counterNumbers: d.counterNumbers,
      articleVersionNo: d.articleVersionNo,
      staleSince: null,
    };
    await this.prisma.articleSummary.update({ where: { id }, data: icerik });
    await this.audit.log(actor, 'article_summary.update', 'article_summary', id);
    return { ok: true, validation: v };
  }

  async setVerification(
    actor: AuthenticatedUser,
    id: string,
    status: 'pending_review' | 'verified' | 'needs_refresh',
  ) {
    const s = await this.prisma.articleSummary.findUnique({ where: { id }, select: { id: true } });
    if (!s) throw new NotFoundException('Özet bulunamadı.');
    await this.prisma.articleSummary.update({
      where: { id },
      data: {
        verificationStatus: status,
        ...(status === 'verified' ? { verifiedAt: new Date() } : {}),
      },
    });
    await this.audit.log(actor, 'article_summary.verification', 'article_summary', id, { status });
    return { ok: true };
  }

  /** Yayın (admin): eskimiş değil, doğrulama geçiyor, mevzuat kontrolü "verified" ya da en azından pending değil değilse uyarı değil engel. */
  async publish(actor: AuthenticatedUser, id: string) {
    if (!actor.roles.includes('admin'))
      throw new ForbiddenException('Yayın kararı admin yetkisi ister.');
    const d = await this.detail(id);
    if (d.staleSince)
      throw new BadRequestException(
        'Madde metni tazelenmiş; özet eskimiş. Önce yeniden incele ve kaydet.',
      );
    if (!d.validation.ok)
      throw new BadRequestException(`${d.validation.issues.length} kusur var; yayınlanamaz.`);
    if (d.verificationStatus === 'needs_refresh')
      throw new BadRequestException(
        'Mevzuat doğrulaması "tazeleme gerekli" durumunda; önce metni tazele.',
      );
    await this.prisma.articleSummary.update({
      where: { id },
      data: {
        status: 'published',
        publishedAt: new Date(),
        verificationStatus: 'verified',
        verifiedAt: d.verifiedAt ?? new Date(),
      },
    });
    await this.audit.log(actor, 'article_summary.publish', 'article_summary', id);
    await revalidateWebPaths(articleSummaryPaths(d.article.lawSlug, d.article.articleNo));
    return { ok: true };
  }

  /**
   * Toplu yayın (admin): her özet tek tek aynı kapıdan geçer (eskimiş / kusurlu / tazeleme gerekli → atlanır,
   * nedeniyle döner). Zaten yayındakiler sayılmaz. İş kullanıcı kararıdır: hangi kayıtların girdiğini istemci seçer.
   */
  async publishMany(actor: AuthenticatedUser, ids: string[]) {
    if (!actor.roles.includes('admin'))
      throw new ForbiddenException('Yayın kararı admin yetkisi ister.');
    const published: { id: string; articleNo: string }[] = [];
    const skipped: { id: string; articleNo: string; reason: string }[] = [];
    for (const id of [...new Set(ids)]) {
      const s = await this.prisma.articleSummary.findUnique({
        where: { id },
        select: { status: true, lawArticle: { select: { articleNo: true } } },
      });
      if (!s) {
        skipped.push({ id, articleNo: '?', reason: 'bulunamadı' });
        continue;
      }
      if (s.status === 'published') continue;
      try {
        await this.publish(actor, id);
        published.push({ id, articleNo: s.lawArticle.articleNo });
      } catch (e) {
        skipped.push({
          id,
          articleNo: s.lawArticle.articleNo,
          reason: e instanceof Error ? e.message : 'yayınlanamadı',
        });
      }
    }
    await this.audit.log(actor, 'article_summary.publish_many', 'article_summary', null, {
      published: published.map((p) => p.articleNo),
      skipped: skipped.map((p) => `${p.articleNo}: ${p.reason}`),
    });
    return { published, skipped };
  }

  async unpublish(actor: AuthenticatedUser, id: string) {
    if (!actor.roles.includes('admin'))
      throw new ForbiddenException('Yayından alma admin yetkisi ister.');
    const s = await this.prisma.articleSummary.update({
      where: { id },
      data: { status: 'in_review' },
      select: {
        lawArticle: { select: { articleNo: true, legislation: { select: { slug: true } } } },
      },
    });
    await this.audit.log(actor, 'article_summary.unpublish', 'article_summary', id);
    if (s.lawArticle.legislation)
      await revalidateWebPaths(
        articleSummaryPaths(s.lawArticle.legislation.slug, s.lawArticle.articleNo),
      );
    return { ok: true };
  }

  async remove(actor: AuthenticatedUser, id: string) {
    if (!actor.roles.includes('admin')) throw new ForbiddenException('Silme admin yetkisi ister.');
    const s = await this.prisma.articleSummary.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!s) throw new NotFoundException('Özet bulunamadı.');
    if (s.status === 'published')
      throw new BadRequestException('Yayındaki özet silinmez; önce yayından al.');
    await this.prisma.articleSummary.delete({ where: { id } });
    await this.audit.log(actor, 'article_summary.delete', 'article_summary', id);
    return { ok: true };
  }

  /** Eskimiş özetler — admin kuyruğu. */
  async staleQueue() {
    const rows = await this.prisma.articleSummary.findMany({
      where: { staleSince: { not: null } },
      orderBy: { staleSince: 'asc' },
      select: {
        id: true,
        title: true,
        status: true,
        staleSince: true,
        lawArticle: {
          select: {
            articleNo: true,
            legislation: { select: { slug: true, shortName: true, name: true } },
          },
        },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      staleSince: r.staleSince,
      articleNo: r.lawArticle.articleNo,
      law: r.lawArticle.legislation,
    }));
  }

  private toJson(
    s: {
      repealed: boolean;
      title: string;
      shortSummary: string;
      detailed: string | null;
      keyPoints: string[];
      conditions: string[];
      exceptions: string[];
      timeLimits: unknown;
      numericalValues: unknown;
      authorityAndLimits: unknown;
      relatedLegislation: unknown;
      examReminders: string[];
      derivedNumbers: unknown;
      counterNumbers: number[];
      verifiedAt: Date | null;
      sourceLabel: string;
      generatedBy: string | null;
    },
    lawSlug: string,
    articleNo: string,
  ): ArticleSummaryJson {
    const arr = <T>(v: unknown): T[] | undefined => (Array.isArray(v) ? (v as T[]) : undefined);
    return {
      lawSlug,
      articleNo,
      repealed: s.repealed,
      title: s.title,
      shortSummary: s.shortSummary,
      detailed: s.detailed ?? undefined,
      keyPoints: s.keyPoints,
      conditions: s.conditions,
      exceptions: s.exceptions,
      timeLimits: arr(s.timeLimits),
      numericalValues: arr(s.numericalValues),
      authorityAndLimits: arr(s.authorityAndLimits),
      relatedLegislation: arr(s.relatedLegislation),
      examReminders: s.examReminders,
      derivedNumbers: arr(s.derivedNumbers),
      counterNumbers: s.counterNumbers,
      verifiedAt: s.verifiedAt?.toISOString().slice(0, 10),
      sourceLabel: s.sourceLabel,
      generatedBy: s.generatedBy ?? undefined,
    };
  }
}

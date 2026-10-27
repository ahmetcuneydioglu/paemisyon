import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, SummaryBlockType } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { AuditService } from '../audit.service';
import {
  blockText,
  extractNumbers,
  fillGeneratedBlocks,
  unitArticleNos,
  validateBlock,
  validateUnit,
  type SummaryBlockJson,
  type SummaryRow,
  type SummaryUnitJson,
} from '../../summaries/ozet-dogrulayici';
import {
  collectExamStats,
  importUnit,
  loadArticleMap,
  SummaryImportError,
} from '../../summaries/ozet-ice-aktar';

export interface UpdateUnitDto {
  title?: string;
  subtitle?: string | null;
  isPremium?: boolean;
  readingMinutes?: number;
  sortOrder?: number;
}

export interface UpdateBlockDto {
  title?: string | null;
  body?: string | null;
  rows?: SummaryRow[] | null;
  /** Madde numaraları ("75", "84"); kaydedilirken id'ye çevrilir. */
  articleRefs?: string[];
  counterNumbers?: number[];
  derivedNumbers?: { value: number; expr: string; refs: string[]; note?: string }[] | null;
}

const BLOCK_SELECT = {
  id: true,
  type: true,
  title: true,
  body: true,
  rows: true,
  derivedNumbers: true,
  counterNumbers: true,
  generated: true,
  sortOrder: true,
  status: true,
  staleSince: true,
  updatedAt: true,
  articleRefs: {
    select: {
      articleVersionNo: true,
      lawArticle: { select: { id: true, articleNo: true, title: true, sortKey: true } },
    },
  },
} satisfies Prisma.SummaryBlockSelect;

/**
 * Konu özetleri — panel tarafı (Doc 53 §4 adım 4–6). Üretim modeldir, yayın insanındır:
 * içe aktarma in_review açar; editör kartları düzenler (her kayıt yeniden doğrulanır);
 * admin yayınlar. Eskimiş (stale) kartı olan ünite yayınlanamaz.
 */
@Injectable()
export class AdminSummariesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Liste: ders › konu › ünite; durum, kart sayıları, eskimiş kart sayısı. */
  async list() {
    const units = await this.prisma.summaryUnit.findMany({
      where: { deletedAt: null },
      orderBy: [
        { topic: { course: { sortOrder: 'asc' } } },
        { topicId: 'asc' },
        { sortOrder: 'asc' },
      ],
      select: {
        id: true,
        slug: true,
        title: true,
        articleFrom: true,
        articleTo: true,
        status: true,
        isPremium: true,
        readingMinutes: true,
        sortOrder: true,
        version: true,
        sourceLabel: true,
        publishedAt: true,
        updatedAt: true,
        topic: { select: { id: true, name: true, course: { select: { name: true } } } },
        legislation: { select: { slug: true, name: true, shortName: true } },
        blocks: { select: { status: true, staleSince: true, generated: true } },
      },
    });
    return units.map((u) => ({
      id: u.id,
      slug: u.slug,
      title: u.title,
      articleFrom: u.articleFrom,
      articleTo: u.articleTo,
      status: u.status,
      isPremium: u.isPremium,
      readingMinutes: u.readingMinutes,
      sortOrder: u.sortOrder,
      version: u.version,
      sourceLabel: u.sourceLabel,
      publishedAt: u.publishedAt,
      updatedAt: u.updatedAt,
      topicId: u.topic.id,
      topicName: u.topic.name,
      courseName: u.topic.course.name,
      legislationName: u.legislation.shortName ?? u.legislation.name,
      legislationSlug: u.legislation.slug,
      blocks: u.blocks.filter((b) => b.status !== 'archived').length,
      staleBlocks: u.blocks.filter((b) => b.staleSince && b.status !== 'archived').length,
      generatedBlocks: u.blocks.filter((b) => b.generated && b.status !== 'archived').length,
    }));
  }

  /** Ünite + kartlar + referans madde metinleri (yan yana inceleme) + canlı doğrulama raporu. */
  async detail(id: string) {
    const unit = await this.prisma.summaryUnit.findFirst({
      where: { id, deletedAt: null },
      include: {
        topic: { select: { id: true, name: true, course: { select: { name: true } } } },
        legislation: { select: { id: true, slug: true, name: true, shortName: true } },
        blocks: {
          where: { status: { not: 'archived' } },
          orderBy: { sortOrder: 'asc' },
          select: BLOCK_SELECT,
        },
      },
    });
    if (!unit) throw new NotFoundException('Ünite bulunamadı.');
    const byNo = await loadArticleMap(this.prisma, unit.legislation.id);
    const refNos = new Set(
      unit.blocks.flatMap((b) => b.articleRefs.map((r) => r.lawArticle.articleNo)),
    );
    const articles = [...refNos]
      .map((no) => byNo.get(no))
      .filter((a): a is NonNullable<typeof a> => Boolean(a))
      .map((a) => ({ no: a.articleNo, title: a.title, text: a.text }));
    const json = this.toJson(unit);
    const validation = validateUnit(json, byNo);
    return {
      id: unit.id,
      slug: unit.slug,
      title: unit.title,
      subtitle: unit.subtitle,
      articleFrom: unit.articleFrom,
      articleTo: unit.articleTo,
      status: unit.status,
      isPremium: unit.isPremium,
      readingMinutes: unit.readingMinutes,
      sortOrder: unit.sortOrder,
      version: unit.version,
      sourceLabel: unit.sourceLabel,
      generatedBy: unit.generatedBy,
      publishedAt: unit.publishedAt,
      updatedAt: unit.updatedAt,
      topic: { id: unit.topic.id, name: unit.topic.name, courseName: unit.topic.course.name },
      legislation: unit.legislation,
      blocks: unit.blocks.map((b, i) => ({
        id: b.id,
        type: b.type,
        title: b.title,
        body: b.body,
        rows: b.rows,
        derivedNumbers: b.derivedNumbers,
        counterNumbers: b.counterNumbers,
        generated: b.generated,
        sortOrder: b.sortOrder,
        status: b.status,
        staleSince: b.staleSince,
        updatedAt: b.updatedAt,
        articleRefs: [...b.articleRefs]
          .sort((x, y) => x.lawArticle.sortKey - y.lawArticle.sortKey)
          .map((r) => ({
            no: r.lawArticle.articleNo,
            title: r.lawArticle.title,
            versionNo: r.articleVersionNo,
          })),
        validation: validation.blocks[i],
      })),
      articles,
      validation: { ok: validation.ok, fails: validation.fails },
    };
  }

  /** JSON içe aktarma (betik çıktısı ya da panelden yapıştırılan). */
  async import(actor: AuthenticatedUser, data: SummaryUnitJson, replaceExisting = false) {
    try {
      const r = await importUnit(this.prisma, data, { createdBy: actor.id, replaceExisting });
      await this.audit.log(actor, 'summary_unit.import', 'summary_unit', r.unitId, {
        slug: r.slug,
        blocks: r.blocks,
        replaceExisting,
      });
      return r;
    } catch (e) {
      if (e instanceof SummaryImportError) {
        // Hata zarfı yalnız mesaj taşır (Doc 7): kusurlar mesaja satır satır eklenir, panel pre-line gösterir.
        const satirlar = (e.validation?.blocks ?? [])
          .filter((b) => !b.ok)
          .map((b) => `[${b.index + 1}] ${b.title || b.type}: ${b.issues.join('; ')}`);
        throw new BadRequestException([e.message, ...satirlar].join('\n'));
      }
      throw e;
    }
  }

  async updateUnit(actor: AuthenticatedUser, id: string, dto: UpdateUnitDto) {
    const unit = await this.prisma.summaryUnit.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!unit) throw new NotFoundException('Ünite bulunamadı.');
    const data: Prisma.SummaryUnitUpdateInput = {};
    if (dto.title !== undefined) {
      if (!dto.title.trim()) throw new BadRequestException('Başlık boş olamaz.');
      data.title = dto.title.trim();
    }
    if (dto.subtitle !== undefined) data.subtitle = dto.subtitle?.trim() || null;
    if (dto.isPremium !== undefined) data.isPremium = Boolean(dto.isPremium);
    if (dto.readingMinutes !== undefined) {
      const m = Math.floor(Number(dto.readingMinutes));
      if (!Number.isFinite(m) || m < 1 || m > 120)
        throw new BadRequestException('Okuma süresi 1–120 dk olmalı.');
      data.readingMinutes = m;
    }
    if (dto.sortOrder !== undefined) data.sortOrder = Math.floor(Number(dto.sortOrder)) || 0;
    const row = await this.prisma.summaryUnit.update({ where: { id }, data, select: { id: true } });
    await this.audit.log(
      actor,
      'summary_unit.update',
      'summary_unit',
      row.id,
      data as Prisma.InputJsonValue,
    );
    return { ok: true };
  }

  /**
   * Kart düzenleme: kayıt öncesi kart yeniden doğrulanır; geçmeyen kart KAYDEDİLMEZ (400 + kusurlar).
   * Kaydedilen kartın eskime damgası kalkar, madde sürümü yenilenir.
   */
  async updateBlock(actor: AuthenticatedUser, blockId: string, dto: UpdateBlockDto) {
    const block = await this.prisma.summaryBlock.findUnique({
      where: { id: blockId },
      select: {
        ...BLOCK_SELECT,
        unit: { select: { id: true, legislationId: true, deletedAt: true } },
      },
    });
    if (!block || block.unit.deletedAt) throw new NotFoundException('Kart bulunamadı.');
    if (block.generated)
      throw new BadRequestException(
        'Betik üretimi kart (istatistik/köprü) elle düzenlenmez; "istatistikleri yenile" kullan.',
      );

    const byNo = await loadArticleMap(this.prisma, block.unit.legislationId);
    const next: SummaryBlockJson = {
      type: block.type,
      title: dto.title !== undefined ? (dto.title ?? undefined) : (block.title ?? undefined),
      body: dto.body !== undefined ? (dto.body ?? undefined) : (block.body ?? undefined),
      rows:
        dto.rows !== undefined
          ? (dto.rows ?? undefined)
          : ((block.rows as SummaryRow[] | null) ?? undefined),
      articleRefs: dto.articleRefs ?? block.articleRefs.map((r) => r.lawArticle.articleNo),
      derivedNumbers:
        dto.derivedNumbers !== undefined
          ? (dto.derivedNumbers ?? undefined)
          : ((block.derivedNumbers as SummaryBlockJson['derivedNumbers']) ?? undefined),
      counterNumbers: dto.counterNumbers ?? block.counterNumbers,
    };
    if (!next.title?.trim() && !next.body?.trim() && !next.rows?.length) {
      throw new BadRequestException('Kart boş olamaz.');
    }
    const v = validateBlock(next, block.sortOrder, byNo);
    if (!v.ok)
      throw new BadRequestException(
        [
          `Kart doğrulamayı geçmedi: ${v.issues.length} kusur.`,
          ...v.issues.map((i) => `✗ ${i}`),
        ].join('\n'),
      );

    const refIds = next.articleRefs
      .map((n) => byNo.get(n)?.id)
      .filter((x): x is string => Boolean(x));
    const versions = await this.prisma.lawArticleVersion.groupBy({
      by: ['lawArticleId'],
      where: { lawArticleId: { in: refIds } },
      _max: { versionNo: true },
    });
    const vMap = new Map(versions.map((r) => [r.lawArticleId, r._max.versionNo ?? null]));

    await this.prisma.$transaction(async (tx) => {
      await tx.summaryBlockArticle.deleteMany({ where: { blockId } });
      await tx.summaryBlock.update({
        where: { id: blockId },
        data: {
          title: next.title?.trim() || null,
          body: next.body ?? null,
          rows: (next.rows ?? null) as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput,
          derivedNumbers: (next.derivedNumbers ?? null) as
            Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput,
          counterNumbers: next.counterNumbers ?? [],
          staleSince: null,
          articleRefs: {
            create: refIds.map((lawArticleId) => ({
              lawArticleId,
              articleVersionNo: vMap.get(lawArticleId) ?? null,
            })),
          },
        },
      });
    });
    await this.audit.log(actor, 'summary_block.update', 'summary_block', blockId, {
      unitId: block.unit.id,
    });
    return { ok: true, validation: v };
  }

  /** Yeni kart (düzenleyici "kart ekle"): aynı doğrulama; sona eklenir. */
  async addBlock(
    actor: AuthenticatedUser,
    unitId: string,
    dto: UpdateBlockDto & { type: SummaryBlockType },
  ) {
    const unit = await this.prisma.summaryUnit.findFirst({
      where: { id: unitId, deletedAt: null },
      select: {
        id: true,
        legislationId: true,
        blocks: { select: { sortOrder: true }, orderBy: { sortOrder: 'desc' }, take: 1 },
      },
    });
    if (!unit) throw new NotFoundException('Ünite bulunamadı.');
    if (dto.type === 'exam_stats' || dto.type === 'bridge')
      throw new BadRequestException('Bu kart türü betik üretimidir.');
    const byNo = await loadArticleMap(this.prisma, unit.legislationId);
    const next: SummaryBlockJson = {
      type: dto.type,
      title: dto.title ?? undefined,
      body: dto.body ?? undefined,
      rows: dto.rows ?? undefined,
      articleRefs: dto.articleRefs ?? [],
      derivedNumbers: dto.derivedNumbers ?? undefined,
      counterNumbers: dto.counterNumbers ?? [],
    };
    const sortOrder = (unit.blocks[0]?.sortOrder ?? -1) + 1;
    const v = validateBlock(next, sortOrder, byNo);
    if (!v.ok)
      throw new BadRequestException(
        [
          `Kart doğrulamayı geçmedi: ${v.issues.length} kusur.`,
          ...v.issues.map((i) => `✗ ${i}`),
        ].join('\n'),
      );
    const refIds = next.articleRefs
      .map((n) => byNo.get(n)?.id)
      .filter((x): x is string => Boolean(x));
    const row = await this.prisma.summaryBlock.create({
      data: {
        unitId,
        type: dto.type,
        title: next.title?.trim() || null,
        body: next.body ?? null,
        rows: (next.rows ?? undefined) as Prisma.InputJsonValue | undefined,
        derivedNumbers: (next.derivedNumbers ?? undefined) as Prisma.InputJsonValue | undefined,
        counterNumbers: next.counterNumbers ?? [],
        sortOrder,
        status: 'in_review',
        articleRefs: { create: refIds.map((lawArticleId) => ({ lawArticleId })) },
      },
      select: { id: true },
    });
    await this.audit.log(actor, 'summary_block.create', 'summary_block', row.id, { unitId });
    return { id: row.id };
  }

  async archiveBlock(actor: AuthenticatedUser, blockId: string) {
    const block = await this.prisma.summaryBlock.findUnique({
      where: { id: blockId },
      select: { id: true, unitId: true },
    });
    if (!block) throw new NotFoundException('Kart bulunamadı.');
    await this.prisma.summaryBlock.update({ where: { id: blockId }, data: { status: 'archived' } });
    await this.audit.log(actor, 'summary_block.archive', 'summary_block', blockId, {
      unitId: block.unitId,
    });
    return { ok: true };
  }

  async reorder(actor: AuthenticatedUser, unitId: string, blockIds: string[]) {
    const blocks = await this.prisma.summaryBlock.findMany({
      where: { unitId, status: { not: 'archived' } },
      select: { id: true },
    });
    const known = new Set(blocks.map((b) => b.id));
    if (blockIds.length !== known.size || blockIds.some((id) => !known.has(id))) {
      throw new BadRequestException('Sıralama listesi ünitenin kartlarıyla birebir eşleşmeli.');
    }
    await this.prisma.$transaction(
      blockIds.map((id, i) =>
        this.prisma.summaryBlock.update({ where: { id }, data: { sortOrder: i } }),
      ),
    );
    await this.audit.log(actor, 'summary_unit.reorder', 'summary_unit', unitId);
    return { ok: true };
  }

  /** İstatistik ve köprü kartlarını veriden yeniden üret (soru bankası değişince). */
  async refreshStats(actor: AuthenticatedUser, unitId: string) {
    const unit = await this.prisma.summaryUnit.findFirst({
      where: { id: unitId, deletedAt: null },
      include: {
        legislation: { select: { slug: true } },
        blocks: {
          where: { status: { not: 'archived' } },
          orderBy: { sortOrder: 'asc' },
          select: BLOCK_SELECT,
        },
      },
    });
    if (!unit) throw new NotFoundException('Ünite bulunamadı.');
    const byNo = await loadArticleMap(this.prisma, unit.legislationId);
    const json = this.toJson(unit);
    const refs = unitArticleNos(json);
    const stats = await collectExamStats(this.prisma, byNo, refs);
    fillGeneratedBlocks(json, stats);
    const refIds = refs.map((n) => byNo.get(n)?.id).filter((x): x is string => Boolean(x));
    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < unit.blocks.length; i++) {
        const b = unit.blocks[i];
        if (b.type !== 'exam_stats' && b.type !== 'bridge') continue;
        await tx.summaryBlockArticle.deleteMany({ where: { blockId: b.id } });
        await tx.summaryBlock.update({
          where: { id: b.id },
          data: {
            rows: (json.blocks[i].rows ?? []) as Prisma.InputJsonValue,
            generated: true,
            staleSince: null,
            articleRefs: { create: refIds.map((lawArticleId) => ({ lawArticleId })) },
          },
        });
      }
    });
    await this.audit.log(actor, 'summary_unit.refresh_stats', 'summary_unit', unitId, {
      totalQuestions: stats.totalQuestions,
    });
    return { ok: true, totalQuestions: stats.totalQuestions };
  }

  /** Yayın (admin): eskimiş kart yok, en az bir insan kartı var, bütün kartlar doğrulamayı geçiyor. */
  async publish(actor: AuthenticatedUser, unitId: string) {
    if (!actor.roles.includes('admin'))
      throw new ForbiddenException('Yayın kararı admin yetkisi ister.');
    const unit = await this.prisma.summaryUnit.findFirst({
      where: { id: unitId, deletedAt: null },
      include: {
        legislation: { select: { slug: true } },
        blocks: {
          where: { status: { not: 'archived' } },
          orderBy: { sortOrder: 'asc' },
          select: BLOCK_SELECT,
        },
      },
    });
    if (!unit) throw new NotFoundException('Ünite bulunamadı.');
    const stale = unit.blocks.filter((b) => b.staleSince);
    if (stale.length)
      throw new BadRequestException(`${stale.length} eskimiş kart var; önce güncelle.`);
    if (!unit.blocks.some((b) => !b.generated))
      throw new BadRequestException('Yayınlanacak kart yok.');
    const byNo = await loadArticleMap(this.prisma, unit.legislationId);
    const v = validateUnit(this.toJson(unit), byNo);
    if (!v.ok) throw new BadRequestException(`${v.fails} kusur var; ünite yayınlanamaz.`);
    await this.prisma.$transaction([
      this.prisma.summaryBlock.updateMany({
        where: { unitId, status: { not: 'archived' } },
        data: { status: 'published' },
      }),
      this.prisma.summaryUnit.update({
        where: { id: unitId },
        data: { status: 'published', publishedAt: new Date() },
      }),
    ]);
    await this.audit.log(actor, 'summary_unit.publish', 'summary_unit', unitId, {
      blocks: unit.blocks.length,
    });
    return { ok: true };
  }

  async unpublish(actor: AuthenticatedUser, unitId: string) {
    if (!actor.roles.includes('admin'))
      throw new ForbiddenException('Yayından alma admin yetkisi ister.');
    const unit = await this.prisma.summaryUnit.findFirst({
      where: { id: unitId, deletedAt: null },
      select: { id: true },
    });
    if (!unit) throw new NotFoundException('Ünite bulunamadı.');
    await this.prisma.$transaction([
      this.prisma.summaryBlock.updateMany({
        where: { unitId, status: 'published' },
        data: { status: 'in_review' },
      }),
      this.prisma.summaryUnit.update({ where: { id: unitId }, data: { status: 'in_review' } }),
    ]);
    await this.audit.log(actor, 'summary_unit.unpublish', 'summary_unit', unitId);
    return { ok: true };
  }

  async remove(actor: AuthenticatedUser, unitId: string) {
    if (!actor.roles.includes('admin')) throw new ForbiddenException('Silme admin yetkisi ister.');
    const unit = await this.prisma.summaryUnit.findFirst({
      where: { id: unitId, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!unit) throw new NotFoundException('Ünite bulunamadı.');
    if (unit.status === 'published')
      throw new BadRequestException('Yayındaki ünite silinmez; önce yayından al.');
    await this.prisma.summaryUnit.update({
      where: { id: unitId },
      data: { deletedAt: new Date(), status: 'archived' },
    });
    await this.audit.log(actor, 'summary_unit.delete', 'summary_unit', unitId);
    return { ok: true };
  }

  /** Eskimiş kartlar — admin kuyruğu. */
  async staleQueue() {
    const blocks = await this.prisma.summaryBlock.findMany({
      where: { staleSince: { not: null }, status: { not: 'archived' }, unit: { deletedAt: null } },
      orderBy: { staleSince: 'asc' },
      select: {
        id: true,
        title: true,
        type: true,
        staleSince: true,
        unit: { select: { id: true, slug: true, title: true } },
        articleRefs: {
          select: { articleVersionNo: true, lawArticle: { select: { articleNo: true } } },
        },
      },
    });
    return blocks.map((b) => ({
      id: b.id,
      title: b.title,
      type: b.type,
      staleSince: b.staleSince,
      unit: b.unit,
      articles: b.articleRefs.map((r) => ({
        no: r.lawArticle.articleNo,
        versionNo: r.articleVersionNo,
      })),
    }));
  }

  /** DB satırlarını doğrulayıcının JSON biçimine çevirir. */
  private toJson(unit: {
    slug: string;
    title: string;
    subtitle: string | null;
    articleFrom: string;
    articleTo: string;
    readingMinutes: number;
    sourceLabel: string;
    topicId: string;
    legislation: { slug: string };
    blocks: {
      type: SummaryBlockType;
      title: string | null;
      body: string | null;
      rows: unknown;
      derivedNumbers: unknown;
      counterNumbers: number[];
      generated: boolean;
      articleRefs: { lawArticle: { articleNo: string } }[];
    }[];
  }): SummaryUnitJson {
    return {
      unit: {
        slug: unit.slug,
        legislationSlug: unit.legislation.slug,
        topicId: unit.topicId,
        title: unit.title,
        subtitle: unit.subtitle ?? undefined,
        articleFrom: unit.articleFrom,
        articleTo: unit.articleTo,
        readingMinutes: unit.readingMinutes,
        sourceLabel: unit.sourceLabel,
      },
      blocks: unit.blocks.map((b) => ({
        type: b.type,
        title: b.title ?? undefined,
        body: b.body ?? undefined,
        rows: (b.rows as SummaryRow[] | null) ?? undefined,
        derivedNumbers: (b.derivedNumbers as SummaryBlockJson['derivedNumbers']) ?? undefined,
        counterNumbers: b.counterNumbers,
        generated: b.generated,
        articleRefs: b.articleRefs.map((r) => r.lawArticle.articleNo),
      })),
    };
  }
}

// Dışa aktarılan yardımcılar testlerde kullanılır.
export { blockText, extractNumbers };

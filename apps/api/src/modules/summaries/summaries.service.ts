import { Injectable, NotFoundException } from '@nestjs/common';
import type { SummaryBlock, SummaryBlockType } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';

/** Kilitli (premium) ünitede misafire/ücretsize açık kalan kart sayısı (Doc 53 §9 varsayımı: 2). */
export const KILITLI_UNITE_ACIK_KART = 2;

export interface PublicUnitListItem {
  slug: string;
  title: string;
  subtitle: string | null;
  articleFrom: string;
  articleTo: string;
  readingMinutes: number;
  isPremium: boolean;
  /** Bu kullanıcı için kilitli mi (premium ünite + premium olmayan kullanıcı). */
  locked: boolean;
  blockCount: number;
  progress: { lastBlockIndex: number; completedAt: string | null } | null;
}

export interface PublicBlock {
  id: string;
  type: SummaryBlockType;
  title: string | null;
  body: string | null;
  rows: unknown | null;
  /** Madde rozetleri: dokununca madde sheet'i (mevcut /public/laws/:slug/articles/:no). */
  articles: { no: string; title: string | null }[];
  /** bridge kartı: madde kapsamlı seans parametreleri. */
  session?: { topicId: string; articleNos: string[] };
}

/**
 * Konu özetleri — public okuma ve kullanıcı ilerlemesi (Doc 53 §6).
 * Kaynak etiketi (sourceLabel) BURADAN ÇIKMAZ: yalnız admin görür (4 Eyl 2026 kuralı).
 */
@Injectable()
export class SummariesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Yayındaki bütün üniteler (web sitemap ve vitrin). Kullanıcıya özel alan yok; paylaşımlı cache uygun. */
  async listAllPublished() {
    const units = await this.prisma.summaryUnit.findMany({
      where: { status: 'published', deletedAt: null },
      orderBy: [{ topicId: 'asc' }, { sortOrder: 'asc' }],
      select: {
        slug: true,
        title: true,
        subtitle: true,
        articleFrom: true,
        articleTo: true,
        readingMinutes: true,
        isPremium: true,
        updatedAt: true,
        topic: { select: { id: true, name: true, course: { select: { name: true } } } },
        legislation: { select: { slug: true, name: true, shortName: true } },
      },
    });
    return units.map((u) => ({
      slug: u.slug,
      title: u.title,
      subtitle: u.subtitle,
      articleFrom: u.articleFrom,
      articleTo: u.articleTo,
      readingMinutes: u.readingMinutes,
      isPremium: u.isPremium,
      updatedAt: u.updatedAt.toISOString(),
      topic: { id: u.topic.id, name: u.topic.name, courseName: u.topic.course.name },
      legislation: u.legislation,
    }));
  }

  /** Konu sayfasının "Özet" yüzü: yayındaki üniteler + kullanıcının ilerlemesi + kilit. */
  async listForTopic(topicId: string, user?: AuthenticatedUser | null): Promise<{ units: PublicUnitListItem[] }> {
    const units = await this.prisma.summaryUnit.findMany({
      where: { topicId, status: 'published', deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        articleFrom: true,
        articleTo: true,
        readingMinutes: true,
        isPremium: true,
        _count: { select: { blocks: { where: { status: 'published' } } } },
      },
    });
    const progress = user
      ? await this.prisma.summaryProgress.findMany({
          where: { userId: user.id, unitId: { in: units.map((u) => u.id) } },
        })
      : [];
    const pById = new Map(progress.map((p) => [p.unitId, p]));
    return {
      units: units.map((u) => {
        const p = pById.get(u.id);
        return {
          slug: u.slug,
          title: u.title,
          subtitle: u.subtitle,
          articleFrom: u.articleFrom,
          articleTo: u.articleTo,
          readingMinutes: u.readingMinutes,
          isPremium: u.isPremium,
          locked: u.isPremium && !(user?.isPremium ?? false),
          blockCount: u._count.blocks,
          progress: p ? { lastBlockIndex: p.lastBlockIndex, completedAt: p.completedAt?.toISOString() ?? null } : null,
        };
      }),
    };
  }

  /** Ünite okuyucu: kartlar sırayla; kilitliyse ilk kartlar + kilit bayrağı. */
  async getUnit(slug: string, user?: AuthenticatedUser | null) {
    const unit = await this.prisma.summaryUnit.findFirst({
      where: { slug, status: 'published', deletedAt: null },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        articleFrom: true,
        articleTo: true,
        readingMinutes: true,
        isPremium: true,
        topicId: true,
        legislation: { select: { slug: true, name: true, shortName: true } },
        topic: { select: { name: true, course: { select: { name: true } } } },
        blocks: {
          where: { status: 'published' },
          orderBy: { sortOrder: 'asc' },
          include: {
            articleRefs: { select: { lawArticle: { select: { articleNo: true, title: true, sortKey: true } } } },
          },
        },
      },
    });
    if (!unit) throw new NotFoundException('Özet bulunamadı.');
    const locked = unit.isPremium && !(user?.isPremium ?? false);
    const visible = locked ? unit.blocks.slice(0, KILITLI_UNITE_ACIK_KART) : unit.blocks;
    const progress = user
      ? await this.prisma.summaryProgress.findUnique({ where: { userId_unitId: { userId: user.id, unitId: unit.id } } })
      : null;
    return {
      slug: unit.slug,
      title: unit.title,
      subtitle: unit.subtitle,
      articleFrom: unit.articleFrom,
      articleTo: unit.articleTo,
      readingMinutes: unit.readingMinutes,
      isPremium: unit.isPremium,
      locked,
      totalBlocks: unit.blocks.length,
      legislation: unit.legislation,
      topic: { id: unit.topicId, name: unit.topic.name, courseName: unit.topic.course.name },
      progress: progress ? { lastBlockIndex: progress.lastBlockIndex, completedAt: progress.completedAt?.toISOString() ?? null } : null,
      blocks: visible.map((b) => this.toPublicBlock(b, unit.topicId)),
    };
  }

  private toPublicBlock(
    b: SummaryBlock & { articleRefs: { lawArticle: { articleNo: string; title: string | null; sortKey: number } }[] },
    topicId: string,
  ): PublicBlock {
    const articles = [...b.articleRefs]
      .sort((x, y) => x.lawArticle.sortKey - y.lawArticle.sortKey)
      .map((r) => ({ no: r.lawArticle.articleNo, title: r.lawArticle.title }));
    const out: PublicBlock = { id: b.id, type: b.type, title: b.title, body: b.body, rows: b.rows ?? null, articles };
    if (b.type === 'bridge') out.session = { topicId, articleNos: articles.map((a) => a.no) };
    return out;
  }

  /** Kaldığın kart / bitirme — ünite başına tek satır. */
  async saveProgress(user: AuthenticatedUser, body: { slug?: string; lastBlockIndex?: number; completed?: boolean }) {
    if (!body.slug) return { ok: false };
    const unit = await this.prisma.summaryUnit.findFirst({
      where: { slug: body.slug, status: 'published', deletedAt: null },
      select: { id: true },
    });
    if (!unit) return { ok: false };
    const idx = Math.max(0, Math.min(500, Math.floor(Number(body.lastBlockIndex ?? 0)) || 0));
    const completedAt = body.completed ? new Date() : undefined;
    await this.prisma.summaryProgress.upsert({
      where: { userId_unitId: { userId: user.id, unitId: unit.id } },
      update: { lastBlockIndex: idx, ...(completedAt ? { completedAt } : {}) },
      create: { userId: user.id, unitId: unit.id, lastBlockIndex: idx, completedAt: completedAt ?? null },
    });
    return { ok: true };
  }

  /** Son okunan üniteler (kaldığın yerden devam kartı için). */
  async myProgress(user: AuthenticatedUser) {
    const rows = await this.prisma.summaryProgress.findMany({
      where: { userId: user.id, unit: { status: 'published', deletedAt: null } },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { unit: { select: { slug: true, title: true, topic: { select: { name: true } } } } },
    });
    return {
      items: rows.map((r) => ({
        slug: r.unit.slug,
        title: r.unit.title,
        topicName: r.unit.topic.name,
        lastBlockIndex: r.lastBlockIndex,
        completedAt: r.completedAt?.toISOString() ?? null,
        updatedAt: r.updatedAt.toISOString(),
      })),
    };
  }
}

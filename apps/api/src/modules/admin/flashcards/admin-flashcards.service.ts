import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { AuditService } from '../audit.service';
import { sentetikMi } from '../questions/kaynak-turu';
import { loadArticleMap } from '../../summaries/ozet-ice-aktar';
import { normalizeCounterNumbers } from '../../summaries/ozet-dogrulayici';
import {
  validateCard,
  validateDeck,
  type CardValidation,
  type FlashcardDeckJson,
  type FlashcardJson,
} from '../../flashcards/kart-dogrulayici';
import {
  FlashcardImportError,
  importDeck,
  KART_KAYNAK_ONEKLERI,
  latestVersionNos,
} from '../../flashcards/kart-ice-aktar';
import type {
  CreateFlashcardDto,
  ListFlashcardsQueryDto,
  UpdateFlashcardDto,
  VerificationDto,
} from './dto/admin-flashcards.dto';

const LIST_SELECT = {
  id: true,
  kind: true,
  front: true,
  back: true,
  difficulty: true,
  status: true,
  verificationStatus: true,
  staleSince: true,
  sourceLabel: true,
  generatedBy: true,
  version: true,
  sortOrder: true,
  updatedAt: true,
  publishedAt: true,
  createdAt: true,
  topic: { select: { id: true, name: true, course: { select: { id: true, name: true } } } },
  summaryUnit: { select: { id: true, slug: true, title: true, isPremium: true } },
  articles: {
    select: {
      relation: true,
      articleVersionNo: true,
      lawArticle: { select: { id: true, articleNo: true, title: true, sortKey: true } },
    },
  },
} satisfies Prisma.FlashcardSelect;

type ListRow = Prisma.FlashcardGetPayload<{ select: typeof LIST_SELECT }>;

const DETAIL_SELECT = {
  ...LIST_SELECT,
  explanation: true,
  derivedNumbers: true,
  counterNumbers: true,
  legislationId: true,
  verifiedAt: true,
  publishedBy: true,
  createdBy: true,
  legislation: { select: { id: true, slug: true, name: true, shortName: true } },
} satisfies Prisma.FlashcardSelect;

type DetailRow = Prisma.FlashcardGetPayload<{ select: typeof DETAIL_SELECT }>;

/** Referanslar: birincil önce, sonra madde sırası. */
function sortedRefs<T extends { relation: string; lawArticle: { sortKey: number } }>(
  refs: T[],
): T[] {
  return [...refs].sort(
    (a, b) =>
      (a.relation === 'primary' ? -1 : 0) - (b.relation === 'primary' ? -1 : 0) ||
      a.lawArticle.sortKey - b.lawArticle.sortKey,
  );
}

function toJson(card: DetailRow): FlashcardJson {
  return {
    kind: card.kind,
    front: card.front,
    back: card.back,
    explanation: card.explanation ?? undefined,
    difficulty: card.difficulty,
    articleRefs: sortedRefs(card.articles).map((r) => r.lawArticle.articleNo),
    derivedNumbers: (card.derivedNumbers as FlashcardJson['derivedNumbers']) ?? undefined,
    counterNumbers: card.counterNumbers,
  };
}

function toListItem(c: ListRow) {
  return {
    id: c.id,
    kind: c.kind,
    front: c.front,
    back: c.back,
    difficulty: c.difficulty,
    status: c.status,
    verificationStatus: c.verificationStatus,
    staleSince: c.staleSince,
    sourceLabel: c.sourceLabel,
    generatedBy: c.generatedBy,
    synthetic: sentetikMi(c.sourceLabel),
    version: c.version,
    sortOrder: c.sortOrder,
    updatedAt: c.updatedAt,
    publishedAt: c.publishedAt,
    createdAt: c.createdAt,
    topicId: c.topic.id,
    topicName: c.topic.name,
    courseId: c.topic.course.id,
    courseName: c.topic.course.name,
    unit: c.summaryUnit,
    articles: sortedRefs(c.articles).map((r) => ({
      no: r.lawArticle.articleNo,
      title: r.lawArticle.title,
      versionNo: r.articleVersionNo,
      relation: r.relation,
    })),
  };
}

/**
 * Bilgi kartları — panel tarafı (Doc 56 §8.1). Üretim modeldir, yayın insanındır: içe aktarma
 * in_review açar; editör kartı düzenler (her kayıt yeniden doğrulanır), mevzuat kontrolünü işaretler;
 * admin yayınlar/yayından alır/siler. Eskimiş ya da "yenilenmeli" kart yayınlanamaz. AI kaynaklı
 * kartlar toplu onaydan geçmez (soru kuyruğu kalıbı: kaynak türü sentetik → tek tek).
 */
@Injectable()
export class AdminFlashcardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ── Liste ──

  async list(q: ListFlashcardsQueryDto) {
    const page = Math.max(1, q.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, q.pageSize ?? 25));
    const search = q.search?.trim();
    const where: Prisma.FlashcardWhereInput = {
      deletedAt: null,
      ...(q.status ? { status: q.status } : {}),
      ...(q.kind ? { kind: q.kind } : {}),
      ...(q.verification ? { verificationStatus: q.verification } : {}),
      ...(q.stale === '1' || q.stale === 'true' ? { staleSince: { not: null } } : {}),
      ...(q.unitId ? { summaryUnitId: q.unitId } : {}),
      ...(q.topicId
        ? { topicId: q.topicId }
        : q.courseId
          ? { topic: { courseId: q.courseId } }
          : {}),
      ...(search
        ? {
            OR: [
              { front: { contains: search, mode: 'insensitive' } },
              { back: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.flashcard.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: LIST_SELECT,
      }),
      this.prisma.flashcard.count({ where }),
    ]);
    return { items: items.map(toListItem), total, page, pageSize };
  }

  /** Beş sayaç (Figma 163:1306): yayında, incelemede, eskimiş, mevzuat kontrolü bekleyen, toplam. */
  async stats() {
    const [byStatus, stale, pendingVerification, needsRefresh] = await Promise.all([
      this.prisma.flashcard.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.flashcard.count({
        where: { deletedAt: null, staleSince: { not: null }, status: { not: 'archived' } },
      }),
      this.prisma.flashcard.count({
        where: {
          deletedAt: null,
          status: { not: 'archived' },
          verificationStatus: 'pending_review',
        },
      }),
      this.prisma.flashcard.count({
        where: {
          deletedAt: null,
          status: { not: 'archived' },
          verificationStatus: 'needs_refresh',
        },
      }),
    ]);
    const n = (s: string) => byStatus.find((r) => r.status === s)?._count._all ?? 0;
    return {
      total: byStatus.reduce((t, r) => t + r._count._all, 0),
      published: n('published'),
      inReview: n('in_review'),
      draft: n('draft'),
      archived: n('archived'),
      stale,
      pendingVerification,
      needsRefresh,
    };
  }

  /** Eskimiş kartlar — admin kuyruğu (madde metni değişti; yayın engeli). */
  async staleQueue() {
    const cards = await this.prisma.flashcard.findMany({
      where: { deletedAt: null, staleSince: { not: null }, status: { not: 'archived' } },
      orderBy: { staleSince: 'asc' },
      select: LIST_SELECT,
    });
    return cards.map(toListItem);
  }

  // ── Detay ──

  async detail(id: string) {
    const card = await this.prisma.flashcard.findFirst({
      where: { id, deletedAt: null },
      select: DETAIL_SELECT,
    });
    if (!card) throw new NotFoundException('Kart bulunamadı.');
    const { byNo, validation } = await this.validateRow(card);
    const latest = await latestVersionNos(
      this.prisma,
      card.articles.map((r) => r.lawArticle.id),
    );
    const history = await this.prisma.auditLog.findMany({
      where: { entityType: 'flashcard', entityId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, action: true, actorEmail: true, createdAt: true, detail: true },
    });
    return {
      ...toListItem(card),
      explanation: card.explanation,
      derivedNumbers: card.derivedNumbers,
      counterNumbers: card.counterNumbers,
      verifiedAt: card.verifiedAt,
      legislation: card.legislation,
      articles: sortedRefs(card.articles).map((r) => {
        const a = byNo.get(r.lawArticle.articleNo);
        return {
          no: r.lawArticle.articleNo,
          title: r.lawArticle.title,
          text: a?.text ?? null,
          versionNo: r.articleVersionNo,
          currentVersionNo: latest.get(r.lawArticle.id) ?? null,
          relation: r.relation,
        };
      }),
      validation,
      gate: this.publishGate(card, validation),
      history,
    };
  }

  /** Yayın kapısı gerekçeleri (rol hariç; rolü istemci bilir, sunucu publish'te yine denetler). */
  private publishGate(
    card: Pick<DetailRow, 'status' | 'staleSince' | 'verificationStatus'>,
    validation: CardValidation,
  ): { canPublish: boolean; reasons: string[] } {
    const reasons: string[] = [];
    if (card.status === 'published') reasons.push('Zaten yayında.');
    if (card.staleSince) reasons.push('Referans madde metni değişti; kartı gözden geçirip kaydet.');
    if (card.verificationStatus === 'needs_refresh')
      reasons.push('Mevzuat kontrolü "yenilenmeli"; kontrol edip durumu güncelle.');
    if (!validation.ok) reasons.push(`Doğrulama ${validation.issues.length} kusur verdi.`);
    return { canPublish: reasons.length === 0, reasons };
  }

  /** Kartın bağlı olduğu mevzuatın madde haritası + canlı doğrulama. */
  private async validateRow(card: DetailRow) {
    const legislationId = card.legislationId ?? (await this.legislationOfRefs(card));
    const byNo = legislationId
      ? await loadArticleMap(this.prisma, legislationId)
      : new Map<string, { articleNo: string; text: string; id: string; title: string | null }>();
    return { byNo, validation: validateCard(toJson(card), 0, byNo) };
  }

  private async legislationOfRefs(card: DetailRow): Promise<string | null> {
    const first = card.articles[0]?.lawArticle.id;
    if (!first) return null;
    const a = await this.prisma.lawArticle.findUnique({
      where: { id: first },
      select: { legislationId: true },
    });
    return a?.legislationId ?? null;
  }

  // ── Oluştur / düzenle ──

  async create(actor: AuthenticatedUser, dto: CreateFlashcardDto) {
    const sourceLabel = (dto.sourceLabel ?? 'Editör').trim();
    if (!KART_KAYNAK_ONEKLERI.some((p) => sourceLabel.startsWith(p)))
      throw new BadRequestException(
        `Kaynak etiketi "${KART_KAYNAK_ONEKLERI.join('" ya da "')}" ön ekiyle başlamalı.`,
      );
    const [topic, leg] = await Promise.all([
      this.prisma.topic.findFirst({
        where: { id: dto.topicId, deletedAt: null },
        select: { id: true },
      }),
      this.prisma.legislation.findFirst({
        where: { slug: dto.legislationSlug, deletedAt: null },
        select: { id: true },
      }),
    ]);
    if (!topic) throw new NotFoundException('Konu bulunamadı.');
    if (!leg) throw new NotFoundException(`Mevzuat bulunamadı: ${dto.legislationSlug}`);
    const unitId = await this.resolveUnit(dto.unitSlug ?? null, topic.id);
    const json: FlashcardJson = {
      kind: dto.kind,
      front: dto.front.trim(),
      back: dto.back.trim(),
      explanation: dto.explanation?.trim() || undefined,
      difficulty: dto.difficulty ?? 2,
      articleRefs: dto.articleRefs,
      derivedNumbers: dto.derivedNumbers ?? undefined,
      counterNumbers: dto.counterNumbers ?? [],
    };
    const byNo = await loadArticleMap(this.prisma, leg.id);
    const v = validateCard(json, 0, byNo);
    if (!v.ok) throw new BadRequestException(['Kart doğrulamayı geçmedi.', ...v.issues].join('\n'));
    const refIds = json.articleRefs.map((n) => byNo.get(n)!.id);
    const versions = await latestVersionNos(this.prisma, refIds);
    const last = await this.prisma.flashcard.aggregate({
      where: { topicId: topic.id, summaryUnitId: unitId, deletedAt: null },
      _max: { sortOrder: true },
    });
    const row = await this.prisma.flashcard.create({
      data: {
        topicId: topic.id,
        summaryUnitId: unitId,
        legislationId: leg.id,
        kind: json.kind,
        front: json.front,
        back: json.back,
        explanation: json.explanation ?? null,
        difficulty: json.difficulty,
        derivedNumbers: (json.derivedNumbers ?? undefined) as Prisma.InputJsonValue | undefined,
        counterNumbers: normalizeCounterNumbers(json.counterNumbers),
        sortOrder: (last._max.sortOrder ?? -1) + 1,
        status: 'in_review',
        sourceLabel,
        createdBy: actor.id,
        articles: {
          create: refIds.map((id, j) => ({
            lawArticleId: id,
            articleVersionNo: versions.get(id) ?? null,
            relation: j === 0 ? 'primary' : 'related',
          })),
        },
      },
      select: { id: true },
    });
    await this.audit.log(actor, 'flashcard.create', 'flashcard', row.id, {
      topicId: topic.id,
      unitId,
    });
    return { id: row.id, validation: v };
  }

  /** Düzenleme: yeniden doğrulanır; referanslar güncel madde sürümüne bağlanır, eskime damgası kalkar. */
  async update(actor: AuthenticatedUser, id: string, dto: UpdateFlashcardDto) {
    const card = await this.prisma.flashcard.findFirst({
      where: { id, deletedAt: null },
      select: DETAIL_SELECT,
    });
    if (!card) throw new NotFoundException('Kart bulunamadı.');
    const legislationId = card.legislationId ?? (await this.legislationOfRefs(card));
    if (!legislationId) throw new BadRequestException('Kartın mevzuatı belirlenemedi.');
    const onceki = toJson(card);
    const json: FlashcardJson = {
      kind: dto.kind ?? onceki.kind,
      front: (dto.front ?? onceki.front).trim(),
      back: (dto.back ?? onceki.back).trim(),
      explanation:
        dto.explanation === undefined ? onceki.explanation : dto.explanation?.trim() || undefined,
      difficulty: dto.difficulty ?? onceki.difficulty,
      articleRefs: dto.articleRefs ?? onceki.articleRefs,
      derivedNumbers:
        dto.derivedNumbers === undefined
          ? onceki.derivedNumbers
          : (dto.derivedNumbers ?? undefined),
      counterNumbers: dto.counterNumbers ?? onceki.counterNumbers,
    };
    const byNo = await loadArticleMap(this.prisma, legislationId);
    const v = validateCard(json, 0, byNo);
    if (!v.ok) throw new BadRequestException(['Kart doğrulamayı geçmedi.', ...v.issues].join('\n'));
    const unitId =
      dto.unitSlug === undefined
        ? (card.summaryUnit?.id ?? null)
        : await this.resolveUnit(dto.unitSlug, card.topic.id);
    const refIds = json.articleRefs.map((n) => byNo.get(n)!.id);
    const versions = await latestVersionNos(this.prisma, refIds);
    const icerikDegisti =
      json.front !== onceki.front ||
      json.back !== onceki.back ||
      (json.explanation ?? null) !== (onceki.explanation ?? null) ||
      json.articleRefs.join('|') !== onceki.articleRefs.join('|');
    await this.prisma.$transaction(async (tx) => {
      await tx.flashcardArticle.deleteMany({ where: { flashcardId: id } });
      await tx.flashcard.update({
        where: { id },
        data: {
          kind: json.kind,
          front: json.front,
          back: json.back,
          explanation: json.explanation ?? null,
          difficulty: json.difficulty,
          // Json? kolonu: boş liste yerine DB null (içe aktarma ile aynı).
          derivedNumbers:
            json.derivedNumbers === undefined
              ? Prisma.DbNull
              : (json.derivedNumbers as unknown as Prisma.InputJsonValue),
          counterNumbers: normalizeCounterNumbers(json.counterNumbers),
          summaryUnitId: unitId,
          staleSince: null,
          verificationStatus:
            card.verificationStatus === 'needs_refresh'
              ? 'pending_review'
              : card.verificationStatus,
          version: icerikDegisti ? card.version + 1 : card.version,
          articles: {
            create: refIds.map((aid, j) => ({
              lawArticleId: aid,
              articleVersionNo: versions.get(aid) ?? null,
              relation: j === 0 ? 'primary' : 'related',
            })),
          },
        },
      });
    });
    await this.audit.log(actor, 'flashcard.update', 'flashcard', id, {
      icerikDegisti,
      refs: json.articleRefs,
    });
    return { ok: true, validation: v };
  }

  private async resolveUnit(unitSlug: string | null, topicId: string): Promise<string | null> {
    if (!unitSlug) return null;
    const unit = await this.prisma.summaryUnit.findFirst({
      where: { slug: unitSlug, deletedAt: null },
      select: { id: true, topicId: true },
    });
    if (!unit) throw new NotFoundException(`Ünite bulunamadı: ${unitSlug}`);
    if (unit.topicId !== topicId) throw new BadRequestException('Ünite bu konuya ait değil.');
    return unit.id;
  }

  // ── Durum geçişleri ──

  async archive(actor: AuthenticatedUser, id: string) {
    const card = await this.prisma.flashcard.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!card) throw new NotFoundException('Kart bulunamadı.');
    if (card.status === 'published' && !actor.roles.includes('admin'))
      throw new ForbiddenException('Yayındaki kartı arşivlemek admin yetkisi ister.');
    await this.prisma.flashcard.update({ where: { id }, data: { status: 'archived' } });
    await this.audit.log(actor, 'flashcard.archive', 'flashcard', id, { from: card.status });
    return { ok: true };
  }

  async publish(actor: AuthenticatedUser, id: string, opts: { audit?: boolean } = {}) {
    if (!actor.roles.includes('admin'))
      throw new ForbiddenException('Yayın kararı admin yetkisi ister.');
    const card = await this.prisma.flashcard.findFirst({
      where: { id, deletedAt: null },
      select: DETAIL_SELECT,
    });
    if (!card) throw new NotFoundException('Kart bulunamadı.');
    const { validation } = await this.validateRow(card);
    const gate = this.publishGate(card, validation);
    if (!gate.canPublish) throw new BadRequestException(gate.reasons.join(' '));
    await this.prisma.flashcard.update({
      where: { id },
      data: { status: 'published', publishedAt: new Date(), publishedBy: actor.id },
    });
    if (opts.audit !== false) await this.audit.log(actor, 'flashcard.publish', 'flashcard', id);
    return { ok: true };
  }

  async unpublish(actor: AuthenticatedUser, id: string) {
    if (!actor.roles.includes('admin'))
      throw new ForbiddenException('Yayından alma admin yetkisi ister.');
    const card = await this.prisma.flashcard.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!card) throw new NotFoundException('Kart bulunamadı.');
    await this.prisma.flashcard.update({ where: { id }, data: { status: 'in_review' } });
    await this.audit.log(actor, 'flashcard.unpublish', 'flashcard', id);
    return { ok: true };
  }

  /** Yumuşak silme: yayındaki kart silinmez (kullanıcı ilerlemesi var; önce yayından al). */
  async remove(actor: AuthenticatedUser, id: string) {
    if (!actor.roles.includes('admin')) throw new ForbiddenException('Silme admin yetkisi ister.');
    const card = await this.prisma.flashcard.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!card) throw new NotFoundException('Kart bulunamadı.');
    if (card.status === 'published')
      throw new BadRequestException('Yayındaki kart silinmez; önce yayından al.');
    await this.prisma.flashcard.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'archived' },
    });
    await this.audit.log(actor, 'flashcard.delete', 'flashcard', id);
    return { ok: true };
  }

  /**
   * Toplu yayın (admin): seçilen kartlardan yayında olmayanlar TEK TEK yayın kapısından geçer
   * (eskimemiş ∧ mevzuat kontrolü "yenilenmeli" değil ∧ doğrulama temiz); geçemeyen gerekçesiyle
   * atlanır. AI kaynaklı kartlar da toplu yayınlanabilir (kullanıcı kararı 6 Kas 2026; kapı kart
   * başına aynı kaldığı için toplu seçim denetimi gevşetmez).
   */
  async publishMany(actor: AuthenticatedUser, ids: string[]) {
    if (!actor.roles.includes('admin'))
      throw new ForbiddenException('Yayın kararı admin yetkisi ister.');
    const published: string[] = [];
    const skipped: { id: string; reason: string }[] = [];
    for (const id of [...new Set(ids)]) {
      const c = await this.prisma.flashcard.findFirst({
        where: { id, deletedAt: null },
        select: { status: true },
      });
      if (!c) {
        skipped.push({ id, reason: 'bulunamadı' });
        continue;
      }
      if (c.status === 'published') continue;
      try {
        await this.publish(actor, id, { audit: false });
        published.push(id);
      } catch (e) {
        skipped.push({ id, reason: e instanceof Error ? e.message : 'yayınlanamadı' });
      }
    }
    await this.audit.log(actor, 'flashcard.publish_many', 'flashcard', null, {
      published,
      skipped,
    });
    return { published, skipped };
  }

  async setVerification(actor: AuthenticatedUser, id: string, dto: VerificationDto) {
    const card = await this.prisma.flashcard.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!card) throw new NotFoundException('Kart bulunamadı.');
    await this.prisma.flashcard.update({
      where: { id },
      data: {
        verificationStatus: dto.status,
        verifiedAt: dto.status === 'verified' ? new Date() : null,
      },
    });
    await this.audit.log(actor, 'flashcard.verification', 'flashcard', id, { status: dto.status });
    return { ok: true };
  }

  // ── İçe aktarma ──

  /** JSON deste: dryRun yalnız doğrular (rapor); değilse in_review yazar. Kusurlu deste yazılmaz. */
  async import(
    actor: AuthenticatedUser,
    data: FlashcardDeckJson,
    opts: { replace: boolean; dryRun: boolean },
  ) {
    if (opts.dryRun) {
      const d = data?.deck;
      if (!d?.legislationSlug || !Array.isArray(data.cards))
        throw new BadRequestException('Gövde { deck, cards } biçiminde deste JSON olmalı.');
      const leg = await this.prisma.legislation.findFirst({
        where: { slug: d.legislationSlug, deletedAt: null },
        select: { id: true, name: true },
      });
      if (!leg) throw new BadRequestException(`Mevzuat bulunamadı: ${d.legislationSlug}`);
      const byNo = await loadArticleMap(this.prisma, leg.id);
      const r = validateDeck(data, byNo);
      return {
        dryRun: true as const,
        legislationName: leg.name,
        count: data.cards.length,
        ok: r.ok,
        fails: r.fails,
        cards: r.cards,
      };
    }
    try {
      const r = await importDeck(this.prisma, data, {
        createdBy: actor.id,
        replaceExisting: opts.replace,
      });
      await this.audit.log(actor, 'flashcard.import', 'flashcard', null, {
        topicId: r.topicId,
        unitId: r.unitId,
        created: r.created,
        removed: r.removed,
        replace: opts.replace,
      });
      return { dryRun: false as const, ...r };
    } catch (e) {
      if (e instanceof FlashcardImportError) {
        const satirlar = (e.validation?.cards ?? [])
          .filter((c) => !c.ok)
          .map((c) => `[${c.index + 1}] ${c.front}: ${c.issues.join('; ')}`);
        throw new BadRequestException([e.message, ...satirlar].join('\n'));
      }
      throw e;
    }
  }
}

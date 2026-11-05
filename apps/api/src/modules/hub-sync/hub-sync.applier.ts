import { Injectable, Logger } from '@nestjs/common';
import type { LegislationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { toHubArticleKey } from './article-key';
import {
  mapQuestion,
  requiredArticleNumber,
  type ExistingQuestion,
  type MappedArticle,
  type MapPlan,
  type ResolvedLink,
} from './hub-sync.mapper';
import type {
  HubEvent,
  HubLegislationVersionPayload,
  HubQuestionPayload,
  HubTaxonomyPayload,
} from './hub-sync.types';
import { HUB_TOPIC_SEED } from './hub-topic-map.seed';

export interface ApplyResult {
  seq: number;
  entityType: string;
  entityId: string;
  action: string;
  /** applied | linked | skipped | unmapped | ignored | error */
  result: 'applied' | 'linked' | 'skipped' | 'unmapped' | 'ignored' | 'error';
  detail: string;
  /** Merkeze ack `error` alanıyla iletilecek kalıcı veri hatası (konu eşlemesi yok vb.). */
  ackError?: string;
}

export interface ApplyOptions {
  dryRun: boolean;
  now?: Date;
}

/** Kuru koşuda işlemi geri almak için fırlatılan işaret. */
class DryRunRollback extends Error {
  constructor(readonly result: ApplyResult) {
    super('dry-run');
  }
}

type Tx = Prisma.TransactionClient;

const HUB_TYPE_TO_PAEM: Record<string, LegislationType> = {
  Kanun: 'kanun',
  'Cumhurbaşkanlığı Kararnamesi': 'cbk',
  Yönetmelik: 'yonetmelik',
  Genelge: 'genelge',
  Yönerge: 'yonerge',
};

interface TopicMapRow {
  topicId: string | null;
  articleFrom: number | null;
  articleTo: number | null;
}
interface LegislationMapRow {
  legislationId: string | null;
  hubName: string;
  hubShortName: string | null;
  hubNumber: string | null;
}

/**
 * Olay başına tek Prisma işlemi; idempotent. Kuru koşuda aynı yol çalışır, işlem geri alınır;
 * konu ve mevzuat eşlemeleri bellekte bir sonraki olaya taşınır (bağımlılık sırası korunsun).
 */
@Injectable()
export class HubSyncApplier {
  private readonly logger = new Logger(HubSyncApplier.name);
  private readonly topicOverlay = new Map<string, TopicMapRow[]>();
  private readonly legislationOverlay = new Map<string, LegislationMapRow>();
  private readonly articleCache = new Map<string, Map<string, { id: string; topicId: string }>>();
  private readonly legislationTopicCache = new Map<string, string | null>();

  constructor(private readonly prisma: PrismaService) {}

  resetRunCaches(): void {
    this.topicOverlay.clear();
    this.legislationOverlay.clear();
    this.articleCache.clear();
    this.legislationTopicCache.clear();
  }

  async apply(event: HubEvent, payload: unknown, opts: ApplyOptions): Promise<ApplyResult> {
    const base = { seq: event.seq, entityType: event.entity_type, entityId: event.entity_id };
    const now = opts.now ?? new Date();
    try {
      if (event.entity_type === 'tag' || event.entity_type === 'source') {
        return {
          ...base,
          action: event.event_type,
          result: 'ignored',
          detail: 'PAEMİSYON etiket/kaynak varlığı tutmaz',
        };
      }
      if (event.entity_type === 'taxonomy') {
        if (event.event_type !== 'upsert' || !payload)
          return {
            ...base,
            action: event.event_type,
            result: 'ignored',
            detail: 'taksonomi geri çekme',
          };
        return this.inTx(opts, base, (tx) =>
          this.applyTaxonomy(tx, base, payload as HubTaxonomyPayload),
        );
      }
      if (event.entity_type === 'legislation_version') {
        if (event.event_type !== 'upsert' || !payload)
          return {
            ...base,
            action: event.event_type,
            result: 'ignored',
            detail: "mevzuat geri çekme: metin PAEMİSYON'da kalır",
          };
        return this.inTx(opts, base, (tx) =>
          this.applyLegislation(tx, base, payload as HubLegislationVersionPayload),
        );
      }
      if (event.entity_type === 'question') {
        if (event.event_type === 'withdraw')
          return this.inTx(opts, base, (tx) => this.applyWithdraw(tx, base, event, now));
        if (!payload)
          return {
            ...base,
            action: 'upsert',
            result: 'error',
            detail: 'yük alınamadı',
            ackError: `${event.entity_id}: yük yok`,
          };
        return this.inTx(opts, base, (tx) =>
          this.applyQuestion(tx, base, payload as HubQuestionPayload, now),
        );
      }
      return {
        ...base,
        action: event.event_type,
        result: 'ignored',
        detail: `bilinmeyen varlık ${event.entity_type}`,
      };
    } catch (e) {
      const message = (e as Error).message ?? String(e);
      this.logger.warn(`seq ${event.seq} ${event.entity_type} ${event.entity_id}: ${message}`);
      return {
        ...base,
        action: event.event_type,
        result: 'error',
        detail: message.slice(0, 1000),
        ackError: `${event.entity_id}: ${message.slice(0, 300)}`,
      };
    }
  }

  private async inTx(
    opts: ApplyOptions,
    base: { seq: number; entityType: string; entityId: string },
    fn: (tx: Tx) => Promise<ApplyResult>,
  ): Promise<ApplyResult> {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const result = await fn(tx);
          if (opts.dryRun) throw new DryRunRollback(result);
          return result;
        },
        { timeout: 60_000, maxWait: 10_000 },
      );
    } catch (e) {
      if (e instanceof DryRunRollback) return e.result;
      throw e;
    }
  }

  // ── Taksonomi: merkez konusu → hub_topic_map (varsayılan satır, tohumdan topic_id) ──
  private async applyTaxonomy(
    tx: Tx,
    base: Omit<ApplyResult, 'action' | 'result' | 'detail'>,
    p: HubTaxonomyPayload,
  ): Promise<ApplyResult> {
    if (p.node_type !== 'topic') {
      return { ...base, action: 'upsert', result: 'ignored', detail: `${p.node_type} ${p.code}` };
    }
    const existing = await tx.hubTopicMap.findFirst({
      where: { hubTopicId: p.id, articleFrom: null, articleTo: null },
    });
    if (existing) {
      if (existing.hubCode !== p.code || existing.hubName !== p.name) {
        await tx.hubTopicMap.update({
          where: { id: existing.id },
          data: { hubCode: p.code, hubName: p.name },
        });
      }
      this.rememberTopic(p.id, await tx.hubTopicMap.findMany({ where: { hubTopicId: p.id } }));
      return {
        ...base,
        action: 'upsert',
        result: existing.topicId ? 'applied' : 'unmapped',
        detail: `${p.code} → ${existing.topicId ?? '(eşlenmemiş)'}`,
      };
    }
    const seed = HUB_TOPIC_SEED[p.code];
    let topicId: string | null = null;
    if (seed?.topicId) {
      const topic = await tx.topic.findFirst({
        where: { id: seed.topicId, deletedAt: null },
        select: { id: true },
      });
      topicId = topic?.id ?? null;
    }
    await tx.hubTopicMap.create({
      data: { hubTopicId: p.id, hubCode: p.code, hubName: p.name, topicId },
    });
    this.rememberTopic(p.id, [{ topicId, articleFrom: null, articleTo: null }]);
    return {
      ...base,
      action: 'upsert',
      result: topicId ? 'applied' : 'unmapped',
      detail: topicId
        ? `${p.code} → ${topicId} (tohum)`
        : `${p.code}: PAEMİSYON konusu yok; hub_topic_map elle doldurulur`,
    };
  }

  private rememberTopic(hubTopicId: string, rows: TopicMapRow[]): void {
    this.topicOverlay.set(
      hubTopicId,
      rows.map((r) => ({ topicId: r.topicId, articleFrom: r.articleFrom, articleTo: r.articleTo })),
    );
  }

  private async topicRows(tx: Tx, hubTopicId: string): Promise<TopicMapRow[]> {
    const fromDb = await tx.hubTopicMap.findMany({ where: { hubTopicId } });
    if (fromDb.length) return fromDb;
    return this.topicOverlay.get(hubTopicId) ?? [];
  }

  /** Karar (2 Kas 2026): madde aralığı eşleşen satır, yoksa aralıksız varsayılan satır. */
  private async resolveTopic(
    tx: Tx,
    hubTopicId: string | null,
    articleNumber: number | null,
  ): Promise<string | null> {
    if (!hubTopicId) return null;
    const rows = await this.topicRows(tx, hubTopicId);
    if (articleNumber != null) {
      const ranged = rows.find(
        (r) =>
          r.topicId &&
          r.articleFrom != null &&
          r.articleTo != null &&
          articleNumber >= r.articleFrom &&
          articleNumber <= r.articleTo,
      );
      if (ranged?.topicId) return ranged.topicId;
    }
    return (
      rows.find((r) => r.topicId && r.articleFrom == null && r.articleTo == null)?.topicId ?? null
    );
  }

  // ── Mevzuat sürümü: yalnız eşleme (metin merkezden alınmaz, karar 5) ──
  private async applyLegislation(
    tx: Tx,
    base: Omit<ApplyResult, 'action' | 'result' | 'detail'>,
    p: HubLegislationVersionPayload,
  ): Promise<ApplyResult> {
    const l = p.legislation;
    const current = await tx.hubLegislationMap.findUnique({ where: { hubLegislationId: l.id } });
    let legislationId = current?.legislationId ?? null;
    let how = 'mevcut eşleme';
    if (!legislationId) {
      const type = HUB_TYPE_TO_PAEM[l.type];
      const found = await tx.legislation.findMany({
        where: {
          deletedAt: null,
          OR: [
            ...(l.number && type ? [{ number: l.number, type }] : []),
            ...(l.number && !type ? [{ number: l.number }] : []),
            { name: l.official_name },
            ...(l.short_name
              ? [
                  { name: l.short_name },
                  { shortName: l.short_name },
                  { aliases: { has: l.short_name } },
                ]
              : []),
          ],
        },
        select: {
          id: true,
          number: true,
          name: true,
          sortOrder: true,
          _count: { select: { articles: { where: { deletedAt: null } } } },
        },
      });
      // Aynı mevzuat için madde taşımayan kabuk kayıtlar var (ör. "Anayasa" 0 madde / "T.C. Anayasası" 199 madde,
      // 1 Ekim backfill'i): önce maddeli olan, sonra numarası eşleşen, sonra sıra.
      const candidates = [...found].sort(
        (a, b) =>
          Number(b._count.articles > 0) - Number(a._count.articles > 0) ||
          Number(Boolean(l.number) && b.number === l.number) -
            Number(Boolean(l.number) && a.number === l.number) ||
          b._count.articles - a._count.articles ||
          a.sortOrder - b.sortOrder,
      );
      legislationId = candidates[0]?.id ?? null;
      how =
        candidates.length > 1
          ? `${candidates.length} aday, maddeli/numaralı olan alındı`
          : candidates.length
            ? 'numara/ad'
            : 'eşleşme yok';
    }
    const row = {
      hubNumber: l.number,
      hubType: l.type,
      hubName: l.official_name,
      hubShortName: l.short_name,
      legislationId,
    };
    await tx.hubLegislationMap.upsert({
      where: { hubLegislationId: l.id },
      create: { hubLegislationId: l.id, ...row },
      update: row,
    });
    this.legislationOverlay.set(l.id, {
      legislationId,
      hubName: l.official_name,
      hubShortName: l.short_name,
      hubNumber: l.number,
    });
    return {
      ...base,
      action: 'upsert',
      result: legislationId ? 'applied' : 'unmapped',
      detail: `${l.number ?? ''} ${l.short_name ?? l.official_name} → ${legislationId ?? "(PAEMİSYON'da yok)"} (${how}); ${p.articles.length} madde`,
    };
  }

  private async legislationRow(
    tx: Tx,
    hubLegislationId: string,
  ): Promise<LegislationMapRow | null> {
    const db = await tx.hubLegislationMap.findUnique({ where: { hubLegislationId } });
    if (db) return db;
    return this.legislationOverlay.get(hubLegislationId) ?? null;
  }

  private async articlesOf(
    tx: Tx,
    legislationId: string,
  ): Promise<Map<string, { id: string; topicId: string }>> {
    const cached = this.articleCache.get(legislationId);
    if (cached) return cached;
    const rows = await tx.lawArticle.findMany({
      where: { legislationId, deletedAt: null },
      select: { id: true, articleNo: true, topicId: true },
    });
    const map = new Map<string, { id: string; topicId: string }>();
    for (const r of rows) {
      const key = toHubArticleKey(r.articleNo);
      if (key && !map.has(key)) map.set(key, { id: r.id, topicId: r.topicId });
    }
    this.articleCache.set(legislationId, map);
    return map;
  }

  private async legislationTopic(tx: Tx, legislationId: string): Promise<string | null> {
    if (this.legislationTopicCache.has(legislationId))
      return this.legislationTopicCache.get(legislationId)!;
    const l = await tx.legislation.findUnique({
      where: { id: legislationId },
      select: { topicId: true },
    });
    this.legislationTopicCache.set(legislationId, l?.topicId ?? null);
    return l?.topicId ?? null;
  }

  private async resolveLinks(
    tx: Tx,
    payload: HubQuestionPayload,
  ): Promise<{ links: ResolvedLink[]; unresolved: string[] }> {
    const links: ResolvedLink[] = [];
    const unresolved: string[] = [];
    for (const l of payload.legislation_links) {
      const row = await this.legislationRow(tx, l.legislation_id);
      const name =
        row?.hubShortName ||
        row?.hubName ||
        (row?.hubNumber
          ? `${row.hubNumber} sayılı Kanun`
          : `mevzuat ${l.legislation_id.slice(0, 8)}`);
      let lawArticleId: string | null = null;
      let legislationTopicId: string | null = null;
      if (row?.legislationId) {
        const articles = await this.articlesOf(tx, row.legislationId);
        lawArticleId = articles.get(l.article_key)?.id ?? null;
        legislationTopicId = await this.legislationTopic(tx, row.legislationId);
        if (!lawArticleId) unresolved.push(`${name} md. ${l.article_key} (madde yok)`);
      } else {
        unresolved.push(`${name} md. ${l.article_key} (mevzuat eşlenmemiş)`);
      }
      links.push({
        role: l.link_role,
        articleKey: l.article_key,
        legislationId: row?.legislationId ?? null,
        legislationTopicId,
        legislationName: name,
        lawArticleId,
      });
    }
    return { links, unresolved };
  }

  private async loadExisting(
    tx: Tx,
    payload: HubQuestionPayload,
  ): Promise<ExistingQuestion | null> {
    const q = payload.question;
    const ids = [q.local_id, ...(q.local_aliases ?? [])].filter((x): x is string => Boolean(x));
    const row =
      (await tx.question.findUnique({
        where: { hubQuestionId: q.id },
        include: existingInclude,
      })) ??
      (ids.length
        ? await tx.question.findFirst({
            where: { id: { in: ids } },
            orderBy: { createdAt: 'asc' },
            include: existingInclude,
          })
        : null);
    if (!row) return null;
    return toExisting(row);
  }

  private async applyQuestion(
    tx: Tx,
    base: Omit<ApplyResult, 'action' | 'result' | 'detail'>,
    payload: HubQuestionPayload,
    now: Date,
  ): Promise<ApplyResult> {
    const existing = await this.loadExisting(tx, payload);
    const { links, unresolved } = await this.resolveLinks(tx, payload);
    const topicId = existing
      ? existing.topicId
      : await this.resolveTopic(tx, payload.question.topic_id, requiredArticleNumber(payload));
    const plan = mapQuestion({ payload, existing, topicId, links, now });
    const tail = unresolved.length ? ` · çözülmeyen bağ: ${unresolved.join('; ')}` : '';
    await this.executePlan(tx, plan, now);
    const result: ApplyResult['result'] =
      plan.kind === 'skip'
        ? plan.reason === 'no-topic'
          ? 'unmapped'
          : 'skipped'
        : plan.kind === 'link-existing'
          ? 'linked'
          : 'applied';
    return {
      ...base,
      action: plan.kind,
      result,
      detail: plan.detail + tail,
      ackError: plan.kind === 'skip' && plan.reason === 'no-topic' ? plan.detail : undefined,
    };
  }

  private async executePlan(tx: Tx, plan: MapPlan, now: Date): Promise<void> {
    if (plan.kind === 'skip') return;
    if (plan.kind === 'link-existing') {
      await tx.question.update({
        where: { id: plan.questionId },
        data: {
          hubQuestionId: plan.hubQuestionId,
          hubCode: plan.hubCode,
          articleNo: plan.articleNo,
          ...(plan.revive ? { deletedAt: null } : {}),
        },
      });
      // Mevcut PAEMİSYON sürümü merkez sürümüyle eşlenir (sürüm açılmaz; seçenek kimlikleri değişmez).
      await tx.questionVersion.update({
        where: { id: plan.versionId },
        data: {
          hubVersionId: plan.hubVersionId,
          ...(plan.revive ? { status: 'published', archivedAt: null } : {}),
        },
      });
      await this.replaceHubArticles(tx, plan.questionId, plan.articles);
      return;
    }
    let questionId = plan.questionId;
    if (plan.kind === 'create') {
      const created = await tx.question.create({
        data: {
          topicId: plan.topicId,
          articleNo: plan.articleNo,
          hubQuestionId: plan.hubQuestionId,
          hubCode: plan.hubCode,
        },
        select: { id: true },
      });
      questionId = created.id;
    } else if (questionId) {
      if (plan.archivePreviousVersionId) {
        await tx.questionVersion.update({
          where: { id: plan.archivePreviousVersionId },
          data: { status: 'archived', archivedAt: now },
        });
      }
      await tx.questionVersion.updateMany({
        where: { questionId, status: 'published' },
        data: { status: 'archived', archivedAt: now },
      });
    }
    if (!questionId) throw new Error('soru kimliği yok');
    await tx.questionVersion.create({
      data: {
        id: plan.version.id,
        questionId,
        versionNo: plan.version.versionNo,
        stem: plan.version.stem,
        explanation: plan.version.explanation,
        difficulty: plan.version.difficulty,
        sourceLabel: plan.version.sourceLabel,
        contentHash: plan.version.contentHash,
        status: 'published',
        publishedAt: now,
        hubVersionId: plan.version.hubVersionId,
        options: {
          create: plan.options.map((o) => ({
            id: o.id,
            label: o.label,
            text: o.text,
            isCorrect: o.isCorrect,
            sortOrder: o.sortOrder,
          })),
        },
        legalReferences: { create: plan.legalReferences.map((citation) => ({ citation })) },
      },
    });
    await tx.question.update({
      where: { id: questionId },
      data: {
        currentVersionId: plan.version.id,
        hubQuestionId: plan.hubQuestionId,
        hubCode: plan.hubCode,
        articleNo: plan.articleNo,
        ...(plan.revive ? { deletedAt: null } : {}),
      },
    });
    await this.replaceHubArticles(tx, questionId, plan.articles);
  }

  private async replaceHubArticles(
    tx: Tx,
    questionId: string,
    articles: MappedArticle[],
  ): Promise<void> {
    await tx.questionArticle.deleteMany({ where: { questionId, source: 'hub' } });
    if (!articles.length) return;
    // Editör/legacy bağı aynı maddeye zaten varsa korunur (bileşik anahtar çakışması).
    const existing = new Set(
      (
        await tx.questionArticle.findMany({ where: { questionId }, select: { lawArticleId: true } })
      ).map((a) => a.lawArticleId),
    );
    const rows = articles.filter((a) => !existing.has(a.lawArticleId));
    if (rows.length) {
      await tx.questionArticle.createMany({
        data: rows.map((a) => ({
          questionId,
          lawArticleId: a.lawArticleId,
          relation: a.relation,
          source: 'hub',
        })),
      });
    }
  }

  private async applyWithdraw(
    tx: Tx,
    base: Omit<ApplyResult, 'action' | 'result' | 'detail'>,
    event: HubEvent,
    now: Date,
  ): Promise<ApplyResult> {
    const q = await tx.question.findUnique({
      where: { hubQuestionId: event.entity_id },
      include: { currentVersion: { select: { id: true, status: true } } },
    });
    if (!q)
      return {
        ...base,
        action: 'withdraw',
        result: 'skipped',
        detail: "merkez sorusu PAEMİSYON'da yok",
      };
    if (q.deletedAt && q.currentVersion?.status !== 'published')
      return {
        ...base,
        action: 'withdraw',
        result: 'skipped',
        detail: `${q.hubCode}: zaten geri çekilmiş`,
      };
    if (q.currentVersion) {
      await tx.questionVersion.update({
        where: { id: q.currentVersion.id },
        data: { status: 'archived', archivedAt: now },
      });
    }
    // Soru silinmez: satırlar, çözümler ve sürümler kalır; havuz dışına deletedAt ile çıkar (Doc 31/32 deseni).
    await tx.question.update({ where: { id: q.id }, data: { deletedAt: q.deletedAt ?? now } });
    return {
      ...base,
      action: 'withdraw',
      result: 'applied',
      detail: `${q.hubCode} ← ${q.id.slice(0, 8)} geri çekildi (${event.reason ?? ''})`,
    };
  }
}

const existingInclude = {
  currentVersion: { include: { options: { orderBy: { sortOrder: 'asc' as const } } } },
  versions: { select: { versionNo: true, hubVersionId: true } },
} satisfies Prisma.QuestionInclude;

type ExistingRow = Prisma.QuestionGetPayload<{ include: typeof existingInclude }>;

function toExisting(row: ExistingRow): ExistingQuestion {
  return {
    id: row.id,
    topicId: row.topicId,
    articleNo: row.articleNo,
    deletedAt: row.deletedAt,
    hubQuestionId: row.hubQuestionId,
    hubCode: row.hubCode,
    maxVersionNo: row.versions.reduce((m, v) => Math.max(m, v.versionNo), 0),
    hubVersionIds: row.versions.map((v) => v.hubVersionId).filter((x): x is string => Boolean(x)),
    current: row.currentVersion
      ? {
          id: row.currentVersion.id,
          versionNo: row.currentVersion.versionNo,
          status: row.currentVersion.status,
          stem: row.currentVersion.stem,
          explanation: row.currentVersion.explanation,
          difficulty: row.currentVersion.difficulty,
          sourceLabel: row.currentVersion.sourceLabel,
          hubVersionId: row.currentVersion.hubVersionId,
          options: row.currentVersion.options.map((o) => ({
            label: o.label,
            text: o.text,
            isCorrect: o.isCorrect,
            sortOrder: o.sortOrder,
          })),
        }
      : null,
  };
}

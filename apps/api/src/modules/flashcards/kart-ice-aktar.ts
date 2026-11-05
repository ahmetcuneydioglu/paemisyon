/**
 * Doc 56 — Bilgi kartı destesi içe aktarma: JSON → doğrula → in_review olarak yaz.
 *
 * PrismaClient alır; hem admin servisi (aşama 6) hem `scripts/kart-yukle.ts` aynı yolu kullanır.
 * Doğrulamayı geçmeyen deste YAZILMAZ. Deste tablo değildir: kartlar konuya (ve varsa ünite
 * etiketine) bağlanır; `--replace` aynı konu+ünite+sourceLabel'daki eski in_review kartları siler.
 */
import type { Prisma, PrismaClient } from '@prisma/client';
import { loadArticleMap } from '../summaries/ozet-ice-aktar';
import { normalizeCounterNumbers } from '../summaries/ozet-dogrulayici';
import { validateDeck, type DeckValidation, type FlashcardDeckJson } from './kart-dogrulayici';

type Db = Pick<
  PrismaClient,
  | 'legislation'
  | 'lawArticle'
  | 'lawArticleVersion'
  | 'questionArticle'
  | 'summaryUnit'
  | 'topic'
  | 'flashcard'
  | '$transaction'
>;

export interface DeckImportResult {
  topicId: string;
  unitId: string | null;
  created: number;
  removed: number;
  validation: DeckValidation;
}

export class FlashcardImportError extends Error {
  constructor(
    message: string,
    readonly validation?: DeckValidation,
  ) {
    super(message);
  }
}

/** Kaynak etiketi ön eki: AI türetimi (CLAUDE.md istisnası) ya da editör girişi. */
export const KART_KAYNAK_ONEKLERI = ['AI bilgi kartı', 'Editör'] as const;

/** Maddelerin güncel sürüm numarası (kart referansı bu sürüme bağlanır; madde tazelenince eskir). */
export async function latestVersionNos(
  db: Pick<PrismaClient, 'lawArticleVersion'>,
  articleIds: string[],
): Promise<Map<string, number>> {
  if (articleIds.length === 0) return new Map();
  const g = await db.lawArticleVersion.groupBy({
    by: ['lawArticleId'],
    where: { lawArticleId: { in: articleIds } },
    _max: { versionNo: true },
  });
  return new Map(g.map((r) => [r.lawArticleId, r._max.versionNo ?? 0]));
}

export async function importDeck(
  db: Db,
  data: FlashcardDeckJson,
  opts: { createdBy?: string | null; replaceExisting?: boolean } = {},
): Promise<DeckImportResult> {
  const d = data.deck;
  if (!d?.topicId || !d.legislationSlug || !d.sourceLabel)
    throw new FlashcardImportError('deck.topicId, legislationSlug ve sourceLabel zorunlu.');
  if (!KART_KAYNAK_ONEKLERI.some((p) => d.sourceLabel.startsWith(p)))
    throw new FlashcardImportError(
      `sourceLabel "${KART_KAYNAK_ONEKLERI.join('" ya da "')}" ön ekiyle başlamalı (Doc 56 §8.3).`,
    );
  if (!Array.isArray(data.cards) || data.cards.length === 0)
    throw new FlashcardImportError('En az bir kart gerekli.');

  const leg = await db.legislation.findFirst({
    where: { slug: d.legislationSlug, deletedAt: null },
    select: { id: true },
  });
  if (!leg) throw new FlashcardImportError(`Mevzuat bulunamadı: ${d.legislationSlug}`);
  const topic = await db.topic.findFirst({
    where: { id: d.topicId, deletedAt: null },
    select: { id: true },
  });
  if (!topic) throw new FlashcardImportError(`Konu bulunamadı: ${d.topicId}`);
  let unitId: string | null = null;
  if (d.unitSlug) {
    const unit = await db.summaryUnit.findFirst({
      where: { slug: d.unitSlug, deletedAt: null },
      select: { id: true, topicId: true },
    });
    if (!unit) throw new FlashcardImportError(`Ünite bulunamadı: ${d.unitSlug}`);
    if (unit.topicId !== topic.id)
      throw new FlashcardImportError(`Ünite ${d.unitSlug} bu konuya ait değil.`);
    unitId = unit.id;
  }

  const byNo = await loadArticleMap(db, leg.id);
  const validation = validateDeck(data, byNo);
  if (!validation.ok)
    throw new FlashcardImportError(
      `Doğrulama geçmedi: ${validation.fails} kusur. Deste yazılmadı.`,
      validation,
    );

  const allRefIds = [...new Set(data.cards.flatMap((c) => c.articleRefs))]
    .map((n) => byNo.get(n)?.id)
    .filter((x): x is string => Boolean(x));
  const versions = await latestVersionNos(db, allRefIds);

  const rows = data.cards.map((c, i) => ({
    topicId: topic.id,
    summaryUnitId: unitId,
    legislationId: leg.id,
    kind: c.kind,
    front: c.front.trim(),
    back: c.back.trim(),
    explanation: c.explanation?.trim() || null,
    difficulty: c.difficulty ?? 2,
    derivedNumbers: (c.derivedNumbers ?? undefined) as Prisma.InputJsonValue | undefined,
    counterNumbers: normalizeCounterNumbers(c.counterNumbers),
    sortOrder: i,
    status: 'in_review' as const,
    sourceLabel: d.sourceLabel,
    generatedBy: d.generatedBy ?? null,
    createdBy: opts.createdBy ?? null,
    articles: {
      create: c.articleRefs.map((n, j) => {
        const id = byNo.get(n)!.id;
        return {
          lawArticleId: id,
          articleVersionNo: versions.get(id) ?? null,
          relation: j === 0 ? 'primary' : 'related',
        };
      }),
    },
  }));

  return db.$transaction(
    async (tx) => {
      let removed = 0;
      if (opts.replaceExisting) {
        // Yalnız henüz yayımlanmamış (in_review/draft) aynı kaynaklı kartlar yenilenir; yayındaki
        // kartın kullanıcı ilerlemesi vardır, silinmez (Doc 06: silme yok, arşiv var).
        const r = await tx.flashcard.deleteMany({
          where: {
            topicId: topic.id,
            summaryUnitId: unitId,
            sourceLabel: d.sourceLabel,
            status: { in: ['in_review', 'draft'] },
            reviews: { none: {} },
          },
        });
        removed = r.count;
      }
      for (const row of rows) await tx.flashcard.create({ data: row, select: { id: true } });
      return { topicId: topic.id, unitId, created: rows.length, removed, validation };
    },
    { timeout: 60_000, maxWait: 10_000 },
  );
}

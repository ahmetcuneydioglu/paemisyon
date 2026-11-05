import type { ContentStatus, Difficulty, QuestionArticleRelation } from '@prisma/client';
import { questionFingerprint } from '../admin/questions/import-parser';
import { articleKeyNumber, hubKeyToArticleNo } from './article-key';
import type { HubQuestionPayload } from './hub-sync.types';
import { normalizeForCompare, richTextToPlain } from './rich-text';
import { hubOptionId } from './uuid-v5';

/** Saf eşleme (Doc 55 §3): yük + PAEMİSYON'daki mevcut durum → yazılacak satırlar. Veritabanına dokunmaz. */

export interface ExistingOption {
  label: string;
  text: string;
  isCorrect: boolean;
  sortOrder: number;
}
export interface ExistingQuestion {
  id: string;
  topicId: string;
  articleNo: string | null;
  deletedAt: Date | null;
  hubQuestionId: string | null;
  hubCode: string | null;
  maxVersionNo: number;
  /** Tüm sürümlerin merkez kimlikleri (eskiyi geri yazmama kuralı için). */
  hubVersionIds: string[];
  current: {
    id: string;
    versionNo: number;
    status: ContentStatus;
    stem: string;
    explanation: string | null;
    difficulty: Difficulty;
    sourceLabel: string | null;
    hubVersionId: string | null;
    options: ExistingOption[];
  } | null;
}

export interface ResolvedLink {
  role: 'required' | 'supporting';
  articleKey: string;
  /** Merkez mevzuatının PAEMİSYON karşılığı (hub_legislation_map). */
  legislationId: string | null;
  /** O mevzuatın konusu (Legislation.topicId): articleNo yalnız sorunun kendi konusunun kanunu için yazılır. */
  legislationTopicId: string | null;
  legislationName: string;
  lawArticleId: string | null;
}

export interface MapInput {
  payload: HubQuestionPayload;
  existing: ExistingQuestion | null;
  /** Yeni soru için çözülmüş konu (hub_topic_map); mevcut soruda konu DEĞİŞMEZ. */
  topicId: string | null;
  links: ResolvedLink[];
  now: Date;
}

export interface MappedVersion {
  id: string; // = merkez sürüm UUID'si
  versionNo: number;
  stem: string;
  explanation: string | null;
  difficulty: Difficulty;
  sourceLabel: string | null;
  contentHash: string;
  hubVersionId: string;
}
export interface MappedOption {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
  sortOrder: number;
}
export interface MappedArticle {
  lawArticleId: string;
  relation: QuestionArticleRelation;
}

export type MapPlan =
  | {
      kind: 'skip';
      reason: 'cancelled-new' | 'stale' | 'already-current' | 'no-topic' | 'empty-content';
      detail: string;
    }
  | {
      /** İçerik aynı: yalnız merkez kimlikleri ve bağlar yazılır, sürüm açılmaz. */
      kind: 'link-existing';
      questionId: string;
      versionId: string;
      hubQuestionId: string;
      hubVersionId: string;
      hubCode: string;
      articleNo: string | null;
      articles: MappedArticle[];
      revive: boolean;
      detail: string;
    }
  | {
      kind: 'create' | 'new-version';
      questionId: string | null; // create'te null (veritabanı üretir)
      topicId: string;
      hubQuestionId: string;
      hubCode: string;
      articleNo: string | null;
      version: MappedVersion;
      options: MappedOption[];
      legalReferences: string[];
      articles: MappedArticle[];
      archivePreviousVersionId: string | null;
      revive: boolean;
      detail: string;
    };

const SOURCELESS_LABELS = new Set(['Kaynak belirtilmemiş (PAEMİSYON)', 'Kaynak belirtilmemiş']);

export function mapDifficulty(d: number): Difficulty {
  if (d <= 2) return 'easy';
  if (d >= 4) return 'hard';
  return 'medium';
}

export function mapSourceLabel(name: string | null | undefined): string | null {
  const n = (name ?? '').trim();
  if (!n || SOURCELESS_LABELS.has(n)) return null;
  return n;
}

export function citationFor(link: ResolvedLink): string {
  return `${link.legislationName} md. ${hubKeyToArticleNo(link.articleKey)}`;
}

/** Zorunlu bağın maddesi, yalnız sorunun konusunun kanunuysa atlas etiketine yazılır. */
export function articleNoFor(
  links: ResolvedLink[],
  topicId: string,
  fallback: string | null,
): string | null {
  const required = links.find((l) => l.role === 'required');
  if (!required) return fallback;
  if (required.legislationTopicId && required.legislationTopicId === topicId) {
    return hubKeyToArticleNo(required.articleKey);
  }
  return fallback;
}

export function requiredArticleNumber(payload: HubQuestionPayload): number | null {
  const req = payload.legislation_links.find((l) => l.link_role === 'required');
  return req ? articleKeyNumber(req.article_key) : null;
}

function sameContent(
  existing: NonNullable<ExistingQuestion['current']>,
  stem: string,
  explanation: string | null,
  options: MappedOption[],
): boolean {
  if (normalizeForCompare(existing.stem) !== normalizeForCompare(stem)) return false;
  if (normalizeForCompare(existing.explanation) !== normalizeForCompare(explanation)) return false;
  const a = [...existing.options].sort((x, y) => x.sortOrder - y.sortOrder);
  if (a.length !== options.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (normalizeForCompare(a[i].text) !== normalizeForCompare(options[i].text)) return false;
    if (a[i].isCorrect !== options[i].isCorrect) return false;
  }
  return true;
}

export function mapQuestion(input: MapInput): MapPlan {
  const { payload, existing, links } = input;
  const q = payload.question;
  const v = payload.version;

  if (existing) {
    if (existing.current?.hubVersionId === v.id) {
      return {
        kind: 'skip',
        reason: 'already-current',
        detail: `${q.code} sürüm ${q.version} zaten güncel`,
      };
    }
    if (existing.hubVersionIds.includes(v.id)) {
      return {
        kind: 'skip',
        reason: 'stale',
        detail: `${q.code} sürüm ${q.version} PAEMİSYON'da daha yeni bir merkez sürümüyle aşılmış`,
      };
    }
  }

  const stem = richTextToPlain(v.stem);
  const explanation = richTextToPlain(v.detailed_solution) || null;
  const options: MappedOption[] = [...payload.options]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((o, i) => ({
      id: hubOptionId(v.id, o.key),
      label: o.key,
      text: richTextToPlain(o.content),
      isCorrect: o.is_correct,
      sortOrder: i,
    }));
  if (
    !stem ||
    options.length < 2 ||
    options.some((o) => !o.text) ||
    options.filter((o) => o.isCorrect).length !== 1
  ) {
    return {
      kind: 'skip',
      reason: 'empty-content',
      detail: `${q.code}: kök/şık boş ya da doğru şık sayısı 1 değil`,
    };
  }

  const articles: MappedArticle[] = [];
  for (const l of links) {
    if (!l.lawArticleId) continue;
    if (articles.some((a) => a.lawArticleId === l.lawArticleId)) continue;
    articles.push({
      lawArticleId: l.lawArticleId,
      relation: l.role === 'required' ? 'primary' : 'related',
    });
  }

  if (existing && existing.current && sameContent(existing.current, stem, explanation, options)) {
    // İptal (sınavda puanlanmamış) soru PAEMİSYON'da zaten PastExamQuestion.cancelled ile havuz dışıdır;
    // sürüm arşivlenmez, yalnız kimlik bağlanır.
    return {
      kind: 'link-existing',
      questionId: existing.id,
      versionId: existing.current.id,
      hubQuestionId: q.id,
      hubVersionId: v.id,
      hubCode: q.code,
      articleNo: articleNoFor(links, existing.topicId, existing.articleNo),
      articles,
      revive: existing.deletedAt != null && !q.cancelled,
      detail: `${q.code} ↔ ${existing.id.slice(0, 8)} içerik aynı; sürüm açılmadı`,
    };
  }

  if (!existing && q.cancelled) {
    return {
      kind: 'skip',
      reason: 'cancelled-new',
      detail: `${q.code} iptal işaretli; havuza alınmaz`,
    };
  }

  const topicId = existing ? existing.topicId : input.topicId;
  if (!topicId) {
    return {
      kind: 'skip',
      reason: 'no-topic',
      detail: `${q.code}: merkez konusu ${q.topic_id ?? '(yok)'} için PAEMİSYON konusu eşlenmemiş`,
    };
  }

  const version: MappedVersion = {
    id: v.id,
    versionNo: (existing?.maxVersionNo ?? 0) + 1,
    stem,
    explanation,
    difficulty: mapDifficulty(q.difficulty),
    sourceLabel: mapSourceLabel(v.source?.name) ?? existing?.current?.sourceLabel ?? null,
    contentHash: questionFingerprint(
      stem,
      options.map((o) => o.text),
    ),
    hubVersionId: v.id,
  };
  const legalReferences = links.map(citationFor).filter((c, i, arr) => arr.indexOf(c) === i);

  return {
    kind: existing ? 'new-version' : 'create',
    questionId: existing?.id ?? null,
    topicId,
    hubQuestionId: q.id,
    hubCode: q.code,
    articleNo: articleNoFor(links, topicId, existing?.articleNo ?? null),
    version,
    options,
    legalReferences,
    articles,
    archivePreviousVersionId:
      existing?.current && existing.current.status === 'published' ? existing.current.id : null,
    revive: existing?.deletedAt != null,
    detail: existing
      ? `${q.code} → ${existing.id.slice(0, 8)} yeni sürüm ${version.versionNo} (merkez sürüm ${q.version})`
      : `${q.code} yeni soru (merkez sürüm ${q.version}, ${v.authoring_method})`,
  };
}

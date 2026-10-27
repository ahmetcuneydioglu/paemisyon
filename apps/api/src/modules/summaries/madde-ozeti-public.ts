/**
 * Doc 54 — madde özetinin PUBLIC görünümleri (saf eşleme). Kaynak etiketi (sourceLabel), üretim bilgisi ve
 * doğrulama ayrıntısı DIŞARI ÇIKMAZ; yalnız "mevzuat kontrol tarihi" çıkar. Yalnız `published` özet gösterilir.
 */
import type { Prisma } from '@prisma/client';

export const ARTICLE_SUMMARY_PUBLIC_SELECT = {
  lawArticleId: true,
  repealed: true,
  title: true,
  shortSummary: true,
  detailed: true,
  keyPoints: true,
  conditions: true,
  exceptions: true,
  timeLimits: true,
  numericalValues: true,
  authorityAndLimits: true,
  relatedLegislation: true,
  examReminders: true,
  verifiedAt: true,
  status: true,
} satisfies Prisma.ArticleSummarySelect;

type Row = Prisma.ArticleSummaryGetPayload<{ select: typeof ARTICLE_SUMMARY_PUBLIC_SELECT }>;

export interface LabeledValueOut {
  label: string;
  value: string;
  ref?: string;
}

/** Madde sayfası / çalışma alanı: tam özet. */
export interface PublicArticleSummary {
  repealed: boolean;
  title: string;
  shortSummary: string;
  detailed: string | null;
  keyPoints: string[];
  conditions: string[];
  exceptions: string[];
  timeLimits: LabeledValueOut[];
  numericalValues: LabeledValueOut[];
  authorityAndLimits: { authority: string; limit: string; ref?: string }[];
  relatedLegislation: { law: string; article: string | null; note?: string; verified: boolean }[];
  examReminders: string[];
  /** Mevzuatın resmî kaynakta kontrol edildiği tarih (ISO gün). */
  verifiedAt: string | null;
}

/** Okuyucu satırı: kısa biçim (liste şişmesin). */
export interface PublicArticleSummaryBrief {
  repealed: boolean;
  title: string;
  shortSummary: string;
  keyPoints: string[];
  timeLimits: LabeledValueOut[];
  numericalValues: LabeledValueOut[];
  examReminders: string[];
}

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export function toPublicArticleSummary(r: Row | null | undefined): PublicArticleSummary | null {
  if (!r || r.status !== 'published') return null;
  return {
    repealed: r.repealed,
    title: r.title,
    shortSummary: r.shortSummary,
    detailed: r.detailed,
    keyPoints: r.keyPoints,
    conditions: r.conditions,
    exceptions: r.exceptions,
    timeLimits: arr(r.timeLimits),
    numericalValues: arr(r.numericalValues),
    authorityAndLimits: arr(r.authorityAndLimits),
    relatedLegislation: arr(r.relatedLegislation),
    examReminders: r.examReminders,
    verifiedAt: r.verifiedAt ? r.verifiedAt.toISOString().slice(0, 10) : null,
  };
}

export function toPublicArticleSummaryBrief(
  r: Row | null | undefined,
): PublicArticleSummaryBrief | null {
  if (!r || r.status !== 'published') return null;
  return {
    repealed: r.repealed,
    title: r.title,
    shortSummary: r.shortSummary,
    keyPoints: r.keyPoints,
    timeLimits: arr(r.timeLimits),
    numericalValues: arr(r.numericalValues),
    examReminders: r.examReminders,
  };
}

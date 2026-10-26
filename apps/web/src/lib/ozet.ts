/**
 * Konu özetleri (Doc 53) — web tipleri ve saf yardımcılar.
 * Tipler backend `summaries.service.ts` public yanıtlarıyla birebir.
 */

export type SummaryBlockType =
  | "concept"
  | "rule"
  | "numbers"
  | "compare"
  | "trap"
  | "exam_stats"
  | "bridge";

export type SummaryRow = Record<string, unknown> & { refs?: string[] };

export interface SummaryUnitListItem {
  slug: string;
  title: string;
  subtitle: string | null;
  articleFrom: string;
  articleTo: string;
  readingMinutes: number;
  isPremium: boolean;
  locked: boolean;
  blockCount: number;
  progress: { lastBlockIndex: number; completedAt: string | null } | null;
}

export interface SummaryPublicBlock {
  id: string;
  type: SummaryBlockType;
  title: string | null;
  body: string | null;
  rows: SummaryRow[] | null;
  articles: { no: string; title: string | null }[];
  session?: { topicId: string; articleNos: string[] };
}

export interface SummaryUnitDetail {
  slug: string;
  title: string;
  subtitle: string | null;
  articleFrom: string;
  articleTo: string;
  readingMinutes: number;
  isPremium: boolean;
  locked: boolean;
  totalBlocks: number;
  legislation: { slug: string; name: string; shortName: string | null };
  topic: { id: string; name: string; courseName: string };
  progress: { lastBlockIndex: number; completedAt: string | null } | null;
  blocks: SummaryPublicBlock[];
}

/** `GET /public/summaries` — sitemap ve vitrin (kullanıcıya özel alan yok). */
export interface SummaryUnitPublicListItem {
  slug: string;
  title: string;
  subtitle: string | null;
  articleFrom: string;
  articleTo: string;
  readingMinutes: number;
  isPremium: boolean;
  updatedAt: string;
  topic: { id: string; name: string; courseName: string };
  legislation: { slug: string; name: string; shortName: string | null };
}

export const SUMMARY_BLOCK_LABEL: Record<SummaryBlockType, string> = {
  concept: "Kavram",
  rule: "Kural",
  numbers: "Sayılar",
  compare: "Karşılaştırma",
  trap: "Tuzak",
  exam_stats: "Sınav der ki",
  bridge: "Soru çöz",
};

// ── Kart gövdesi (markdown-lite): kalın **…**, satır başı liste "- " / "1. " ──

export interface InlineRun {
  bold: boolean;
  text: string;
}
export type BodyPara =
  | { kind: "p"; runs: InlineRun[] }
  | { kind: "list"; ordered: boolean; items: InlineRun[][] };

export function parseInline(s: string): InlineRun[] {
  return s
    .split(/(\*\*[^*]+\*\*)/g)
    .filter((part) => part.length > 0)
    .map((part) =>
      part.startsWith("**") && part.endsWith("**") && part.length > 4
        ? { bold: true, text: part.slice(2, -2) }
        : { bold: false, text: part },
    );
}

const LIST_LINE = /^\s*(-|\d+\.)\s+/;

/**
 * Gövdeyi paragraf ve listelere böler. Bir paragraf içinde "**Başlık:**" satırını izleyen
 * liste satırları ayrı liste olur (admin düzenleyicisiyle aynı kural).
 */
export function parseBody(text: string): BodyPara[] {
  const out: BodyPara[] = [];
  for (const para of text.split(/\n\s*\n/)) {
    const lines = para.split("\n").filter((l) => l.trim().length > 0);
    let textBuf: string[] = [];
    let listBuf: { ordered: boolean; items: string[] } | null = null;
    const flushText = () => {
      if (textBuf.length) out.push({ kind: "p", runs: parseInline(textBuf.join(" ")) });
      textBuf = [];
    };
    const flushList = () => {
      if (listBuf) out.push({ kind: "list", ordered: listBuf.ordered, items: listBuf.items.map(parseInline) });
      listBuf = null;
    };
    for (const line of lines) {
      if (LIST_LINE.test(line)) {
        flushText();
        const ordered = /^\s*\d+\./.test(line);
        if (!listBuf || listBuf.ordered !== ordered) {
          flushList();
          listBuf = { ordered, items: [] };
        }
        listBuf.items.push(line.replace(LIST_LINE, ""));
      } else {
        flushList();
        textBuf.push(line.trim());
      }
    }
    flushText();
    flushList();
  }
  return out;
}

/** Ünite sonu köprüsü: ünitenin maddelerinden 10 soruluk seans adresi. */
export function bridgeSessionHref(opts: {
  topicId: string;
  articleNos: string[];
  scope: string;
  count?: number;
}): string {
  const q = new URLSearchParams({
    topicId: opts.topicId,
    articleNos: opts.articleNos.join(","),
    count: String(opts.count ?? 10),
    source: "topic_room",
    scope: opts.scope,
  });
  return `/seans?${q.toString()}`;
}

/** SEO açıklaması: ilk kavram kartından, etiket ve kalınlık işaretleri temizlenmiş 160 karakter. */
export function unitDescription(unit: Pick<SummaryUnitDetail, "blocks" | "subtitle" | "legislation">): string {
  const first = unit.blocks.find((b) => b.body)?.body ?? unit.subtitle ?? "";
  const duz = first.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
  const kisa = duz.length > 157 ? `${duz.slice(0, 157).replace(/\s+\S*$/, "")}…` : duz;
  return kisa || `${unit.legislation.name} konu özeti.`;
}

/** Okuma ilerlemesi yüzdesi (kart sayısına göre). */
export function unitProgressPct(u: Pick<SummaryUnitListItem, "blockCount" | "progress">): number {
  if (!u.progress) return 0;
  if (u.progress.completedAt) return 100;
  if (u.blockCount <= 0) return 0;
  return Math.min(99, Math.round(((u.progress.lastBlockIndex + 1) / u.blockCount) * 100));
}

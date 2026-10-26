import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Konu özetleri (Doc 53) — tipler backend `summaries.service.ts` public yanıtlarıyla birebir;
 * web `apps/web/src/lib/ozet.ts` ile aynı sözleşme. Kilit ve ilerleme sunucudan; istemci
 * yalnız çizer (koç kuralı). Kaynak etiketi yanıtta yoktur, burada da yoktur.
 */
export type SummaryBlockType = "concept" | "rule" | "numbers" | "compare" | "trap" | "exam_stats" | "bridge";
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

export interface SummaryBlock {
  id: string;
  type: SummaryBlockType;
  title: string | null;
  body: string | null;
  rows: SummaryRow[] | null;
  articles: { no: string; title: string | null }[];
  session?: { topicId: string; articleNos: string[] };
}

export interface SummaryUnit {
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
  blocks: SummaryBlock[];
}

export const summaryKeys = {
  topic: (topicId: string | null) => ["summaries", "topic", topicId] as const,
  unit: (slug: string | null) => ["summaries", "unit", slug] as const,
};

export function useTopicUnits(topicId: string | null) {
  return useQuery({
    queryKey: summaryKeys.topic(topicId),
    queryFn: () => api<{ units: SummaryUnitListItem[] }>(`/public/summaries/topic/${topicId}`).then((r) => r.units),
    enabled: Boolean(topicId),
  });
}

export function useUnit(slug: string | null) {
  return useQuery({ queryKey: summaryKeys.unit(slug), queryFn: () => api<SummaryUnit>(`/public/summaries/${slug}`), enabled: Boolean(slug) });
}

/** Kaldığın kart / bitirme — seyrek çağrılır (okuyucu kendi zamanlar). */
export function useSaveUnitProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { slug: string; lastBlockIndex: number; completed?: boolean }) => api<{ ok: boolean }>("/me/summaries/progress", { method: "POST", body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["summaries", "topic"] });
    },
  });
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

/** Ünite başlığının kısa hali ("Yasama I — Meclis…" → "Yasama I"). */
export const shortTitle = (title: string) => title.split(" — ")[0]!;

export function unitProgressPct(u: Pick<SummaryUnitListItem, "blockCount" | "progress">): number {
  if (!u.progress) return 0;
  if (u.progress.completedAt) return 100;
  if (u.blockCount <= 0) return 0;
  return Math.min(99, Math.round(((u.progress.lastBlockIndex + 1) / u.blockCount) * 100));
}

// ── Kart gövdesi (markdown-lite): kalın **…**, satır başı liste "- " / "1. " ──
export interface InlineRun {
  bold: boolean;
  text: string;
}
export type BodyPara = { kind: "p"; runs: InlineRun[] } | { kind: "list"; ordered: boolean; items: InlineRun[][] };

export function parseInline(s: string): InlineRun[] {
  return s
    .split(/(\*\*[^*]+\*\*)/g)
    .filter((part) => part.length > 0)
    .map((part) => (part.startsWith("**") && part.endsWith("**") && part.length > 4 ? { bold: true, text: part.slice(2, -2) } : { bold: false, text: part }));
}

const LIST_LINE = /^\s*(-|\d+\.)\s+/;

/** Web `parseBody` ile aynı kural: "**Başlık:**" satırını izleyen liste satırları ayrı liste olur. */
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

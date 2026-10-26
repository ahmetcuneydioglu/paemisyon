import { AlertTriangle, BarChart3, Lightbulb, Scale, Table2 } from "lucide-react";
import type { ComponentType } from "react";
import { SUMMARY_BLOCK_LABEL, type SummaryPublicBlock, type SummaryRow } from "@/lib/ozet";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { ArticlePeek } from "./article-peek";
import { SummaryBody } from "./summary-body";
import { cn } from "@/lib/cn";

type IconProps = { size?: number | string; className?: string; "aria-hidden"?: boolean };

const META: Record<
  SummaryPublicBlock["type"],
  { tone: BadgeTone; icon: ComponentType<IconProps> | null; cardTone: "surface" | "alt" | "accent" }
> = {
  concept: { tone: "accent", icon: Lightbulb, cardTone: "accent" },
  rule: { tone: "neutral", icon: Scale, cardTone: "surface" },
  numbers: { tone: "neutral", icon: Table2, cardTone: "alt" },
  compare: { tone: "neutral", icon: Table2, cardTone: "alt" },
  trap: { tone: "warning", icon: AlertTriangle, cardTone: "surface" },
  exam_stats: { tone: "success", icon: BarChart3, cardTone: "alt" },
  bridge: { tone: "accent", icon: null, cardTone: "accent" },
};

const ROW_KEYS: Partial<Record<SummaryPublicBlock["type"], string[]>> = {
  numbers: ["label", "value"],
  compare: ["aspect", "left", "right"],
};

function compareHeads(title: string | null): [string, string] {
  const parts = (title ?? "").split(/\s+(?:ve|ile|vs\.?|–|-)\s+/i);
  if (parts.length >= 2) return [parts[0].trim(), parts.slice(1).join(" ").trim()];
  return ["Birincisi", "İkincisi"];
}

function RowsTable({
  rows,
  type,
  lawSlug,
  title,
}: {
  rows: SummaryRow[];
  type: SummaryPublicBlock["type"];
  lawSlug: string;
  title: string | null;
}) {
  const keys = ROW_KEYS[type] ?? ["label", "value"];
  const compare = type === "compare";
  const [solBaslik, sagBaslik] = compareHeads(title);
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[20rem] border-separate border-spacing-0 type-body-sm">
        {compare ? (
          <thead>
            <tr className="type-label text-ink-subtle">
              <th className="px-1 pb-2 text-left font-medium" />
              <th className="px-1 pb-2 text-left font-medium">{solBaslik}</th>
              <th className="px-1 pb-2 text-left font-medium">{sagBaslik}</th>
            </tr>
          </thead>
        ) : null}
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="align-top">
              {keys.map((k, j) => (
                <td
                  key={k}
                  className={cn(
                    "border-t border-line px-1 py-2",
                    j === 0 ? "text-ink-soft" : "text-ink",
                    j === 0 && !compare && "w-[55%]",
                    j > 0 && !compare && "font-semibold tabular-nums",
                  )}
                >
                  {String(r[k] ?? "")}
                  {j === keys.length - 1 && Array.isArray(r.refs) && r.refs.length > 0 ? (
                    <span className="ml-1 inline-flex flex-wrap gap-1 align-middle">
                      {r.refs.map((no) => (
                        <ArticlePeek key={no} lawSlug={lawSlug} no={no} title={null} className="h-6 px-1.5" />
                      ))}
                    </span>
                  ) : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatRows({ rows }: { rows: SummaryRow[] }) {
  return (
    <dl className="flex flex-col divide-y divide-line">
      {rows.map((r, i) => (
        <div key={i} className="flex items-baseline justify-between gap-4 py-2">
          <dt className="type-body-sm text-ink-soft">{String(r.label ?? "")}</dt>
          <dd className="type-subhead text-right text-ink tabular-nums">{String(r.value ?? "")}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Tek kart (Doc 53 §3): tür rozeti + madde rozetleri + gövde ya da tablo.
 * bridge kartı burada çizilmez (okuyucu sonda kendi köprüsünü koyar).
 */
export function SummaryBlockCard({
  block,
  lawSlug,
  index,
  className,
}: {
  block: SummaryPublicBlock;
  lawSlug: string;
  index: number;
  className?: string;
}) {
  const meta = META[block.type];
  const Icon = meta.icon;
  const compare = block.type === "compare";
  return (
    <Card
      tone={meta.cardTone}
      data-block-index={index}
      className={cn("flex flex-col gap-3 p-5", className)}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={meta.tone}>
          {Icon ? <Icon size={12} aria-hidden /> : null}
          {SUMMARY_BLOCK_LABEL[block.type]}
        </Badge>
        {block.articles.map((a) => (
          <ArticlePeek key={a.no} lawSlug={lawSlug} no={a.no} title={a.title} />
        ))}
      </div>
      {block.title ? <h2 className="type-heading text-ink">{block.title}</h2> : null}
      {block.body ? <SummaryBody text={block.body} /> : null}
      {block.rows && block.rows.length > 0 ? (
        block.type === "exam_stats" ? (
          <StatRows rows={block.rows} />
        ) : (
          <RowsTable rows={block.rows} type={compare ? "compare" : "numbers"} lawSlug={lawSlug} title={block.title} />
        )
      ) : null}
    </Card>
  );
}

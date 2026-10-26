import { parseBody, type InlineRun } from "@/lib/ozet";
import { cn } from "@/lib/cn";

function Runs({ runs }: { runs: InlineRun[] }) {
  return (
    <>
      {runs.map((r, i) =>
        r.bold ? (
          <strong key={i} className="font-semibold text-ink">
            {r.text}
          </strong>
        ) : (
          <span key={i}>{r.text}</span>
        ),
      )}
    </>
  );
}

/** Kart gövdesi: kalın ve liste dışında markdown yok (Doc 53 §3). Sunucu ve istemcide çalışır. */
export function SummaryBody({ text, className }: { text: string; className?: string }) {
  const paras = parseBody(text);
  return (
    <div className={cn("flex flex-col gap-2 type-body text-ink-soft", className)}>
      {paras.map((p, i) => {
        if (p.kind === "p") {
          return (
            <p key={i} className="text-pretty">
              <Runs runs={p.runs} />
            </p>
          );
        }
        const Tag = p.ordered ? "ol" : "ul";
        return (
          <Tag key={i} className={cn("flex flex-col gap-1 pl-5", p.ordered ? "list-decimal" : "list-disc")}>
            {p.items.map((runs, j) => (
              <li key={j} className="text-pretty">
                <Runs runs={runs} />
              </li>
            ))}
          </Tag>
        );
      })}
    </div>
  );
}

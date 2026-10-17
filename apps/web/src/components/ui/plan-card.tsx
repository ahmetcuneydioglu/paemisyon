import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Badge } from "./badge";

/**
 * Fiyat/plan kartı — `highlight` ve `badge` varyantlarıyla tek planlı premium
 * sayfasında ve çok planlı listede kullanılır. Rozet rengi tek başına anlam
 * taşımaz (metin var); fiyat tabular.
 */
export function PlanCard({
  name,
  price,
  periodLabel,
  note,
  badge,
  features,
  highlight = false,
  children,
  className,
}: {
  name: string;
  price: string;
  periodLabel?: string;
  note?: string;
  badge?: string;
  features?: string[];
  highlight?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative flex flex-col items-center rounded-sheet border bg-surface p-6 text-center",
        highlight ? "border-accent" : "border-line",
        className,
      )}
    >
      {badge ? (
        <Badge tone="accent" className="mb-3">
          {badge}
        </Badge>
      ) : null}
      <h2 className="type-heading text-ink">{name}</h2>
      <p className="mt-2 flex items-baseline justify-center gap-1.5">
        <span className="type-title tabular text-ink">{price}</span>
        {periodLabel ? (
          <span className="type-body text-ink-soft">/ {periodLabel}</span>
        ) : null}
      </p>
      {note ? (
        <p className="type-body-sm tabular mt-1.5 text-ink-soft">{note}</p>
      ) : null}
      {features && features.length > 0 ? (
        <ul className="mx-auto mt-5 flex max-w-[34ch] flex-col gap-2 text-left">
          {features.map((f) => (
            <li key={f} className="type-body-sm flex gap-2.5 text-ink">
              <Check
                size={16}
                strokeWidth={2.25}
                className="mt-0.5 shrink-0 text-success"
                aria-hidden
              />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {children ? <div className="mt-6 w-full">{children}</div> : null}
    </section>
  );
}

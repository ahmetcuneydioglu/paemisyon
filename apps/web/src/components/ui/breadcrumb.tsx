import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Fragment, type ComponentProps } from "react";

type Crumb = { label: string; href?: ComponentProps<typeof Link>["href"] };

/** Ekmek kırıntısı — yalnız 3+ seviyede (Doc 25 kuralı). Son öğe bağlantısızdır. */
export function Breadcrumb({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  return (
    <nav aria-label="Konum" className={className}>
      <ol className="flex flex-wrap items-center gap-1 type-body-sm text-ink-soft">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <Fragment key={`${c.label}-${i}`}>
              {i > 0 ? (
                <ChevronRight
                  size={14}
                  className="text-ink-subtle"
                  aria-hidden
                />
              ) : null}
              <li
                aria-current={last ? "page" : undefined}
                className={last ? "text-ink" : undefined}
              >
                {c.href && !last ? (
                  <Link
                    href={c.href}
                    className="hover:text-ink hover:underline"
                  >
                    {c.label}
                  </Link>
                ) : (
                  c.label
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

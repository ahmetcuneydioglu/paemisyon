import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  /** Dar ekranda gizlenir. */
  hideBelowMd?: boolean;
  width?: string;
};

/**
 * Veri tablosu (web'e özgü, Doc 27 §0 "yüksek yoğunluk"): çizgili satırlar, zebra yok,
 * sayısal kolonlar tabular ve sağa yaslı. Satır eylemi `onRowHref` ile tüm satırı kapsar.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  empty,
  dense = false,
  rowClassName,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption?: string;
  empty?: ReactNode;
  dense?: boolean;
  /** Satıra özel sınıf (ör. "sen" satırını vurgulamak). */
  rowClassName?: (row: T) => string | undefined;
  className?: string;
}) {
  const alignClass = (a?: Column<T>["align"]) =>
    a === "right"
      ? "text-right tabular"
      : a === "center"
        ? "text-center"
        : "text-left";
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-card border border-line bg-surface",
        className,
      )}
    >
      <table className="w-full border-collapse">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-line">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                style={c.width ? { width: c.width } : undefined}
                className={cn(
                  "type-label px-4 py-3 text-ink-subtle",
                  alignClass(c.align),
                  c.hideBelowMd && "hidden md:table-cell",
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center type-body-sm text-ink-soft"
              >
                {empty ?? "Henüz veri yok."}
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr
                key={rowKey(r)}
                className={cn(
                  "border-b border-line last:border-b-0 hover:bg-surface-alt/50",
                  rowClassName?.(r),
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "type-body-sm px-4 text-ink",
                      dense ? "py-2" : "py-3",
                      alignClass(c.align),
                      c.hideBelowMd && "hidden md:table-cell",
                    )}
                  >
                    {c.cell(r)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

import type { ReactNode } from "react";

/**
 * Oda durum paneli (Doc 49/14): lacivert panel (iki temada da koyu), solda büyük serif yüzde,
 * sağda kısa satırlar. Sol sütun sabit, sağ sütun esnek (uzun konu adı sarar; rakam kırılmaz).
 */
export function RoomStatPanel({
  pct,
  sub,
  right,
  label,
}: {
  pct: number | null;
  sub: string;
  right?: ReactNode;
  label?: string | null;
}) {
  return (
    <section className="rounded-panel bg-panel px-5 py-4 text-panel-ink">
      {label ? <p className="type-label text-panel-soft">{label}</p> : null}
      <div className="flex items-end justify-between gap-4">
        <div className="shrink-0">
          {pct == null ? (
            <p className="type-heading font-display">Henüz çözülmedi</p>
          ) : (
            <p className="font-display text-[44px] leading-[48px] font-medium text-accent tabular">
              %{pct}
            </p>
          )}
          <p className="type-body-sm text-panel-soft">{sub}</p>
        </div>
        {right ? (
          <div className="flex min-w-0 flex-1 flex-col items-end gap-1 text-right">
            {right}
          </div>
        ) : null}
      </div>
    </section>
  );
}

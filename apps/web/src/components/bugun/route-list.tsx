import Link from "next/link";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface RouteRow {
  key: string;
  label: string;
  /** Alt bilgi: "4/10", "12/20 · 881 kuyrukta", "Anayasa". */
  detail: string | null;
  /** "~4 dk" sağda; bitmiş adımda yazılmaz. */
  estimateMin: number | null;
  done: boolean;
  /** null: yalnız bilgi (bağlantısız). */
  href: string | null;
}

/**
 * Bugünün rotası (Bugün v3; kullanıcı kararı 30 Eki: GYSROTA'daki gibi SIRA NUMARASI ve tamamlanınca
 * TİK). Numaralı daireler dikey çizgiyle bağlı; tamamlanan adım success dolgu + onay işareti + üstü
 * çizili soluk metin; sağda "~dk". Sıra sunucunun, tamamlanma gerçek veriden. Alt satır bugünün
 * sayımı ("Bugün 150 soru · %80 doğru · hedef 20 ✓") → Performans; sağda "Planım ›".
 */
export function RouteList({
  rows,
  footer,
  footerHref,
  planHref,
}: {
  rows: RouteRow[];
  footer: string | null;
  footerHref?: string;
  planHref?: string;
}) {
  const done = rows.filter((r) => r.done).length;
  return (
    <section
      aria-labelledby="rota-baslik"
      className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="rota-baslik" className="type-label text-ink-subtle">
          Bugünün rotası
        </h2>
        <span className="type-body-sm tabular text-ink-soft">
          {done}/{rows.length} tamam
        </span>
      </div>
      <ol className="flex flex-col">
        {rows.map((r, i) => {
          const last = i === rows.length - 1;
          const inner = (
            <>
              <span className="flex w-7 shrink-0 flex-col items-center">
                <span
                  aria-hidden
                  className={cn(
                    "mt-2.5 flex size-7 items-center justify-center rounded-full",
                    r.done
                      ? "bg-success text-on-accent"
                      : "border-[1.5px] border-line bg-surface text-ink-soft",
                  )}
                >
                  {r.done ? (
                    <Check size={16} strokeWidth={3} />
                  ) : (
                    <span className="type-subhead tabular text-[13px] leading-4">
                      {i + 1}
                    </span>
                  )}
                </span>
                {!last ? (
                  <span
                    aria-hidden
                    className={cn(
                      "my-1 w-0.5 flex-1",
                      r.done ? "bg-success" : "bg-line",
                    )}
                    style={{ minHeight: 10 }}
                  />
                ) : null}
              </span>
              <span
                className={cn(
                  "flex min-h-12 min-w-0 flex-1 items-start gap-2 py-2.5",
                  !last && "border-b border-line",
                )}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span
                    className={cn(
                      "type-body",
                      r.done ? "text-ink-soft line-through" : "text-ink",
                    )}
                  >
                    {r.label}
                  </span>
                  {r.detail ? (
                    <span className="type-body-sm tabular text-ink-subtle">
                      {r.detail}
                    </span>
                  ) : null}
                </span>
                {r.estimateMin != null && !r.done ? (
                  <span className="type-body-sm tabular shrink-0 pt-0.5 text-ink-soft">
                    ~{r.estimateMin} dk
                  </span>
                ) : null}
              </span>
            </>
          );
          const a11y = `${i + 1}. adım, ${r.label}${
            r.estimateMin != null ? `, yaklaşık ${r.estimateMin} dakika` : ""
          }${r.done ? ", tamamlandı" : ""}`;
          return (
            <li key={r.key} className="flex">
              {r.href ? (
                <Link
                  href={r.href}
                  aria-label={a11y}
                  className="tk-interactive -mx-2 flex flex-1 gap-3 rounded-control px-2 hover:bg-surface-alt"
                >
                  {inner}
                </Link>
              ) : (
                <div aria-label={a11y} className="flex flex-1 gap-3">
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {footer || planHref ? (
        <div className="flex items-center justify-between gap-2">
          <FooterText href={footerHref}>{footer ?? ""}</FooterText>
          {planHref ? (
            <Link
              href={planHref}
              className="type-body-sm inline-flex min-h-8 shrink-0 items-center text-accent-ink hover:underline"
            >
              Planım ›
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function FooterText({
  href,
  children,
}: {
  href?: string;
  children: ReactNode;
}) {
  // Dar ekranda kısaltma yok: satır gerekirse iki satıra kırılır (375 px'te "hedef 20 sor…" kesiliyordu).
  const cls =
    "type-body-sm tabular inline-flex min-h-8 min-w-0 flex-1 items-center text-ink-soft";
  return href ? (
    <Link href={href} className={cn(cls, "hover:text-ink")}>
      {children}
    </Link>
  ) : (
    <span className={cls}>{children}</span>
  );
}

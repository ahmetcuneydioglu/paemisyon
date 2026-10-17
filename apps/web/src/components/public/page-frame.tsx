import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Breadcrumb } from "@/components/ui/breadcrumb";

type Width = "narrow" | "default" | "wide";
const widths: Record<Width, string> = {
  narrow: "max-w-3xl",
  default: "max-w-4xl",
  wide: "max-w-6xl",
};

/**
 * Public sayfa çerçevesi (Doc 27 L1 Kapı, F7 W-F): tek sütun, token zemin, üç genişlik.
 * Sayfalar kendi `mx-auto max-w-* px-4` kombinasyonunu yazmaz; okuma sayfaları `narrow`,
 * liste/tablo sayfaları `wide`.
 */
export function PageFrame({
  width = "default",
  className,
  children,
}: {
  width?: Width;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-8 md:py-10",
        widths[width],
        className,
      )}
    >
      {children}
    </div>
  );
}

type Crumb = { label: string; href?: string };

/**
 * Sayfa girişi: kırıntı (3+ seviyede), üst etiket, başlık, bir paragraf, meta satırı,
 * eylemler. Başlık her zaman tek `h1`; eski `.head2` bandının yerini alır.
 */
export function PageIntro({
  breadcrumb,
  eyebrow,
  title,
  lead,
  meta,
  actions,
  align = "left",
  className,
}: {
  breadcrumb?: Crumb[];
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  const center = align === "center";
  return (
    <header
      className={cn(
        "flex flex-col gap-3",
        center && "items-center text-center",
        className,
      )}
    >
      {breadcrumb && breadcrumb.length > 1 ? (
        <Breadcrumb items={breadcrumb} />
      ) : null}
      <div className={cn("flex flex-col gap-1.5", center && "items-center")}>
        {eyebrow ? (
          <span className="type-label text-accent-ink">{eyebrow}</span>
        ) : null}
        <h1 className="type-title text-balance text-ink">{title}</h1>
        {lead ? (
          <p className="type-body max-w-[68ch] text-pretty text-ink-soft">
            {lead}
          </p>
        ) : null}
      </div>
      {meta ? (
        <div
          className={cn(
            "flex flex-wrap items-center gap-2 type-body-sm text-ink-soft",
            center && "justify-center",
          )}
        >
          {meta}
        </div>
      ) : null}
      {actions ? (
        <div
          className={cn(
            "flex flex-wrap gap-2 pt-1",
            center && "justify-center",
          )}
        >
          {actions}
        </div>
      ) : null}
    </header>
  );
}

/**
 * Kapanış çağrısı: public sayfaların altındaki "ücretsiz başla" kartı. Metin ve
 * düğmeler sayfadan gelir; görünüm tek yerde durur.
 */
export function ClosingCta({
  title,
  body,
  actions,
  className,
}: {
  title: ReactNode;
  body?: ReactNode;
  actions: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col items-start gap-3 rounded-card border border-accent/40 bg-accent-soft p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="type-heading text-ink">{title}</h2>
        {body ? (
          <p className="type-body-sm mt-1 max-w-[60ch] text-ink-soft">{body}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {actions}
      </div>
    </section>
  );
}

/** Düzyazı belgeler (gizlilik, koşullar, hesap silme): başlık/paragraf/liste ritmi tek sınıfta. */
export function Prose({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("doc-prose", className)}>{children}</div>;
}

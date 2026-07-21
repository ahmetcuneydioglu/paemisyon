import type { ReactNode } from "react";

/**
 * Fiyat/plan kartı — tek ekrana özel değil: `highlight` ve `badge` varyantlarıyla
 * hem tek planlı premium sayfasında hem ileride çok planlı listede kullanılır.
 *
 * a11y: rozet rengi TEK BAŞINA anlam taşımaz (metin de var); fiyat `tabular`
 * ile hizalanır (yalnız .tk-scope altında etkin — sayfa kabuğu bunu sağlar).
 * Tipografi: `font-heading` yalnız 700 ağırlığında yüklü → daima `font-bold`.
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
  /** Biçimlenmiş fiyat, ör. "499,99 TL" */
  price: string;
  /** "/ 3 ay" olarak basılır */
  periodLabel?: string;
  /** Fiyatın altındaki açıklama, ör. "Ayda 166,66 TL" */
  note?: string;
  badge?: string;
  features?: string[];
  highlight?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    // aria-label YOK: aynı metni taşıyan <h2> zaten bölümü adlandırıyor; ikisi
    // birlikte ekran okuyucuda plan adını arka arkaya iki kez duyururdu.
    <section
      className={[
        "tk-interactive relative rounded-lg border bg-surface p-6 text-center",
        highlight ? "border-brand shadow-[0_1px_24px_-8px_var(--tk-brand)]" : "border-line",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {badge && (
        <p className="tk-caption mx-auto mb-3 inline-block rounded-sm bg-brand px-2.5 py-1 text-surface">
          {badge}
        </p>
      )}

      <h2 className="font-heading text-[17px] font-bold text-ink">{name}</h2>

      <p className="mt-2 flex items-baseline justify-center gap-1.5">
        <span className="tabular font-heading text-[34px] font-bold leading-none text-ink">
          {price}
        </span>
        {periodLabel && (
          <span className="text-[15px] text-ink-soft">/ {periodLabel}</span>
        )}
      </p>
      {note && <p className="tabular mt-1.5 text-[13px] text-ink-soft">{note}</p>}

      {features && features.length > 0 && (
        <ul className="mx-auto mt-5 max-w-[34ch] space-y-2 text-left text-[14px] text-ink">
          {features.map((f) => (
            <li key={f} className="flex gap-2.5">
              <span aria-hidden className="mt-0.5 font-bold text-success">
                ✓
              </span>
              <span className="leading-relaxed">{f}</span>
            </li>
          ))}
        </ul>
      )}

      {children && <div className="mt-6">{children}</div>}
    </section>
  );
}

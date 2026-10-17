import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Bölüm başlığı: sol heading, sağda isteğe bağlı bağlantı ("Tümü ›"). */
export function SectionHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: { label: string; href: ComponentProps<typeof Link>["href"] };
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3", className)}>
      <h2 className="type-heading text-ink">{title}</h2>
      {action ? (
        <Link
          href={action.href}
          className="type-subhead text-accent-ink hover:underline"
        >
          {action.label} ›
        </Link>
      ) : null}
    </div>
  );
}

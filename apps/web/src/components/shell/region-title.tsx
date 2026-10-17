"use client";

import { usePathname } from "next/navigation";
import { activeNavItem } from "./navigation";

/** Üst şeritte aktif bölge adı (istemci — yol adına bakar). */
export function RegionTitle({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <p className={className} aria-live="polite">
      {activeNavItem(pathname).label}
    </p>
  );
}

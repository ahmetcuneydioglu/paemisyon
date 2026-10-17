"use client";

import { usePathname } from "next/navigation";
import { findNavItem } from "./navigation";

/** Üst şeritte aktif bölge adı (istemci — yol adına bakar). */
export function RegionTitle({ className }: { className?: string }) {
  const pathname = usePathname();
  const item = findNavItem(pathname);
  if (!item) return null;
  return (
    <p className={className} aria-live="polite">
      {item.label}
    </p>
  );
}

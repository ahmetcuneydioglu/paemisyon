import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Eylem çubuğu: tek birincil eylem (+ ikincil). Dar ekranda alta yapışır,
 * geniş ekranda içerik akışında kalır (Doc 27: web'de kart içi/altı).
 */
export function ActionBar({
  primary,
  secondary,
  sticky = true,
  className,
}: {
  primary: ReactNode;
  secondary?: ReactNode;
  sticky?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-t border-line bg-bg px-4 py-3 md:static md:flex-row md:items-center md:justify-end md:border-0 md:bg-transparent md:px-0",
        sticky && "sticky bottom-0 z-20",
        className,
      )}
    >
      {secondary ? <div className="md:order-1">{secondary}</div> : null}
      <div className="md:order-2 md:min-w-48">{primary}</div>
    </div>
  );
}

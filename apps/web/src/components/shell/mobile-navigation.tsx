"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { BrandGlyph } from "@/components/brand-mark";
import { LinkPendingIndicator } from "@/components/ui/link-pending-indicator";
import { cn } from "@/lib/cn";
import { CMDK_EVENT } from "./command-palette";
import { NavigationIcon } from "./navigation-icon";
import { activeNavItem, APP_NAV_ITEMS, isNavItemActive } from "./navigation";

/** Dar ekran üst başlık (<md): marka · bölge adı · ara. */
export function MobileAppHeader() {
  const pathname = usePathname();
  const active = activeNavItem(pathname);
  return (
    <header className="sticky top-0 z-40 grid h-14 grid-cols-[1fr_auto_1fr] items-center border-b border-line bg-bg/90 px-2 backdrop-blur md:hidden">
      <Link
        href="/bugun"
        aria-label="Paemisyon ana sayfa"
        className="flex size-11 items-center justify-center"
      >
        <BrandGlyph className="size-7" />
      </Link>
      <p className="type-subhead text-ink" aria-live="polite">
        {active.label}
      </p>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent(CMDK_EVENT))}
        className="tk-interactive ml-auto flex size-11 items-center justify-center rounded-control text-ink-soft hover:bg-surface-alt hover:text-ink"
        aria-label="Ara"
      >
        <Search size={22} strokeWidth={1.75} aria-hidden />
      </button>
    </header>
  );
}

/** Dar ekran alt sekme çubuğu: Expo TabBar ile aynı beş bölge ve ikonlar. */
export function MobileBottomNavigation() {
  const pathname = usePathname();
  const items = APP_NAV_ITEMS.filter((i) => !i.desktopOnly);
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/95 pb-[max(env(safe-area-inset-bottom),4px)] backdrop-blur-md md:hidden"
      aria-label="Ana bölgeler"
    >
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const active = isNavItemActive(item, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "tk-interactive relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] font-semibold",
                active
                  ? "text-accent-ink"
                  : "text-ink-soft active:bg-surface-alt",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-11 items-center justify-center rounded-pill",
                  active ? "bg-accent-soft" : "bg-transparent",
                )}
              >
                <NavigationIcon
                  name={item.icon}
                  className="size-[22px]"
                  strokeWidth={active ? 2.1 : 1.75}
                />
              </span>
              <span className="max-w-full truncate">{item.label}</span>
              <LinkPendingIndicator />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

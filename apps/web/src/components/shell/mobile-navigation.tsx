"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CMDK_EVENT } from "./command-palette";
import { NavigationIcon } from "./navigation-icon";
import { activeNavItem, APP_NAV_ITEMS, isNavItemActive } from "./navigation";

export function MobileAppHeader() {
  const pathname = usePathname();
  const active = activeNavItem(pathname);

  return (
    <header className="sticky top-0 z-40 grid h-14 grid-cols-[1fr_auto_1fr] items-center border-b border-line bg-surface/95 px-3 backdrop-blur md:hidden">
      <Link
        href="/bugun"
        aria-label="Paemisyon ana sayfa"
        className="flex size-11 items-center justify-center rounded-md font-heading text-lg font-bold text-brand"
      >
        P
      </Link>
      <p
        className="font-heading text-[15px] font-bold text-ink"
        aria-live="polite"
      >
        {active.label}
      </p>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent(CMDK_EVENT))}
        className="tk-interactive ml-auto flex size-11 items-center justify-center rounded-md text-ink-soft hover:bg-line/50 hover:text-ink"
        aria-label="Ara"
      >
        <NavigationIcon name="search" className="size-[22px]" />
      </button>
    </header>
  );
}

export function MobileBottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/95 pb-[max(env(safe-area-inset-bottom),6px)] backdrop-blur-md md:hidden"
      aria-label="Ana bölgeler"
    >
      <div className="grid grid-cols-5">
        {APP_NAV_ITEMS.map((item) => {
          const active = isNavItemActive(item, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "tk-interactive flex min-h-[58px] min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] font-semibold",
                active ? "text-brand" : "text-ink-soft active:bg-line/50",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-7 w-10 items-center justify-center rounded-full",
                  active ? "bg-brand/12" : "bg-transparent",
                ].join(" ")}
              >
                <NavigationIcon
                  name={item.icon}
                  className="size-[22px]"
                  strokeWidth={active ? 2.2 : 1.8}
                />
              </span>
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

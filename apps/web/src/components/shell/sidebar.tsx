"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/(auth)/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { CMDK_EVENT } from "./command-palette";
import { NavigationIcon } from "./navigation-icon";
import { APP_NAV_ITEMS, isNavItemActive } from "./navigation";
import { LinkPendingIndicator } from "@/components/ui/link-pending-indicator";

/** Tablet: etiketli navigasyon rayı · geniş ekran: tam sidebar ve alt ağaç. */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-24 shrink-0 flex-col border-r border-line bg-surface md:flex min-[1200px]:w-56">
      <Link
        href="/bugun"
        aria-label="Paemisyon ana sayfa"
        className="flex h-16 items-center justify-center font-heading font-bold tracking-tight text-brand min-[1200px]:justify-start min-[1200px]:px-5 min-[1200px]:text-[15px]"
      >
        <span className="flex size-9 items-center justify-center rounded-md bg-brand/10 text-lg min-[1200px]:hidden">
          P
        </span>
        <span className="hidden min-[1200px]:inline">PAEMİSYON</span>
      </Link>

      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent(CMDK_EVENT))}
        className="tk-interactive mx-2 mb-3 flex min-h-12 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-line px-1 text-[11px] font-semibold text-ink-soft hover:border-ink-soft hover:text-ink min-[1200px]:mx-3 min-[1200px]:min-h-0 min-[1200px]:flex-row min-[1200px]:justify-between min-[1200px]:gap-2 min-[1200px]:px-2.5 min-[1200px]:py-2 min-[1200px]:text-[13px] min-[1200px]:font-normal"
        aria-label="Ara — komut paleti"
      >
        <NavigationIcon name="search" className="size-5 shrink-0" />
        <span className="min-[1200px]:flex-1 min-[1200px]:text-left">Ara</span>
        <kbd className="tk-caption hidden min-[1200px]:inline" aria-hidden>
          ⌘K
        </kbd>
      </button>

      <nav
        className="flex flex-col gap-1 px-2 min-[1200px]:px-3"
        aria-label="Ana bölgeler"
      >
        {APP_NAV_ITEMS.map((item) => {
          const active = isNavItemActive(item, pathname);
          return (
            <div key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={item.label}
                className={[
                  "tk-interactive relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-semibold min-[1200px]:min-h-0 min-[1200px]:flex-row min-[1200px]:justify-start min-[1200px]:gap-3 min-[1200px]:px-2.5 min-[1200px]:py-2.5 min-[1200px]:text-[14px]",
                  active
                    ? "bg-brand/10 text-brand"
                    : "text-ink-soft hover:bg-line/40 hover:text-ink",
                ].join(" ")}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-7 w-0.5 -translate-y-1/2 rounded-full bg-brand" />
                )}
                <NavigationIcon
                  name={item.icon}
                  className="size-[22px] shrink-0"
                />
                <span>{item.label}</span>
                <LinkPendingIndicator />
              </Link>

              {active && item.children && (
                <div className="mt-0.5 mb-1 ml-6 hidden flex-col gap-0.5 border-l border-line pl-2 min-[1200px]:flex">
                  {item.children.map((child) => {
                    const childActive =
                      !child.href.includes("?") && pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        aria-current={childActive ? "page" : undefined}
                        className={[
                          "tk-interactive relative rounded-sm px-2 py-1.5 text-[13px]",
                          childActive
                            ? "font-bold text-brand"
                            : "text-ink-soft hover:bg-line/40 hover:text-ink",
                        ].join(" ")}
                      >
                        {child.label}
                        <LinkPendingIndicator />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1 border-t border-line px-2 py-3 min-[1200px]:px-3">
        <div className="mb-2 hidden min-[1200px]:block">
          <ThemeToggle />
        </div>
        <UtilityLink href="/premium" icon="premium" label="Premium" />
        <UtilityLink href="/sss" icon="help" label="Yardım ve SSS" />
        <form action={signOut}>
          <button
            type="submit"
            title="Çıkış yap"
            className="tk-interactive flex min-h-12 w-full flex-col items-center justify-center gap-1 rounded-md text-[10px] font-semibold text-ink-soft hover:bg-danger/5 hover:text-danger min-[1200px]:min-h-0 min-[1200px]:flex-row min-[1200px]:justify-start min-[1200px]:gap-3 min-[1200px]:px-2.5 min-[1200px]:py-2 min-[1200px]:text-[13px]"
          >
            <NavigationIcon name="logout" className="size-5 shrink-0" />
            <span>Çıkış</span>
          </button>
        </form>
      </div>
    </aside>
  );
}

function UtilityLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: "premium" | "help";
  label: string;
}) {
  return (
    <Link
      href={href}
      title={label}
      className="tk-interactive relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-center text-[10px] font-semibold text-ink-soft hover:bg-line/40 hover:text-ink min-[1200px]:min-h-0 min-[1200px]:flex-row min-[1200px]:justify-start min-[1200px]:gap-3 min-[1200px]:px-2.5 min-[1200px]:py-2 min-[1200px]:text-left min-[1200px]:text-[13px]"
    >
      <NavigationIcon name={icon} className="size-5 shrink-0" />
      <span>{label}</span>
      <LinkPendingIndicator />
    </Link>
  );
}

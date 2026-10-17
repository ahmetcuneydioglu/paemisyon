"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/(auth)/actions";
import { BrandGlyph, BrandMark } from "@/components/brand-mark";
import { KeyHint } from "@/components/ui/key-hint";
import { LinkPendingIndicator } from "@/components/ui/link-pending-indicator";
import { cn } from "@/lib/cn";
import { CMDK_EVENT } from "./command-palette";
import { NavigationIcon } from "./navigation-icon";
import { APP_NAV_ITEMS, isNavItemActive } from "./navigation";

/**
 * Sol sidebar (Doc 27 L2): 768–1279 ikon rayı (64 px), ≥1280 tam sidebar (240 px)
 * ve bölge içi alt başlıklar. Aktif öğe `accentSoft` zemin + `accentInk` metin +
 * sol bakır çizgi (renk tek başına değil: aria-current da var).
 */
export function Sidebar() {
  const pathname = usePathname();
  const item =
    "tk-interactive relative flex min-h-11 items-center justify-center rounded-control px-1 text-[14px] font-semibold xl:min-h-0 xl:justify-start xl:gap-3 xl:px-3 xl:py-2.5";

  return (
    <aside className="sticky top-0 hidden h-dvh w-16 shrink-0 flex-col border-r border-line bg-surface md:flex xl:w-60">
      <Link
        href="/bugun"
        aria-label="Paemisyon ana sayfa"
        className="flex h-14 items-center justify-center xl:justify-start xl:px-5"
      >
        <BrandGlyph className="size-8 xl:hidden" />
        <BrandMark
          className="hidden xl:inline-flex"
          glyphClassName="size-6"
          textClassName="text-[15px]"
        />
      </Link>

      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent(CMDK_EVENT))}
        className="tk-interactive mx-2 mb-2 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-control border border-line text-ink-soft hover:border-ink-soft hover:text-ink xl:mx-3 xl:justify-between xl:px-3"
        aria-label="Ara — komut paleti"
      >
        <NavigationIcon name="search" className="size-5 shrink-0" />
        <span className="hidden flex-1 text-left text-[13px] xl:inline">
          Ara
        </span>
        <KeyHint keys="⌘K" className="hidden xl:inline-block" />
      </button>

      <nav
        className="flex flex-col gap-0.5 px-2 xl:px-3"
        aria-label="Ana bölgeler"
      >
        {APP_NAV_ITEMS.map((it) => {
          const active = isNavItemActive(it, pathname);
          return (
            <div key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                title={it.label}
                className={cn(
                  item,
                  active
                    ? "bg-accent-soft text-accent-ink"
                    : "text-ink-soft hover:bg-surface-alt hover:text-ink",
                )}
              >
                {active ? (
                  <span className="absolute top-1/2 left-0 h-6 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
                ) : null}
                <NavigationIcon
                  name={it.icon}
                  className="size-[22px] shrink-0"
                  strokeWidth={active ? 2 : 1.75}
                />
                <span className="max-w-full truncate xl:max-w-none">
                  {it.label}
                </span>
                <LinkPendingIndicator />
              </Link>
              {active && it.children ? (
                <div className="mt-0.5 mb-1 ml-6 hidden flex-col gap-0.5 border-l border-line pl-2 xl:flex">
                  {it.children.map((child) => {
                    const childActive =
                      !child.href.includes("?") && pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        aria-current={childActive ? "page" : undefined}
                        className={cn(
                          "tk-interactive relative rounded-control px-2 py-1.5 text-[13px]",
                          childActive
                            ? "font-semibold text-accent-ink"
                            : "text-ink-soft hover:bg-surface-alt hover:text-ink",
                        )}
                      >
                        {child.label}
                        <LinkPendingIndicator />
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-0.5 border-t border-line px-2 py-3 xl:px-3">
        <UtilityLink href="/premium" icon="premium" label="Premium" />
        <UtilityLink href="/sss" icon="help" label="Yardım ve SSS" />
        <form action={signOut}>
          <button
            type="submit"
            title="Çıkış yap"
            className={cn(
              item,
              "w-full cursor-pointer text-ink-soft hover:bg-danger-soft hover:text-danger-ink",
            )}
          >
            <NavigationIcon name="logout" className="size-5 shrink-0" />
            <span className="hidden xl:inline">Çıkış</span>
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
      className="tk-interactive relative flex min-h-11 items-center justify-center rounded-control text-[13px] font-semibold text-ink-soft hover:bg-surface-alt hover:text-ink xl:min-h-0 xl:justify-start xl:gap-3 xl:px-3 xl:py-2 xl:text-left"
    >
      <NavigationIcon name={icon} className="size-5 shrink-0" />
      <span className="hidden xl:inline">{label}</span>
      <LinkPendingIndicator />
    </Link>
  );
}

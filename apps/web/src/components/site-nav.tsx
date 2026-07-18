"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "./theme-toggle";

export interface NavItem {
  href: string;
  label: string;
}

/** Public üst nav — masaüstünde yatay linkler, mobilde açılır menü (L1 Kapı). */
export function SiteNav({ items, authArea }: { items: NavItem[]; authArea: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const first = useRef(true);
  // Sayfa değişince menüyü kapat (senkron setState lint kuralına takılmadan).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => setOpen(false), 0);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <>
      <nav className="hidden items-center gap-1 md:flex" aria-label="Site">
        {items.map((n) => {
          const active = pathname === n.href || pathname.startsWith(n.href + "/");
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={[
                "tk-interactive rounded-sm px-3 py-2 text-[14px]",
                active
                  ? "font-bold text-brand"
                  : "text-ink-soft hover:bg-line/40 hover:text-ink",
              ].join(" ")}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Menü"
        className="tk-interactive grid size-9 cursor-pointer place-items-center rounded-sm text-ink md:hidden"
      >
        <span aria-hidden>{open ? "✕" : "☰"}</span>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-40 border-b border-line bg-surface shadow-lg md:hidden">
          <nav className="flex flex-col p-2" aria-label="Site (mobil)">
            {items.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="rounded-sm px-3 py-2.5 text-[15px] text-ink hover:bg-line/40"
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-1 flex items-center justify-between gap-2 border-t border-line p-2">
              {authArea}
              <ThemeToggle compact />
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

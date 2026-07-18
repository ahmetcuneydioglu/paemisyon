"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CMDK_EVENT } from "./command-palette";

interface NavChild {
  href: string;
  label: string;
}
interface NavItem {
  href: string;
  label: string;
  icon: string;
  also: string[];
  children?: NavChild[];
}

const nav: NavItem[] = [
  { href: "/bugun", label: "Bugün", icon: "◉", also: [] },
  // Mevzuat sayfaları (aynı URL iki derinlik) Kütüphane bölgesine aittir.
  {
    href: "/kutuphane",
    label: "Kütüphane",
    icon: "▤",
    also: ["/kanunlar", "/kanun"],
    children: [
      { href: "/kutuphane", label: "Dersler" },
      { href: "/kanunlar", label: "Mevzuat" },
      { href: "/kutuphane/yanlislar", label: "Yanlışlarım" },
      { href: "/kutuphane/favoriler", label: "Favorilerim" },
      { href: "/seans?mode=review&scope=Yanl%C4%B1%C5%9F+tekrar%C4%B1", label: "Akıllı Tekrar" },
    ],
  },
  {
    href: "/denemeler",
    label: "Denemeler",
    icon: "◧",
    also: ["/sinav", "/sonuc", "/siralama"],
  },
  {
    href: "/performans",
    label: "Performans",
    icon: "◔",
    also: [],
    children: [
      { href: "/performans", label: "Genel bakış" },
      { href: "/performans/konu-haritasi", label: "Konu haritası" },
    ],
  },
  { href: "/profil", label: "Ben", icon: "☺", also: [] },
];

/**
 * Girişli uygulama kabuğunun sol navigasyonu (Doc 27 L2). 5 bölge modeli;
 * Performans W3'te eklenir. Kütüphane/Denemeler/Ben şimdilik mevcut (site)
 * sayfalarına gider — W2/W3'te kabuğa taşınırlar.
 */
export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-surface max-lg:w-16">
      <Link
        href="/bugun"
        className="px-5 py-5 font-heading text-[15px] font-bold tracking-tight text-brand max-lg:px-0 max-lg:text-center"
      >
        <span className="max-lg:hidden">PAEMİSYON</span>
        <span className="hidden max-lg:inline">P</span>
      </Link>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent(CMDK_EVENT))}
        className="tk-interactive mx-3 mb-2 flex cursor-pointer items-center justify-between rounded-sm border border-line px-2.5 py-1.5 text-[13px] text-ink-soft hover:border-ink-soft hover:text-ink max-lg:mx-2 max-lg:justify-center"
        aria-label="Ara — komut paleti"
      >
        <span className="max-lg:hidden">Ara…</span>
        <kbd className="tk-caption max-lg:hidden" aria-hidden>
          ⌘K
        </kbd>
        <span className="hidden max-lg:inline" aria-hidden>
          ⌕
        </span>
      </button>
      <nav className="flex flex-col gap-0.5 px-3 max-lg:px-2" aria-label="Ana bölgeler">
        {nav.map((item) => {
          const active = [item.href, ...item.also].some(
            (p) => pathname === p || pathname.startsWith(p + "/"),
          );
          return (
            <div key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "tk-interactive flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-[14px] max-lg:justify-center max-lg:px-0",
                  active
                    ? "bg-brand/10 font-bold text-brand"
                    : "text-ink-soft hover:bg-line/40 hover:text-ink",
                ].join(" ")}
              >
                <span aria-hidden className="w-4 text-center">
                  {item.icon}
                </span>
                <span className="max-lg:hidden">{item.label}</span>
              </Link>
              {/* Aktif bölgenin alt öğeleri (Doc 27 §1) — daraltılmış rayda gizli */}
              {active && item.children && (
                <div className="mb-1 ml-6 mt-0.5 flex flex-col gap-0.5 border-l border-line pl-2 max-lg:hidden">
                  {item.children.map((c) => {
                    // Sorgu içeren alt öğe (Akıllı Tekrar) hiçbir zaman "aktif" işaretlenmez.
                    const cActive = !c.href.includes("?") && pathname === c.href;
                    return (
                      <Link
                        key={c.href}
                        href={c.href}
                        aria-current={cActive ? "page" : undefined}
                        className={[
                          "tk-interactive rounded-sm px-2 py-1 text-[13px]",
                          cActive
                            ? "font-bold text-brand"
                            : "text-ink-soft hover:bg-line/40 hover:text-ink",
                        ].join(" ")}
                      >
                        {c.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="mt-auto space-y-2 border-t border-line px-5 py-4 max-lg:px-2">
        <Link
          href="/premium"
          className="tk-caption block text-brand hover:underline max-lg:text-center"
        >
          <span className="max-lg:hidden">Premium&apos;a geç</span>
          <span className="hidden max-lg:inline">★</span>
        </Link>
        <Link
          href="/sss"
          className="tk-caption block hover:text-ink max-lg:text-center"
          title="Yardım ve SSS"
        >
          <span className="max-lg:hidden">Yardım · SSS</span>
          <span className="hidden max-lg:inline">?</span>
        </Link>
      </div>
    </aside>
  );
}

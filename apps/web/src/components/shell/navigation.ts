export type NavigationIconName =
  "today" | "library" | "exam" | "performance" | "profile";

export interface NavChild {
  href: string;
  label: string;
}

export interface NavItem {
  href: string;
  label: string;
  icon: NavigationIconName;
  also: string[];
  children?: NavChild[];
}

/** Ürünün beş ana bölgesi — web ve mobil navigasyonun tek kaynağı. */
export const APP_NAV_ITEMS: NavItem[] = [
  { href: "/bugun", label: "Bugün", icon: "today", also: [] },
  {
    href: "/kutuphane",
    label: "Kütüphane",
    icon: "library",
    also: ["/kanunlar", "/kanun"],
    children: [
      { href: "/kutuphane", label: "Dersler" },
      { href: "/kanunlar", label: "Mevzuat" },
      { href: "/kutuphane/yanlislar", label: "Yanlışlarım" },
      { href: "/kutuphane/favoriler", label: "Favorilerim" },
      {
        href: "/seans?mode=review&scope=Yanl%C4%B1%C5%9F+tekrar%C4%B1",
        label: "Akıllı Tekrar",
      },
    ],
  },
  {
    href: "/denemeler",
    label: "Denemeler",
    icon: "exam",
    also: ["/sinav", "/sonuc", "/siralama"],
  },
  {
    href: "/performans",
    label: "Performans",
    icon: "performance",
    also: [],
    children: [
      { href: "/performans", label: "Genel bakış" },
      { href: "/performans/konu-haritasi", label: "Konu haritası" },
    ],
  },
  { href: "/profil", label: "Ben", icon: "profile", also: [] },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return [item.href, ...item.also].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function activeNavItem(pathname: string): NavItem {
  return (
    APP_NAV_ITEMS.find((item) => isNavItemActive(item, pathname)) ??
    APP_NAV_ITEMS[0]
  );
}

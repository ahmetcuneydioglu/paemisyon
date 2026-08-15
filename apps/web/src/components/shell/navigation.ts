export type NavigationIconName =
  | "today"
  | "library"
  | "mevzuat"
  | "exam"
  | "leaderboard"
  | "performance"
  | "profile";

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
  /** Mobil web alt barında gizle (5-bölge ilkesi korunur; masaüstünde görünür). */
  desktopOnly?: boolean;
}

/** Ürünün beş ana bölgesi — web ve mobil navigasyonun tek kaynağı. */
export const APP_NAV_ITEMS: NavItem[] = [
  { href: "/bugun", label: "Bugün", icon: "today", also: [] },
  {
    href: "/kutuphane",
    label: "Kütüphane",
    icon: "library",
    also: [],
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
  // Mevzuat Merkezi (Doc 29): platformun temel özelliği — birinci seviye.
  // Mobil web alt barı 5 bölgede kalır; oradan Kütüphane > Mevzuat çocuğu taşır.
  {
    href: "/kanunlar",
    label: "Mevzuat",
    icon: "mevzuat",
    also: ["/kanun"],
    desktopOnly: true,
  },
  {
    href: "/denemeler",
    label: "Denemeler",
    icon: "exam",
    also: ["/sinav", "/sonuc", "/siralama"],
  },
  { href: "/liderlik", label: "Liderlik", icon: "leaderboard", also: [] },
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
